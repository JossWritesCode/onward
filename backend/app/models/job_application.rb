class JobApplication < ApplicationRecord
  STATUSES = Stage::KINDS
  WORK_ARRANGEMENTS = %w[onsite hybrid remote].freeze

  belongs_to :user
  belongs_to :stage, inverse_of: :job_applications
  has_many :job_application_contacts, dependent: :destroy
  has_many :contacts, through: :job_application_contacts

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
  validate :stage_belongs_to_user

  before_validation :sync_stage_and_status
  before_save :place_at_top_of_stage, if: -> { (new_record? || will_save_change_to_stage_id?) && !@positioned }
  # When something moves to "applied" without a date, assume it happened today.
  before_save :default_date_applied, if: -> { will_save_change_to_status? && status_applied? }

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

  private

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
