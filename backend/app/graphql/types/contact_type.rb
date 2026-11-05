module Types
  class ContactType < Types::BaseObject
    description "Someone you know or have reached out to during your job hunt."

    field :id, ID, null: false
    field :name, String, null: false
    field :title, String, null: true
    field :company, String, null: true
    field :email, String, null: true
    field :phone, String, null: true
    field :linkedin_url, String, null: true
    field :last_contacted_on, GraphQL::Types::ISO8601Date, null: true
    field :notes, String, null: true
    field :job_applications, [ Types::JobApplicationType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def job_applications
      object.job_applications.order(updated_at: :desc)
    end
  end
end
