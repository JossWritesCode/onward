# Something you do for your job hunt that Onward has no button for, like
# "Went to a meetup". Logging one counts toward your streak like any other win.
class CustomAction < ApplicationRecord
  MAX_ACTIVE = 12

  belongs_to :user
  has_many :activities, dependent: :restrict_with_exception
  has_one :daily_goal, dependent: :destroy

  enum :category, Activity::CATEGORIES.index_with(&:itself), prefix: true, validate: true

  scope :active, -> { where(archived_at: nil) }

  normalizes :name, with: ->(name) { name.squish }

  validates :name, presence: true, length: { maximum: 60 }
  validate :name_is_unique, if: -> { archived_at.nil? }
  validate :not_too_many, on: :create

  # Past activity keeps the action's name, so deleting only hides it.
  def archive!
    transaction do
      daily_goal&.destroy!
      update!(archived_at: Time.current)
    end
  end

  private

  def name_is_unique
    taken = user&.custom_actions&.active&.where.not(id:)&.where("LOWER(name) = ?", name.to_s.downcase)&.exists?
    errors.add(:name, "is already one of your actions") if taken
  end

  def not_too_many
    return unless user && user.custom_actions.active.count >= MAX_ACTIVE

    errors.add(:base, "You can have up to #{MAX_ACTIVE} custom actions. Delete one to add another.")
  end
end
