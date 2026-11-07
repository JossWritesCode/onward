module Integrations
  # Reads a public LeetCode profile.
  #
  # LeetCode has no official API. This uses the same GraphQL endpoint its own
  # website uses for public profiles, so it needs no login, but LeetCode can
  # change or block it at any time. Everything that calls this expects it to
  # fail sometimes.
  module Leetcode
    URL = "https://leetcode.com/graphql".freeze

    QUERY = <<~GRAPHQL.freeze
      query onwardProfile($username: String!) {
        allQuestionsCount { difficulty count }
        matchedUser(username: $username) {
          submitStats { acSubmissionNum { difficulty count } }
          userCalendar { streak totalActiveDays submissionCalendar }
        }
      }
    GRAPHQL

    # Asked separately, so if LeetCode stops sharing these, the main stats still work.
    RECENT_QUERY = <<~GRAPHQL.freeze
      query onwardRecent($username: String!) {
        recentSubmissionList(username: $username, limit: 20) { titleSlug timestamp statusDisplay }
        recentAcSubmissionList(username: $username, limit: 20) { titleSlug timestamp }
      }
    GRAPHQL

    module_function

    # Returns a hash with string keys, ready to store as a snapshot:
    # streak, total_active_days, solved and totals by difficulty, days
    # (ISO date in UTC => submissions that day), and recent (your latest
    # submissions with exact times, so days can follow your own clock).
    def fetch(username)
      response = Http.post_json(URL, { query: QUERY, variables: { username: } },
        headers: { "Referer" => "https://leetcode.com/u/#{username}/" }, service: "LeetCode")

      user = response.dig("data", "matchedUser")
      raise Error, "LeetCode doesn't have a public profile named \"#{username}\"." if user.nil?

      calendar = user.dig("userCalendar") || {}
      # submissionCalendar is a JSON string of { "unix timestamp at midnight UTC": count }.
      raw_days = JSON.parse(calendar["submissionCalendar"].presence || "{}")
      days = raw_days.to_h { |timestamp, count| [ Time.at(timestamp.to_i).utc.to_date.iso8601, count.to_i ] }

      {
        "username" => username,
        "streak" => calendar["streak"].to_i,
        "total_active_days" => calendar["totalActiveDays"].to_i,
        "solved" => by_difficulty(user.dig("submitStats", "acSubmissionNum")),
        "totals" => by_difficulty(response.dig("data", "allQuestionsCount")),
        "days" => days,
        "recent" => fetch_recent(username)
      }
    rescue JSON::ParserError
      raise Error, "LeetCode sent back something unexpected. Try again later."
    end

    # Up to 20 recent submissions of any kind plus up to 20 accepted ones,
    # merged: [{ "slug", "timestamp", "accepted" }], newest first. Either list
    # can be missing if LeetCode stops sharing it.
    def fetch_recent(username)
      response = Http.post_json(URL, { query: RECENT_QUERY, variables: { username: } },
        headers: { "Referer" => "https://leetcode.com/u/#{username}/" }, service: "LeetCode")
      recent_submissions(response["data"] || {})
    rescue Error
      []
    end

    def recent_submissions(data)
      all = Array(data["recentSubmissionList"]).map do |row|
        { "slug" => row["titleSlug"].to_s, "timestamp" => row["timestamp"].to_i, "accepted" => row["statusDisplay"] == "Accepted" }
      end
      accepted = Array(data["recentAcSubmissionList"]).map do |row|
        { "slug" => row["titleSlug"].to_s, "timestamp" => row["timestamp"].to_i, "accepted" => true }
      end

      (all + accepted)
        .reject { |row| row["timestamp"].zero? }
        .group_by { |row| [ row["slug"], row["timestamp"] ] }
        .map { |_, rows| rows.first.merge("accepted" => rows.any? { |row| row["accepted"] }) }
        .sort_by { |row| -row["timestamp"] }
    end

    def by_difficulty(rows)
      Array(rows).to_h { |row| [ row["difficulty"].to_s.downcase, row["count"].to_i ] }
    end
  end
end
