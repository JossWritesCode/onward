module Mutations
  class TailorResume < BaseMutation
    description "Copies a resume and links the copy to a job application, ready to tailor. Each application has at most one tailored resume."

    argument :id, ID, required: true, description: "The resume to start from."
    argument :job_application_id, ID, required: true

    field :resume, Types::ResumeType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, job_application_id:)
      user = current_user!
      base = user.resumes.find(id)
      job_application = user.job_applications.find(job_application_id)

      if (problem = Resume.link_problem(job_application))
        return { resume: nil, errors: [ { field: "jobApplicationId", message: problem } ] }
      end

      { resume: base.tailor_for(job_application), errors: [] }
    end
  end
end
