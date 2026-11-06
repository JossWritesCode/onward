# Works out a streak from the days you were active. Not stored anywhere: it's
# recalculated from your activity history, so it's always consistent with it.
#
# Rules:
# - Any day with at least one activity counts.
# - Today doesn't break the streak until it's over.
# - Every 7 active days in a row earns a freeze. You can hold up to 2.
# - A missed day uses a freeze automatically, if you have one, and the streak survives.
class Streak
  FREEZE_EVERY = 7
  MAX_FREEZES = 2

  attr_reader :current, :longest, :freezes, :frozen_dates, :active_today

  def self.for(user)
    new(user.activities.distinct.pluck(:occurred_on), today: user.today)
  end

  def initialize(active_dates, today:)
    dates = active_dates.to_set
    @active_today = dates.include?(today)
    @current = 0
    @longest = 0
    @freezes = 0
    @frozen_dates = []
    return if dates.empty?

    days_toward_freeze = 0
    (dates.min..today).each do |day|
      if dates.include?(day)
        @current += 1
        days_toward_freeze += 1
        if days_toward_freeze == FREEZE_EVERY
          @freezes = [ @freezes + 1, MAX_FREEZES ].min
          days_toward_freeze = 0
        end
      elsif day == today
        # There's still time today.
      elsif @current.positive? && @freezes.positive?
        @freezes -= 1
        @frozen_dates << day
      else
        @current = 0
        days_toward_freeze = 0
      end

      @longest = [ @longest, @current ].max
    end
  end
end
