module Mutations
  class TailorResume < BaseMutation
    description "Makes the resume tailored for a job application from a base resume, keeping its template and design. Each application has at most one tailored resume."

    argument :id, ID, required: true, description: "The resume to start from."
    argument :job_application_id, ID, required: true
    argument :text, String, required: false,
      description: "An AI's reply to Onward's tailoring message: the tailored resume as JSON. Without it, the content is copied as it is. If it can't be read, nothing is saved and the error says where it broke."

    field :resume, Types::ResumeType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, job_application_id:, text: nil)
      user = current_user!
      base = user.resumes.find(id)
      job_application = user.job_applications.find(job_application_id)

      if (problem = Resume.link_problem(job_application))
        return { resume: nil, errors: [ { field: "jobApplicationId", message: problem } ] }
      end

      resume, problems = base.tailor_for(job_application, text:)
      { resume:, errors: problems.map { |message| { field: "text", message: } } }
    end
  end
end
