# Milestone 4: invite codes, so friends can join a hosted Onward without
# opening sign-ups to everyone.
class AddInvites < ActiveRecord::Migration[8.0]
  def up
    # Admins can make invite codes. The first account on a server is the admin.
    add_column :users, :admin, :boolean, null: false, default: false
    execute "UPDATE users SET admin = true WHERE id = (SELECT MIN(id) FROM users)"

    create_table :invites do |t|
      t.references :created_by, null: false, foreign_key: { to_table: :users, on_delete: :cascade }
      t.references :used_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string :code, null: false
      t.string :note
      t.datetime :used_at
      t.timestamps
    end
    add_index :invites, :code, unique: true
  end

  def down
    drop_table :invites
    remove_column :users, :admin
  end
end
