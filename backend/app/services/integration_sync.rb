# Keeps each person's LeetCode and GitHub snapshots fresh, and turns LeetCode
# practice days into activities that count toward the streak.
#
# Fetches happen at most every 30 minutes per person (or when asked to
# refresh). If a service can't be reached, the last good data stays and the
# error is shown next to it.
module IntegrationSync
  module_function

  def leetcode(user, force: false)
    return nil if user.leetcode_username.blank?

    snapshot = user.integration_snapshots.find_or_initialize_by(provider: "leetcode")
    return snapshot unless force || snapshot.stale?

    begin
      data = Integrations::Leetcode.fetch(user.leetcode_username)
      snapshot.update!(data:, error: nil, fetched_at: Time.current)
      record_leetcode_days(user, data["days"])
    rescue Integrations::Error => error
      snapshot.update!(error: error.message, fetched_at: Time.current)
    end
    snapshot
  end

  def github(user, force: false)
    return nil if user.github_username.blank?

    snapshot = user.integration_snapshots.find_or_initialize_by(provider: "github")
    return snapshot unless force || snapshot.stale?

    begin
      data = Integrations::Github.fetch(user.github_username, user.github_token)
      snapshot.update!(data:, error: nil, fetched_at: Time.current)
    rescue Integrations::Error => error
      snapshot.update!(error: error.message, fetched_at: Time.current)
    end
    snapshot
  end

  # Called before working out the streak. Never lets an outside service break it.
  def refresh_for_streak(user)
    leetcode(user) if user.engineering_track? && user.leetcode_username.present?
  rescue StandardError => error
    Rails.logger.warn("LeetCode sync failed: #{error.class}: #{error.message}")
  end

  # Each day with LeetCode submissions, from the day you connected, counts as
  # one activity. LeetCode's days run on UTC.
  def record_leetcode_days(user, days)
    counts_from = user.leetcode_counts_from || user.today
    existing = user.activities.where(kind: "leetcode").pluck(:occurred_on).to_set

    days.each do |iso_date, count|
      date = Date.iso8601(iso_date)
      next if count.to_i <= 0 || date < counts_from || date > user.today || existing.include?(date)

      user.activities.create!(
        kind: "leetcode",
        automatic: true,
        occurred_on: date,
        note: "#{count} #{count.to_i == 1 ? 'submission' : 'submissions'}"
      )
    end
  end
end
