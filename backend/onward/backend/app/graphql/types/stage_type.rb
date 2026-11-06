module Types
  class StageType < Types::BaseObject
    description "A column on your job board, like \"Phone screen\"."

    field :id, ID, null: false
    field :name, String, null: false
    field :kind, Types::JobApplicationStatusEnum, null: false,
      description: "What this column means. Applications in it get this status."
    field :position, Int, null: false, description: "Where the column sits on the board, starting at 0."
    field :job_applications, [ Types::JobApplicationType ], null: false,
      description: "The cards in this column, top to bottom."

    def job_applications
      dataload_association(:job_applications)
    end
  end
end
