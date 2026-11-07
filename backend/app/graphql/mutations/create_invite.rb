module Mutations
  class CreateInvite < BaseMutation
    description "Makes a one-time invite code. Admins only."

    argument :note, String, required: false, description: "Who it's for, so you remember."

    field :invite, Types::InviteType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(note: nil)
      user = current_user!
      return { invite: nil, errors: [ { field: nil, message: "Only admins can make invites." } ] } unless user.admin?

      invite = user.invites.new(note:)
      invite.save ? { invite:, errors: [] } : { invite: nil, errors: errors_for(invite) }
    end
  end
end
