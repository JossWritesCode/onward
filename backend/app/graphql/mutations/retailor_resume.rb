module Mutations
  class RetailorResume < BaseMutation
    description "Replaces a tailored resume's content with an AI's reply to Onward's re-tailoring message, keeping its title, template, design, and application. If the reply can't be read, nothing changes and the error says where it broke."

    argument :id, ID, required: true, description: "A tailored resume (one linked to an application)."
    argument :text, String, required: true

    field :resume, Types::ResumeType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, text:)
      resume = current_user!.resumes.find(id)
      problems = resume.retailor(text)
      { resume: problems.empty? ? resume : nil, errors: problems.map { |message| { field: "text", message: } } }
    end
  end
end
