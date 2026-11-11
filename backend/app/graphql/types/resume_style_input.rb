module Types
  class ResumeStyleInput < Types::BaseInputObject
    description "Changes to how a resume looks. Values outside the allowed range are brought back into it."

    argument :font_size, Float, required: false, description: "Body text size in points, 8.5 to 11."
    argument :line_height, Float, required: false, description: "Line spacing, 1.15 to 1.6 times the text size."
    argument :margin, Float, required: false, description: "Page margins in inches, 0.4 to 1."
    argument :section_gap, Float, required: false, description: "Space above each section heading in points, 4 to 20."
    argument :accent, String, required: false, description: "Accent colour as a hex string, like \"#4f46e5\"."
  end
end
