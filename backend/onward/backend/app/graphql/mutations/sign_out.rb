module Mutations
  class SignOut < BaseMutation
    description "Signs out of this browser."

    field :success, Boolean, null: false

    def resolve
      context[:auth].terminate_session
      { success: true }
    end
  end
end
