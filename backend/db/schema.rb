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

ActiveRecord::Schema[8.1].define(version: 2026_11_06_000002) do
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
    t.index ["contact_id"], name: "index_activities_on_contact_id"
    t.index ["job_application_id", "kind"], name: "index_activities_once_per_application_and_kind", unique: true, where: "automatic"
    t.index ["job_application_id"], name: "index_activities_on_job_application_id"
    t.index ["user_id", "occurred_on"], name: "index_activities_on_user_id_and_occurred_on"
    t.index ["user_id"], name: "index_activities_on_user_id"
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

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "time_zone", default: "UTC", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "activities", "contacts", on_delete: :nullify
  add_foreign_key "activities", "job_applications", on_delete: :nullify
  add_foreign_key "activities", "users"
  add_foreign_key "contacts", "users"
  add_foreign_key "job_application_contacts", "contacts"
  add_foreign_key "job_application_contacts", "job_applications"
  add_foreign_key "job_applications", "stages"
  add_foreign_key "job_applications", "users"
  add_foreign_key "sessions", "users"
  add_foreign_key "stages", "users"
end
