module Mutations
  class CreateJobApplication < BaseMutation
    description "Adds a job application."

    argument :input, Types::JobApplicationInput, required: true

    field :job_application, Types::JobApplicationType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      user = current_user!
      attributes = input.to_h
      contact_ids = attributes.delete(:contact_ids)

      job_application = user.job_applications.new(attributes)
      job_application.contacts = user.contacts.where(id: contact_ids) unless contact_ids.nil?

      if job_application.save
        { job_application:, errors: [] }
      else
        { job_application: nil, errors: errors_for(job_application) }
      end
    end
  end
end
