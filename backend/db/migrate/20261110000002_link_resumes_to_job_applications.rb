# A resume linked to a job application is "tailored" for it. One without a
# link is a base resume. Each application has at most one tailored resume.
class LinkResumesToJobApplications < ActiveRecord::Migration[8.0]
  def change
    change_table :resumes do |t|
      # Deleting the application keeps the resume, as a base resume.
      t.references :job_application, null: true, index: { unique: true }, foreign_key: { on_delete: :nullify }
      # The resume this one was copied from when it was tailored.
      t.references :based_on, null: true, foreign_key: { to_table: :resumes, on_delete: :nullify }
    end
  end
end
