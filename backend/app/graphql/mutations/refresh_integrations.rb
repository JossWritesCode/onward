module Mutations
  class RefreshIntegrations < BaseMutation
    description "Fetches fresh LeetCode and GitHub data now, instead of waiting for the next automatic refresh."

    field :engineering, Types::EngineeringType, null: false

    def resolve
      context[:refresh_integrations] = true
      { engineering: current_user! }
    end
  end
end
