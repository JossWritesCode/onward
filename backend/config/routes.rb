Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # "Download my data" on the Account page.
  get "/account/export", to: "account_exports#show"

  # Returns 200 when the app boots without errors. Handy for hosting health checks.
  get "up" => "rails/health#show", as: :rails_health_check

  # The end-to-end tests reset their account before each test. Test environment
  # only, and the controller also checks for an _e2e database.
  post "/e2e/reset/:account", to: "e2e_resets#create" if Rails.env.test?

  # Every other page address loads the React app, which handles its own routes.
  root "spa#index"
  get "*path", to: "spa#index", constraints: ->(request) { !request.xhr? && request.format.html? }
end
