# A nudge you dismissed (hidden_until is nil) or snoozed (hidden until that day).
# Keys include the date the nudge is about, so a dismissed nudge comes back
# if things change and it applies again later.
class NudgeDismissal < ApplicationRecord
  SNOOZE_DAYS = 7

  belongs_to :user

  validates :key, presence: true, length: { maximum: 100 }

  scope :hiding_on, ->(date) { where(hidden_until: nil).or(where(hidden_until: (date + 1)..)) }
end
