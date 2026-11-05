module Mutations
  class SignUp < BaseMutation
    description "Creates an account and signs in."

    argument :email_address, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(email_address:, password:, password_confirmation:)
      user = User.new(email_address:, password:, password_confirmation:)

      if user.save
        context[:auth].start_new_session_for(user)
        { user:, errors: [] }
      else
        { user: nil, errors: errors_for(user) }
      end
    end
  end
end
