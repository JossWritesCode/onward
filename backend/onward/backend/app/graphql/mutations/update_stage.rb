module Mutations
  class UpdateStage < BaseMutation
    description "Renames a column or changes what kind of column it is."

    argument :id, ID, required: true
    argument :input, Types::StageInput, required: true

    field :stage, Types::StageType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      stage = current_user!.stages.find(id)

      if stage.update(input.to_h)
        { stage:, errors: [] }
      else
        { stage: nil, errors: errors_for(stage) }
      end
    end
  end
end
