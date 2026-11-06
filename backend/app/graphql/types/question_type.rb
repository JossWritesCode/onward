module Types
  class QuestionType < Types::BaseObject
    description "An interview question in your question bank."

    field :id, ID, null: false
    field :prompt, String, null: false
  end
end
