# Activities are the things you did on a given day: sending an application,
# landing an interview, a coffee chat. They power the streak, the heat map,
# and the weekly recap.
class CreateActivities < ActiveRecord::Migration[8.0]
  def change
    # Days (and so streaks) follow your own clock, not the server's.
    add_column :users, :time_zone, :string, null: false, default: "UTC"

    create_table :activities do |t|
      t.references :user, null: false, foreign_key: true
      t.references :job_application, foreign_key: { on_delete: :nullify }
      t.references :contact, foreign_key: { on_delete: :nullify }
      t.string :kind, null: false
      t.string :category, null: false
      t.date :occurred_on, null: false
      t.text :note
      # True when it came from moving a card on the board, false when you logged it yourself.
      t.boolean :automatic, null: false, default: false

      t.timestamps
    end

    add_index :activities, [ :user_id, :occurred_on ]
    # Each application counts once for reaching each stage type, so dragging a
    # card back and forth doesn't add up.
    add_index :activities, [ :job_application_id, :kind ],
      unique: true, where: "automatic", name: "index_activities_once_per_application_and_kind"
  end
end
