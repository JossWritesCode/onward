module Mutations
  class DeleteJobApplication < BaseMutation
    description "Deletes a job application."

    argument :id, ID, required: true

    field :id, ID, null: false, description: "The id of the deleted application."

    def resolve(id:)
      current_user!.job_applications.find(id).destroy!
      { id: }
    end
  end
end
