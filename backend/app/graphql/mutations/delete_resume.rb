module Mutations
  class DeleteResume < BaseMutation
    description "Deletes a resume for good."

    argument :id, ID, required: true

    field :id, ID, null: false

    def resolve(id:)
      current_user!.resumes.find(id).destroy!
      { id: }
    end
  end
end
