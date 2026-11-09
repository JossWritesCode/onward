module Types
  class FollowUpStepEnum < Types::BaseEnum
    graphql_name "FollowUpStep"
    description "What an application's next follow-up should be."

    value "FOLLOW_UP", "Check in on an application you sent.", value: "follow_up"
    value "THANK_YOU", "Send a thank-you note after an interview.", value: "thank_you"
    value "CHECK_IN", "Check in after an interview.", value: "check_in"
    value "LAST_NOTE", "Send a last gracious note.", value: "last_note"
    value "LET_GO", "Time to think about letting this one go.", value: "let_go"
  end
end
