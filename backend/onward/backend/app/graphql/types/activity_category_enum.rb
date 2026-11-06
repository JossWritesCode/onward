module Types
  class ActivityCategoryEnum < Types::BaseEnum
    graphql_name "ActivityCategory"
    description "Which part of the job hunt an activity belongs to."

    value "APPLYING", value: "applying"
    value "NETWORKING", value: "networking"
    value "INTERVIEW_PREP", value: "interview_prep"
    value "MATERIALS", value: "materials"
  end
end
