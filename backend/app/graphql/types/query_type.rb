module Types
  class QueryType < Types::BaseObject
    field :me, Types::UserType, null: true, description: "The signed-in person, or null when signed out."

    field :job_applications, [ Types::JobApplicationType ], null: false,
      description: "Your job applications, most recently updated first." do
      argument :status, Types::JobApplicationStatusEnum, required: false
    end

    field :job_application, Types::JobApplicationType, null: false do
      argument :id, ID, required: true
    end

    field :progress, Types::ProgressType, null: false, description: "Your streak and activity history."

    field :stages, [ Types::StageType ], null: false, description: "Your board columns, left to right."

    field :contacts, [ Types::ContactType ], null: false, description: "Your contacts, alphabetically."

    field :contact, Types::ContactType, null: false do
      argument :id, ID, required: true
    end

    def me
      context[:current_user]
    end

    def job_applications(status: nil)
      scope = current_user!.job_applications.order(updated_at: :desc)
      status ? scope.where(status: status) : scope
    end

    def job_application(id:)
      current_user!.job_applications.find(id)
    end

    def progress
      current_user!
    end

    def stages
      current_user!.stages
    end

    def contacts
      current_user!.contacts.order(Arel.sql("LOWER(name)"))
    end

    def contact(id:)
      current_user!.contacts.find(id)
    end
  end
end
