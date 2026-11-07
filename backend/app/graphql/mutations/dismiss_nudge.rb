module Mutations
  class DismissNudge < BaseMutation
    description "Hides a nudge. Snoozing hides it for a week; dismissing hides it until things change."

    argument :key, String, required: true
    argument :snooze, Boolean, required: false, default_value: false

    field :key, String, null: false

    def resolve(key:, snooze:)
      user = current_user!
      dismissal = user.nudge_dismissals.find_or_initialize_by(key: key.to_s.first(100))
      dismissal.update!(hidden_until: snooze ? user.today + NudgeDismissal::SNOOZE_DAYS : nil)
      { key: }
    end
  end
end
