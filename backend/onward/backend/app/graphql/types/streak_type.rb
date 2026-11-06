module Types
  class StreakType < Types::BaseObject
    description "Your run of active days in a row."

    field :current, Int, null: false, description: "Days in a row, counting today once you've done something."
    field :longest, Int, null: false
    field :freezes, Int, null: false, description: "Freezes ready to cover a missed day (up to 2)."
    field :active_today, Boolean, null: false, description: "Whether you've done something today yet."
    field :frozen_dates, [ GraphQL::Types::ISO8601Date ], null: false, description: "Missed days a freeze covered."
  end
end
