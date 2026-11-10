module Types
  class ResumeType < Types::BaseObject
    description "A resume, kept as structured content that a template turns into a PDF."

    field :id, ID, null: false
    field :title, String, null: false, description: "Your own name for this version, like \"Frontend v3\"."
    field :template, Types::ResumeTemplateEnum, null: false
    field :page_size, Types::ResumePageSizeEnum, null: false
    field :content, GraphQL::Types::JSON, null: false,
      description: "Name, contact details, summary, skills, experience, education, and extra sections."
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
