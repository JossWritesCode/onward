module Types
  # Built on the signed-in user. Fetches fresh LeetCode and GitHub data when
  # what's saved is more than 30 minutes old.
  class EngineeringType < Types::BaseObject
    description "The software engineering track: LeetCode, GitHub, and study time."

    field :leetcode, Types::LeetcodeStatsType, null: true, description: "Null until you add your LeetCode username."
    field :github, Types::GithubStatsType, null: true, description: "Null until you add your GitHub username."
    field :study, Types::StudyStatsType, null: false

    def leetcode = IntegrationSync.leetcode(object, force: context[:refresh_integrations])
    def github = IntegrationSync.github(object, force: context[:refresh_integrations])
    def study = object
  end
end
