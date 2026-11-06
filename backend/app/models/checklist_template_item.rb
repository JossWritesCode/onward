# One line of your interview prep checklist template. Every new interview
# round gets a copy of the template.
class ChecklistTemplateItem < ApplicationRecord
  STARTERS = [
    "Research the company and what it makes",
    "Reread the job description",
    "Rehearse two stories from your story bank",
    "Write three questions to ask them",
    "Plan the logistics (or test your video setup)"
  ].freeze

  belongs_to :user

  normalizes :text, with: ->(text) { text.strip }

  validates :text, presence: true, length: { maximum: 200 }
end
