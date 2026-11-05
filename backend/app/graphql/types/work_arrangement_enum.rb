module Types
  class WorkArrangementEnum < Types::BaseEnum
    graphql_name "WorkArrangement"
    description "Where the work happens."

    value "ONSITE", "In the office.", value: "onsite"
    value "HYBRID", "Partly in the office, partly remote.", value: "hybrid"
    value "REMOTE", "Fully remote.", value: "remote"
  end
end
