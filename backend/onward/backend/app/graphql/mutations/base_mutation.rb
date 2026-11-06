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

    # Swaps a stage_id from the input for the user's own stage, so nobody can
    # put an application in someone else's column.
    def resolve_stage!(attributes, user)
      return unless attributes.key?(:stage_id)

      stage_id = attributes.delete(:stage_id)
      attributes[:stage] = user.stages.find(stage_id) if stage_id.present?
    end

    # An interview round, but only if it belongs to one of your applications.
    def find_interview_round!(id)
      InterviewRound.joins(:job_application).where(job_applications: { user_id: current_user!.id }).find(id)
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
