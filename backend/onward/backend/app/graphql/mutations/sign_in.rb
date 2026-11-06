module Mutations
  class SignIn < BaseMutation
    description "Signs in with an email address and password."

    argument :email_address, String, required: true
    argument :password, String, required: true

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(email_address:, password:)
      # authenticate_by takes the same time whether or not the email exists,
      # so response timing doesn't reveal who has an account.
      user = User.authenticate_by(email_address: email_address.to_s.strip.downcase, password:)

      if user
        context[:auth].start_new_session_for(user)
        { user:, errors: [] }
      else
        { user: nil, errors: [ { field: nil, message: "That email and password don't match. Try again." } ] }
      end
    end
  end
end
