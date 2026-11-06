# Adds board columns ("stages"). Each user gets a default set, and existing
# applications are placed in the column that matches their current status.
class CreateStages < ActiveRecord::Migration[8.0]
  DEFAULT_STAGES = [
    [ "Saved", "saved" ],
    [ "Applied", "applied" ],
    [ "Phone screen", "interviewing" ],
    [ "Interviewing", "interviewing" ],
    [ "Offer", "offer" ],
    [ "Rejected", "rejected" ]
  ].freeze

  STAGE_FOR_STATUS = {
    "saved" => "Saved",
    "applied" => "Applied",
    "interviewing" => "Interviewing",
    "offer" => "Offer",
    "rejected" => "Rejected"
  }.freeze

  # Minimal stand-ins so this migration keeps working even if the real models change later.
  class MigrationStage < ActiveRecord::Base
    self.table_name = "stages"
  end

  class MigrationJobApplication < ActiveRecord::Base
    self.table_name = "job_applications"
  end

  def up
    create_table :stages do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :kind, null: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end
    add_index :stages, [ :user_id, :position ]

    add_reference :job_applications, :stage, foreign_key: true
    add_column :job_applications, :position, :integer, null: false, default: 0

    MigrationStage.reset_column_information
    MigrationJobApplication.reset_column_information

    select_values("SELECT id FROM users").each do |user_id|
      stage_ids = DEFAULT_STAGES.each_with_index.to_h do |(name, kind), index|
        [ name, MigrationStage.create!(user_id:, name:, kind:, position: index).id ]
      end

      MigrationJobApplication.where(user_id:).order(updated_at: :desc).each_with_index do |application, index|
        stage_name = STAGE_FOR_STATUS.fetch(application.status, "Saved")
        application.update_columns(stage_id: stage_ids.fetch(stage_name), position: index)
      end
    end

    change_column_null :job_applications, :stage_id, false
  end

  def down
    remove_reference :job_applications, :stage, foreign_key: true
    remove_column :job_applications, :position
    drop_table :stages
  end
end
