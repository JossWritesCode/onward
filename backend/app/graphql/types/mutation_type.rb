module Types
  class MutationType < Types::BaseObject
    field :sign_up, mutation: Mutations::SignUp
    field :sign_in, mutation: Mutations::SignIn
    field :sign_out, mutation: Mutations::SignOut
    field :request_password_reset, mutation: Mutations::RequestPasswordReset
    field :reset_password, mutation: Mutations::ResetPassword
    field :delete_account, mutation: Mutations::DeleteAccount
    field :create_invite, mutation: Mutations::CreateInvite
    field :delete_invite, mutation: Mutations::DeleteInvite

    field :create_job_application, mutation: Mutations::CreateJobApplication
    field :update_job_application, mutation: Mutations::UpdateJobApplication
    field :delete_job_application, mutation: Mutations::DeleteJobApplication
    field :move_job_application, mutation: Mutations::MoveJobApplication
    field :let_go_of_job_application, mutation: Mutations::LetGoOfJobApplication

    field :create_stage, mutation: Mutations::CreateStage
    field :update_stage, mutation: Mutations::UpdateStage
    field :delete_stage, mutation: Mutations::DeleteStage
    field :reorder_stages, mutation: Mutations::ReorderStages

    field :log_activity, mutation: Mutations::LogActivity
    field :delete_activity, mutation: Mutations::DeleteActivity
    field :update_time_zone, mutation: Mutations::UpdateTimeZone

    field :create_daily_goal, mutation: Mutations::CreateDailyGoal
    field :update_daily_goal, mutation: Mutations::UpdateDailyGoal
    field :delete_daily_goal, mutation: Mutations::DeleteDailyGoal
    field :reorder_daily_goals, mutation: Mutations::ReorderDailyGoals
    field :create_custom_action, mutation: Mutations::CreateCustomAction
    field :update_custom_action, mutation: Mutations::UpdateCustomAction
    field :delete_custom_action, mutation: Mutations::DeleteCustomAction
    field :dismiss_nudge, mutation: Mutations::DismissNudge

    field :create_story, mutation: Mutations::CreateStory
    field :update_story, mutation: Mutations::UpdateStory
    field :delete_story, mutation: Mutations::DeleteStory
    field :create_question, mutation: Mutations::CreateQuestion
    field :update_question, mutation: Mutations::UpdateQuestion
    field :delete_question, mutation: Mutations::DeleteQuestion
    field :log_practice, mutation: Mutations::LogPractice
    field :update_interview_round, mutation: Mutations::UpdateInterviewRound
    field :set_checklist_item_done, mutation: Mutations::SetChecklistItemDone
    field :add_checklist_item, mutation: Mutations::AddChecklistItem
    field :delete_checklist_item, mutation: Mutations::DeleteChecklistItem
    field :update_checklist_template, mutation: Mutations::UpdateChecklistTemplate
    field :log_study_session, mutation: Mutations::LogStudySession
    field :update_engineering_settings, mutation: Mutations::UpdateEngineeringSettings
    field :refresh_integrations, mutation: Mutations::RefreshIntegrations

    field :import_resume, mutation: Mutations::ImportResume
    field :update_resume, mutation: Mutations::UpdateResume
    field :tailor_resume, mutation: Mutations::TailorResume
    field :duplicate_resume, mutation: Mutations::DuplicateResume
    field :delete_resume, mutation: Mutations::DeleteResume

    field :create_contact, mutation: Mutations::CreateContact
    field :update_contact, mutation: Mutations::UpdateContact
    field :delete_contact, mutation: Mutations::DeleteContact
  end
end
