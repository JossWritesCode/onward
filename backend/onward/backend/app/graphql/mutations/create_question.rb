module Mutations
  class CreateQuestion < BaseMutation
    description "Adds a question to your question bank."

    argument :prompt, String, required: true

    field :question, Types::QuestionType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(prompt:)
      question = current_user!.questions.new(prompt:)
      question.save ? { question:, errors: [] } : { question: nil, errors: errors_for(question) }
    end
  end
end
