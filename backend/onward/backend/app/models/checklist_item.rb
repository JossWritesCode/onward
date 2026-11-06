class ChecklistItem < ApplicationRecord
  belongs_to :interview_round

  normalizes :text, with: ->(text) { text.strip }

  validates :text, presence: true, length: { maximum: 200 }
end
