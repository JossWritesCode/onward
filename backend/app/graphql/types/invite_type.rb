module Types
  class InviteType < Types::BaseObject
    description "A one-time code that lets someone create an account."

    field :id, ID, null: false
    field :code, String, null: false, description: "Like ABCD-EFGH."
    field :note, String, null: true, description: "Who it's for, so you remember."
    field :used_at, GraphQL::Types::ISO8601DateTime, null: true
    field :used_by_email, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def code = object.display_code
    def used_by_email = object.used_by&.email_address
  end
end
