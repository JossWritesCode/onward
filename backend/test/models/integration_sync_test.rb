require "test_helper"

class IntegrationSyncTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @user.update!(engineering_track: true, leetcode_username: "joss", leetcode_counts_from: @user.today - 2)
  end

  def leetcode_data(days)
    { "username" => "joss", "streak" => 3, "total_active_days" => 40,
      "solved" => { "easy" => 50, "medium" => 30, "hard" => 5 }, "totals" => { "easy" => 800, "medium" => 1700, "hard" => 700 },
      "days" => days }
  end

  test "LeetCode days count toward the streak from the day you connected" do
    today = @user.today
    days = { (today - 10).iso8601 => 4, (today - 1).iso8601 => 2, today.iso8601 => 1 }

    with_stub(Integrations::Leetcode, :fetch, leetcode_data(days)) do
      IntegrationSync.leetcode(@user, force: true)
      IntegrationSync.leetcode(@user, force: true) # syncing again doesn't double count
    end

    activities = @user.activities.where(kind: "leetcode").order(:occurred_on)
    assert_equal [ today - 1, today ], activities.map(&:occurred_on)
    assert_equal "2 submissions", activities.first.note
    assert_equal 2, Streak.new(activities.map(&:occurred_on), today:).current
  end

  test "keeps the last good data when LeetCode can't be reached" do
    with_stub(Integrations::Leetcode, :fetch, leetcode_data({})) { IntegrationSync.leetcode(@user, force: true) }
    failing = ->(_) { raise Integrations::Error, "Couldn't reach LeetCode." }
    snapshot = with_stub(Integrations::Leetcode, :fetch, failing) { IntegrationSync.leetcode(@user, force: true) }

    assert_equal "Couldn't reach LeetCode.", snapshot.error
    assert_equal 50, snapshot.data.dig("solved", "easy")
  end

  test "doesn't ask LeetCode again within 30 minutes" do
    calls = 0
    counting = ->(_) { calls += 1; leetcode_data({}) }
    with_stub(Integrations::Leetcode, :fetch, counting) do
      IntegrationSync.leetcode(@user)
      IntegrationSync.leetcode(@user)
    end
    assert_equal 1, calls
  end

  test "an outside failure never breaks the streak" do
    exploding = ->(_) { raise "boom" }
    with_stub(Integrations::Leetcode, :fetch, exploding) do
      assert_equal 0, Streak.for(@user).current
    end
  end

  test "parses LeetCode's response" do
    response = {
      "data" => {
        "allQuestionsCount" => [ { "difficulty" => "All", "count" => 3200 }, { "difficulty" => "Easy", "count" => 850 } ],
        "matchedUser" => {
          "submitStats" => { "acSubmissionNum" => [ { "difficulty" => "Easy", "count" => 12 }, { "difficulty" => "Medium", "count" => 7 } ] },
          "userCalendar" => { "streak" => 5, "totalActiveDays" => 30, "submissionCalendar" => { "1793923200" => 3 }.to_json }
        }
      }
    }
    data = with_stub(Integrations::Http, :post_json, response) { Integrations::Leetcode.fetch("joss") }

    assert_equal 5, data["streak"]
    assert_equal 12, data.dig("solved", "easy")
    assert_equal 850, data.dig("totals", "easy")
    assert_equal({ Time.at(1793923200).utc.to_date.iso8601 => 3 }, data["days"])
  end

  test "explains a LeetCode username that doesn't exist" do
    error = assert_raises(Integrations::Error) do
      with_stub(Integrations::Http, :post_json, { "data" => { "matchedUser" => nil } }) { Integrations::Leetcode.fetch("nobody") }
    end
    assert_match "doesn't have a public profile", error.message
  end

  test "parses GitHub's contribution calendar" do
    response = { "data" => { "user" => { "contributionsCollection" => { "contributionCalendar" => {
      "totalContributions" => 7,
      "weeks" => [ { "contributionDays" => [ { "date" => "2026-11-01", "contributionCount" => 4 }, { "date" => "2026-11-02", "contributionCount" => 3 } ] } ]
    } } } } }
    data = with_stub(Integrations::Http, :post_json, response) { Integrations::Github.fetch("joss", "token") }

    assert_equal 7, data["total_contributions"]
    assert_equal({ "2026-11-01" => 4, "2026-11-02" => 3 }, data["days"])
  end

  test "asks for a GitHub token before calling GitHub" do
    error = assert_raises(Integrations::Error) { Integrations::Github.fetch("joss", nil) }
    assert_match "token", error.message
  end
end
