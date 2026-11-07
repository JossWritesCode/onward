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
      record_leetcode_days(user, data)
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
      if user.github_token_status == :unreadable
        raise Integrations::Error,
          "Onward can't read your saved GitHub token anymore, usually because the encryption keys in backend/.env changed. Paste your token again in Settings."
      end

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
  # one activity, on your own clock.
  #
  # LeetCode's calendar groups submissions by UTC day, so an evening
  # submission in Toronto lands on tomorrow there. Recent submissions come
  # with exact times, so those days are worked out in your time zone. Older
  # days, before the recent list reaches, fall back to LeetCode's calendar.
  def record_leetcode_days(user, data)
    counts_from = user.leetcode_counts_from || user.today
    counts = leetcode_day_counts(user, data)
    existing = user.activities.where(kind: "leetcode").pluck(:occurred_on).to_set

    counts.each do |date, count|
      next if count <= 0 || date < counts_from || date > user.today || existing.include?(date)

      user.activities.create!(
        kind: "leetcode",
        automatic: true,
        occurred_on: date,
        note: "#{count} #{count == 1 ? 'submission' : 'submissions'}"
      )
    end
  end

  # { Date => submissions } on your clock.
  def leetcode_day_counts(user, data)
    recent = Array(data["recent"])
    local = recent.map { |row| user.local_date(Time.at(row["timestamp"].to_i)) }.tally
    covered_from = local.keys.min

    calendar = Hash(data["days"]).filter_map do |iso_date, count|
      date = Date.iso8601(iso_date)
      [ date, count.to_i ] if covered_from.nil? || date < covered_from
    end.to_h

    calendar.merge(local)
  end

  # Different problems you solved (accepted) on a day, on your clock.
  def solved_on(user, snapshot, date)
    Array(snapshot.data["recent"])
      .select { |row| row["accepted"] && user.local_date(Time.at(row["timestamp"].to_i)) == date }
      .map { |row| row["slug"] }
      .uniq
      .size
  end
end
