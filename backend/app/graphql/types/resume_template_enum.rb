module Types
  class ResumeTemplateEnum < Types::BaseEnum
    graphql_name "ResumeTemplate"
    description "How a resume is laid out in its PDF."

    value "CLASSIC", "Centred serif name and headings, with thin rules. The traditional look.", value: "classic"
    value "COMPACT", "Tighter, with small sans-serif headings. Fits more on a page.", value: "compact"
    value "MODERN", "Left-aligned sans-serif name and headings in an accent colour.", value: "modern"
  end
end
