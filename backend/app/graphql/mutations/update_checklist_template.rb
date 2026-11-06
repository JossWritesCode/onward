module Mutations
  class UpdateChecklistTemplate < BaseMutation
    description "Replaces the checklist new interview rounds start with. Existing rounds keep theirs."

    argument :items, [ String ], required: true, description: "Every line, in order. Blank lines are skipped."

    field :items, [ Types::ChecklistTemplateItemType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(items:)
      user = current_user!
      lines = items.map(&:strip).compact_blank

      if lines.size > 30
        return { items: user.checklist_template_items, errors: [ { field: "items", message: "Keep it to 30 steps or fewer." } ] }
      end
      if (too_long = lines.find { |line| line.length > 200 })
        return { items: user.checklist_template_items, errors: [ { field: "items", message: "\"#{too_long.first(40)}…\" is too long. Keep each step under 200 characters." } ] }
      end

      ChecklistTemplateItem.transaction do
        user.checklist_template_items.delete_all
        lines.each_with_index { |text, position| user.checklist_template_items.create!(text:, position:) }
      end

      { items: user.checklist_template_items.reload, errors: [] }
    end
  end
end
