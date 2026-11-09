class JobApplication < ApplicationRecord
  STATUSES = Stage::KINDS
  WORK_ARRANGEMENTS = %w[onsite hybrid remote].freeze

  # Only cards in these kinds of columns have follow-up dates.
  FOLLOW_UP_STATUSES = %w[applied interviewing].freeze
  # Days between one follow-up and the next.
  FOLLOW_UP_DAYS = 7
  # What the next follow-up is, by how many you've sent since the card landed
  # in its column. Past the end of the list, it's time to think about letting go.
  FOLLOW_UP_STEPS = {
    "applied" => %w[follow_up follow_up],
    "interviewing" => %w[thank_you check_in check_in last_note]
  }.freeze

  belongs_to :user
  belongs_to :stage, inverse_of: :job_applications
  has_many :job_application_contacts, dependent: :destroy
  has_many :contacts, through: :job_application_contacts
  # Activities stay in your history (and streak) even if the application is deleted.
  has_many :activities, dependent: :nullify
  has_many :interview_rounds, -> { order(:created_at) }, dependent: :destroy

  # The status always matches the kind of the column the card is in. It's kept
  # as its own column so filtering and stats don't need to look at stages.
  enum :status, STATUSES.index_with(&:itself), prefix: true, validate: true
  enum :work_arrangement, WORK_ARRANGEMENTS.index_with(&:itself), prefix: :work, validate: { allow_nil: true }

  normalizes :company, :role, :posting_url, :salary_range, :location, :resume_version,
    with: ->(value) { value.strip.presence }

  validates :company, presence: true, length: { maximum: 200 }
  validates :role, presence: true, length: { maximum: 200 }
  validates :posting_url,
    format: { with: %r{\Ahttps?://\S+\z}i, message: "should start with http:// or https://" },
    allow_blank: true
  validates :follow_ups_sent, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :stage_belongs_to_user

  before_validation :sync_stage_and_status
  before_save :place_at_top_of_stage, if: -> { (new_record? || will_save_change_to_stage_id?) && !@positioned }
  # When something moves to "applied" without a date, assume it happened today.
  before_save :default_date_applied, if: -> { will_save_change_to_status? && status_applied? }
  # Moving to a new kind of column, or to a different interview round, starts
  # the follow-up schedule over. Logged follow-ups are scheduled in Activity.
  before_save :restart_follow_ups, if: :follow_ups_restart?
  # Saved, offer, and rejected cards never have a follow-up date.
  before_save -> { self.follow_up_on = nil }, unless: -> { FOLLOW_UP_STATUSES.include?(status) }
  # Applying, interviews, offers, and rejections count toward your streak.
  after_save -> { Activity.record_status_change!(self) }, if: :saved_change_to_status?
  # Landing in an interview column starts a prep checklist for that round.
  after_save -> { InterviewRound.start_for!(self) }, if: :saved_change_to_stage_id?

  # Moves the card into a column at a given spot (0 is the top) and renumbers
  # the cards around it.
  def move_to!(new_stage, index)
    transaction do
      siblings = new_stage.job_applications.where.not(id: id).to_a
      index = index.to_i.clamp(0, siblings.size)

      self.stage = new_stage
      @positioned = true
      save!

      siblings.insert(index, self).each_with_index do |application, position|
        application.update_column(:position, position) unless application.position == position
      end
    end
  ensure
    @positioned = false
  end

  # The soonest interview that hasn't happened yet, for the countdown on the card.
  def next_interview_at
    interview_rounds.where(scheduled_at: Time.current..).minimum(:scheduled_at)
  end

  # What the next follow-up should be: "follow_up", "thank_you", "check_in",
  # "last_note", or "let_go". Nil for cards that don't get follow-ups.
  def follow_up_step
    steps = FOLLOW_UP_STEPS[status]
    return if steps.nil?

    steps[follow_ups_sent] || "let_go"
  end

  # Whether the follow-up date is today or already past, on your clock.
  def follow_up_due?(today = user.today)
    follow_up_on.present? && follow_up_on <= today
  end

  # Called when you log a follow-up for this application: counts it and
  # schedules the next one a week after the day it was logged.
  def schedule_next_follow_up!(logged_on)
    return unless FOLLOW_UP_STATUSES.include?(status)

    update_columns(
      follow_ups_sent: follow_ups_sent + 1,
      follow_up_on: logged_on + FOLLOW_UP_DAYS,
      updated_at: Time.current
    )
  end

  private

  def follow_ups_restart?
    will_save_change_to_stage_id? && (will_save_change_to_status? || status_interviewing?)
  end

  def restart_follow_ups
    self.follow_ups_sent = 0
    # A date you typed in yourself in the same save wins.
    return if will_save_change_to_follow_up_on?

    self.follow_up_on =
      case status
      when "applied" then user.today + FOLLOW_UP_DAYS
      when "interviewing" then thank_you_on
      end
  end

  # A thank-you note goes out the day after the interview if this round has a
  # date coming up, and tomorrow otherwise.
  def thank_you_on
    round = InterviewRound.find_by(job_application_id: id, stage_id:) if persisted?
    interview_at = round&.scheduled_at
    return user.local_date(interview_at) + 1 if interview_at&.future?

    user.today + 1
  end

  # Setting a stage sets the status. Setting only a status (for example from
  # older code or seeds) picks the first column of that kind.
  def sync_stage_and_status
    return if user.nil?

    if stage.nil? || (status_changed? && !stage_id_changed? && stage.kind != status)
      self.stage = user.stages.where(kind: status).order(:position).first || stage || user.stages.order(:position).first
    end

    self.status = stage.kind if stage
  end

  def place_at_top_of_stage
    self.position = (stage.job_applications.where.not(id: id).minimum(:position) || 1) - 1
  end

  def default_date_applied
    self.date_applied ||= Date.current
  end

  def stage_belongs_to_user
    return if stage.nil? || user.nil? || stage.user_id == user_id

    errors.add(:stage, "must be one of your columns")
  end
end
