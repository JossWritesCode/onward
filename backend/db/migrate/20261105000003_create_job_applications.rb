class CreateJobApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :job_applications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :company, null: false
      t.string :role, null: false
      t.string :status, null: false, default: "saved"
      t.date :date_applied
      t.string :posting_url
      t.string :salary_range
      t.string :location
      t.string :work_arrangement
      t.text :job_description
      t.string :resume_version
      t.text :notes

      t.timestamps
    end

    add_index :job_applications, [ :user_id, :status ]
  end
end
