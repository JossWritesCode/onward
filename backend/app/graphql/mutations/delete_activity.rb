module Mutations
  class DeleteActivity < BaseMutation
    description "Deletes something you logged by mistake. Board activity can't be deleted."

    argument :id, ID, required: true

    field :id, ID, null: true, description: "The id of the deleted activity, or null if it couldn't be deleted."
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      activity = current_user!.activities.find(id)

      if activity.automatic?
        { id: nil, errors: [ { field: nil, message: "This came from your board, so it can't be deleted here." } ] }
      else
        activity.destroy!
        { id:, errors: [] }
      end
    end
  end
end
