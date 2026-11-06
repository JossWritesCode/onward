# The latest data fetched from LeetCode or GitHub for one person.
class IntegrationSnapshot < ApplicationRecord
  PROVIDERS = %w[leetcode github].freeze
  FRESH_FOR = 30.minutes

  belongs_to :user

  validates :provider, inclusion: { in: PROVIDERS }

  def stale?
    fetched_at.nil? || fetched_at < FRESH_FOR.ago
  end

  def days
    data.fetch("days", {})
  end
end
