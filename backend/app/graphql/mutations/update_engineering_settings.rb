module Mutations
  class UpdateEngineeringSettings < BaseMutation
    description "Turns the software engineering track on or off and connects LeetCode and GitHub. Leave a field out to keep it."

    argument :engineering_track, Boolean, required: false
    argument :leetcode_username, String, required: false
    argument :github_username, String, required: false
    argument :github_token, String, required: false, description: "Send an empty string to remove the saved token."

    field :user, Types::UserType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(**settings)
      user = current_user!
      user.assign_attributes(settings)

      # A new LeetCode account counts toward the streak from today, not its whole history.
      user.leetcode_counts_from = user.today if user.leetcode_username_changed? && user.leetcode_username.present?

      if user.save
        user.integration_snapshots.where(provider: "leetcode").delete_all if user.saved_change_to_leetcode_username?
        if user.saved_change_to_github_username? || user.saved_change_to_github_token?
          user.integration_snapshots.where(provider: "github").delete_all
        end
        { user:, errors: [] }
      else
        { user: nil, errors: errors_for(user) }
      end
    rescue ActiveRecord::Encryption::Errors::Configuration
      { user: nil, errors: [ { field: "githubToken", message: "Onward can't encrypt your token yet. Run bin/setup in the backend folder, restart the server, and try again." } ] }
    end
  end
end
