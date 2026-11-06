require "test_helper"

class ActivityTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @applied = @user.stages.find_by!(name: "Applied")
    @saved = @user.stages.find_by!(name: "Saved")
  end

  test "applying records an activity" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @applied)

    activity = @user.activities.sole
    assert activity.kind_application_sent?
    assert activity.category_applying?
    assert activity.automatic?
    assert_equal application, activity.job_application
    assert_equal @user.today, activity.occurred_on
  end

  test "saving for later doesn't count" do
    @user.job_applications.create!(company: "Acme", role: "Dev")
    assert_equal 0, @user.activities.count
  end

  test "moving a card back and forth only counts once" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @applied)
    application.move_to!(@saved, 0)
    application.move_to!(@applied, 0)

    assert_equal 1, @user.activities.count
  end

  test "each stage type counts once" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @applied)
    application.move_to!(@user.stages.find_by!(name: "Phone screen"), 0)
    application.move_to!(@user.stages.find_by!(name: "Interviewing"), 0)
    application.move_to!(@user.stages.find_by!(name: "Rejected"), 0)

    assert_equal %w[application_sent interview rejection], @user.activities.order(:id).map(&:kind)
  end

  test "networking updates the contact's last talked date" do
    contact = @user.contacts.create!(name: "Priya", last_contacted_on: 1.month.ago.to_date)
    @user.activities.create!(kind: "coffee_chat", contact:)

    assert_equal @user.today, contact.reload.last_contacted_on
  end

  test "days follow the user's time zone" do
    @user.update!(time_zone: "Pacific/Kiritimati") # UTC+14
    travel_to Time.utc(2026, 11, 20, 12, 0) do
      assert_equal Date.new(2026, 11, 21), @user.today
    end
  end

  test "rejects unknown time zones" do
    @user.time_zone = "Mars/Olympus_Mons"
    assert_not @user.valid?
  end

  test "deleting an application keeps its activity" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @applied)
    application.destroy!

    assert_nil @user.activities.sole.job_application
  end
end
