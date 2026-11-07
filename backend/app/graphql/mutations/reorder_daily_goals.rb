module Mutations
  class ReorderDailyGoals < BaseMutation
    description "Puts your goals in a new order. Pass every goal's id, first to last."

    argument :ids, [ ID ], required: true

    field :daily_goals, [ Types::DailyGoalType ], null: false

    def resolve(ids:)
      user = current_user!
      goals = user.daily_goals.index_by { |goal| goal.id.to_s }
      DailyGoal.transaction do
        ids.each_with_index { |id, position| goals[id.to_s]&.update_column(:position, position) }
      end
      { daily_goals: user.daily_goals.reload }
    end
  end
end
