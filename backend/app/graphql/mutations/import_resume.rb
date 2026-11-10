module Mutations
  class ImportResume < BaseMutation
    description "Saves a new resume from JSON an AI wrote using Onward's prompt. Small slips are forgiven. If it can't be read, nothing is saved and the error says where it broke."

    argument :text, String, required: true

    field :resume, Types::ResumeType, null: true
    field :filled_fields, [ String ], null: false,
      description: "Contact fields the paste left blank that were copied from your most recent resume."
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(text:)
      resume, problems, filled = Resume.import(current_user!, text)
      { resume:, filled_fields: filled, errors: problems.map { |message| { field: "text", message: } } }
    end
  end
end
