# Cookie-based sign-in, modeled on the Rails 8 authentication generator.
#
# The cookie holds only a signed session id. It's HTTP-only (JavaScript can't
# read it) and SameSite=Lax (other sites can't send it along with their own
# requests). Combined with GraphqlController only accepting JSON requests, that
# protects against cross-site request forgery without needing CSRF tokens.
module Authentication
  extend ActiveSupport::Concern

  included do
    include ActionController::Cookies
  end

  def current_session
    return @current_session if defined?(@current_session)

    session_id = cookies.signed[:session_id]
    @current_session = session_id && Session.includes(:user).find_by(id: session_id)
  end

  def current_user
    current_session&.user
  end

  def start_new_session_for(user)
    user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
      @current_session = session
      cookies.signed.permanent[:session_id] = {
        value: session.id,
        httponly: true,
        same_site: :lax,
        secure: Rails.env.production?
      }
    end
  end

  def terminate_session
    current_session&.destroy
    @current_session = nil
    cookies.delete(:session_id)
  end
end
