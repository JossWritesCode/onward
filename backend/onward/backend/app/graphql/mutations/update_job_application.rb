module Mutations
  class UpdateJobApplication < BaseMutation
    description "Changes a job application, like moving it to a new status."

    argument :id, ID, required: true
    argument :input, Types::JobApplicationInput, required: true

    field :job_application, Types::JobApplicationType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      user = current_user!
      job_application = user.job_applications.find(id)
      attributes = input.to_h
      contact_ids = attributes.delete(:contact_ids)
      resolve_stage!(attributes, user)

      saved = JobApplication.transaction do
        job_application.assign_attributes(attributes)
        job_application.contacts = user.contacts.where(id: contact_ids) unless contact_ids.nil?
        job_application.save || raise(ActiveRecord::Rollback)
      end

      if saved
        { job_application: job_application.reload, errors: [] }
      else
        { job_application: nil, errors: errors_for(job_application) }
      end
    end
  end
end
