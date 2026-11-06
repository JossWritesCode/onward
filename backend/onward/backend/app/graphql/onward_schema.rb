class OnwardSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType

  use GraphQL::Dataloader

  # Guard against accidentally (or deliberately) huge queries.
  max_depth 12
  max_complexity 400

  rescue_from(ActiveRecord::RecordNotFound) do |_error, _object, _arguments, _context, _field|
    raise GraphQL::ExecutionError, "We couldn't find that."
  end
end
