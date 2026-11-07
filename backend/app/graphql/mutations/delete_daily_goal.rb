module Mutations
  class DeleteDailyGoal < BaseMutation
    description "Removes a daily goal. Perfect days you already had stay."

    argument :id, ID, required: true

    field :id, ID, null: false

    def resolve(id:)
      current_user!.daily_goals.find(id).destroy!
      { id: }
    end
  end
end
