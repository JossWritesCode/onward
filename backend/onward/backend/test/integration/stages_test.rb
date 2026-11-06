require "test_helper"

class StagesTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  test "lists columns with their cards" do
    @user.job_applications.create!(company: "Acme", role: "Developer", status: "applied")

    stages = graphql("query { stages { name kind jobApplications { company } } }").dig("data", "stages")

    assert_equal 6, stages.size
    applied = stages.find { |s| s["name"] == "Applied" }
    assert_equal "APPLIED", applied["kind"]
    assert_equal [ "Acme" ], applied["jobApplications"].map { |a| a["company"] }
  end

  test "moves an application to another column" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    offer = @user.stages.find_by!(name: "Offer")

    result = graphql(<<~GRAPHQL, variables: { id: application.id.to_s, stageId: offer.id.to_s })
      mutation($id: ID!, $stageId: ID!) {
        moveJobApplication(id: $id, stageId: $stageId, position: 0) {
          jobApplication { status stage { name } }
          errors { message }
        }
      }
    GRAPHQL

    moved = result.dig("data", "moveJobApplication", "jobApplication")
    assert_equal "OFFER", moved["status"]
    assert_equal "Offer", moved.dig("stage", "name")
  end

  test "creates, renames, and deletes a column" do
    created = graphql('mutation { createStage(input: { name: "Final round", kind: INTERVIEWING }) { stage { id name position } errors { message } } }')
    stage = created.dig("data", "createStage", "stage")
    assert_equal 6, stage["position"]

    renamed = graphql(<<~GRAPHQL, variables: { id: stage["id"] })
      mutation($id: ID!) { updateStage(id: $id, input: { name: "Onsite" }) { stage { name } errors { message } } }
    GRAPHQL
    assert_equal "Onsite", renamed.dig("data", "updateStage", "stage", "name")

    deleted = graphql("mutation($id: ID!) { deleteStage(id: $id) { id errors { message } } }", variables: { id: stage["id"] })
    assert_equal stage["id"], deleted.dig("data", "deleteStage", "id")
  end

  test "explains why a column with cards can't be deleted" do
    stage = @user.stages.find_by!(name: "Saved")
    @user.job_applications.create!(company: "Acme", role: "Developer", stage:)

    result = graphql("mutation($id: ID!) { deleteStage(id: $id) { id errors { message } } }", variables: { id: stage.id.to_s })

    assert_nil result.dig("data", "deleteStage", "id")
    assert_equal [ "Move the cards out of this column before deleting it." ],
      result.dig("data", "deleteStage", "errors").map { |e| e["message"] }
  end

  test "reorders columns" do
    ids = @user.stages.map { |s| s.id.to_s }.reverse

    result = graphql("mutation($ids: [ID!]!) { reorderStages(ids: $ids) { stages { name } } }", variables: { ids: })

    assert_equal "Rejected", result.dig("data", "reorderStages", "stages", 0, "name")
  end

  test "won't move an application into someone else's column" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    stranger_stage = create_user.stages.first

    result = graphql(<<~GRAPHQL, variables: { id: application.id.to_s, stageId: stranger_stage.id.to_s })
      mutation($id: ID!, $stageId: ID!) { moveJobApplication(id: $id, stageId: $stageId) { jobApplication { id } errors { message } } }
    GRAPHQL

    assert_equal "We couldn't find that.", result.dig("errors", 0, "message")
  end
end
