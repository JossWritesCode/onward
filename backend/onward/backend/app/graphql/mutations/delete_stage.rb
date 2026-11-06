module Mutations
  class DeleteStage < BaseMutation
    description "Deletes an empty column."

    argument :id, ID, required: true

    field :id, ID, null: true, description: "The id of the deleted column, or null if it couldn't be deleted."
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      stage = current_user!.stages.find(id)

      if stage.destroy
        { id:, errors: [] }
      else
        { id: nil, errors: errors_for(stage) }
      end
    end
  end
end
