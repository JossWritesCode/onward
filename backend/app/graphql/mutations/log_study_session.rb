module Mutations
  class LogStudySession < BaseMutation
    description "Records a study session from the timer. Sessions under 10 minutes aren't saved."

    argument :topic, String, required: true
    argument :minutes, Int, required: true
    argument :studied_on, GraphQL::Types::ISO8601Date, required: false,
      description: "For time you studied away from the timer. Defaults to today, and can be up to a week back."

    field :counted, Boolean, null: false, description: "Whether the session was long enough to count."
    field :study_session, Types::StudySessionType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(topic:, minutes:, studied_on: nil)
      if minutes < StudySession::MINIMUM_MINUTES
        return { counted: false, study_session: nil, errors: [] }
      end

      user = current_user!
      if studied_on && !(user.today - 7..user.today).cover?(studied_on)
        return { counted: false, study_session: nil, errors: [ { field: "studiedOn", message: "Pick a day in the last week." } ] }
      end

      session = user.study_sessions.new(topic: topic.presence || "Studying", minutes: [ minutes, 480 ].min, studied_on:)
      if session.save
        { counted: true, study_session: session, errors: [] }
      else
        { counted: false, study_session: nil, errors: errors_for(session) }
      end
    end
  end
end
