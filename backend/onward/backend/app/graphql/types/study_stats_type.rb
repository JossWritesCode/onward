module Types
  # Built on the signed-in user.
  class StudyStatsType < Types::BaseObject
    description "Time spent studying, from the study timer and time you added."

    field :minutes_this_week, Int, null: false, description: "Since Monday."
    field :minutes_this_month, Int, null: false
    field :minutes_total, Int, null: false
    field :by_topic, [ Types::TopicMinutesType ], null: false, description: "All-time minutes per topic, most first."
    field :weeks, [ Types::WeekMinutesType ], null: false, description: "Minutes per week for the last 12 weeks, oldest first."

    def minutes_this_week = sessions.where(studied_on: today.beginning_of_week..).sum(:minutes)
    def minutes_this_month = sessions.where(studied_on: today.beginning_of_month..).sum(:minutes)
    def minutes_total = sessions.sum(:minutes)

    def by_topic
      sessions.group(:topic).sum(:minutes).sort_by { |_, minutes| -minutes }.map { |topic, minutes| { topic:, minutes: } }
    end

    def weeks
      first_week = today.beginning_of_week - 11.weeks
      totals = sessions.where(studied_on: first_week..).group(:studied_on).sum(:minutes)
      (0..11).map do |offset|
        week_start = first_week + offset.weeks
        { week_start:, minutes: totals.sum { |date, minutes| date >= week_start && date < week_start + 1.week ? minutes : 0 } }
      end
    end

    private

    def sessions = object.study_sessions
    def today = @today ||= object.today
  end
end
