class JobApplication < ApplicationRecord
  STATUSES = %w[saved applied interviewing offer rejected].freeze
  WORK_ARRANGEMENTS = %w[onsite hybrid remote].freeze

  belongs_to :user
  has_many :job_application_contacts, dependent: :destroy
  has_many :contacts, through: :job_application_contacts

  enum :status, STATUSES.index_with(&:itself), prefix: true, validate: true
  enum :work_arrangement, WORK_ARRANGEMENTS.index_with(&:itself), prefix: :work, validate: { allow_nil: true }

  normalizes :company, :role, :posting_url, :salary_range, :location, :resume_version,
    with: ->(value) { value.strip.presence }

  validates :company, presence: true, length: { maximum: 200 }
  validates :role, presence: true, length: { maximum: 200 }
  validates :posting_url,
    format: { with: %r{\Ahttps?://\S+\z}i, message: "should start with http:// or https://" },
    allow_blank: true

  # When something moves to "applied" without a date, assume it happened today.
  before_save :default_date_applied, if: -> { will_save_change_to_status? && status_applied? }

  private

  def default_date_applied
    self.date_applied ||= Date.current
  end
end
