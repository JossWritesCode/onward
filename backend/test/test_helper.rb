ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors)

    # Temporarily replaces a module method, like Integrations::Leetcode.fetch,
    # so tests never call the real LeetCode or GitHub. `value` is returned, or
    # called with the arguments if it's a lambda.
    def with_stub(object, method_name, value)
      original = object.method(method_name)
      object.define_singleton_method(method_name) do |*args, **_kwargs, &_block|
        value.respond_to?(:call) ? value.call(*args) : value
      end
      yield
    ensure
      object.define_singleton_method(method_name, original)
    end

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
