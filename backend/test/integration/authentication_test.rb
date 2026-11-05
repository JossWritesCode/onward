require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  ME = "query { me { id emailAddress } }".freeze

  test "signing up creates an account and signs you in" do
    result = graphql(<<~GRAPHQL)
      mutation {
        signUp(emailAddress: "new@example.com", password: "password123", passwordConfirmation: "password123") {
          user { emailAddress }
          errors { field message }
        }
      }
    GRAPHQL

    assert_empty result.dig("data", "signUp", "errors")
    assert_equal "new@example.com", graphql(ME).dig("data", "me", "emailAddress")
  end

  test "signing up with mismatched passwords returns a field error" do
    result = graphql(<<~GRAPHQL)
      mutation {
        signUp(emailAddress: "new@example.com", password: "password123", passwordConfirmation: "different1") {
          user { id }
          errors { field message }
        }
      }
    GRAPHQL

    errors = result.dig("data", "signUp", "errors")
    assert_equal [ "passwordConfirmation" ], errors.map { |e| e["field"] }
    assert_nil graphql(ME).dig("data", "me")
  end

  test "signing in with the wrong password fails" do
    user = create_user
    result = graphql(<<~GRAPHQL, variables: { email: user.email_address })
      mutation($email: String!) {
        signIn(emailAddress: $email, password: "wrong-password") { user { id } errors { message } }
      }
    GRAPHQL

    assert_nil result.dig("data", "signIn", "user")
    assert_equal 1, result.dig("data", "signIn", "errors").size
  end

  test "signing out ends the session" do
    user = create_user
    sign_in_as(user)
    assert_equal user.id.to_s, graphql(ME).dig("data", "me", "id")

    graphql("mutation { signOut { success } }")

    assert_nil graphql(ME).dig("data", "me")
    assert_equal 0, user.sessions.count
  end

  test "rejects requests that aren't JSON" do
    post "/graphql", params: { query: ME }
    assert_response :unsupported_media_type
  end
end
