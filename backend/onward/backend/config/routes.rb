Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # Returns 200 when the app boots without errors. Handy for hosting health checks.
  get "up" => "rails/health#show", as: :rails_health_check
end
