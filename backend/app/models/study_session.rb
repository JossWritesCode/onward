# A focused study session from the study timer. Sessions of at least 10
# minutes count toward your streak, even if you stopped early.
class StudySession < ApplicationRecord
  MINIMUM_MINUTES = 10

  belongs_to :user

  normalizes :topic, with: ->(topic) { topic.strip }

  validates :topic, presence: true, length: { maximum: 60 }
  validates :minutes, numericality: { only_integer: true, in: MINIMUM_MINUTES..480 }

  before_validation { self.studied_on ||= user&.today }
  after_create do
    user.activities.create!(kind: "study_session", automatic: true, occurred_on: studied_on, note: "#{minutes} min · #{topic}")
  end
end
