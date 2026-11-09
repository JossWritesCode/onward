# Follow-up dates: when to check in on an application next, and how many
# follow-ups you've sent since it landed in its current column. Existing
# applications start without a date; it's set the next time a card moves or
# you log a follow-up.
class AddFollowUpDates < ActiveRecord::Migration[8.0]
  def change
    add_column :job_applications, :follow_up_on, :date
    add_column :job_applications, :follow_ups_sent, :integer, null: false, default: 0
    add_index :job_applications, [ :user_id, :follow_up_on ]
  end
end
