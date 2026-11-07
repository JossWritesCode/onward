module Types
  # Built on a DailyGoals for today.
  class PerfectDayType < Types::BaseObject
    description "Whether today is a perfect day (every goal done), and your run of them."

    field :today, Boolean, null: false, description: "Whether every one of today's goals is done."
    field :streak, Int, null: false, description: "Perfect days in a row. Days with no goals are skipped."
    field :has_goals, Boolean, null: false

    def today = object.perfect?
    def streak = object.perfect_streak
    def has_goals = object.any_goals?
  end
end
