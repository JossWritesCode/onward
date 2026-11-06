module Mutations
  class SetChecklistItemDone < BaseMutation
    description "Checks or unchecks a prep checklist item."

    argument :id, ID, required: true
    argument :done, Boolean, required: true

    field :interview_round, Types::InterviewRoundType, null: false
    field :just_prepped, Boolean, null: false, description: "True when this finished the checklist for the first time."

    def resolve(id:, done:)
      item = ChecklistItem.joins(interview_round: :job_application)
        .where(job_applications: { user_id: current_user!.id })
        .find(id)
      round = item.interview_round
      was_prepped = round.prepped_at.present?

      item.update!(done:)
      round.checklist_items.reset
      round.record_progress!

      { interview_round: round, just_prepped: !was_prepped && round.prepped_at.present? }
    end
  end
end
