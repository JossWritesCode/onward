module Types
  class QueryType < Types::BaseObject
    field :me, Types::UserType, null: true, description: "The signed-in person, or null when signed out."
    field :server_settings, Types::ServerSettingsType, null: false, description: "How this server is set up. Works while signed out."
    field :invites, [ Types::InviteType ], null: false, description: "Invite codes you've made, newest first. Admins only."

    field :job_applications, [ Types::JobApplicationType ], null: false,
      description: "Your job applications, most recently updated first." do
      argument :status, Types::JobApplicationStatusEnum, required: false
    end

    field :job_application, Types::JobApplicationType, null: false do
      argument :id, ID, required: true
    end

    field :progress, Types::ProgressType, null: false, description: "Your streak and activity history."

    field :today, Types::TodayType, null: false, description: "Today's goals and nudges."
    field :daily_goals, [ Types::DailyGoalType ], null: false, description: "Your daily goals, in your order."
    field :custom_actions, [ Types::CustomActionType ], null: false, description: "Your custom actions, alphabetically."

    field :stages, [ Types::StageType ], null: false, description: "Your board columns, left to right."

    field :engineering, Types::EngineeringType, null: false,
      description: "LeetCode, GitHub, and study time, for the software engineering track."

    field :stories, [ Types::StoryType ], null: false, description: "Your story bank, most recently edited first."
    field :story, Types::StoryType, null: false do
      argument :id, ID, required: true
    end
    field :questions, [ Types::QuestionType ], null: false, description: "Your question bank, oldest first."
    field :checklist_template, [ Types::ChecklistTemplateItemType ], null: false,
      description: "The checklist every new interview round starts with."
    field :upcoming_interview_rounds, [ Types::InterviewRoundType ], null: false,
      description: "Rounds for applications still in an interview column, soonest first. Unscheduled rounds come last."
    field :study_topics, [ String ], null: false, description: "Topics you've studied, most recent first."

    field :resumes, [ Types::ResumeType ], null: false, description: "Your resumes, most recently edited first."
    field :resume, Types::ResumeType, null: false do
      argument :id, ID, required: true
    end

    field :contacts, [ Types::ContactType ], null: false, description: "Your contacts, alphabetically."

    field :contact, Types::ContactType, null: false do
      argument :id, ID, required: true
    end

    def me
      context[:current_user]
    end

    def server_settings
      {}
    end

    def invites
      user = current_user!
      return [] unless user.admin?

      user.invites.includes(:used_by).order(created_at: :desc)
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

    def today
      goals = DailyGoals.for(current_user!)
      goals.record!
      goals
    end

    def daily_goals
      current_user!.daily_goals
    end

    def custom_actions
      current_user!.custom_actions.active.order(Arel.sql("LOWER(name)"))
    end

    def stages
      current_user!.stages
    end

    def engineering
      current_user!
    end

    def resumes
      current_user!.resumes.recent_first
    end

    def resume(id:)
      current_user!.resumes.find(id)
    end

    def stories
      current_user!.stories.order(updated_at: :desc)
    end

    def story(id:)
      current_user!.stories.find(id)
    end

    def questions
      current_user!.questions.order(:created_at, :id)
    end

    def checklist_template
      current_user!.checklist_template_items
    end

    def upcoming_interview_rounds
      InterviewRound
        .joins(:job_application)
        .where(job_applications: { user_id: current_user!.id, status: "interviewing" })
        .order(Arel.sql("interview_rounds.scheduled_at ASC NULLS LAST, interview_rounds.created_at DESC"))
    end

    def study_topics
      current_user!.study_sessions.group(:topic).order(Arel.sql("MAX(created_at) DESC")).limit(20).pluck(:topic)
    end

    def contacts
      current_user!.contacts.order(Arel.sql("LOWER(name)"))
    end

    def contact(id:)
      current_user!.contacts.find(id)
    end
  end
end
