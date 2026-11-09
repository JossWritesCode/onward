module Mutations
  class LetGoOfJobApplication < BaseMutation
    description "Lets go of an application that's gone quiet: moves it to your first rejected column, which counts as closure."

    argument :id, ID, required: true

    field :job_application, Types::JobApplicationType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      user = current_user!
      job_application = user.job_applications.find(id)
      return { job_application:, errors: [] } if job_application.status_rejected?

      stage = user.stages.kind_rejected.order(:position).first
      if stage.nil?
        return { job_application: nil, errors: [ { field: nil, message: "Add a column of the rejected type to your board first." } ] }
      end

      job_application.move_to!(stage, 0)
      { job_application: job_application.reload, errors: [] }
    rescue ActiveRecord::RecordInvalid
      { job_application: nil, errors: errors_for(job_application) }
    end
  end
end
