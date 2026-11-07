require "test_helper"

class DailyGoalsTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @today = @user.today
  end

  test "new accounts start with one goal: apply to 1 job a day" do
    assert_equal [ [ "applications", 1, false ] ], @user.daily_goals.map { |g| [ g.kind, g.target, g.weekdays_only ] }
  end

  test "applying checks off the goal and makes a perfect day" do
    goals = DailyGoals.for(@user)
    assert_equal [ 0 ], goals.progress.map(&:count)
    assert_not goals.perfect?

    @user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")

    goals = DailyGoals.for(@user)
    assert goals.perfect?
    assert @user.perfect_days.exists?(achieved_on: @today), "the activity should record the perfect day right away"
    assert_equal 1, goals.perfect_streak
  end

  test "every goal has to be done for a perfect day" do
    @user.daily_goals.create!(kind: "study", target: 30)
    @user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")
    @user.study_sessions.create!(topic: "Arrays", minutes: 20)
    assert_not DailyGoals.for(@user).perfect?
    assert_not @user.perfect_days.exists?

    @user.study_sessions.create!(topic: "Graphs", minutes: 15)
    goals = DailyGoals.for(@user)
    assert_equal [ 1, 35 ], goals.progress.map(&:count)
    assert goals.perfect?
    assert @user.perfect_days.exists?
  end

  test "networking counts messages, coffee chats, and follow-ups" do
    @user.daily_goals.first.update!(kind: "networking", target: 3)
    %w[networking_message coffee_chat follow_up tailored_materials].each { |kind| @user.activities.create!(kind:) }
    assert_equal [ 3 ], DailyGoals.for(@user).progress.map(&:count)
  end

  test "custom goals count that action" do
    meetup = @user.custom_actions.create!(name: "Went to a meetup", category: "networking")
    other = @user.custom_actions.create!(name: "Read an article", category: "materials")
    @user.daily_goals.create!(kind: "custom", custom_action: meetup, target: 1)

    @user.activities.create!(kind: "custom", custom_action: other)
    assert_equal [ 0, 0 ], DailyGoals.for(@user).progress.map(&:count)

    activity = @user.activities.create!(kind: "custom", custom_action: meetup)
    assert_equal "networking", activity.category
    assert_equal [ 0, 1 ], DailyGoals.for(@user).progress.map(&:count)
  end

  test "weekday goals skip weekends" do
    goal = @user.daily_goals.first
    goal.update!(weekdays_only: true)
    saturday = Date.new(2026, 11, 7)
    monday = Date.new(2026, 11, 9)

    assert_not goal.scheduled_on?(saturday)
    assert goal.scheduled_on?(monday)
    assert DailyGoals.for(@user, date: saturday, refresh: false).rest_day?
    assert_not DailyGoals.for(@user, date: monday, refresh: false).rest_day?
  end

  test "the perfect-day streak skips days with no goals and stops at a missed one" do
    @user.daily_goals.first.update!(weekdays_only: true)
    friday = Date.new(2026, 11, 6)
    monday = Date.new(2026, 11, 9)
    tuesday = Date.new(2026, 11, 10)
    [ Date.new(2026, 11, 4), friday, monday ].each { |day| @user.perfect_days.create!(achieved_on: day) }

    travel_to Time.utc(2026, 11, 10, 17) do
      # Thursday the 5th was missed, so the streak is Friday and Monday. Tuesday isn't over yet.
      assert_equal tuesday, @user.today
      assert_equal 2, DailyGoals.for(@user, refresh: false).perfect_streak
    end
  end

  test "LeetCode and GitHub goals only count with the engineering track on" do
    @user.daily_goals.create!(kind: "leetcode", target: 1)
    assert_equal [ "applications" ], DailyGoals.for(@user, refresh: false).progress.map { |p| p.goal.kind }

    @user.update!(engineering_track: true)
    assert_equal [ "applications", "leetcode" ], DailyGoals.for(@user, refresh: false).progress.map { |p| p.goal.kind }
  end

  test "LeetCode goals count different problems solved today on your clock" do
    @user.update!(engineering_track: true, leetcode_username: "joss", time_zone: "America/Toronto")
    @user.daily_goals.first.update!(kind: "leetcode", target: 2)

    travel_to Time.utc(2026, 11, 7, 3) do # 10pm on the 6th in Toronto
      now = Time.current.to_i
      recent = [
        { "slug" => "two-sum", "timestamp" => now - 60, "accepted" => true },
        { "slug" => "two-sum", "timestamp" => now - 120, "accepted" => true },
        { "slug" => "valid-anagram", "timestamp" => now - 180, "accepted" => false },
        { "slug" => "old-one", "timestamp" => now - 2.days.to_i, "accepted" => true }
      ]
      @user.integration_snapshots.create!(provider: "leetcode", data: { "recent" => recent, "days" => {} }, fetched_at: Time.current)

      assert_equal [ 1 ], DailyGoals.for(@user).progress.map(&:count)
    end
  end

  test "GitHub goals read the contribution calendar" do
    @user.update!(engineering_track: true, github_username: "JossWritesCode")
    @user.daily_goals.first.update!(kind: "github", target: 1)
    @user.integration_snapshots.create!(provider: "github", data: { "days" => { @today.iso8601 => 3 } }, fetched_at: Time.current)

    assert DailyGoals.for(@user).perfect?
  end

  test "a goal kind can only be used once, and targets stay sensible" do
    duplicate = @user.daily_goals.new(kind: "applications", target: 2)
    assert_not duplicate.valid?
    assert duplicate.errors[:kind].any?

    assert_not @user.daily_goals.new(kind: "study", target: 2).valid?
    assert_not @user.daily_goals.new(kind: "practice", target: 0).valid?
    assert @user.daily_goals.new(kind: "practice", target: 3).valid?
  end

  test "deleting a custom action keeps its history and removes its goal" do
    meetup = @user.custom_actions.create!(name: "Went to a meetup", category: "networking")
    @user.daily_goals.create!(kind: "custom", custom_action: meetup, target: 1)
    activity = @user.activities.create!(kind: "custom", custom_action: meetup)

    meetup.archive!

    assert_equal [ "applications" ], @user.daily_goals.reload.map(&:kind)
    assert_equal "Went to a meetup", activity.reload.custom_action.name
    assert @user.custom_actions.create(name: "Went to a meetup", category: "networking").persisted?,
      "the name is free to use again"
  end
end
