require "test_helper"

class StreakTest < ActiveSupport::TestCase
  TODAY = Date.new(2026, 11, 20)

  def streak(days_ago)
    Streak.new(days_ago.map { |n| TODAY - n }, today: TODAY)
  end

  test "no activity means no streak" do
    s = streak([])
    assert_equal 0, s.current
    assert_not s.active_today
  end

  test "counts consecutive days including today" do
    s = streak([ 0, 1, 2 ])
    assert_equal 3, s.current
    assert s.active_today
  end

  test "today doesn't break the streak before it's over" do
    s = streak([ 1, 2, 3 ])
    assert_equal 3, s.current
    assert_not s.active_today
  end

  test "a missed day with no freeze resets the streak" do
    s = streak([ 0, 2, 3 ])
    assert_equal 1, s.current
    assert_equal 2, s.longest
  end

  test "seven days in a row earns a freeze that covers a missed day" do
    # Active 9 through 3 days ago (7 days), missed 2 days ago, active yesterday and today.
    s = streak([ 9, 8, 7, 6, 5, 4, 3, 1, 0 ])
    assert_equal 9, s.current
    assert_equal 0, s.freezes
    assert_equal [ TODAY - 2 ], s.frozen_dates
  end

  test "freezes cap at two" do
    s = streak((0..29).to_a)
    assert_equal 2, s.freezes
  end

  test "two missed days in a row use two freezes" do
    # 14 active days earns 2 freezes, then 2 and 1 days ago are missed, then today.
    s = streak((3..16).to_a + [ 0 ])
    assert_equal 15, s.current
    assert_equal 0, s.freezes
    assert_equal [ TODAY - 2, TODAY - 1 ], s.frozen_dates
  end

  test "a third missed day ends the streak once freezes run out" do
    s = streak((4..17).to_a + [ 0 ])
    assert_equal 1, s.current
    assert_equal 14, s.longest
  end
end
