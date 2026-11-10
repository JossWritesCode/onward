module Types
  class ResumePageSizeEnum < Types::BaseEnum
    graphql_name "ResumePageSize"
    description "The paper size of a resume's PDF."

    value "LETTER", "US Letter, standard in Canada and the US.", value: "letter"
    value "A4", "A4, standard nearly everywhere else.", value: "a4"
  end
end
