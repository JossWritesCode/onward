require "test_helper"

class NudgesTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @today = @user.today
  end

  def quiet_application(company, days_ago)
    application = @user.job_applications.create!(company:, role: "Dev", status: "applied", date_applied: @today - days_ago)
    application.update_columns(updated_at: days_ago.days.ago)
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
end
