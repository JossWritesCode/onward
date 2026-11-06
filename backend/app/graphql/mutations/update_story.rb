module Mutations
  class UpdateStory < BaseMutation
    description "Changes a story in your story bank."

    argument :id, ID, required: true
    argument :input, Types::StoryInput, required: true

    field :story, Types::StoryType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      story = current_user!.stories.find(id)
      story.update(input.to_h) ? { story:, errors: [] } : { story: nil, errors: errors_for(story) }
    end
  end
end
