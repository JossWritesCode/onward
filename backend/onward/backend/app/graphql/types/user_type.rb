module Types
  class UserType < Types::BaseObject
    description "Someone with an Onward account."

    field :id, ID, null: false
    field :email_address, String, null: false
    field :time_zone, String, null: false, description: "Your time zone, like America/Toronto."
    field :engineering_track, Boolean, null: false, description: "Whether the software engineering track is on."
    field :leetcode_username, String, null: true
    field :github_username, String, null: true
    field :github_connected, Boolean, null: false, description: "Whether a GitHub token is saved. The token itself is never sent back."
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def github_connected
      object.github_token.present?
    end
  end
end
