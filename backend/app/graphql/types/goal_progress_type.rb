module Types
  # Built on a DailyGoals::Progress.
  class GoalProgressType < Types::BaseObject
    description "How far along you are on one goal today."

    field :goal, Types::DailyGoalType, null: false
    field :count, Int, null: false, description: "How many so far (minutes, for study goals)."
    field :done, Boolean, null: false

    def done = object.done?
  end
end
