# An interview question in your question bank. New accounts start with
# general behavioral questions, which you can edit or delete.
class Question < ApplicationRecord
  STARTERS = [
    "Tell me about a time you faced a difficult challenge at work. How did you handle it?",
    "Describe a time you disagreed with a teammate or manager. What happened?",
    "Tell me about a project you're proud of.",
    "Tell me about a time you made a mistake. What did you learn?",
    "Describe a time you had to learn something new quickly.",
    "Tell me about a time you took the lead on something.",
    "Describe a situation where you had to meet a tight deadline.",
    "Tell me about a time you received critical feedback. How did you respond?",
    "Give an example of a time you went above and beyond.",
    "Tell me about a time you worked with someone who was difficult to work with.",
    "Describe a time you had to make a decision without all the information.",
    "Tell me about a time something you worked on failed.",
    "Describe a time you improved a process or made something more efficient.",
    "Tell me about a time you had to persuade someone to see things your way.",
    "Tell me about a time you juggled several priorities at once."
  ].freeze

  belongs_to :user
  has_many :practices, dependent: :nullify

  normalizes :prompt, with: ->(prompt) { prompt.strip }

  validates :prompt, presence: true, length: { maximum: 500 }
end
