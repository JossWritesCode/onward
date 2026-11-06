module Mutations
  class LogPractice < BaseMutation
    description "Records a practice rep: answering a question out loud with one of your stories."

    argument :question_id, ID, required: false
    argument :story_id, ID, required: false
    argument :rating, Types::PracticeRatingEnum, required: true
    argument :seconds, Int, required: false, description: "How long the answer took, if you used the timer."

    field :story, Types::StoryType, null: true, description: "The story you used, with its updated practice count."
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(rating:, question_id: nil, story_id: nil, seconds: nil)
      user = current_user!
      practice = user.practices.new(
        rating:,
        seconds:,
        question: question_id.present? ? user.questions.find(question_id) : nil,
        story: story_id.present? ? user.stories.find(story_id) : nil
      )

      if practice.save
        { story: practice.story, errors: [] }
      else
        { story: nil, errors: errors_for(practice) }
      end
    end
  end
end
