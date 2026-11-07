# Something you did for your job hunt on a given day.
class Activity < ApplicationRecord
  # Every kind and the category it counts toward in the weekly recap.
  KINDS = {
    "application_sent" => "applying",
    "interview" => "interview_prep",
    "offer" => "applying",
    "rejection" => "applying",
    "networking_message" => "networking",
    "coffee_chat" => "networking",
    "follow_up" => "networking",
    "tailored_materials" => "materials",
    "interview_practice" => "interview_prep",
    "interview_prepped" => "interview_prep",
    "study_session" => "interview_prep",
    "leetcode" => "interview_prep",
    # Your own actions. The category comes from the action.
    "custom" => nil
  }.freeze

  CATEGORIES = %w[applying networking interview_prep materials].freeze

  # Kinds you log yourself on the Progress page. The rest come from the board.
  LOGGABLE_KINDS = %w[networking_message coffee_chat tailored_materials follow_up custom].freeze

  # Talking to someone counts as contacting them, which later powers follow-up nudges.
  CONTACTING_KINDS = %w[networking_message coffee_chat follow_up].freeze

  # Recorded from the board, once per application for each stage type.
  BOARD_KINDS = %w[application_sent interview offer rejection].freeze

  # What moving a card into each kind of column counts as.
  KIND_FOR_STATUS = {
    "applied" => "application_sent",
    "interviewing" => "interview",
    "offer" => "offer",
    "rejected" => "rejection"
  }.freeze

  belongs_to :user
  belongs_to :job_application, optional: true
  belongs_to :contact, optional: true
  belongs_to :custom_action, optional: true

  enum :kind, KINDS.keys.index_with(&:itself), prefix: true, validate: true
  enum :category, CATEGORIES.index_with(&:itself), prefix: true, validate: true

  normalizes :note, with: ->(note) { note.strip.presence }

  validates :note, length: { maximum: 500 }
  validate :links_belong_to_user
  validates :custom_action, presence: true, if: :kind_custom?

  before_validation :fill_in_defaults
  after_create :mark_contact_as_contacted, if: -> { contact && CONTACTING_KINDS.include?(kind) }
  # Finishing your last goal for the day makes it a perfect day.
  after_create_commit :check_daily_goals

  # Called when an application's status changes. Records the step the first
  # time an application reaches it, and never again.
  def self.record_status_change!(job_application)
    kind = KIND_FOR_STATUS[job_application.status]
    return if kind.nil?
    return if where(job_application:, kind:, automatic: true).exists?

    create!(user: job_application.user, job_application:, kind:, automatic: true)
  end

  private

  def fill_in_defaults
    self.category ||= kind_custom? ? custom_action&.category : KINDS[kind]
    self.occurred_on ||= user&.today
  end

  def mark_contact_as_contacted
    return if contact.last_contacted_on && contact.last_contacted_on >= occurred_on

    contact.update_column(:last_contacted_on, occurred_on)
  end

  def check_daily_goals
    return if occurred_on > user.today

    DailyGoals.for(user, date: occurred_on, refresh: false).record!
  rescue StandardError => error
    # Goals are a bonus. Never let them get in the way of saving what you did.
    Rails.logger.warn("Daily goal check failed: #{error.class}: #{error.message}")
  end

  def links_belong_to_user
    errors.add(:job_application, "must be one of yours") if job_application && job_application.user_id != user_id
    errors.add(:contact, "must be one of yours") if contact && contact.user_id != user_id
    errors.add(:custom_action, "must be one of yours") if custom_action && custom_action.user_id != user_id
  end
end
