module Types
  # Built on an IntegrationSnapshot for GitHub.
  class GithubStatsType < Types::BaseObject
    description "Your GitHub contribution calendar."

    field :username, String, null: false
    field :total_contributions, Int, null: false, description: "Contributions over the last year."
    field :days, [ Types::CalendarDayType ], null: false
    field :error, String, null: true, description: "Why the latest refresh failed, if it did. Older data may still show."
    field :fetched_at, GraphQL::Types::ISO8601DateTime, null: true

    def username = object.data["username"] || object.user.github_username
    def total_contributions = object.data["total_contributions"].to_i

    def days
      object.days.map { |date, count| { date: Date.iso8601(date), count: count.to_i } }.sort_by { |day| day[:date] }
    end
  end
end
