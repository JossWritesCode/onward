module Types
  class PracticeRatingEnum < Types::BaseEnum
    graphql_name "PracticeRating"
    description "How a practice rep went."

    value "NAILED_IT", "Felt good.", value: "nailed_it"
    value "NEEDS_WORK", "Worth another go.", value: "needs_work"
  end
end
