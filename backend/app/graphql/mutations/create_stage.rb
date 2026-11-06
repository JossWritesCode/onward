module Mutations
  class CreateStage < BaseMutation
    description "Adds a column to the end of the board."

    argument :input, Types::StageInput, required: true

    field :stage, Types::StageType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      stage = current_user!.stages.new(input.to_h)

      if stage.save
        { stage:, errors: [] }
      else
        { stage: nil, errors: errors_for(stage) }
      end
    end
  end
end
