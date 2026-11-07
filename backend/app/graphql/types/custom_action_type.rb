module Types
  class CustomActionType < Types::BaseObject
    description "Something you do for your job hunt that you log yourself, like \"Went to a meetup\"."

    field :id, ID, null: false
    field :name, String, null: false
    field :category, Types::ActivityCategoryEnum, null: false
    field :archived, Boolean, null: false, description: "True once deleted. Past activity keeps the name."

    def archived = object.archived_at.present?
  end
end
