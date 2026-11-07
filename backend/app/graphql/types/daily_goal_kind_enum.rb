module Types
  class DailyGoalKindEnum < Types::BaseEnum
    graphql_name "DailyGoalKind"
    description "What a daily goal counts."

    value "APPLICATIONS", "Applications sent (cards moved into an applied column).", value: "applications"
    value "NETWORKING", "Networking messages, coffee chats, and follow-ups.", value: "networking"
    value "PRACTICE", "Interview questions practiced.", value: "practice"
    value "STUDY", "Minutes studied with the study timer or added by hand.", value: "study"
    value "MATERIALS", "Resumes or cover letters tailored.", value: "materials"
    value "LEETCODE", "Different LeetCode problems solved. Engineering track only.", value: "leetcode"
    value "GITHUB", "GitHub contributions. Engineering track only.", value: "github"
    value "CUSTOM", "Times you logged one of your custom actions.", value: "custom"
  end
end
