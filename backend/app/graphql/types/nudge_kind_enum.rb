module Types
  class NudgeKindEnum < Types::BaseEnum
    graphql_name "NudgeKind"
    description "What a nudge is about."

    value "INTERVIEW_PREP", "An interview in the next 2 days whose prep checklist isn't done.", value: "interview_prep"
    value "FOLLOW_UP", "An application whose follow-up date is today or past. See jobApplication.followUpStep.", value: "follow_up"
    value "QUIET_APPLICATION", "An application with no change in 2 weeks.", value: "quiet_application"
    value "QUIET_CONTACT", "Someone you haven't talked to in 3 weeks.", value: "quiet_contact"
  end
end
