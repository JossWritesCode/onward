module Mutations
  class ResetPassword < BaseMutation
    description "Sets a new password from an emailed link, signs you out everywhere else, and signs you in here."

    argument :token, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(token:, password:, password_confirmation:)
      user = User.find_by_token_for(:password_reset_link, token)
      if user.nil?
        return { user: nil, errors: [ { field: "token", message: "This link has expired or was already used. Ask for a new one." } ] }
      end

      if user.update(password:, password_confirmation:)
        user.sessions.destroy_all
        context[:auth].start_new_session_for(user)
        { user:, errors: [] }
      else
        { user: nil, errors: errors_for(user) }
      end
    end
  end
end
