require "test_helper"

# When to follow up on an application: set when a card moves, and moved a
# week along each time you log a follow-up.
class FollowUpScheduleTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @today = @user.today
    @application = @user.job_applications.create!(company: "Acme", role: "Dev")
  end

  def stage(name)
    @user.stages.find_by!(name:)
  end

  def move(name)
    @application.move_to!(stage(name), 0)
    @application.reload
  end

  def log_follow_up
    @user.activities.create!(kind: "follow_up", job_application: @application)
    @application.reload
  end

  test "saved cards don't get a date" do
    assert_nil @application.follow_up_on
    assert_nil @application.follow_up_step
  end

  test "moving to an applied column schedules a follow-up in a week" do
    move("Applied")

    assert_equal @today + 7, @application.follow_up_on
    assert_equal 0, @application.follow_ups_sent
    assert_equal "follow_up", @application.follow_up_step
  end

  test "applications created in an applied column get a date too" do
    application = @user.job_applications.create!(company: "Brightline", role: "Dev", status: "applied")
    assert_equal @today + 7, application.follow_up_on
  end

  test "two follow-ups on an application, then it's time to think about letting go" do
    move("Applied")

    travel_to 8.days.from_now do
      today = @user.today
      log_follow_up
      assert_equal today + 7, @application.follow_up_on, "counts from the day it's logged"
      assert_equal "follow_up", @application.follow_up_step

      log_follow_up
      assert_equal today + 7, @application.follow_up_on
      assert_equal 2, @application.follow_ups_sent
      assert_equal "let_go", @application.follow_up_step
    end
  end

  test "moving to an interview column asks for a thank-you note tomorrow" do
    move("Applied")
    move("Phone screen")

    assert_equal @today + 1, @application.follow_up_on
    assert_equal 0, @application.follow_ups_sent
    assert_equal "thank_you", @application.follow_up_step
  end

  test "the interview sequence: thank-you, two check-ins, a last note, then letting go" do
    move("Phone screen")

    steps = 4.times.map do
      log_follow_up
      assert_equal @today + 7, @application.follow_up_on
      @application.follow_up_step
    end

    assert_equal %w[check_in check_in last_note let_go], steps
  end

  test "the thank-you waits until the day after a dated interview" do
    move("Phone screen")
    round = @application.interview_rounds.first
    interview_at = 3.days.from_now

    round.update!(scheduled_at: interview_at)
    assert_equal @user.local_date(interview_at) + 1, @application.reload.follow_up_on

    # Coming back to a column whose round has a date uses it too.
    move("Interviewing")
    assert_equal @today + 1, @application.follow_up_on
    move("Phone screen")
    assert_equal @user.local_date(interview_at) + 1, @application.follow_up_on
  end

  test "dating an interview after the thank-you is logged leaves the schedule alone" do
    move("Phone screen")
    log_follow_up

    @application.interview_rounds.first.update!(scheduled_at: 3.days.from_now)
    assert_equal @today + 7, @application.reload.follow_up_on
  end

  test "moving to a later interview column starts the interview sequence over" do
    move("Phone screen")
    3.times { log_follow_up }
    assert_equal "last_note", @application.follow_up_step

    move("Interviewing")
    assert_equal @today + 1, @application.follow_up_on
    assert_equal 0, @application.follow_ups_sent
    assert_equal "thank_you", @application.follow_up_step
  end

  test "moving between two applied columns keeps the schedule" do
    second_applied = @user.stages.create!(name: "Applied (referral)", kind: "applied")
    move("Applied")
    log_follow_up

    @application.move_to!(second_applied, 0)
    @application.reload
    assert_equal 1, @application.follow_ups_sent
    assert_equal @today + 7, @application.follow_up_on
  end

  test "moving to offer, rejected, or back to saved clears the date" do
    %w[Offer Rejected Saved].each do |name|
      move("Applied")
      log_follow_up
      move(name)

      assert_nil @application.follow_up_on, "moving to #{name}"
      assert_equal 0, @application.follow_ups_sent
    end
  end

  test "a date set by hand stays until the next move or logged follow-up" do
    move("Applied")
    @application.update!(follow_up_on: @today + 30, notes: "Recruiter said end of month")
    assert_equal @today + 30, @application.reload.follow_up_on

    log_follow_up
    assert_equal @today + 7, @application.follow_up_on

    @application.update!(follow_up_on: @today + 30)
    move("Phone screen")
    assert_equal @today + 1, @application.follow_up_on
  end

  test "a date typed in while changing columns wins" do
    @application.update!(stage: stage("Applied"), follow_up_on: @today + 2)
    assert_equal @today + 2, @application.reload.follow_up_on
  end

  test "saved, offer, and rejected cards can't have a date, even by hand" do
    @application.update!(follow_up_on: @today + 3)
    assert_nil @application.reload.follow_up_on

    @application.update!(stage: stage("Offer"), follow_up_on: @today + 3)
    assert_nil @application.reload.follow_up_on
  end

  test "follow-ups on cards without follow-up dates change nothing" do
    log_follow_up
    assert_nil @application.follow_up_on
    assert_equal 0, @application.follow_ups_sent
  end

  test "changing a column to a kind without follow-ups clears its cards' dates" do
    move("Applied")
    stage("Applied").update!(kind: "offer")

    assert_nil @application.reload.follow_up_on
  end

  test "due on the day and while overdue" do
    move("Applied")
    assert_not @application.follow_up_due?
    assert @application.follow_up_due?(@today + 7)
    assert @application.follow_up_due?(@today + 9)
  end
end
