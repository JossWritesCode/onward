class CreateJobApplicationContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :job_application_contacts do |t|
      t.references :job_application, null: false, foreign_key: true
      t.references :contact, null: false, foreign_key: true

      t.timestamps
    end

    add_index :job_application_contacts, [ :job_application_id, :contact_id ],
      unique: true, name: "index_job_application_contacts_uniqueness"
  end
end
