# Interview prep: your story bank, a question bank to practice with, a
# checklist for each interview round, and study sessions.
class CreateInterviewPrep < ActiveRecord::Migration[8.0]
  STARTER_QUESTIONS = [
    "Tell me about a time you faced a difficult challenge at work. How did you handle it?",
    "Describe a time you disagreed with a teammate or manager. What happened?",
    "Tell me about a project you're proud of.",
    "Tell me about a time you made a mistake. What did you learn?",
    "Describe a time you had to learn something new quickly.",
    "Tell me about a time you took the lead on something.",
    "Describe a situation where you had to meet a tight deadline.",
    "Tell me about a time you received critical feedback. How did you respond?",
    "Give an example of a time you went above and beyond.",
    "Tell me about a time you worked with someone who was difficult to work with.",
    "Describe a time you had to make a decision without all the information.",
    "Tell me about a time something you worked on failed.",
    "Describe a time you improved a process or made something more efficient.",
    "Tell me about a time you had to persuade someone to see things your way.",
    "Tell me about a time you juggled several priorities at once."
  ].freeze

  STARTER_CHECKLIST = [
    "Research the company and what it makes",
    "Reread the job description",
    "Rehearse two stories from your story bank",
    "Write three questions to ask them",
    "Plan the logistics (or test your video setup)"
  ].freeze

  class MigrationRecord < ActiveRecord::Base
    self.abstract_class = true
  end

  class MigrationQuestion < MigrationRecord
    self.table_name = "questions"
  end

  class MigrationTemplateItem < MigrationRecord
    self.table_name = "checklist_template_items"
  end

  class MigrationRound < MigrationRecord
    self.table_name = "interview_rounds"
  end

  class MigrationChecklistItem < MigrationRecord
    self.table_name = "checklist_items"
  end

  def up
    create_table :stories do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :situation
      t.text :task
      t.text :action
      t.text :result
      t.string :tags, array: true, null: false, default: []
      t.timestamps
    end

    create_table :questions do |t|
      t.references :user, null: false, foreign_key: true
      t.text :prompt, null: false
      t.timestamps
    end

    create_table :practices do |t|
      t.references :user, null: false, foreign_key: true
      t.references :question, foreign_key: { on_delete: :nullify }
      t.references :story, foreign_key: { on_delete: :nullify }
      t.string :rating, null: false
      t.integer :seconds
      t.date :practiced_on, null: false
      t.timestamps
    end

    create_table :checklist_template_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :text, null: false
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    create_table :interview_rounds do |t|
      t.references :job_application, null: false, foreign_key: { on_delete: :cascade }
      t.references :stage, foreign_key: { on_delete: :nullify }
      t.string :name, null: false
      t.datetime :scheduled_at
      t.datetime :prepped_at
      t.timestamps
    end
    add_index :interview_rounds, [ :job_application_id, :stage_id ], unique: true

    create_table :checklist_items do |t|
      t.references :interview_round, null: false, foreign_key: { on_delete: :cascade }
      t.string :text, null: false
      t.boolean :done, null: false, default: false
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    create_table :study_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :topic, null: false
      t.integer :minutes, null: false
      t.date :studied_on, null: false
      t.timestamps
    end

    # Board activity counts once per application and stage type. Prep activity
    # (practice, study sessions, finished checklists) can happen many times.
    remove_index :activities, name: "index_activities_once_per_application_and_kind"
    add_index :activities, [ :job_application_id, :kind ],
      unique: true,
      where: "automatic AND kind IN ('application_sent', 'interview', 'offer', 'rejection')",
      name: "index_activities_once_per_application_and_kind"

    backfill
  end

  def down
    remove_index :activities, name: "index_activities_once_per_application_and_kind"
    add_index :activities, [ :job_application_id, :kind ],
      unique: true, where: "automatic", name: "index_activities_once_per_application_and_kind"

    drop_table :study_sessions
    drop_table :checklist_items
    drop_table :interview_rounds
    drop_table :checklist_template_items
    drop_table :practices
    drop_table :questions
    drop_table :stories
  end

  private

  # Existing accounts get the starter questions and checklist, and applications
  # already in an interview column get a checklist for that round.
  def backfill
    [ MigrationQuestion, MigrationTemplateItem, MigrationRound, MigrationChecklistItem ].each(&:reset_column_information)

    select_values("SELECT id FROM users").each do |user_id|
      STARTER_QUESTIONS.each { |prompt| MigrationQuestion.create!(user_id:, prompt:) }
      STARTER_CHECKLIST.each_with_index { |text, position| MigrationTemplateItem.create!(user_id:, text:, position:) }
    end

    select_rows(<<~SQL).each do |job_application_id, stage_id, stage_name, user_id|
      SELECT job_applications.id, stages.id, stages.name, job_applications.user_id
      FROM job_applications
      JOIN stages ON stages.id = job_applications.stage_id
      WHERE stages.kind = 'interviewing'
    SQL
      round = MigrationRound.create!(job_application_id:, stage_id:, name: stage_name)
      MigrationTemplateItem.where(user_id:).order(:position).each do |item|
        MigrationChecklistItem.create!(interview_round_id: round.id, text: item.text, position: item.position)
      end
    end
  end
end
