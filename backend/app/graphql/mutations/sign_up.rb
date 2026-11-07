module Mutations
  class SignUp < BaseMutation
    description "Creates an account and signs in."

    argument :email_address, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :invite_code, String, required: false, description: "Needed when sign-ups are invite-only."

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(email_address:, password:, password_confirmation:, invite_code: nil)
      user = User.new(email_address:, password:, password_confirmation:, admin: Signups.admin?(email_address))

      User.transaction do
        invite = nil
        if Signups.invite_needed?(email_address)
          invite = Invite.unused.lock.find_by(code: Invite.normalize_value_for(:code, invite_code.to_s))
          if invite.nil?
            message = invite_code.blank? ? "You need an invite code to sign up here." : "That invite code isn't valid, or it was already used."
            return { user: nil, errors: [ { field: "inviteCode", message: } ] }
          end
        end

        unless user.save
          return { user: nil, errors: errors_for(user) }
        end

        invite&.update!(used_by: user, used_at: Time.current)
      end

      context[:auth].start_new_session_for(user)
      { user:, errors: [] }
    end
  end
end
