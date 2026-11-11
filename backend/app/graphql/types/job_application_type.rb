module Types
  class JobApplicationType < Types::BaseObject
    description "A job you've saved, applied to, or are interviewing for."

    field :id, ID, null: false
    field :company, String, null: false
    field :role, String, null: false
    field :status, Types::JobApplicationStatusEnum, null: false,
      description: "Always the kind of the column the application is in."
    field :stage, Types::StageType, null: false, description: "The board column the application is in."
    field :position, Int, null: false, description: "Where the card sits in its column. Lower is higher up."
    field :date_applied, GraphQL::Types::ISO8601Date, null: true
    field :posting_url, String, null: true
    field :salary_range, String, null: true
    field :location, String, null: true
    field :work_arrangement, Types::WorkArrangementEnum, null: true
    field :job_description, String, null: true
    field :resume_version, String, null: true, description: "A note about which resume you sent, for resumes kept outside Onward."
    field :resume, Types::ResumeType, null: true, description: "The resume tailored for this application, if there is one."
    field :notes, String, null: true
    field :contacts, [ Types::ContactType ], null: false
    field :interview_rounds, [ Types::InterviewRoundType ], null: false, description: "Oldest first."
    field :next_interview_at, GraphQL::Types::ISO8601DateTime, null: true,
      description: "The soonest scheduled interview that hasn't happened yet."
    field :follow_up_on, GraphQL::Types::ISO8601Date, null: true,
      description: "When to follow up next. Set when the card moves or a follow-up is logged, or by hand."
    field :follow_ups_sent, Int, null: false,
      description: "Follow-ups logged since the card landed in its current kind of column or interview round."
    field :follow_up_step, Types::FollowUpStepEnum, null: true,
      description: "What the next follow-up should be. Null for cards that don't get follow-ups."
    field :follow_up_due, Boolean, null: false,
      description: "Whether followUpOn is today or past, on your clock."
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def stage
      dataload_association(:stage)
    end

    def resume
      dataload_association(:resume)
    end

    def interview_rounds
      object.interview_rounds
    end

    def follow_up_due
      object.follow_up_due?((context[:current_user] || object.user).today)
    end

    def contacts
      object.contacts.order(Arel.sql("LOWER(contacts.name)"))
    end
  end
end
