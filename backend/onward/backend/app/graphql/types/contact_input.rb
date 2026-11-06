module Types
  class ContactInput < Types::BaseInputObject
    description "Fields for creating or updating a contact. Leave a field out to keep its current value."

    argument :name, String, required: false
    argument :title, String, required: false
    argument :company, String, required: false
    argument :email, String, required: false
    argument :phone, String, required: false
    argument :linkedin_url, String, required: false
    argument :last_contacted_on, GraphQL::Types::ISO8601Date, required: false
    argument :notes, String, required: false
    argument :job_application_ids, [ ID ], required: false,
      description: "Replaces the linked job applications with exactly these."
  end
end
