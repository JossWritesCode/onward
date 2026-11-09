module Types
  class JobApplicationInput < Types::BaseInputObject
    description "Fields for creating or updating a job application. Leave a field out to keep its current value."

    argument :company, String, required: false
    argument :role, String, required: false
    argument :stage_id, ID, required: false,
      description: "The board column to put the application in. Its status follows the column's kind."
    argument :date_applied, GraphQL::Types::ISO8601Date, required: false
    argument :follow_up_on, GraphQL::Types::ISO8601Date, required: false,
      description: "When to follow up next, or null to clear it. A date set by hand stays until the card moves or a follow-up is logged."
    argument :posting_url, String, required: false
    argument :salary_range, String, required: false
    argument :location, String, required: false
    argument :work_arrangement, Types::WorkArrangementEnum, required: false
    argument :job_description, String, required: false
    argument :resume_version, String, required: false
    argument :notes, String, required: false
    argument :contact_ids, [ ID ], required: false,
      description: "Replaces the linked contacts with exactly these."
  end
end
