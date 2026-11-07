module Types
  # Built on the signed-in user.
  class ProgressType < Types::BaseObject
    description "Your streak and activity history."

    field :today, GraphQL::Types::ISO8601Date, null: false, description: "Today's date on your clock."
    field :streak, Types::StreakType, null: false
    field :activities, [ Types::ActivityType ], null: false, description: "Newest first." do
      argument :since, GraphQL::Types::ISO8601Date, required: true, description: "The earliest day to include."
    end
    field :perfect_day, Types::PerfectDayType, null: false, description: "Whether today is a perfect day, and your run of them."
    field :perfect_days, [ GraphQL::Types::ISO8601Date ], null: false,
      description: "Days you finished every goal, oldest first." do
      argument :since, GraphQL::Types::ISO8601Date, required: true, description: "The earliest day to include."
    end

    def today
      object.today
    end

    def streak
      Streak.for(object)
    end

    def perfect_day
      goals = DailyGoals.for(object)
      goals.record!
      goals
    end

    def perfect_days(since:)
      object.perfect_days.where(achieved_on: since..).order(:achieved_on).pluck(:achieved_on)
    end

    def activities(since:)
      object.activities
        .where(occurred_on: since..)
        .includes(:job_application, :contact, :custom_action)
        .order(occurred_on: :desc, created_at: :desc)
    end
  end
end
