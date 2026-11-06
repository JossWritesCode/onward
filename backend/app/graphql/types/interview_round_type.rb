module Types
  class InterviewRoundType < Types::BaseObject
    description "One round of interviews for an application, with its prep checklist."

    field :id, ID, null: false
    field :name, String, null: false, description: "The board column it started in, like \"Phone screen\"."
    field :scheduled_at, GraphQL::Types::ISO8601DateTime, null: true
    field :prepped, Boolean, null: false, description: "Whether the checklist has ever been finished."
    field :checklist_items, [ Types::ChecklistItemType ], null: false
    field :job_application, Types::JobApplicationType, null: false

    def prepped
      object.prepped_at.present?
    end

    def checklist_items
      dataload_association(:checklist_items)
    end

    def job_application
      dataload_association(:job_application)
    end
  end
end
