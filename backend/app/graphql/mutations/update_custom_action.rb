module Mutations
  class UpdateCustomAction < BaseMutation
    description "Renames a custom action or changes its category. Past activity follows along."

    argument :id, ID, required: true
    argument :name, String, required: false
    argument :category, Types::ActivityCategoryEnum, required: false

    field :custom_action, Types::CustomActionType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, **changes)
      action = current_user!.custom_actions.active.find(id)
      CustomAction.transaction do
        if action.update(changes)
          action.activities.update_all(category: action.category) if action.saved_change_to_category?
          { custom_action: action, errors: [] }
        else
          { custom_action: nil, errors: errors_for(action) }
        end
      end
    end
  end
end
