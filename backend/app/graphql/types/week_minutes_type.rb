module Types
  class WeekMinutesType < Types::BaseObject
    field :week_start, GraphQL::Types::ISO8601Date, null: false, description: "The Monday the week starts on."
    field :minutes, Int, null: false
  end
end
