require "test_helper"

class NudgesTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @today = @user.today
  end

  def quiet_application(company, days_ago)
    application = @user.job_applications.create!(company:, role: "Dev", status: "applied", date_applied: @today - days_ago)
    # Like an application from before follow-up dates: no date was backfilled.
    application.update_columns(updated_at: days_ago.days.ago, follow_up_on: nil)
    @user.activities.where(job_application: application).update_all(occurred_on: @today - days_ago)
    application
  end

  test "an application with no change in 2 weeks gets a nudge, until you follow up" do
    application = quiet_application("Acme", 15)
    quiet_application("Fresh Co", 3)

    nudges = Nudges.for(@user)
    assert_equal [ [ "quiet_application", "Acme" ] ], nudges.map { |n| [ n.kind, n.job_application.company ] }
    assert_equal @today - 15, nudges.first.since

    @user.activities.create!(kind: "follow_up", job_application: application)
    assert_empty Nudges.for(@user)
  end

  test "someone you haven't talked to in 3 weeks gets a nudge" do
    @user.contacts.create!(name: "Priya", last_contacted_on: @today - 25)
    @user.contacts.create!(name: "Sam", last_contacted_on: @today - 5)
    @user.contacts.create!(name: "New person")

    assert_equal [ "Priya" ], Nudges.for(@user).map { |n| n.contact.name }
  end

  test "an interview in the next 2 days with an unfinished checklist comes first" do
    quiet_application("Acme", 20)
    application = @user.job_applications.create!(company: "Northwind", role: "Dev", status: "interviewing")
    round = application.interview_rounds.first
    round.update!(scheduled_at: 1.day.from_now)

    nudges = Nudges.for(@user)
    assert_equal %w[interview_prep quiet_application], nudges.map(&:kind)
    assert_equal round, nudges.first.interview_round

    round.checklist_items.each { |item| item.update!(done: true) }
    assert_equal %w[quiet_application], Nudges.for(@user).map(&:kind)
  end

  test "shows at most 3, mixing applications and people" do
    4.times { |i| quiet_application("Company #{i}", 20 + i) }
    2.times { |i| @user.contacts.create!(name: "Person #{i}", last_contacted_on: @today - 30) }

    assert_equal %w[quiet_application quiet_contact quiet_application], Nudges.for(@user).map(&:kind)
  end

  test "snoozing hides a nudge for a week, and dismissing hides it until things change" do
    priya = @user.contacts.create!(name: "Priya", last_contacted_on: @today - 25)
    key = Nudges.for(@user).first.key

    @user.nudge_dismissals.create!(key:, hidden_until: @today + 7)
    assert_empty Nudges.for(@user)
    travel_to 7.days.from_now do
      assert_equal [ key ], Nudges.for(@user).map(&:key)
    end

    @user.nudge_dismissals.find_by!(key:).update!(hidden_until: nil)
    travel_to 30.days.from_now do
      assert_empty Nudges.for(@user)
    end

    # Talking to them again and going quiet again is a new nudge.
    priya.update!(last_contacted_on: @today)
    travel_to 22.days.from_now do
      assert_equal [ "Priya" ], Nudges.for(@user).map { |n| n.contact.name }
    end
  end

  def follow_up_due(company, days_ago, status: "applied")
    application = @user.job_applications.create!(company:, role: "Dev", status:)
    application.update_columns(follow_up_on: @today - days_ago)
    application
  end

  test "an application whose follow-up date has come gets a nudge" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", status: "applied")
    assert_empty Nudges.for(@user)

    travel_to 7.days.from_now do
      nudges = Nudges.for(@user)
      assert_equal [ [ "follow_up", "Acme" ] ], nudges.map { |n| [ n.kind, n.job_application.company ] }
      assert_equal application.follow_up_on, nudges.first.since
    end

    travel_to 9.days.from_now do
      assert_equal [ "follow_up" ], Nudges.for(@user).map(&:kind), "still there while overdue"
    end
  end

  test "following up moves the nudge a week out" do
    application = follow_up_due("Acme", 0)
    @user.activities.create!(kind: "follow_up", job_application: application)

    assert_empty Nudges.for(@user)
    assert_equal @today + 7, application.reload.follow_up_on
  end

  test "applications with a follow-up date skip the quiet-application nudge" do
    application = quiet_application("Acme", 20)
    assert_equal [ "quiet_application" ], Nudges.for(@user).map(&:kind)

    application.update_columns(follow_up_on: @today + 3)
    assert_empty Nudges.for(@user)
  end

  test "no follow-up nudges for cards that have moved on" do
    application = follow_up_due("Acme", 2)
    application.update_columns(status: "offer")

    assert_empty Nudges.for(@user)
  end

  test "interview prep first, then follow-ups oldest first, then the quiet mix, 3 at most" do
    quiet_application("Quiet Co", 20)
    @user.contacts.create!(name: "Priya", last_contacted_on: @today - 30)
    follow_up_due("Recent", 1)
    follow_up_due("Oldest", 5, status: "interviewing")
    interviewing = @user.job_applications.create!(company: "Northwind", role: "Dev", status: "interviewing")
    interviewing.interview_rounds.first.update!(scheduled_at: 1.day.from_now)

    nudges = Nudges.for(@user)
    assert_equal %w[interview_prep follow_up follow_up], nudges.map(&:kind)
    assert_equal %w[Oldest Recent], nudges.drop(1).map { |n| n.job_application.company }

    @user.job_applications.find_by!(company: "Recent").update_columns(follow_up_on: nil)
    assert_equal %w[interview_prep follow_up quiet_application], Nudges.for(@user).map(&:kind)
  end
end
