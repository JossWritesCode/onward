# One practice rep: answering a question out loud with one of your stories.
class Practice < ApplicationRecord
  RATINGS = %w[nailed_it needs_work].freeze

  belongs_to :user
  belongs_to :question, optional: true
  belongs_to :story, optional: true

  enum :rating, RATINGS.index_with(&:itself), prefix: true, validate: true

  validates :seconds, numericality: { only_integer: true, in: 0..3600 }, allow_nil: true
  validate :links_belong_to_user

  before_validation { self.practiced_on ||= user&.today }
  after_create { user.activities.create!(kind: "interview_practice", automatic: true, occurred_on: practiced_on) }

  private

  def links_belong_to_user
    errors.add(:question, "must be one of yours") if question && question.user_id != user_id
    errors.add(:story, "must be one of yours") if story && story.user_id != user_id
  end
end
