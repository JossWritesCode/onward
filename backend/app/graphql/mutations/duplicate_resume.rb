module Mutations
  class DuplicateResume < BaseMutation
    description "Makes a copy of a resume, ready to tailor."

    argument :id, ID, required: true

    field :resume, Types::ResumeType, null: false

    def resolve(id:)
      { resume: current_user!.resumes.find(id).duplicate }
    end
  end
end
