module Types
  class MutationType < Types::BaseObject
    field :sign_up, mutation: Mutations::SignUp
    field :sign_in, mutation: Mutations::SignIn
    field :sign_out, mutation: Mutations::SignOut

    field :create_job_application, mutation: Mutations::CreateJobApplication
    field :update_job_application, mutation: Mutations::UpdateJobApplication
    field :delete_job_application, mutation: Mutations::DeleteJobApplication

    field :create_contact, mutation: Mutations::CreateContact
    field :update_contact, mutation: Mutations::UpdateContact
    field :delete_contact, mutation: Mutations::DeleteContact
  end
end
