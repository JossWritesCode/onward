# Works out how far along you are on your daily goals for one day, and saves
# a PerfectDay the first time you finish all of them.
#
# Progress comes from what you already do:
# - applications, networking, practice, materials, custom: activities that day
# - study: minutes from study sessions that day
# - leetcode: different problems you solved that day, on your own clock
# - github: contributions on GitHub's calendar for that day
class DailyGoals
  ACTIVITY_KINDS = {
    "applications" => %w[application_sent],
    "networking" => Activity::CONTACTING_KINDS,
    "practice" => %w[interview_practice],
    "materials" => %w[tailored_materials]
  }.freeze

  Progress = Struct.new(:goal, :count, keyword_init: true) do
    def done? = count >= goal.target
  end

  attr_reader :user, :date

  # refresh: false uses whatever LeetCode and GitHub data is already saved,
  # without asking them. Used from model callbacks, which shouldn't wait on
  # outside services.
  def self.for(user, date: user.today, refresh: true)
    new(user, date:, refresh:)
  end

  def initialize(user, date:, refresh:)
    @user = user
    @date = date
    @all_goals = user.daily_goals.includes(:custom_action).to_a.select(&:available?)
    @goals = @all_goals.select { |goal| goal.scheduled_on?(date) }
    sync_integrations if refresh
  end

  def progress
    @progress ||= @goals.map { |goal| Progress.new(goal:, count: count_for(goal)) }
  end

  def any_goals? = @all_goals.any?

  # You have goals, just none on this day (for example, weekday goals on a Saturday).
  def rest_day? = any_goals? && @goals.empty?

  def perfect? = progress.any? && progress.all?(&:done?)

  # Saves today as a perfect day if every goal is done. Returns true the
  # first time, so callers know to celebrate.
  def record!
    return false unless perfect? && date <= user.today
    return false if user.perfect_days.exists?(achieved_on: date)

    user.perfect_days.create!(achieved_on: date)
    true
  rescue ActiveRecord::RecordNotUnique
    false
  end

  # Perfect days in a row. Days with no goals (like weekends, when your goals
  # are weekdays only) are skipped. Today only adds to it; it can't break it
  # until it's over.
  def perfect_streak
    dates = user.perfect_days.where(achieved_on: ..user.today).pluck(:achieved_on).to_set
    return 0 if dates.empty? || @all_goals.empty?

    today = user.today
    streak = dates.include?(today) ? 1 : 0
    day = today - 1
    earliest = dates.min
    while day >= earliest
      if dates.include?(day)
        streak += 1
      elsif @all_goals.any? { |goal| goal.scheduled_on?(day) }
        break
      end
      day -= 1
    end
    streak
  end

  private

  def count_for(goal)
    case goal.kind
    when "study" then study_minutes
    when "leetcode" then leetcode_solved
    when "github" then github_contributions
    when "custom" then custom_counts.fetch(goal.custom_action_id, 0)
    else ACTIVITY_KINDS.fetch(goal.kind).sum { |kind| activity_counts.fetch(kind, 0) }
    end
  end

  def activity_counts
    @activity_counts ||= user.activities.where(occurred_on: date).group(:kind).count
  end

  def custom_counts
    @custom_counts ||= user.activities.where(occurred_on: date, kind: "custom").group(:custom_action_id).count
  end

  def study_minutes
    user.study_sessions.where(studied_on: date).sum(:minutes)
  end

  def leetcode_solved
    snapshot = user.integration_snapshots.find_by(provider: "leetcode")
    return 0 if snapshot.nil?

    IntegrationSync.solved_on(user, snapshot, date)
  end

  def github_contributions
    snapshot = user.integration_snapshots.find_by(provider: "github")
    snapshot ? snapshot.days.fetch(date.iso8601, 0).to_i : 0
  end

  # Fetches fresh data (at most every 30 minutes) for goals that need it.
  # A failure leaves the goal at whatever was last saved.
  def sync_integrations
    kinds = @goals.map(&:kind)
    IntegrationSync.leetcode(user) if kinds.include?("leetcode")
    IntegrationSync.github(user) if kinds.include?("github")
  rescue StandardError => error
    Rails.logger.warn("Goal sync failed: #{error.class}: #{error.message}")
  end
end
