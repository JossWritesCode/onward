module Types
  class ActivityKindEnum < Types::BaseEnum
    graphql_name "ActivityKind"
    description "Something you did for your job hunt."

    value "APPLICATION_SENT", "Sent an application. Recorded from the board.", value: "application_sent"
    value "INTERVIEW", "Landed an interview. Recorded from the board.", value: "interview"
    value "OFFER", "Got an offer. Recorded from the board.", value: "offer"
    value "REJECTION", "Heard back with a no. Recorded from the board.", value: "rejection"
    value "NETWORKING_MESSAGE", "Sent a networking message.", value: "networking_message"
    value "COFFEE_CHAT", "Had a coffee chat or informational interview.", value: "coffee_chat"
    value "FOLLOW_UP", "Followed up on an application or conversation.", value: "follow_up"
    value "TAILORED_MATERIALS", "Tailored a resume or cover letter.", value: "tailored_materials"
    value "INTERVIEW_PRACTICE", "Practiced answering an interview question.", value: "interview_practice"
    value "INTERVIEW_PREPPED", "Finished an interview round's prep checklist.", value: "interview_prepped"
    value "STUDY_SESSION", "Finished a study session.", value: "study_session"
    value "LEETCODE", "Submitted LeetCode solutions that day. Synced from LeetCode.", value: "leetcode"
  end
end
