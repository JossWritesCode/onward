module Types
  class ResumeTemplateEnum < Types::BaseEnum
    graphql_name "ResumeTemplate"
    description "How a resume is laid out in its PDF."

    value "CLASSIC", "One column, with serif headings.", value: "classic"
  end
end
