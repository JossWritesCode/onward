module Types
  class CalendarDayType < Types::BaseObject
    description "How much happened on one day, for a heat map."

    field :date, GraphQL::Types::ISO8601Date, null: false
    field :count, Int, null: false
  end
end
