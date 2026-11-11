module Mutations
  class UpdateResume < BaseMutation
    description "Changes a resume's title, template, page size, style, content, or which application it's tailored for."

    argument :id, ID, required: true
    argument :input, Types::ResumeInput, required: true

    field :resume, Types::ResumeType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      user = current_user!
      resume = user.resumes.find(id)
      attributes = input.to_h

      if attributes.key?(:job_application_id)
        application_id = attributes.delete(:job_application_id)
        resume.job_application = application_id.present? ? user.job_applications.find(application_id) : nil
        if (problem = Resume.link_problem(resume.job_application, except: resume))
          return { resume: nil, errors: [ { field: "jobApplicationId", message: problem } ] }
        end
      end

      if attributes.key?(:content)
        problems = resume.replace_content(attributes.delete(:content))
        return { resume: nil, errors: problems.map { |message| { field: "content", message: } } } if problems.any?
      end

      if attributes.key?(:style)
        changes = (attributes.delete(:style) || {}).to_h.transform_keys { |key| key.to_s.camelize(:lower) }
        resume.style = resume.style.merge(changes.compact)
      end

      resume.assign_attributes(attributes)
      resume.save ? { resume:, errors: [] } : { resume: nil, errors: errors_for(resume) }
    end
  end
end
