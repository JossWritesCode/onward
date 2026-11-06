# The optional software engineering track: LeetCode and GitHub activity on the
# Prep page, with LeetCode practice counting toward your streak.
class AddEngineeringTrack < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :engineering_track, :boolean, null: false, default: false
    add_column :users, :leetcode_username, :string
    # LeetCode days count toward your streak from the day you connect, not before.
    add_column :users, :leetcode_counts_from, :date
    add_column :users, :github_username, :string
    # Encrypted with Active Record encryption (see config/application.rb).
    add_column :users, :github_token, :text

    # The latest data fetched from LeetCode or GitHub, so the app doesn't ask
    # them on every page load.
    create_table :integration_snapshots do |t|
      t.references :user, null: false, foreign_key: true
      t.string :provider, null: false
      t.jsonb :data, null: false, default: {}
      t.string :error
      t.datetime :fetched_at
      t.timestamps
    end
    add_index :integration_snapshots, [ :user_id, :provider ], unique: true

    # One LeetCode activity per day at most.
    add_index :activities, [ :user_id, :occurred_on ],
      unique: true, where: "kind = 'leetcode'", name: "index_activities_one_leetcode_day"
  end
end
