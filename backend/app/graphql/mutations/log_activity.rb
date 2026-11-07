module Mutations
  class LogActivity < BaseMutation
    description "Logs something you did today, like a networking message, a coffee chat, or one of your custom actions."

    argument :kind, Types::ActivityKindEnum, required: true
    argument :job_application_id, ID, required: false
    argument :contact_id, ID, required: false
    argument :custom_action_id, ID, required: false, description: "Required when kind is CUSTOM."
    argument :note, String, required: false

    field :activity, Types::ActivityType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(kind:, job_application_id: nil, contact_id: nil, custom_action_id: nil, note: nil)
      user = current_user!

      unless Activity::LOGGABLE_KINDS.include?(kind)
        return { activity: nil, errors: [ { field: "kind", message: "That one is recorded from the board automatically." } ] }
      end

      activity = user.activities.new(
        kind:,
        note:,
        job_application: job_application_id.present? ? user.job_applications.find(job_application_id) : nil,
        contact: contact_id.present? ? user.contacts.find(contact_id) : nil,
        custom_action: kind == "custom" && custom_action_id.present? ? user.custom_actions.active.find(custom_action_id) : nil
      )

      if activity.save
        { activity:, errors: [] }
      else
        { activity: nil, errors: errors_for(activity) }
      end
    end
  end
end
