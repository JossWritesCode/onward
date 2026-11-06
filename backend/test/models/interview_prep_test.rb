require "test_helper"

class InterviewPrepTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @phone_screen = @user.stages.find_by!(name: "Phone screen")
    @interviewing = @user.stages.find_by!(name: "Interviewing")
  end

  test "new accounts get starter questions and a checklist template" do
    assert_equal 15, @user.questions.count
    assert_equal 5, @user.checklist_template_items.count
  end

  test "moving into an interview column starts a round with the checklist" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @phone_screen)

    round = application.interview_rounds.sole
    assert_equal "Phone screen", round.name
    assert_equal @user.checklist_template_items.map(&:text), round.checklist_items.map(&:text)
  end

  test "each interview column gets its own round, once" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @phone_screen)
    application.move_to!(@interviewing, 0)
    application.move_to!(@phone_screen, 0)

    assert_equal [ "Phone screen", "Interviewing" ], application.interview_rounds.map(&:name)
  end

  test "finishing a checklist counts once" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", stage: @phone_screen)
    round = application.interview_rounds.sole

    round.checklist_items.each { |item| item.update!(done: true) }
    round.checklist_items.reset
    round.record_progress!
    round.record_progress!

    assert round.prepped_at.present?
    assert_equal 1, @user.activities.where(kind: "interview_prepped").count
  end

  test "practicing counts toward the streak, as often as you like" do
    story = @user.stories.create!(title: "The migration", tags: [ " Leadership ", "leadership", "" ])
    assert_equal [ "leadership" ], story.tags

    2.times { @user.practices.create!(story:, question: @user.questions.first, rating: "nailed_it") }

    assert_equal 2, @user.activities.where(kind: "interview_practice").count
    assert Streak.for(@user).active_today
  end

  test "study sessions need at least 10 minutes" do
    assert_not @user.study_sessions.new(topic: "LeetCode", minutes: 5).valid?

    @user.study_sessions.create!(topic: "LeetCode", minutes: 25)
    assert_equal "25 min · LeetCode", @user.activities.find_by!(kind: "study_session").note
  end

  test "can't practice with someone else's story" do
    stranger_story = create_user.stories.create!(title: "Not yours")
    assert_not @user.practices.new(story: stranger_story, rating: "nailed_it").valid?
  end
end
