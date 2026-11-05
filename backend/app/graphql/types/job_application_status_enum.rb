module Types
  class JobApplicationStatusEnum < Types::BaseEnum
    graphql_name "JobApplicationStatus"
    description "Where a job application stands."

    value "SAVED", "Saved to apply later.", value: "saved"
    value "APPLIED", "Application sent.", value: "applied"
    value "INTERVIEWING", "In the interview process.", value: "interviewing"
    value "OFFER", "Received an offer.", value: "offer"
    value "REJECTED", "Heard back with a no.", value: "rejected"
  end
end
