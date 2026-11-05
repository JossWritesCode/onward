module Types
  class UserType < Types::BaseObject
    description "Someone with an Onward account."

    field :id, ID, null: false
    field :email_address, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
