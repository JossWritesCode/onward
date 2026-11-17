module Mutations
  class MoveJobApplication < BaseMutation
    description "Moves an application to a board column and spot, like dragging a card."

    argument :id, ID, required: true
    argument :stage_id, ID, required: true
    argument :position, Int, required: false, description: "Where in the column, 0 is the top. Defaults to the top."

    field :job_application, Types::JobApplicationType, null: true
    field :undone, [ Types::ActivityKindEnum ], null: false,
      description: "What this move took back, like INTERVIEW, because it moved the card back from a column it was only just moved into. Usually empty."
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, stage_id:, position: 0)
      user = current_user!
      job_application = user.job_applications.find(id)
      stage = user.stages.find(stage_id)

      job_application.move_to!(stage, position)
      { job_application: job_application.reload, undone: job_application.undone_kinds, errors: [] }
    rescue ActiveRecord::RecordInvalid
      { job_application: nil, undone: [], errors: errors_for(job_application) }
    end
  end
end
