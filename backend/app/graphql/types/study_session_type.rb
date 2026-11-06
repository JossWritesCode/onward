module Types
  class StudySessionType < Types::BaseObject
    description "A focused study session from the study timer."

    field :id, ID, null: false
    field :topic, String, null: false
    field :minutes, Int, null: false
    field :studied_on, GraphQL::Types::ISO8601Date, null: false
  end
end
