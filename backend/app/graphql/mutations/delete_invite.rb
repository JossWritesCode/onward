module Mutations
  class DeleteInvite < BaseMutation
    description "Cancels an invite code. Accounts already made with it stay."

    argument :id, ID, required: true

    field :id, ID, null: false

    def resolve(id:)
      current_user!.invites.find(id).destroy!
      { id: }
    end
  end
end
