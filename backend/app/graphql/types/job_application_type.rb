module Types
  class JobApplicationType < Types::BaseObject
    description "A job you've saved, applied to, or are interviewing for."

    field :id, ID, null: false
    field :company, String, null: false
    field :role, String, null: false
    field :status, Types::JobApplicationStatusEnum, null: false
    field :date_applied, GraphQL::Types::ISO8601Date, null: true
    field :posting_url, String, null: true
    field :salary_range, String, null: true
    field :location, String, null: true
    field :work_arrangement, Types::WorkArrangementEnum, null: true
    field :job_description, String, null: true
    field :resume_version, String, null: true
    field :notes, String, null: true
    field :contacts, [ Types::ContactType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def contacts
      object.contacts.order(Arel.sql("LOWER(contacts.name)"))
    end
  end
end
