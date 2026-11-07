module Mutations
  class CreateCustomAction < BaseMutation
    description "Adds an action you can log, like \"Went to a meetup\"."

    argument :name, String, required: true
    argument :category, Types::ActivityCategoryEnum, required: true

    field :custom_action, Types::CustomActionType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(name:, category:)
      action = current_user!.custom_actions.new(name:, category:)
      action.save ? { custom_action: action, errors: [] } : { custom_action: nil, errors: errors_for(action) }
    end
  end
end
