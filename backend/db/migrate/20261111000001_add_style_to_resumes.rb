# How a resume looks: text size, line spacing, margins, section spacing, and
# an accent colour. Each resume has its own, so a tailored copy can be
# tightened for one job. Missing keys fall back to ResumeStyle::DEFAULTS.
class AddStyleToResumes < ActiveRecord::Migration[8.0]
  def change
    add_column :resumes, :style, :jsonb, null: false, default: {}
  end
end
