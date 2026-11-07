module Types
  class ActivityType < Types::BaseObject
    description "Something you did for your job hunt on a given day."

    field :id, ID, null: false
    field :kind, Types::ActivityKindEnum, null: false
    field :category, Types::ActivityCategoryEnum, null: false
    field :occurred_on, GraphQL::Types::ISO8601Date, null: false, description: "The day it happened, on your clock."
    field :note, String, null: true
    field :automatic, Boolean, null: false,
      description: "True when it came from moving a card on the board, false when you logged it."
    field :job_application, Types::JobApplicationType, null: true
    field :contact, Types::ContactType, null: true
    field :custom_action, Types::CustomActionType, null: true, description: "Set when kind is CUSTOM."
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
