module Types
  class SignupModeEnum < Types::BaseEnum
    graphql_name "SignupMode"
    description "Who can create an account on this server."

    value "OPEN", "Anyone.", value: "open"
    value "INVITE", "Only people with an invite code.", value: "invite"
  end
end
