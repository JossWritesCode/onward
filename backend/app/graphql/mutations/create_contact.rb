module Mutations
  class CreateContact < BaseMutation
    description "Adds a contact."

    argument :input, Types::ContactInput, required: true

    field :contact, Types::ContactType, null: true
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      user = current_user!
      attributes = input.to_h
      job_application_ids = attributes.delete(:job_application_ids)

      contact = user.contacts.new(attributes)
      contact.job_applications = user.job_applications.where(id: job_application_ids) unless job_application_ids.nil?

      if contact.save
        { contact:, errors: [] }
      else
        { contact: nil, errors: errors_for(contact) }
      end
    end
  end
end
