# A story from your experience, written once in STAR form (situation, task,
# action, result) and practiced against behavioral interview questions.
class Story < ApplicationRecord
  belongs_to :user
  has_many :practices, dependent: :nullify

  normalizes :title, with: ->(title) { title.strip }
  normalizes :situation, :task, :action, :result, with: ->(text) { text.strip.presence }
  normalizes :tags, with: ->(tags) { tags.map { |tag| tag.to_s.strip.downcase }.compact_blank.uniq.first(10) }

  validates :title, presence: true, length: { maximum: 120 }
  validates :situation, :task, :action, :result, length: { maximum: 5000 }
end
