module Types
  class MutationType < Types::BaseObject
    field :sign_up, mutation: Mutations::SignUp
    field :sign_in, mutation: Mutations::SignIn
    field :sign_out, mutation: Mutations::SignOut

    field :create_job_application, mutation: Mutations::CreateJobApplication
    field :update_job_application, mutation: Mutations::UpdateJobApplication
    field :delete_job_application, mutation: Mutations::DeleteJobApplication
    field :move_job_application, mutation: Mutations::MoveJobApplication

    field :create_stage, mutation: Mutations::CreateStage
    field :update_stage, mutation: Mutations::UpdateStage
    field :delete_stage, mutation: Mutations::DeleteStage
    field :reorder_stages, mutation: Mutations::ReorderStages

    field :log_activity, mutation: Mutations::LogActivity
    field :delete_activity, mutation: Mutations::DeleteActivity
    field :update_time_zone, mutation: Mutations::UpdateTimeZone

    field :create_contact, mutation: Mutations::CreateContact
    field :update_contact, mutation: Mutations::UpdateContact
    field :delete_contact, mutation: Mutations::DeleteContact
  end
end
