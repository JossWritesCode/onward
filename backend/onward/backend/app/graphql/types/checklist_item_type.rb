module Types
  class ChecklistItemType < Types::BaseObject
    description "One step in an interview round's prep checklist."

    field :id, ID, null: false
    field :text, String, null: false
    field :done, Boolean, null: false
  end
end
