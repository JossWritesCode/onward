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

    # Encrypts secrets stored in the database, like a GitHub token. bin/setup
    # writes random keys to backend/.env. In production, set these variables
    # on your host.
    config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]
    config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]
    config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]

    config.generators do |g|
      g.test_framework :test_unit, fixture: false
    end
  end
end
