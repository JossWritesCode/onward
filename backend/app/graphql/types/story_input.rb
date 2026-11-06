module Types
  class StoryInput < Types::BaseInputObject
    description "Fields for creating or updating a story. Leave a field out to keep its current value."

    argument :title, String, required: false
    argument :situation, String, required: false
    argument :task, String, required: false
    argument :action, String, required: false
    argument :result, String, required: false
    argument :tags, [ String ], required: false
  end
end
