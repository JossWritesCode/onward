ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors)

    def create_user(email_address: "person#{SecureRandom.hex(4)}@example.com", password: "password123")
      User.create!(email_address:, password:)
    end
  end
end

# Helpers for sending GraphQL requests the way the browser does.
module GraphqlRequestHelpers
  def graphql(query, variables: {})
    post "/graphql",
      params: { query:, variables: }.to_json,
      headers: { "Content-Type" => "application/json" }
    response.parsed_body
  end

  def sign_in_as(user, password: "password123")
    result = graphql(<<~GRAPHQL, variables: { email: user.email_address, password: })
      mutation($email: String!, $password: String!) {
        signIn(emailAddress: $email, password: $password) { user { id } errors { message } }
      }
    GRAPHQL
    assert_empty result.dig("data", "signIn", "errors")
  end
end
