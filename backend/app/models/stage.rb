# A column on the job board, like "Phone screen". Every column has a kind,
# one of the five application statuses, so custom columns still mean
# something to the rest of the app (XP, interview prep, stats).
class Stage < ApplicationRecord
  KINDS = %w[saved applied interviewing offer rejected].freeze
  MAX_STAGES = 20

  DEFAULTS = [
    { name: "Saved", kind: "saved" },
    { name: "Applied", kind: "applied" },
    { name: "Phone screen", kind: "interviewing" },
    { name: "Interviewing", kind: "interviewing" },
    { name: "Offer", kind: "offer" },
    { name: "Rejected", kind: "rejected" }
  ].freeze

  belongs_to :user
  has_many :job_applications, -> { order(:position, :id) }, inverse_of: :stage

  enum :kind, KINDS.index_with(&:itself), prefix: true, validate: true

  normalizes :name, with: ->(name) { name.strip }

  validates :name, presence: true, length: { maximum: 40 }
  validate :within_stage_limit, on: :create

  before_create :place_at_end
  after_update :sync_application_statuses, if: :saved_change_to_kind?
  before_destroy :ensure_deletable, prepend: true

  def self.create_defaults_for(user)
    DEFAULTS.each_with_index do |attributes, index|
      user.stages.create!(attributes.merge(position: index))
    end
  end

  private

  def place_at_end
    return if position.to_i.positive? || user.nil?

    self.position = (user.stages.maximum(:position) || -1) + 1
  end

  # Changing a column's kind (say, "Interviewing" to "Offer") updates its cards.
  def sync_application_statuses
    job_applications.update_all(status: kind, updated_at: Time.current)
  end

  def within_stage_limit
    return if user.nil? || user.stages.count < MAX_STAGES

    errors.add(:base, "You can have up to #{MAX_STAGES} columns.")
  end

  def ensure_deletable
    if job_applications.exists?
      errors.add(:base, "Move the cards out of this column before deleting it.")
      throw :abort
    end

    if user.stages.count <= 1
      errors.add(:base, "Your board needs at least one column.")
      throw :abort
    end
  end
end
