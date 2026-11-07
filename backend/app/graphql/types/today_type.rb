module Types
  # Built on a DailyGoals for today.
  class TodayType < Types::BaseObject
    description "Today's goals and nudges, for the Today strip above the board."

    field :date, GraphQL::Types::ISO8601Date, null: false, description: "Today's date on your clock."
    field :goals, [ Types::GoalProgressType ], null: false, description: "Today's goals, in your order."
    field :has_goals, Boolean, null: false, description: "Whether you've set up any goals at all."
    field :rest_day, Boolean, null: false,
      description: "True when you have goals but none for today, like weekday goals on a Saturday."
    field :perfect, Boolean, null: false, description: "Whether every one of today's goals is done."
    field :perfect_streak, Int, null: false, description: "Perfect days in a row. Days with no goals are skipped."
    field :nudges, [ Types::NudgeType ], null: false, description: "Up to 3."

    def goals = object.progress
    def has_goals = object.any_goals?
    def rest_day = object.rest_day?
    def perfect = object.perfect?
    def perfect_streak = object.perfect_streak
    def nudges = Nudges.for(object.user)
  end
end
