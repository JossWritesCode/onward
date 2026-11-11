module Mutations
  class ImportResume < BaseMutation
    description "Saves a new resume from JSON an AI wrote using Onward's prompt. Small slips are forgiven. If it can't be read, nothing is saved and the error says where it broke."

    argument :text, String, required: true
    argument :job_application_id, ID, required: false, description: "Links the new resume to this application, as its tailored resume."

    field :resume, Types::ResumeType, null: true
    field :filled_fields, [ String ], null: false,
      description: "Contact fields the paste left blank that were copied from your most recent resume."
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(text:, job_application_id: nil)
      user = current_user!
      job_application = job_application_id.present? ? user.job_applications.find(job_application_id) : nil
      resume, problems, filled = Resume.import(user, text, job_application:)
      { resume:, filled_fields: filled, errors: problems.map { |message| { field: "text", message: } } }
    end
  end
end
