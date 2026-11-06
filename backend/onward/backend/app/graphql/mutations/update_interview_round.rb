module Mutations
  class UpdateInterviewRound < BaseMutation
    description "Sets (or clears) when an interview round happens, for the countdown."

    argument :id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false

    field :interview_round, Types::InterviewRoundType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, scheduled_at: nil)
      round = find_interview_round!(id)
      round.update(scheduled_at:) ? { interview_round: round, errors: [] } : { interview_round: nil, errors: errors_for(round) }
    end
  end
end
