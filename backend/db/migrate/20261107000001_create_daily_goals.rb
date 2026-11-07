# Milestone 3b: your own daily goals, custom actions you can log, perfect
# days, and nudges you can dismiss or snooze.
class CreateDailyGoals < ActiveRecord::Migration[8.0]
  def up
    # Things you do that Onward doesn't have a button for, like "Went to a meetup".
    create_table :custom_actions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :category, null: false
      # Deleting an action archives it, so past activity keeps its name.
      t.datetime :archived_at
      t.timestamps
    end

    add_reference :activities, :custom_action, foreign_key: true

    create_table :daily_goals do |t|
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false
      t.integer :target, null: false, default: 1
      t.boolean :weekdays_only, null: false, default: false
      t.references :custom_action, foreign_key: true
      t.integer :position, null: false, default: 0
      t.timestamps
    end
    add_index :daily_goals, [ :user_id, :kind ], unique: true, where: "kind <> 'custom'"
    add_index :daily_goals, :custom_action_id, unique: true, where: "custom_action_id IS NOT NULL",
      name: "index_daily_goals_one_per_custom_action"

    # Days you finished every goal. Saved when it happens, so changing your
    # goals later doesn't rewrite your history.
    create_table :perfect_days do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.date :achieved_on, null: false
      t.timestamps
    end
    add_index :perfect_days, [ :user_id, :achieved_on ], unique: true

    # Nudges you dismissed (hidden_until is null) or snoozed (hidden until that day).
    create_table :nudge_dismissals do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.string :key, null: false
      t.date :hidden_until
      t.timestamps
    end
    add_index :nudge_dismissals, [ :user_id, :key ], unique: true

    # Everyone starts with one goal: apply to 1 job a day.
    execute <<~SQL
      INSERT INTO daily_goals (user_id, kind, target, weekdays_only, position, created_at, updated_at)
      SELECT id, 'applications', 1, false, 0, NOW(), NOW() FROM users
    SQL
  end

  def down
    drop_table :nudge_dismissals
    drop_table :perfect_days
    drop_table :daily_goals
    remove_reference :activities, :custom_action
    drop_table :custom_actions
  end
end
