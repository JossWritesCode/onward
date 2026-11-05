module Mutations
  class UpdateContact < BaseMutation
    description "Changes a contact."

    argument :id, ID, required: true
    argument :input, Types::ContactInput, required: true

    field :contact, Types::ContactType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, input:)
      user = current_user!
      contact = user.contacts.find(id)
      attributes = input.to_h
      job_application_ids = attributes.delete(:job_application_ids)

      saved = Contact.transaction do
        contact.assign_attributes(attributes)
        contact.job_applications = user.job_applications.where(id: job_application_ids) unless job_application_ids.nil?
        contact.save || raise(ActiveRecord::Rollback)
      end

      if saved
        { contact: contact.reload, errors: [] }
      else
        { contact: nil, errors: errors_for(contact) }
      end
    end
  end
end
