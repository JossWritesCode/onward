# Resumes: pasted in as JSON an AI wrote from Onward's prompt, edited in a
# form, and turned into a PDF in the browser.
class CreateResumes < ActiveRecord::Migration[8.0]
  def change
    create_table :resumes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :template, null: false, default: "classic"
      t.string :page_size, null: false, default: "letter"
      # The resume itself, in the shape ResumeContent describes.
      t.jsonb :content, null: false, default: {}
      # Exactly what was pasted, kept in case the import misread something.
      t.text :source_text
      t.timestamps
    end
  end
end
