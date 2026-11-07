# A day you finished every one of your daily goals.
class PerfectDay < ApplicationRecord
  belongs_to :user

  validates :achieved_on, presence: true
end
