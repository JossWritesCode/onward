module Types
  # Built on an IntegrationSnapshot for LeetCode.
  class LeetcodeStatsType < Types::BaseObject
    description "Your public LeetCode stats. LeetCode has no official API, so this can be unavailable at times."

    field :username, String, null: false
    field :streak, Int, null: false, description: "LeetCode's own daily streak (LeetCode days run on UTC)."
    field :total_active_days, Int, null: false
    field :easy_solved, Int, null: false
    field :medium_solved, Int, null: false
    field :hard_solved, Int, null: false
    field :easy_total, Int, null: false
    field :medium_total, Int, null: false
    field :hard_total, Int, null: false
    field :days, [ Types::CalendarDayType ], null: false, description: "Submissions per day over the last year."
    field :error, String, null: true, description: "Why the latest refresh failed, if it did. Older data may still show."
    field :fetched_at, GraphQL::Types::ISO8601DateTime, null: true

    def username = object.data["username"] || object.user.leetcode_username
    def streak = object.data["streak"].to_i
    def total_active_days = object.data["total_active_days"].to_i
    def easy_solved = object.data.dig("solved", "easy").to_i
    def medium_solved = object.data.dig("solved", "medium").to_i
    def hard_solved = object.data.dig("solved", "hard").to_i
    def easy_total = object.data.dig("totals", "easy").to_i
    def medium_total = object.data.dig("totals", "medium").to_i
    def hard_total = object.data.dig("totals", "hard").to_i

    def days
      object.days.map { |date, count| { date: Date.iso8601(date), count: count.to_i } }.sort_by { |day| day[:date] }
    end
  end
end
