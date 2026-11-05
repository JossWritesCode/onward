module Types
  class BaseObject < GraphQL::Schema::Object
    field_class Types::BaseField

    private

    def current_user!
      context[:current_user] || raise(GraphQL::ExecutionError, "You need to sign in first.")
    end
  end
end
