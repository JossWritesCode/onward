require "test_helper"

class JobApplicationsTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  CREATE = <<~GRAPHQL.freeze
    mutation($input: JobApplicationInput!) {
      createJobApplication(input: $input) {
        jobApplication { id company role status workArrangement contacts { name } }
        errors { field message }
      }
    }
  GRAPHQL

  UPDATE = <<~GRAPHQL.freeze
    mutation($id: ID!, $input: JobApplicationInput!) {
      updateJobApplication(id: $id, input: $input) {
        jobApplication { id status dateApplied company }
        errors { field message }
      }
    }
  GRAPHQL

  setup do
    @user = create_user
  end

  test "requires signing in" do
    result = graphql("query { jobApplications { id } }")
    assert_equal "You need to sign in first.", result.dig("errors", 0, "message")
  end

  test "creates an application with linked contacts" do
    sign_in_as(@user)
    contact = @user.contacts.create!(name: "Priya Shah")

    result = graphql(CREATE, variables: {
      input: { company: "Acme", role: "Developer", workArrangement: "REMOTE", contactIds: [ contact.id.to_s ] }
    })

    application = result.dig("data", "createJobApplication", "jobApplication")
    assert_equal "SAVED", application["status"]
    assert_equal "REMOTE", application["workArrangement"]
    assert_equal [ "Priya Shah" ], application["contacts"].map { |c| c["name"] }
  end

  test "returns field errors for invalid input" do
    sign_in_as(@user)
    result = graphql(CREATE, variables: { input: { company: "", role: "Developer" } })

    assert_nil result.dig("data", "createJobApplication", "jobApplication")
    assert_equal [ "company" ], result.dig("data", "createJobApplication", "errors").map { |e| e["field"] }
  end

  test "updates only the fields that are sent" do
    sign_in_as(@user)
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    applied = @user.stages.find_by!(name: "Applied")

    result = graphql(UPDATE, variables: { id: application.id.to_s, input: { stageId: applied.id.to_s } })

    updated = result.dig("data", "updateJobApplication", "jobApplication")
    assert_equal "APPLIED", updated["status"]
    assert_equal "Acme", updated["company"]
    assert_equal Date.current.iso8601, updated["dateApplied"]
  end

  test "can't see or change someone else's applications" do
    stranger_application = create_user.job_applications.create!(company: "Secret Co", role: "Spy")
    sign_in_as(@user)

    assert_empty graphql("query { jobApplications { id } }").dig("data", "jobApplications")

    result = graphql(UPDATE, variables: { id: stranger_application.id.to_s, input: { company: "Mine now" } })
    assert_equal "We couldn't find that.", result.dig("errors", 0, "message")
    assert_equal "Secret Co", stranger_application.reload.company
  end

  test "filters by status" do
    sign_in_as(@user)
    @user.job_applications.create!(company: "A", role: "Dev", status: "saved")
    @user.job_applications.create!(company: "B", role: "Dev", status: "offer")

    result = graphql("query { jobApplications(status: OFFER) { company } }")
    assert_equal [ "B" ], result.dig("data", "jobApplications").map { |a| a["company"] }
  end

  test "deletes an application" do
    sign_in_as(@user)
    application = @user.job_applications.create!(company: "Acme", role: "Developer")

    graphql("mutation($id: ID!) { deleteJobApplication(id: $id) { id } }", variables: { id: application.id.to_s })

    assert_not JobApplication.exists?(application.id)
  end

  test "moving a card back from a mistaken move says what it took back" do
    sign_in_as(@user)
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    applied = @user.stages.find_by!(name: "Applied")
    saved = @user.stages.find_by!(name: "Saved")
    move = <<~GRAPHQL
      mutation($id: ID!, $stageId: ID!) {
        moveJobApplication(id: $id, stageId: $stageId) { undone jobApplication { status dateApplied } errors { message } }
      }
    GRAPHQL

    result = graphql(move, variables: { id: application.id, stageId: applied.id })
    assert_empty result.dig("data", "moveJobApplication", "undone")

    result = graphql(move, variables: { id: application.id, stageId: saved.id })
    assert_equal [ "APPLICATION_SENT" ], result.dig("data", "moveJobApplication", "undone")
    assert_nil result.dig("data", "moveJobApplication", "jobApplication", "dateApplied")
    assert_empty @user.activities
  end

  test "changing the column on the application's page takes back a mistaken move too" do
    sign_in_as(@user)
    application = @user.job_applications.create!(company: "Acme", role: "Developer", status: "applied")
    application.update_columns(recent_moves: [])
    phone_screen = @user.stages.find_by!(name: "Phone screen")
    applied = @user.stages.find_by!(name: "Applied")
    update = <<~GRAPHQL
      mutation($id: ID!, $input: JobApplicationInput!) {
        updateJobApplication(id: $id, input: $input) { undone jobApplication { status } errors { message } }
      }
    GRAPHQL
    input = { company: "Acme", role: "Developer" }

    graphql(update, variables: { id: application.id, input: input.merge(stageId: phone_screen.id) })
    result = graphql(update, variables: { id: application.id, input: input.merge(stageId: applied.id) })

    assert_equal [ "INTERVIEW" ], result.dig("data", "updateJobApplication", "undone")
    assert_equal %w[application_sent], @user.activities.pluck(:kind)
    assert_empty application.interview_rounds
  end
end
