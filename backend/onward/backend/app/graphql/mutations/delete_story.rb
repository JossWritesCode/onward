module Mutations
  class DeleteStory < BaseMutation
    description "Deletes a story. Your practice history stays in your streak."

    argument :id, ID, required: true

    field :id, ID, null: false

    def resolve(id:)
      current_user!.stories.find(id).destroy!
      { id: }
    end
  end
end
