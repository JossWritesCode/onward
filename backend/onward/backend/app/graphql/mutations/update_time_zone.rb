module Mutations
  class UpdateTimeZone < BaseMutation
    description "Sets your time zone, so days and streaks follow your clock. The app sends this automatically."

    argument :time_zone, String, required: true, description: "An IANA time zone, like America/Toronto."

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(time_zone:)
      user = current_user!

      if user.update(time_zone:)
        { user:, errors: [] }
      else
        { user: nil, errors: errors_for(user) }
      end
    end
  end
end
