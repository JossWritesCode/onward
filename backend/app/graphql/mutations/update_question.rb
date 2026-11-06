module Mutations
  class UpdateQuestion < BaseMutation
    description "Rewords a question in your question bank."

    argument :id, ID, required: true
    argument :prompt, String, required: true

    field :question, Types::QuestionType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, prompt:)
      question = current_user!.questions.find(id)
      question.update(prompt:) ? { question:, errors: [] } : { question: nil, errors: errors_for(question) }
    end
  end
end
