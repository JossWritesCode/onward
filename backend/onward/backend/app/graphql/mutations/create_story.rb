module Mutations
  class CreateStory < BaseMutation
    description "Adds a story to your story bank."

    argument :input, Types::StoryInput, required: true

    field :story, Types::StoryType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      story = current_user!.stories.new(input.to_h)
      story.save ? { story:, errors: [] } : { story: nil, errors: errors_for(story) }
    end
  end
end
