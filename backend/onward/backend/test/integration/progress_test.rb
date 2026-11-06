require "test_helper"

class ProgressTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  PROGRESS = <<~GRAPHQL.freeze
    query($since: ISO8601Date!) {
      progress {
        today
        streak { current longest freezes activeToday frozenDates }
        activities(since: $since) { kind category automatic note contact { name } jobApplication { company } }
      }
    }
  GRAPHQL

  LOG = <<~GRAPHQL.freeze
    mutation($kind: ActivityKind!, $contactId: ID, $note: String) {
      logActivity(kind: $kind, contactId: $contactId, note: $note) {
        activity { id kind category }
        errors { field message }
      }
    }
  GRAPHQL

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  test "logging a win starts a streak" do
    contact = @user.contacts.create!(name: "Priya")
    result = graphql(LOG, variables: { kind: "COFFEE_CHAT", contactId: contact.id.to_s, note: "Great chat" })
    assert_equal "NETWORKING", result.dig("data", "logActivity", "activity", "category")

    progress = graphql(PROGRESS, variables: { since: 1.week.ago.to_date.iso8601 }).dig("data", "progress")
    assert_equal 1, progress.dig("streak", "current")
    assert progress.dig("streak", "activeToday")
    assert_equal [ "Priya" ], progress["activities"].map { |a| a.dig("contact", "name") }
  end

  test "board activity can't be logged by hand" do
    result = graphql(LOG, variables: { kind: "OFFER" })
    assert_nil result.dig("data", "logActivity", "activity")
    assert_equal [ "kind" ], result.dig("data", "logActivity", "errors").map { |e| e["field"] }
  end

  test "deletes a logged activity but not a board one" do
    logged = @user.activities.create!(kind: "follow_up")
    @user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")
    board = @user.activities.find_by!(automatic: true)

    delete = "mutation($id: ID!) { deleteActivity(id: $id) { id errors { message } } }"
    assert_equal logged.id.to_s, graphql(delete, variables: { id: logged.id.to_s }).dig("data", "deleteActivity", "id")
    assert_nil graphql(delete, variables: { id: board.id.to_s }).dig("data", "deleteActivity", "id")
    assert Activity.exists?(board.id)
  end

  test "sets the time zone" do
    result = graphql('mutation { updateTimeZone(timeZone: "America/Toronto") { user { timeZone } errors { message } } }')
    assert_equal "America/Toronto", result.dig("data", "updateTimeZone", "user", "timeZone")

    bad = graphql('mutation { updateTimeZone(timeZone: "Nowhere/Land") { user { timeZone } errors { field } } }')
    assert_equal [ "timeZone" ], bad.dig("data", "updateTimeZone", "errors").map { |e| e["field"] }
  end

  test "can't link someone else's contact" do
    stranger_contact = create_user.contacts.create!(name: "Not yours")
    result = graphql(LOG, variables: { kind: "COFFEE_CHAT", contactId: stranger_contact.id.to_s })
    assert_equal "We couldn't find that.", result.dig("errors", 0, "message")
  end
end
