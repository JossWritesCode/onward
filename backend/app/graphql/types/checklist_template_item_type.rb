module Types
  class ChecklistTemplateItemType < Types::BaseObject
    description "One line of the checklist every new interview round starts with."

    field :id, ID, null: false
    field :text, String, null: false
  end
end
