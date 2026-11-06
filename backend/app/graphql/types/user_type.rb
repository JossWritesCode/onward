module Types
  class UserType < Types::BaseObject
    description "Someone with an Onward account."

    field :id, ID, null: false
    field :email_address, String, null: false
    field :time_zone, String, null: false, description: "Your time zone, like America/Toronto."
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
