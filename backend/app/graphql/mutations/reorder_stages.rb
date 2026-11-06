module Mutations
  class ReorderStages < BaseMutation
    description "Puts the board columns in a new order, left to right."

    argument :ids, [ ID ], required: true, description: "Every column id, in the new order."

    field :stages, [ Types::StageType ], null: false

    def resolve(ids:)
      user = current_user!
      stages = user.stages.to_a

      unless ids.map(&:to_s).sort == stages.map { |stage| stage.id.to_s }.sort
        raise GraphQL::ExecutionError, "Include every column exactly once."
      end

      Stage.transaction do
        ids.each_with_index do |id, position|
          stages.find { |stage| stage.id.to_s == id.to_s }.update_column(:position, position)
        end
      end

      { stages: user.stages.reload }
    end
  end
end
