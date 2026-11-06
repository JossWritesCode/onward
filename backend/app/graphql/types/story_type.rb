module Types
  class StoryType < Types::BaseObject
    description "A story from your experience, in STAR form, for behavioral interviews."

    field :id, ID, null: false
    field :title, String, null: false
    field :situation, String, null: true
    field :task, String, null: true
    field :action, String, null: true
    field :result, String, null: true
    field :tags, [ String ], null: false
    field :practice_count, Int, null: false
    field :last_practiced_on, GraphQL::Types::ISO8601Date, null: true
    field :last_rating, Types::PracticeRatingEnum, null: true
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def practice_count
      practices.size
    end

    def last_practiced_on
      latest_practice&.practiced_on
    end

    def last_rating
      latest_practice&.rating
    end

    private

    def practices
      @practices ||= dataload_association(:practices)
    end

    def latest_practice
      practices.max_by(&:created_at)
    end
  end
end
