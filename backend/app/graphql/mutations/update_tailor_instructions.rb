module Mutations
  class UpdateTailorInstructions < BaseMutation
    description "Saves your own instructions for the message that asks ChatGPT to tailor a resume. Send null or an empty string to go back to Onward's default."

    argument :instructions, String, required: false

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(instructions: nil)
      user = current_user!

      if user.update(tailor_instructions: instructions)
        { user:, errors: [] }
      else
        { user: nil, errors: errors_for(user) }
      end
    end
  end
end
