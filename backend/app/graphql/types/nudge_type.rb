module Types
  # Built on a Nudges::Nudge.
  class NudgeType < Types::BaseObject
    description "A gentle reminder about something that might need you."

    field :key, String, null: false, description: "Pass this to dismissNudge."
    field :kind, Types::NudgeKindEnum, null: false
    field :since, GraphQL::Types::ISO8601Date, null: true,
      description: "For quiet applications and contacts: the last day anything happened."
    field :job_application, Types::JobApplicationType, null: true
    field :contact, Types::ContactType, null: true
    field :interview_round, Types::InterviewRoundType, null: true
  end
end
