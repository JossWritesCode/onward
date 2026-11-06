module Types
  class TopicMinutesType < Types::BaseObject
    field :topic, String, null: false
    field :minutes, Int, null: false
  end
end
