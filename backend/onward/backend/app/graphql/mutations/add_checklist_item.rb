module Mutations
  class AddChecklistItem < BaseMutation
    description "Adds a step to one interview round's checklist."

    argument :interview_round_id, ID, required: true
    argument :text, String, required: true

    field :interview_round, Types::InterviewRoundType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(interview_round_id:, text:)
      round = find_interview_round!(interview_round_id)
      item = round.checklist_items.new(text:, position: (round.checklist_items.maximum(:position) || -1) + 1)

      if item.save
        round.checklist_items.reset
        { interview_round: round, errors: [] }
      else
        { interview_round: nil, errors: errors_for(item) }
      end
    end
  end
end
