# A short history of where a card has been dragged in the last day, so a
# mistaken move can be taken back when the card is moved to an earlier column:
# the activity it recorded, the prep checklist it started, and the follow-up
# date it replaced. See "Taking back a mistaken move" in JobApplication.
class AddRecentMovesToJobApplications < ActiveRecord::Migration[8.0]
  def change
    add_column :job_applications, :recent_moves, :jsonb, null: false, default: []
  end
end
