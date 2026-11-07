module Mutations
  class DeleteCustomAction < BaseMutation
    description "Removes a custom action and its goal, if it has one. Times you logged it stay in your history."

    argument :id, ID, required: true

    field :id, ID, null: false

    def resolve(id:)
      current_user!.custom_actions.active.find(id).archive!
      { id: }
    end
  end
end
