module Types
  class ResumeStyleType < Types::BaseObject
    description "How a resume looks, apart from its template. Each resume has its own."

    field :font_size, Float, null: false, description: "Body text size, in points."
    field :line_height, Float, null: false, description: "Line spacing, as a multiple of the text size."
    field :margin, Float, null: false, description: "Page margins, in inches."
    field :section_gap, Float, null: false, description: "Space above each section heading, in points."
    field :accent, String, null: false, description: "Accent colour as a hex string. Only the Modern template uses it."

    def font_size = object["fontSize"]
    def line_height = object["lineHeight"]
    def section_gap = object["sectionGap"]
  end
end
