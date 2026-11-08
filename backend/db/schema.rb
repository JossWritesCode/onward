# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_08_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activities", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "job_application_id"
    t.bigint "contact_id"
    t.string "kind", null: false
    t.string "category", null: false
    t.date "occurred_on", null: false
    t.text "note"
    t.boolean "automatic", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "custom_action_id"
    t.index ["contact_id"], name: "index_activities_on_contact_id"
    t.index ["custom_action_id"], name: "index_activities_on_custom_action_id"
    t.index ["job_application_id", "kind"], name: "index_activities_once_per_application_and_kind", unique: true, where: "(automatic AND ((kind)::text = ANY (ARRAY[('application_sent'::character varying)::text, ('interview'::character varying)::text, ('offer'::character varying)::text, ('rejection'::character varying)::text])))"
    t.index ["job_application_id"], name: "index_activities_on_job_application_id"
    t.index ["user_id", "occurred_on"], name: "index_activities_on_user_id_and_occurred_on"
    t.index ["user_id", "occurred_on"], name: "index_activities_one_leetcode_day", unique: true, where: "((kind)::text = 'leetcode'::text)"
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "checklist_items", force: :cascade do |t|
    t.bigint "interview_round_id", null: false
    t.string "text", null: false
    t.boolean "done", default: false, null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["interview_round_id"], name: "index_checklist_items_on_interview_round_id"
  end

  create_table "checklist_template_items", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "text", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_checklist_template_items_on_user_id"
  end

  create_table "contacts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "title"
    t.string "company"
    t.string "email"
    t.string "phone"
    t.string "linkedin_url"
    t.date "last_contacted_on"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_contacts_on_user_id"
  end

  create_table "custom_actions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "category", null: false
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_custom_actions_on_user_id"
  end

  create_table "daily_goals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "kind", null: false
    t.integer "target", default: 1, null: false
    t.boolean "weekdays_only", default: false, null: false
    t.bigint "custom_action_id"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["custom_action_id"], name: "index_daily_goals_on_custom_action_id"
    t.index ["custom_action_id"], name: "index_daily_goals_one_per_custom_action", unique: true, where: "(custom_action_id IS NOT NULL)"
    t.index ["user_id", "kind"], name: "index_daily_goals_on_user_id_and_kind", unique: true, where: "((kind)::text <> 'custom'::text)"
    t.index ["user_id"], name: "index_daily_goals_on_user_id"
  end

  create_table "integration_snapshots", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "provider", null: false
    t.jsonb "data", default: {}, null: false
    t.string "error"
    t.datetime "fetched_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "provider"], name: "index_integration_snapshots_on_user_id_and_provider", unique: true
    t.index ["user_id"], name: "index_integration_snapshots_on_user_id"
  end

  create_table "interview_rounds", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.bigint "stage_id"
    t.string "name", null: false
    t.datetime "scheduled_at"
    t.datetime "prepped_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id", "stage_id"], name: "index_interview_rounds_on_job_application_id_and_stage_id", unique: true
    t.index ["job_application_id"], name: "index_interview_rounds_on_job_application_id"
    t.index ["stage_id"], name: "index_interview_rounds_on_stage_id"
  end

  create_table "invites", force: :cascade do |t|
    t.bigint "created_by_id", null: false
    t.bigint "used_by_id"
    t.string "code", null: false
    t.string "note"
    t.datetime "used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_invites_on_code", unique: true
    t.index ["created_by_id"], name: "index_invites_on_created_by_id"
    t.index ["used_by_id"], name: "index_invites_on_used_by_id"
  end

  create_table "job_application_contacts", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.bigint "contact_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["contact_id"], name: "index_job_application_contacts_on_contact_id"
    t.index ["job_application_id", "contact_id"], name: "index_job_application_contacts_uniqueness", unique: true
    t.index ["job_application_id"], name: "index_job_application_contacts_on_job_application_id"
  end

  create_table "job_applications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "company", null: false
    t.string "role", null: false
    t.string "status", default: "saved", null: false
    t.date "date_applied"
    t.string "posting_url"
    t.string "salary_range"
    t.string "location"
    t.string "work_arrangement"
    t.text "job_description"
    t.string "resume_version"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "stage_id", null: false
    t.integer "position", default: 0, null: false
    t.index ["stage_id"], name: "index_job_applications_on_stage_id"
    t.index ["user_id", "status"], name: "index_job_applications_on_user_id_and_status"
    t.index ["user_id"], name: "index_job_applications_on_user_id"
  end

  create_table "nudge_dismissals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "key", null: false
    t.date "hidden_until"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "key"], name: "index_nudge_dismissals_on_user_id_and_key", unique: true
  end

  create_table "perfect_days", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "achieved_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "achieved_on"], name: "index_perfect_days_on_user_id_and_achieved_on", unique: true
  end

  create_table "practices", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "question_id"
    t.bigint "story_id"
    t.string "rating", null: false
    t.integer "seconds"
    t.date "practiced_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id"], name: "index_practices_on_question_id"
    t.index ["story_id"], name: "index_practices_on_story_id"
    t.index ["user_id"], name: "index_practices_on_user_id"
  end

  create_table "questions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "prompt", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_questions_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "stages", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "kind", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "position"], name: "index_stages_on_user_id_and_position"
    t.index ["user_id"], name: "index_stages_on_user_id"
  end

  create_table "stories", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "situation"
    t.text "task"
    t.text "action"
    t.text "result"
    t.string "tags", default: [], null: false, array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_stories_on_user_id"
  end

  create_table "study_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "topic", null: false
    t.integer "minutes", null: false
    t.date "studied_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_study_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "time_zone", default: "UTC", null: false
    t.boolean "engineering_track", default: false, null: false
    t.string "leetcode_username"
    t.date "leetcode_counts_from"
    t.string "github_username"
    t.text "github_token"
    t.boolean "admin", default: false, null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "activities", "contacts", on_delete: :nullify
  add_foreign_key "activities", "custom_actions"
  add_foreign_key "activities", "job_applications", on_delete: :nullify
  add_foreign_key "activities", "users"
  add_foreign_key "checklist_items", "interview_rounds", on_delete: :cascade
  add_foreign_key "checklist_template_items", "users"
  add_foreign_key "contacts", "users"
  add_foreign_key "custom_actions", "users"
  add_foreign_key "daily_goals", "custom_actions"
  add_foreign_key "daily_goals", "users"
  add_foreign_key "integration_snapshots", "users"
  add_foreign_key "interview_rounds", "job_applications", on_delete: :cascade
  add_foreign_key "interview_rounds", "stages", on_delete: :nullify
  add_foreign_key "invites", "users", column: "created_by_id", on_delete: :cascade
  add_foreign_key "invites", "users", column: "used_by_id", on_delete: :nullify
  add_foreign_key "job_application_contacts", "contacts"
  add_foreign_key "job_application_contacts", "job_applications"
  add_foreign_key "job_applications", "stages"
  add_foreign_key "job_applications", "users"
  add_foreign_key "nudge_dismissals", "users"
  add_foreign_key "perfect_days", "users"
  add_foreign_key "practices", "questions", on_delete: :nullify
  add_foreign_key "practices", "stories", on_delete: :nullify
  add_foreign_key "practices", "users"
  add_foreign_key "questions", "users"
  add_foreign_key "sessions", "users"
  add_foreign_key "stages", "users"
  add_foreign_key "stories", "users"
  add_foreign_key "study_sessions", "users"
end
