module Mutations
  class UpdateDailyGoal < BaseMutation
    description "Changes a goal's number or whether it's for weekdays only."

    argument :id, ID, required: true
    argument :target, Int, required: false
    argument :weekdays_only, Boolean, required: false

    field :daily_goal, Types::DailyGoalType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, **changes)
      goal = current_user!.daily_goals.find(id)
      goal.update(changes) ? { daily_goal: goal, errors: [] } : { daily_goal: nil, errors: errors_for(goal) }
    end
  end
end
