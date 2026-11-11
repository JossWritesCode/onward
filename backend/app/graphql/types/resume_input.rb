module Types
  class ResumeInput < Types::BaseInputObject
    description "Fields for updating a resume. Leave a field out to keep its current value."

    argument :title, String, required: false
    argument :template, Types::ResumeTemplateEnum, required: false
    argument :page_size, Types::ResumePageSizeEnum, required: false
    argument :job_application_id, ID, required: false,
      description: "The application this resume is tailored for, or null to make it a base resume."
    argument :content, GraphQL::Types::JSON, required: false, description: "The whole content, in the same shape it's read in."
  end
end
