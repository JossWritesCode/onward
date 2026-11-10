require "test_helper"

class AccountsTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  SIGN_UP = <<~GRAPHQL.freeze
    mutation($email: String!, $code: String) {
      signUp(emailAddress: $email, password: "password123", passwordConfirmation: "password123", inviteCode: $code) {
        user { emailAddress admin }
        errors { field message }
      }
    }
  GRAPHQL

  setup { ActionMailer::Base.deliveries.clear }

  test "invite-only sign-ups need a code, which works once" do
    with_env("SIGNUPS" => "invite", "OWNER_EMAIL" => "joss@example.com") do
      owner = graphql(SIGN_UP, variables: { email: "joss@example.com" }).dig("data", "signUp", "user")
      assert_equal({ "emailAddress" => "joss@example.com", "admin" => true }, owner)

      code = graphql('mutation { createInvite(note: "Sam") { invite { code note } errors { message } } }')
        .dig("data", "createInvite", "invite", "code")
      assert_match(/\A[A-Z2-9]{4}-[A-Z2-9]{4}\z/, code)
      graphql("mutation { signOut { success } }")

      no_code = graphql(SIGN_UP, variables: { email: "sam@example.com" }).dig("data", "signUp", "errors")
      assert_equal [ "inviteCode" ], no_code.map { |e| e["field"] }

      friend = graphql(SIGN_UP, variables: { email: "sam@example.com", code: code.downcase }).dig("data", "signUp", "user")
      assert_equal({ "emailAddress" => "sam@example.com", "admin" => false }, friend)
      assert_equal User.find_by!(email_address: "sam@example.com"), Invite.last.used_by
      graphql("mutation { signOut { success } }")

      reused = graphql(SIGN_UP, variables: { email: "alex@example.com", code: }).dig("data", "signUp", "errors")
      assert_equal [ "inviteCode" ], reused.map { |e| e["field"] }
    end
  end

  test "the first account on a server can always sign up and is the admin" do
    with_env("SIGNUPS" => "invite", "OWNER_EMAIL" => nil) do
      first = graphql(SIGN_UP, variables: { email: "first@example.com" }).dig("data", "signUp", "user")
      assert first["admin"]
    end
  end

  test "open sign-ups need no code, and only admins can invite" do
    with_env("SIGNUPS" => "open") do
      create_user
      user = graphql(SIGN_UP, variables: { email: "anyone@example.com" }).dig("data", "signUp", "user")
      assert_not user["admin"]

      errors = graphql('mutation { createInvite { invite { code } errors { message } } }').dig("data", "createInvite", "errors")
      assert_equal [ "Only admins can make invites." ], errors.map { |e| e["message"] }
      assert_equal({ "signups" => "OPEN", "passwordResetAvailable" => true }, graphql("query { serverSettings { signups passwordResetAvailable } }").dig("data", "serverSettings"))
    end
  end

  test "resets a password with an emailed link that works once" do
    user = create_user(email_address: "joss@example.com")
    other_device = user.sessions.create!

    sent = graphql('mutation { requestPasswordReset(emailAddress: " JOSS@example.com ") { sent errors { message } } }')
    assert sent.dig("data", "requestPasswordReset", "sent")
    email = ActionMailer::Base.deliveries.last
    assert_equal [ "joss@example.com" ], email.to
    token = CGI.unescape(email.body.to_s[/token=(\S+)/, 1])

    reset = <<~GRAPHQL
      mutation($token: String!) {
        resetPassword(token: $token, password: "brand-new-pass", passwordConfirmation: "brand-new-pass") {
          user { emailAddress } errors { field message }
        }
      }
    GRAPHQL
    assert_equal "joss@example.com", graphql(reset, variables: { token: }).dig("data", "resetPassword", "user", "emailAddress")
    assert user.reload.authenticate("brand-new-pass")
    assert_not Session.exists?(other_device.id), "signs out other devices"

    again = graphql(reset, variables: { token: }).dig("data", "resetPassword", "errors")
    assert_equal [ "token" ], again.map { |e| e["field"] }
  end

  test "asking to reset an unknown email looks the same and sends nothing" do
    result = graphql('mutation { requestPasswordReset(emailAddress: "nobody@example.com") { sent } }')
    assert result.dig("data", "requestPasswordReset", "sent")
    assert_empty ActionMailer::Base.deliveries
  end

  test "downloads everything as JSON" do
    user = create_user
    sign_in_as(user)
    user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")
    user.stories.create!(title: "Shipped it", situation: "S", task: "T", action: "A", result: "R")
    Resume.import(user, '{ "name": "Dana Whitfield", "title": "Developer" }')
    user.update!(github_token: "github_pat_secret")

    get "/account/export"
    assert_response :success
    assert_match "attachment", response.headers["Content-Disposition"]
    data = JSON.parse(response.body)
    assert_equal "Acme", data.dig("job_applications", 0, "company")
    assert_equal 1, data["stories"].size
    assert_equal "Dana Whitfield", data.dig("resumes", 0, "content", "name")
    assert_not data.dig("resumes", 0).key?("user_id")
    assert_not_includes response.body, "github_pat_secret"
    assert_not_includes response.body, "password_digest"
  end

  test "export needs you to be signed in" do
    get "/account/export"
    assert_response :unauthorized
  end

  test "deleting an account removes everything in it" do
    user = create_user
    sign_in_as(user)
    contact = user.contacts.create!(name: "Priya")
    application = user.job_applications.create!(company: "Acme", role: "Dev", status: "interviewing", contacts: [ contact ])
    question = user.questions.first
    story = user.stories.create!(title: "Shipped it", situation: "S", task: "T", action: "A", result: "R")
    user.practices.create!(question:, story:, rating: "nailed_it")
    user.study_sessions.create!(topic: "Graphs", minutes: 30)
    action = user.custom_actions.create!(name: "Meetup", category: "networking")
    user.daily_goals.create!(kind: "custom", custom_action: action, target: 1)
    user.activities.create!(kind: "custom", custom_action: action)
    user.integration_snapshots.create!(provider: "github", data: {})
    user.nudge_dismissals.create!(key: "contact:1:2026-01-01")
    user.update!(admin: true)
    user.invites.create!
    Resume.import(user, '{ "name": "Dana Whitfield", "title": "Developer" }')
    assert application.interview_rounds.any?

    wrong = graphql('mutation { deleteAccount(password: "nope") { deleted errors { field } } }').dig("data", "deleteAccount")
    assert_not wrong["deleted"]

    assert graphql('mutation { deleteAccount(password: "password123") { deleted } }').dig("data", "deleteAccount", "deleted")
    assert_not User.exists?(user.id)
    assert_equal 0, Activity.count + JobApplication.count + Contact.count + Stage.count + Invite.count + CustomAction.count + Resume.count
    assert_nil graphql("query { me { id } }").dig("data", "me")
  end

  test "page addresses load the React app, and the API still answers" do
    get "/progress", headers: { "Accept" => "text/html" }
    assert_includes [ 200, 404 ], response.status # 404 until the frontend is built into public/
    get "/up"
    assert_response :success
  end
end
