# The accounts the end-to-end tests in frontend/e2e sign in as.
#
# Each spec file signs in as its own account, named for the file, so files can
# run side by side without moving each other's cards. Every account starts the
# same: the default columns, three applications, and one resume. Nothing has
# happened in the last few days, so the streak starts at zero. Dates count from
# today on the account's own clock, so the follow-up that's due is due whenever
# the tests run.
#
# `bin/rails e2e:seed` (run by bin/e2e) creates them all in an empty database.
# Before every test, the tests ask E2eResetsController to rebuild that test's
# account, so each test, and each retry of a failed test, starts from here
# rather than from whatever the test before it left behind.
#
# All of this only ever runs against a test database whose name ends in _e2e.
module E2eAccounts
  ACCOUNTS = %w[
    auth
    applications
    board
    columns
    resume-preview
    resume-import
    log-win
    follow-up
    interview-prep
    undo-move
    tailor-resume
  ].freeze
  PASSWORD = "password123"

  RESUME = {
    "name" => "Dana Whitfield",
    "title" => "Frontend Developer",
    "location" => "Halifax, NS, Canada",
    "phone" => "+1 902 555 0142",
    "email" => "dana.whitfield@example.com",
    "links" => [ "linkedin.com/in/danawhitfield", "github.com/danawhitfield" ],
    "summary" => "Frontend developer with five years of experience building accessible, fast web apps in React and TypeScript.",
    "skills" => [
      { "label" => "Languages", "items" => %w[JavaScript TypeScript Ruby SQL] }
    ],
    "experience" => [
      {
        "title" => "Frontend Developer", "company" => "Tidewater Apps", "location" => "Remote",
        "start" => "2022-08", "end" => "Present",
        "bullets" => [ "Rebuilt the booking flow in React and TypeScript, cutting drop-off at checkout by 18%." ]
      }
    ],
    "education" => [
      { "school" => "Dalhousie University", "degree" => "Bachelor of Computer Science", "date" => "2019-05", "honors" => "" }
    ],
    "sections" => []
  }.freeze

  module_function

  # True only in the test environment, on a database whose name ends in _e2e,
  # since these methods delete and rebuild accounts.
  def enabled?
    Rails.env.test? && database.end_with?("_e2e")
  end

  def database
    ActiveRecord::Base.connection_db_config.database.to_s
  end

  def email_for(name)
    "#{name}@e2e.onward.test"
  end

  def seed_all
    ACCOUNTS.each { |name| seed(name) }
  end

  # Deletes the account if it's there, then builds it again from scratch.
  def reset(name)
    raise ArgumentError, "No end-to-end account called #{name.inspect}" unless ACCOUNTS.include?(name)

    User.transaction do
      User.find_by(email_address: email_for(name))&.destroy!
      seed(name)
    end
  end

  def seed(name)
    user = User.create!(email_address: email_for(name), password: PASSWORD, time_zone: "America/Toronto")
    today = user.today

    user.job_applications.create!(company: "Maple & Co", role: "Junior Software Developer", status: "saved", location: "Ottawa, ON")
    brightline = user.job_applications.create!(company: "Brightline", role: "Frontend Developer", status: "applied", date_applied: today - 10)
    northwind = user.job_applications.create!(company: "Northwind Labs", role: "Full Stack Engineer", status: "applied", date_applied: today - 3)

    # One follow-up due today, one coming up.
    brightline.update_columns(follow_up_on: today, follow_ups_sent: 0)
    northwind.update_columns(follow_up_on: today + 5, follow_ups_sent: 0)

    user.resumes.create!(title: "Frontend v3", content: RESUME)

    # Creating applied cards logs "sent an application" for today, as moving a
    # card would. These cards were sent days ago, so date their activity then:
    # each account starts with no streak and today's goal not yet done (a done
    # goal folds the Today strip and hides its nudges). They also haven't been
    # moved lately, so there's no recent move to take back.
    user.activities.includes(:job_application).each do |activity|
      sent_on = activity.job_application.date_applied
      activity.update_columns(occurred_on: sent_on, created_at: sent_on.noon)
    end
    user.perfect_days.delete_all
    user.job_applications.update_all(recent_moves: [])
    user
  end
end
