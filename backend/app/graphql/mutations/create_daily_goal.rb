module Mutations
  class CreateDailyGoal < BaseMutation
    description "Adds a daily goal, like \"Apply to 1 job\"."

    argument :kind, Types::DailyGoalKindEnum, required: true
    argument :target, Int, required: true
    argument :weekdays_only, Boolean, required: false, default_value: false
    argument :custom_action_id, ID, required: false, description: "Required for CUSTOM goals."

    field :daily_goal, Types::DailyGoalType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(kind:, target:, weekdays_only:, custom_action_id: nil)
      user = current_user!
      goal = user.daily_goals.new(
        kind:, target:, weekdays_only:,
        custom_action: custom_action_id.present? ? user.custom_actions.active.find(custom_action_id) : nil
      )
      goal.save ? { daily_goal: goal, errors: [] } : { daily_goal: nil, errors: errors_for(goal) }
    end
  end
end
