module Mutations
  class DeleteQuestion < BaseMutation
    description "Removes a question from your question bank."

    argument :id, ID, required: true

    field :id, ID, null: false

    def resolve(id:)
      current_user!.questions.find(id).destroy!
      { id: }
    end
  end
end
