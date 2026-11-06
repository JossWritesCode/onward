class CreateContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :contacts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :title
      t.string :company
      t.string :email
      t.string :phone
      t.string :linkedin_url
      t.date :last_contacted_on
      t.text :notes

      t.timestamps
    end
  end
end
