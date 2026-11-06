class GraphqlController < ApplicationController
  include Authentication

  before_action :require_json_request

  def execute
    result = OnwardSchema.execute(
      params[:query],
      variables: prepare_variables(params[:variables]),
      operation_name: params[:operationName],
      context: {
        current_user: current_user,
        # Lets sign-in and sign-out mutations set and clear the session cookie.
        auth: self
      }
    )
    render json: result
  rescue StandardError => error
    raise error unless Rails.env.development?

    handle_error_in_development(error)
  end

  private

  # Browsers can't send a cross-site JSON POST without a CORS preflight, which
  # this API never approves. Requiring JSON closes the door on forged form posts.
  def require_json_request
    return if request.media_type == "application/json"

    render json: { errors: [ { message: "Requests must be sent as JSON." } ] }, status: :unsupported_media_type
  end

  def prepare_variables(variables_param)
    case variables_param
    when String
      variables_param.present? ? (JSON.parse(variables_param) || {}) : {}
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(error)
    logger.error error.message
    logger.error error.backtrace.join("\n")

    render json: { errors: [ { message: error.message, backtrace: error.backtrace } ], data: {} },
      status: :internal_server_error
  end
end
