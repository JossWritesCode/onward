# Something you want to do every day (or every weekday), like "Apply to 1 job"
# or "Solve 1 LeetCode problem". Goals check themselves off from what you do
# in Onward, LeetCode, and GitHub. See DailyGoals for how progress is counted.
class DailyGoal < ApplicationRecord
  KINDS = %w[applications networking practice study materials leetcode github custom].freeze

  # Goals that read from LeetCode or GitHub, which only apply with the
  # software engineering track on.
  ENGINEERING_KINDS = %w[leetcode github].freeze

  # Study goals are in minutes. Everything else is a count.
  TARGET_RANGE = { "study" => 5..480 }.freeze
  DEFAULT_TARGET_RANGE = 1..20

  MAX_GOALS = 6

  belongs_to :user
  belongs_to :custom_action, optional: true

  enum :kind, KINDS.index_with(&:itself), prefix: true, validate: true

  validates :target, numericality: { only_integer: true }
  validate :target_in_range
  validate :custom_action_matches_kind
  validate :one_goal_per_kind
  validate :not_too_many, on: :create

  before_create { self.position = (user.daily_goals.maximum(:position) || -1) + 1 }

  def scheduled_on?(date)
    !weekdays_only? || !(date.saturday? || date.sunday?)
  end

  # LeetCode and GitHub goals sit out while the engineering track is off.
  def available?
    !ENGINEERING_KINDS.include?(kind) || user.engineering_track?
  end

  def target_range
    TARGET_RANGE.fetch(kind, DEFAULT_TARGET_RANGE)
  end

  private

  def target_in_range
    return if target.nil? || kind.nil?

    range = target_range
    errors.add(:target, "should be between #{range.min} and #{range.max}") unless range.cover?(target)
  end

  def custom_action_matches_kind
    if kind_custom?
      if custom_action.nil?
        errors.add(:custom_action, "can't be blank")
      elsif custom_action.user_id != user_id || custom_action.archived_at
        errors.add(:custom_action, "must be one of yours")
      end
    elsif custom_action
      errors.add(:custom_action, "only goes with a custom goal")
    end
  end

  def one_goal_per_kind
    return if user.nil?

    others = user.daily_goals.where.not(id:)
    if kind_custom?
      errors.add(:custom_action, "already has a goal") if custom_action && others.exists?(custom_action:)
    elsif others.exists?(kind:)
      errors.add(:kind, "already has a goal. Change that one instead.")
    end
  end

  def not_too_many
    return unless user && user.daily_goals.count >= MAX_GOALS

    errors.add(:base, "You can have up to #{MAX_GOALS} daily goals. A few you'll really do beats a long list.")
  end
end
