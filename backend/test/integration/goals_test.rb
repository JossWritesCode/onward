require "test_helper"

class GoalsTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  TODAY = <<~GRAPHQL.freeze
    query {
      today {
        date hasGoals restDay perfect perfectStreak
        goals { count done goal { kind target weekdaysOnly customAction { name } } }
        nudges { key kind since contact { name } jobApplication { company } }
      }
    }
  GRAPHQL

  CREATE_GOAL = <<~GRAPHQL.freeze
    mutation($kind: DailyGoalKind!, $target: Int!, $weekdaysOnly: Boolean, $customActionId: ID) {
      createDailyGoal(kind: $kind, target: $target, weekdaysOnly: $weekdaysOnly, customActionId: $customActionId) {
        dailyGoal { id kind target }
        errors { field message }
      }
    }
  GRAPHQL

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  test "shows today's goals and becomes a perfect day when they're done" do
    today = graphql(TODAY).dig("data", "today")
    assert_equal [ { "count" => 0, "done" => false } ], today["goals"].map { |g| g.slice("count", "done") }
    assert_not today["perfect"]

    @user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")

    today = graphql(TODAY).dig("data", "today")
    assert today["perfect"]
    assert_equal 1, today["perfectStreak"]

    progress = graphql("query($since: ISO8601Date!) { progress { perfectDay { today streak } perfectDays(since: $since) } }",
      variables: { since: (@user.today - 7).iso8601 }).dig("data", "progress")
    assert_equal({ "today" => true, "streak" => 1 }, progress["perfectDay"])
    assert_equal [ @user.today.iso8601 ], progress["perfectDays"]
  end

  test "adds, changes, and removes goals" do
    created = graphql(CREATE_GOAL, variables: { kind: "STUDY", target: 30, weekdaysOnly: true }).dig("data", "createDailyGoal")
    assert_empty created["errors"]
    id = created.dig("dailyGoal", "id")

    duplicate = graphql(CREATE_GOAL, variables: { kind: "STUDY", target: 45 }).dig("data", "createDailyGoal")
    assert_equal [ "kind" ], duplicate["errors"].map { |e| e["field"] }

    updated = graphql("mutation($id: ID!) { updateDailyGoal(id: $id, target: 45) { dailyGoal { target weekdaysOnly } errors { message } } }",
      variables: { id: }).dig("data", "updateDailyGoal", "dailyGoal")
    assert_equal({ "target" => 45, "weekdaysOnly" => true }, updated)

    too_big = graphql("mutation($id: ID!) { updateDailyGoal(id: $id, target: 9000) { dailyGoal { target } errors { field } } }",
      variables: { id: }).dig("data", "updateDailyGoal", "errors")
    assert_equal [ "target" ], too_big.map { |e| e["field"] }

    graphql("mutation($id: ID!) { deleteDailyGoal(id: $id) { id } }", variables: { id: })
    assert_equal [ "applications" ], @user.daily_goals.reload.map(&:kind)
  end

  test "reorders goals" do
    study = @user.daily_goals.create!(kind: "study", target: 25)
    apply = @user.daily_goals.first
    result = graphql("mutation($ids: [ID!]!) { reorderDailyGoals(ids: $ids) { dailyGoals { kind } } }",
      variables: { ids: [ study.id.to_s, apply.id.to_s ] })
    assert_equal %w[STUDY APPLICATIONS], result.dig("data", "reorderDailyGoals", "dailyGoals").map { |g| g["kind"] }
  end

  test "custom actions can be logged and used as goals" do
    created = graphql('mutation { createCustomAction(name: "  Went to a   meetup ", category: NETWORKING) { customAction { id name category } errors { message } } }')
      .dig("data", "createCustomAction", "customAction")
    assert_equal "Went to a meetup", created["name"]
    action_id = created["id"]

    graphql(CREATE_GOAL, variables: { kind: "CUSTOM", target: 1, customActionId: action_id })

    logged = graphql("mutation($id: ID!) { logActivity(kind: CUSTOM, customActionId: $id) { activity { kind category customAction { name } } errors { message } } }",
      variables: { id: action_id }).dig("data", "logActivity", "activity")
    assert_equal({ "kind" => "CUSTOM", "category" => "NETWORKING", "customAction" => { "name" => "Went to a meetup" } }, logged)

    goals = graphql(TODAY).dig("data", "today", "goals")
    assert_equal [ [ "APPLICATIONS", 0 ], [ "CUSTOM", 1 ] ], goals.map { |g| [ g.dig("goal", "kind"), g["count"] ] }

    renamed = graphql("mutation($id: ID!) { updateCustomAction(id: $id, name: \"Meetup\", category: MATERIALS) { customAction { name } errors { message } } }",
      variables: { id: action_id }).dig("data", "updateCustomAction", "customAction")
    assert_equal "Meetup", renamed["name"]
    assert_equal "materials", @user.activities.find_by!(kind: "custom").category

    graphql("mutation($id: ID!) { deleteCustomAction(id: $id) { id } }", variables: { id: action_id })
    assert_empty graphql("query { customActions { id } }").dig("data", "customActions")
    assert_equal [ "APPLICATIONS" ], graphql(TODAY).dig("data", "today", "goals").map { |g| g.dig("goal", "kind") }
  end

  test "logging a custom action needs the action" do
    errors = graphql("mutation { logActivity(kind: CUSTOM) { activity { id } errors { field } } }").dig("data", "logActivity", "errors")
    assert_includes errors.map { |e| e["field"] }, "customAction"
  end

  test "nudges can be snoozed" do
    @user.contacts.create!(name: "Priya", last_contacted_on: @user.today - 30)
    nudge = graphql(TODAY).dig("data", "today", "nudges", 0)
    assert_equal({ "kind" => "QUIET_CONTACT", "name" => "Priya" }, { "kind" => nudge["kind"], "name" => nudge.dig("contact", "name") })

    graphql("mutation($key: String!) { dismissNudge(key: $key, snooze: true) { key } }", variables: { key: nudge["key"] })
    assert_empty graphql(TODAY).dig("data", "today", "nudges")
    assert_equal @user.today + 7, @user.nudge_dismissals.first.hidden_until
  end

  test "someone else's custom action can't be used" do
    stranger = create_user.custom_actions.create!(name: "Theirs", category: "networking")
    result = graphql(CREATE_GOAL, variables: { kind: "CUSTOM", target: 1, customActionId: stranger.id.to_s })
    assert_equal "We couldn't find that.", result.dig("errors", 0, "message")
  end
end
