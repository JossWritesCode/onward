require "test_helper"

class FollowUpsTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  APPLICATION_FIELDS = "id status followUpOn followUpsSent followUpStep followUpDue stage { name }".freeze

  LET_GO = <<~GRAPHQL.freeze
    mutation($id: ID!) {
      letGoOfJobApplication(id: $id) {
        jobApplication { #{APPLICATION_FIELDS} }
        errors { field message }
      }
    }
  GRAPHQL

  UPDATE = <<~GRAPHQL.freeze
    mutation($id: ID!, $input: JobApplicationInput!) {
      updateJobApplication(id: $id, input: $input) {
        jobApplication { #{APPLICATION_FIELDS} }
        errors { field message }
      }
    }
  GRAPHQL

  LOG = <<~GRAPHQL.freeze
    mutation($id: ID!) {
      logActivity(kind: FOLLOW_UP, jobApplicationId: $id) {
        activity { id }
        errors { message }
      }
    }
  GRAPHQL

  APPLICATION = <<~GRAPHQL.freeze
    query($id: ID!) { jobApplication(id: $id) { #{APPLICATION_FIELDS} } }
  GRAPHQL

  NUDGES = <<~GRAPHQL.freeze
    query { today { nudges { kind since jobApplication { company followUpStep } } } }
  GRAPHQL

  setup do
    @user = create_user
    @today = @user.today
    sign_in_as(@user)
    @application = @user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")
  end

  test "applications show their follow-up date, step, and whether it's due" do
    result = graphql(APPLICATION, variables: { id: @application.id.to_s }).dig("data", "jobApplication")

    assert_equal (@today + 7).iso8601, result["followUpOn"]
    assert_equal 0, result["followUpsSent"]
    assert_equal "FOLLOW_UP", result["followUpStep"]
    assert_equal false, result["followUpDue"]

    @application.update_columns(follow_up_on: @today)
    assert graphql(APPLICATION, variables: { id: @application.id.to_s }).dig("data", "jobApplication", "followUpDue")
  end

  test "logging a follow-up schedules the next one" do
    result = graphql(LOG, variables: { id: @application.id.to_s })
    assert_empty result.dig("data", "logActivity", "errors")

    @application.reload
    assert_equal 1, @application.follow_ups_sent
    assert_equal @today + 7, @application.follow_up_on
  end

  test "sets and clears the date by hand" do
    result = graphql(UPDATE, variables: { id: @application.id.to_s, input: { followUpOn: (@today + 3).iso8601 } })
    assert_equal (@today + 3).iso8601, result.dig("data", "updateJobApplication", "jobApplication", "followUpOn")

    result = graphql(UPDATE, variables: { id: @application.id.to_s, input: { followUpOn: nil } })
    assert_nil result.dig("data", "updateJobApplication", "jobApplication", "followUpOn")

    # Leaving it out keeps it.
    @application.update_columns(follow_up_on: @today + 5)
    graphql(UPDATE, variables: { id: @application.id.to_s, input: { notes: "Pinged the recruiter" } })
    assert_equal @today + 5, @application.reload.follow_up_on
  end

  test "due follow-ups show up as nudges with their step" do
    @application.update_columns(follow_up_on: @today - 1, follow_ups_sent: 2)

    nudges = graphql(NUDGES).dig("data", "today", "nudges")
    assert_equal [ { "kind" => "FOLLOW_UP", "since" => (@today - 1).iso8601, "jobApplication" => { "company" => "Acme", "followUpStep" => "LET_GO" } } ], nudges
  end

  test "letting go moves the card to the first rejected column as closure" do
    second_rejected = @user.stages.create!(name: "No reply", kind: "rejected")
    first_rejected = @user.stages.find_by!(name: "Rejected")
    assert first_rejected.position < second_rejected.position

    result = graphql(LET_GO, variables: { id: @application.id.to_s }).dig("data", "letGoOfJobApplication")

    assert_empty result["errors"]
    assert_equal "REJECTED", result.dig("jobApplication", "status")
    assert_equal "Rejected", result.dig("jobApplication", "stage", "name")
    assert_nil result.dig("jobApplication", "followUpOn")
    assert_nil result.dig("jobApplication", "followUpStep")
    assert_equal 1, @user.activities.where(job_application: @application, kind: "rejection").count
    assert_empty graphql(NUDGES).dig("data", "today", "nudges")
  end

  test "letting go of a card that's already rejected leaves it be" do
    @application.move_to!(@user.stages.find_by!(name: "Rejected"), 0)

    result = graphql(LET_GO, variables: { id: @application.id.to_s }).dig("data", "letGoOfJobApplication")
    assert_empty result["errors"]
    assert_equal 1, @user.activities.where(job_application: @application, kind: "rejection").count
  end

  test "letting go needs a rejected column" do
    @user.stages.find_by!(name: "Rejected").destroy!

    result = graphql(LET_GO, variables: { id: @application.id.to_s }).dig("data", "letGoOfJobApplication")
    assert_nil result["jobApplication"]
    assert_match "rejected", result.dig("errors", 0, "message")
    assert @application.reload.status_applied?
  end

  test "can't let go of someone else's application" do
    stranger_application = create_user.job_applications.create!(company: "Secret Co", role: "Spy", status: "applied")

    result = graphql(LET_GO, variables: { id: stranger_application.id.to_s })
    assert_equal "We couldn't find that.", result.dig("errors", 0, "message")
    assert stranger_application.reload.status_applied?
  end
end
