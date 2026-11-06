module Mutations
  class DeleteChecklistItem < BaseMutation
    description "Removes a step from one interview round's checklist."

    argument :id, ID, required: true

    field :interview_round, Types::InterviewRoundType, null: false

    def resolve(id:)
      item = ChecklistItem.joins(interview_round: :job_application)
        .where(job_applications: { user_id: current_user!.id })
        .find(id)
      round = item.interview_round
      item.destroy!
      round.checklist_items.reset
      round.record_progress!
      { interview_round: round }
    end
  end
end
