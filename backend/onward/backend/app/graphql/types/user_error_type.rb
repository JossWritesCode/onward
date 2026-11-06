module Types
  class UserErrorType < Types::BaseObject
    description "A problem with what was submitted, like a missing company name."

    field :field, String, null: true,
      description: "The input field the problem is about, in camelCase. Null when it applies to the whole form."
    field :message, String, null: false, description: "A sentence that can be shown to the person."
  end
end
