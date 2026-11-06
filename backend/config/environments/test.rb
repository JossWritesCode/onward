require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = ENV["CI"].present?
  config.consider_all_requests_local = true
  config.cache_store = :null_store

  config.action_dispatch.show_exceptions = :rescuable
  config.action_controller.allow_forgery_protection = false

  config.active_support.deprecation = :stderr

  # Fixed keys so tests can encrypt without any setup. Never use these elsewhere.
  config.active_record.encryption.primary_key = "test-only-primary-key-0123456789ab"
  config.active_record.encryption.deterministic_key = "test-only-deterministic-key-01234"
  config.active_record.encryption.key_derivation_salt = "test-only-key-derivation-salt-012"

  config.action_controller.raise_on_missing_callback_actions = true
end
