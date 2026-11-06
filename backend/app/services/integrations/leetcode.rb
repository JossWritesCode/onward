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

    module_function

    # Returns a hash with string keys, ready to store as a snapshot:
    # streak, total_active_days, solved and totals by difficulty, and days
    # (ISO date => submissions that day).
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
        "days" => days
      }
    rescue JSON::ParserError
      raise Error, "LeetCode sent back something unexpected. Try again later."
    end

    def by_difficulty(rows)
      Array(rows).to_h { |row| [ row["difficulty"].to_s.downcase, row["count"].to_i ] }
    end
  end
end
