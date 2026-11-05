module Mutations
  class DeleteContact < BaseMutation
    description "Deletes a contact."

    argument :id, ID, required: true

    field :id, ID, null: false, description: "The id of the deleted contact."

    def resolve(id:)
      current_user!.contacts.find(id).destroy!
      { id: }
    end
  end
end
