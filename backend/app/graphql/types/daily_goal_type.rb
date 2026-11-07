module Types
  class DailyGoalType < Types::BaseObject
    description "Something you want to do every day (or every weekday)."

    field :id, ID, null: false
    field :kind, Types::DailyGoalKindEnum, null: false
    field :target, Int, null: false, description: "How many (or, for study, how many minutes) count as done."
    field :weekdays_only, Boolean, null: false, description: "True when the goal skips Saturdays and Sundays."
    field :custom_action, Types::CustomActionType, null: true, description: "Set for custom goals."
    field :available, Boolean, null: false,
      description: "False for LeetCode and GitHub goals while the engineering track is off. They don't count until it's back on."
    field :min_target, Int, null: false
    field :max_target, Int, null: false

    def custom_action = dataload_association(:custom_action)
    def available = object.available?
    def min_target = object.target_range.min
    def max_target = object.target_range.max
  end
end
