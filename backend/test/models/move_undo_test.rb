require "test_helper"

# Moving a card to an earlier column within a day takes back what the mistaken
# move recorded. See "Taking back a mistaken move" in JobApplication.
class MoveUndoTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @saved, @applied, @phone_screen, @interviewing, @offer, @rejected =
      [ "Saved", "Applied", "Phone screen", "Interviewing", "Offer", "Rejected" ].map { |name| @user.stages.find_by!(name:) }
    @today = @user.today
  end

  def kinds(application = @application)
    application.activities.reload.map(&:kind).sort
  end

  def saved_card
    @application = @user.job_applications.create!(company: "Acme", role: "Developer")
  end

  # A card that has been in Applied for a while, one follow-up in.
  def applied_card
    @application = @user.job_applications.create!(company: "Acme", role: "Developer", stage: @applied, date_applied: @today - 9)
    @application.update_columns(follow_up_on: @today + 3, follow_ups_sent: 1, recent_moves: [])
    @application.activities.update_all(occurred_on: @today - 9, created_at: 9.days.ago)
    @application
  end

  test "moving to Applied and straight back takes the application back" do
    saved_card.move_to!(@applied, 0)
    assert_equal %w[application_sent], kinds
    assert_equal 1, Streak.for(@user).current

    @application.move_to!(@saved, 0)

    assert_empty kinds
    assert_equal %w[application_sent], @application.undone_kinds
    assert_nil @application.reload.date_applied, "the applied date the mistake filled in should be cleared"
    assert_equal 0, Streak.for(@user).current
    assert_equal [ @saved.id ], @application.recent_moves.map { |move| move["to"] }, "the mistaken move should be forgotten"
  end

  test "an applied date you typed yourself stays" do
    saved_card.update!(stage: @applied, date_applied: @today - 2)
    @application.move_to!(@saved, 0)

    assert_equal @today - 2, @application.reload.date_applied
  end

  test "takes back the perfect day the mistake earned, and it can be earned again" do
    saved_card.move_to!(@applied, 0)
    assert @user.perfect_days.exists?(achieved_on: @today)

    @application.move_to!(@saved, 0)
    assert_not @user.perfect_days.exists?(achieved_on: @today)

    @application.move_to!(@applied, 0)
    assert @user.perfect_days.exists?(achieved_on: @today)
  end

  test "keeps the perfect day when the goal is still met without the mistake" do
    @user.job_applications.create!(company: "Real", role: "Developer", stage: @applied)
    saved_card.move_to!(@applied, 0)
    @application.move_to!(@saved, 0)

    assert @user.perfect_days.exists?(achieved_on: @today)
  end

  test "moving to an interview column and back takes back the interview, its checklist, and the new follow-up date" do
    applied_card.move_to!(@phone_screen, 0)
    assert_equal %w[application_sent interview], kinds
    assert_equal 1, @application.interview_rounds.count
    assert_equal @today + 1, @application.follow_up_on

    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent], kinds
    assert_equal %w[interview], @application.undone_kinds
    assert_equal 0, @application.interview_rounds.count
    @application.reload
    assert_equal @today + 3, @application.follow_up_on
    assert_equal 1, @application.follow_ups_sent
    assert_equal @today - 9, @application.date_applied
  end

  test "a checklist you've ticked something on stays, though the interview is still taken back" do
    applied_card.move_to!(@phone_screen, 0)
    @application.interview_rounds.sole.checklist_items.first.update!(done: true)

    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent], kinds
    assert_equal 1, @application.interview_rounds.count
  end

  test "a round with a date, or an added or edited item, stays" do
    changes = [
      ->(round) { round.update!(scheduled_at: 3.days.from_now) },
      ->(round) { round.checklist_items.create!(text: "Read their engineering blog", position: 99) },
      ->(round) { travel(1.second) { round.checklist_items.first.update!(text: "Reworded") } },
      ->(round) { round.checklist_items.first.destroy! }
    ]
    changes.each do |change|
      application = @user.job_applications.create!(company: "Acme", role: "Developer", stage: @applied)
      application.move_to!(@phone_screen, 0)
      change.call(application.interview_rounds.sole)
      application.move_to!(@applied, 0)

      assert_equal 1, application.interview_rounds.count
    end
  end

  test "moving forward never takes anything back" do
    saved_card
    [ @applied, @phone_screen, @interviewing, @offer ].each { |stage| @application.move_to!(stage, 0) }

    assert_equal %w[application_sent interview offer], kinds
    assert_equal 2, @application.interview_rounds.count
    assert_empty @application.undone_kinds
  end

  test "after a day, moving back is real news and history stays" do
    applied_card.move_to!(@phone_screen, 0)
    travel 25.hours
    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent interview], kinds
    assert_empty @application.undone_kinds
    assert_equal 1, @application.interview_rounds.count
    assert_equal @user.today + 7, @application.reload.follow_up_on, "a real move back restarts the follow-ups"
  end

  test "just inside a day still counts as a mistake" do
    applied_card.move_to!(@phone_screen, 0)
    travel 23.hours
    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent], kinds
  end

  test "dropping a card one column too far, then in the right one" do
    applied_card.move_to!(@offer, 0)
    assert_equal %w[application_sent offer], kinds

    @application.move_to!(@phone_screen, 0)
    assert_equal %w[application_sent interview], kinds
    assert_equal %w[offer], @application.undone_kinds
    assert_equal 1, @application.interview_rounds.count

    # And if the interview was a mistake too, the card is back where it began.
    @application.move_to!(@applied, 0)
    assert_equal %w[application_sent], kinds
    assert_equal @today + 3, @application.reload.follow_up_on
    assert_equal 1, @application.follow_ups_sent
  end

  test "several mistaken moves unwind one at a time, newest first" do
    saved_card.move_to!(@applied, 0)
    @application.move_to!(@phone_screen, 0)

    @application.move_to!(@applied, 0)
    assert_equal %w[application_sent], kinds
    assert_equal %w[interview], @application.undone_kinds

    @application.move_to!(@saved, 0)
    assert_empty kinds
    assert_equal %w[application_sent], @application.undone_kinds
  end

  test "moving all the way back takes back every recent move at once" do
    saved_card
    [ @applied, @phone_screen, @offer ].each { |stage| @application.move_to!(stage, 0) }
    @application.move_to!(@saved, 0)

    assert_empty kinds
    assert_equal %w[application_sent interview offer], @application.undone_kinds.sort
    assert_equal 0, @application.interview_rounds.count
  end

  test "an interview you really landed earlier still counts" do
    applied_card.move_to!(@phone_screen, 0)
    travel 25.hours
    @application.move_to!(@applied, 0)
    # Today's moves: into the interview column again by mistake, and back.
    @application.move_to!(@phone_screen, 0)
    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent interview], kinds
    assert_empty @application.undone_kinds
    assert_equal 1, @application.interview_rounds.count
  end

  test "rejecting by mistake and moving back takes back the closure and keeps the follow-ups" do
    applied_card.move_to!(@rejected, 0)
    assert_nil @application.follow_up_on

    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent], kinds
    assert_equal %w[rejection], @application.undone_kinds
    assert_equal @today + 3, @application.reload.follow_up_on
    assert_equal 1, @application.follow_ups_sent
  end

  test "moving back from a later interview round to an earlier one" do
    applied_card.move_to!(@phone_screen, 0)
    @application.update_columns(follow_ups_sent: 2, follow_up_on: @today + 4)
    @application.move_to!(@interviewing, 0)

    @application.move_to!(@phone_screen, 0)

    assert_equal %w[application_sent interview], kinds, "the interview was recorded by the first round, which stands"
    assert_equal [ "Phone screen" ], @application.interview_rounds.reload.map(&:name)
    assert_equal @today + 4, @application.reload.follow_up_on
    assert_equal 2, @application.follow_ups_sent
  end

  test "a card added to the wrong column can be moved back too" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer", stage: @applied)
    application.move_to!(@saved, 0)

    assert_empty kinds(application)
    assert_nil application.reload.date_applied
  end

  test "moving between columns of the same kind takes nothing back" do
    waiting = @user.stages.create!(name: "Waiting to hear", kind: "applied")
    saved_card.move_to!(waiting, 0)
    @application.move_to!(@applied, 0)

    assert_equal %w[application_sent], kinds
    assert_empty @application.undone_kinds
  end

  test "reordering a card within its column changes nothing" do
    saved_card.move_to!(@applied, 0)
    moves = @application.reload.recent_moves
    @application.move_to!(@applied, 0)

    assert_equal moves, @application.reload.recent_moves
    assert_equal %w[application_sent], kinds
  end

  test "only remembers moves from the last day" do
    saved_card.move_to!(@applied, 0)
    travel 25.hours
    @application.move_to!(@phone_screen, 0)

    assert_equal [ @phone_screen.id ], @application.reload.recent_moves.map { |move| move["to"] }
  end
end
