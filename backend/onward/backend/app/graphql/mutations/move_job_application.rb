module Mutations
  class MoveJobApplication < BaseMutation
    description "Moves an application to a board column and spot, like dragging a card."

    argument :id, ID, required: true
    argument :stage_id, ID, required: true
    argument :position, Int, required: false, description: "Where in the column, 0 is the top. Defaults to the top."

    field :job_application, Types::JobApplicationType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, stage_id:, position: 0)
      user = current_user!
      job_application = user.job_applications.find(id)
      stage = user.stages.find(stage_id)

      job_application.move_to!(stage, position)
      { job_application: job_application.reload, errors: [] }
    rescue ActiveRecord::RecordInvalid
      { job_application: nil, errors: errors_for(job_application) }
    end
  end
end
