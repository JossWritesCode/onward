module Types
  class StageInput < Types::BaseInputObject
    description "Fields for creating or updating a board column. Leave a field out to keep its current value."

    argument :name, String, required: false
    argument :kind, Types::JobApplicationStatusEnum, required: false
  end
end
