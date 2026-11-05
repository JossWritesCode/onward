require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module Onward
  class Application < Rails::Application
    config.load_defaults 8.0

    config.autoload_lib(ignore: %w[assets tasks])

    # Rails only serves the GraphQL API; the React app in ../frontend is the interface.
    config.api_only = true

    # API-only apps skip cookies by default. Onward keeps people signed in with a
    # signed, HTTP-only session cookie, so add the middleware back.
    config.middleware.use ActionDispatch::Cookies

    config.generators do |g|
      g.test_framework :test_unit, fixture: false
    end
  end
end
