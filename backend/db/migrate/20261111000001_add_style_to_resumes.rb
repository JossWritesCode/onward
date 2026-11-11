# How a resume looks: text size, line spacing, margins, section spacing, and
# an accent colour. Each resume has its own, so a tailored copy can be
# tightened for one job. Missing keys fall back to ResumeStyle::DEFAULTS.
class AddStyleToResumes < ActiveRecord::Migration[8.0]
  def up
    add_column :resumes, :style, :jsonb, null: false, default: {}
    # Resumes from before this have the Normal look spelled out, like new ones.
    execute "UPDATE resumes SET style = '#{ResumeStyle::DEFAULTS.to_json}'::jsonb"
  end

  def down
    remove_column :resumes, :style
  end
end
