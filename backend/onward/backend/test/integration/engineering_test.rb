require "test_helper"

class EngineeringTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  SETTINGS = <<~GRAPHQL.freeze
    mutation($track: Boolean, $leetcode: String, $github: String, $token: String) {
      updateEngineeringSettings(engineeringTrack: $track, leetcodeUsername: $leetcode, githubUsername: $github, githubToken: $token) {
        user { engineeringTrack leetcodeUsername githubUsername githubConnected }
        errors { field message }
      }
    }
  GRAPHQL

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  test "turns on the track and saves the GitHub token encrypted" do
    result = graphql(SETTINGS, variables: { track: true, leetcode: "@joss", github: "JossWritesCode", token: "github_pat_secret" })
    user = result.dig("data", "updateEngineeringSettings", "user")

    assert_equal({ "engineeringTrack" => true, "leetcodeUsername" => "joss", "githubUsername" => "JossWritesCode", "githubConnected" => true }, user)
    assert_equal "github_pat_secret", @user.reload.github_token
    stored = User.connection.select_value("SELECT github_token FROM users WHERE id = #{@user.id}")
    assert_not_includes stored, "github_pat_secret"
    assert_equal @user.today, @user.leetcode_counts_from
  end

  test "an empty token removes it" do
    @user.update!(github_token: "github_pat_secret")
    result = graphql(SETTINGS, variables: { token: "" })
    assert_not result.dig("data", "updateEngineeringSettings", "user", "githubConnected")
  end

  test "rejects usernames that can't be real" do
    result = graphql(SETTINGS, variables: { github: "not a username!" })
    assert_equal [ "githubUsername" ], result.dig("data", "updateEngineeringSettings", "errors").map { |e| e["field"] }
  end

  test "shows study time" do
    @user.study_sessions.create!(topic: "LeetCode", minutes: 30)
    @user.study_sessions.create!(topic: "System design", minutes: 45)
    @user.study_sessions.create!(topic: "LeetCode", minutes: 20, studied_on: @user.today - 30)

    study = graphql("query { engineering { leetcode { username } study { minutesThisWeek minutesTotal byTopic { topic minutes } weeks { minutes } } } }")
      .dig("data", "engineering")

    assert_nil study["leetcode"]
    assert_equal 75, study.dig("study", "minutesThisWeek")
    assert_equal 95, study.dig("study", "minutesTotal")
    assert_equal [ [ "LeetCode", 50 ], [ "System design", 45 ] ], study.dig("study", "byTopic").map { |t| [ t["topic"], t["minutes"] ] }
    assert_equal 12, study.dig("study", "weeks").size
  end

  test "adds study time from earlier in the week, but not further back" do
    ok = graphql("mutation($on: ISO8601Date) { logStudySession(topic: \"Reading\", minutes: 40, studiedOn: $on) { counted errors { field } } }",
      variables: { on: (@user.today - 2).iso8601 })
    assert ok.dig("data", "logStudySession", "counted")

    too_old = graphql("mutation($on: ISO8601Date) { logStudySession(topic: \"Reading\", minutes: 40, studiedOn: $on) { counted errors { field } } }",
      variables: { on: (@user.today - 30).iso8601 })
    assert_equal [ "studiedOn" ], too_old.dig("data", "logStudySession", "errors").map { |e| e["field"] }
  end

  test "shows LeetCode stats" do
    @user.update!(engineering_track: true, leetcode_username: "joss")
    data = { "username" => "joss", "streak" => 4, "total_active_days" => 12, "solved" => { "medium" => 9 }, "totals" => { "medium" => 1700 },
             "days" => { @user.today.iso8601 => 2 } }

    leetcode = with_stub(Integrations::Leetcode, :fetch, data) do
      graphql("query { engineering { leetcode { username streak mediumSolved mediumTotal days { date count } error } } }")
    end.dig("data", "engineering", "leetcode")

    assert_equal 4, leetcode["streak"]
    assert_equal 9, leetcode["mediumSolved"]
    assert_equal [ { "date" => @user.today.iso8601, "count" => 2 } ], leetcode["days"]
  end
end
