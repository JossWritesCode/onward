module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField
    object_class Types::BaseObject

    null false

    private

    def current_user!
      context[:current_user] || raise(GraphQL::ExecutionError, "You need to sign in first.")
    end

    # Turns ActiveRecord validation errors into UserError objects the frontend
    # can show next to the matching form field.
    def errors_for(record)
      record.errors.map do |error|
        { field: error.attribute.to_s.camelize(:lower), message: error.full_message }
      end
    end
  end
end
