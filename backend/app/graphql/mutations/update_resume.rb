module Mutations
  class UpdateResume < BaseMutation
    description "Changes a resume's title, template, page size, or content."

    argument :id, ID, required: true
    argument :input, Types::ResumeInput, required: true

    field :resume, Types::ResumeType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      resume = current_user!.resumes.find(id)
      attributes = input.to_h

      if attributes.key?(:content)
        problems = resume.replace_content(attributes.delete(:content))
        return { resume: nil, errors: problems.map { |message| { field: "content", message: } } } if problems.any?
      end

      resume.assign_attributes(attributes)
      resume.save ? { resume:, errors: [] } : { resume: nil, errors: errors_for(resume) }
    end
  end
end
