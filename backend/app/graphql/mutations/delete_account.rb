module Mutations
  class DeleteAccount < BaseMutation
    description "Deletes your account and everything in it, for good. Needs your password."

    argument :password, String, required: true

    field :deleted, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(password:)
      user = current_user!
      unless user.authenticate(password)
        return { deleted: false, errors: [ { field: "password", message: "That password isn't right." } ] }
      end

      context[:auth].terminate_session
      user.destroy!
      { deleted: true, errors: [] }
    end
  end
end
