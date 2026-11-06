require "test_helper"

class StageTest < ActiveSupport::TestCase
  setup do
    @user = create_user
  end

  test "new accounts get the default columns in order" do
    assert_equal [ "Saved", "Applied", "Phone screen", "Interviewing", "Offer", "Rejected" ], @user.stages.map(&:name)
    assert_equal (0..5).to_a, @user.stages.map(&:position)
  end

  test "new columns go at the end" do
    stage = @user.stages.create!(name: "Final round", kind: "interviewing")
    assert_equal 6, stage.position
  end

  test "an application's status follows its column" do
    phone_screen = @user.stages.find_by!(name: "Phone screen")
    application = @user.job_applications.create!(company: "Acme", role: "Developer", stage: phone_screen)
    assert application.status_interviewing?
  end

  test "setting only a status picks the first column of that kind" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer", status: "interviewing")
    assert_equal "Phone screen", application.stage.name
  end

  test "changing a column's kind updates its applications" do
    stage = @user.stages.find_by!(name: "Interviewing")
    application = @user.job_applications.create!(company: "Acme", role: "Developer", stage:)

    stage.update!(kind: "offer")

    assert application.reload.status_offer?
  end

  test "can't delete a column that still has cards" do
    stage = @user.stages.find_by!(name: "Saved")
    @user.job_applications.create!(company: "Acme", role: "Developer", stage:)

    assert_not stage.destroy
    assert_includes stage.errors.full_messages, "Move the cards out of this column before deleting it."
  end

  test "can delete an empty column" do
    assert @user.stages.find_by!(name: "Phone screen").destroy
    assert_equal 5, @user.stages.count
  end

  test "can't put an application in someone else's column" do
    stranger_stage = create_user.stages.first
    application = @user.job_applications.new(company: "Acme", role: "Developer", stage: stranger_stage)
    assert_not application.valid?
  end

  test "moving a card renumbers the column" do
    applied = @user.stages.find_by!(name: "Applied")
    first = @user.job_applications.create!(company: "First", role: "Dev", stage: applied)
    second = @user.job_applications.create!(company: "Second", role: "Dev", stage: applied)
    saved_app = @user.job_applications.create!(company: "Moving", role: "Dev")

    # New cards go on top, so Applied is currently: Second, First.
    assert_equal [ "Second", "First" ], applied.job_applications.reload.map(&:company)

    saved_app.move_to!(applied, 1)

    assert_equal [ "Second", "Moving", "First" ], applied.job_applications.reload.map(&:company)
    assert saved_app.reload.status_applied?
    assert_equal Date.current, saved_app.date_applied
    assert_equal [ 0, 1, 2 ], [ second, saved_app, first ].map { |a| a.reload.position }
  end

  test "deleting an account deletes its columns" do
    @user.job_applications.create!(company: "Acme", role: "Developer")
    assert_difference -> { Stage.count }, -6 do
      @user.destroy!
    end
  end
end
