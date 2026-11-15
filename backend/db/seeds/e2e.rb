# Accounts for the end-to-end tests in frontend/e2e. `bin/rails e2e:seed` loads
# this into an empty database (bin/e2e does it for you).
#
# Each spec file signs in as its own account, named for the file, so files can
# run side by side without moving each other's cards. (The tests inside one
# file share its account and run in order.) Every
# account starts the same: the default columns, three applications, and one
# resume, with no activity yet, so the streak starts at zero.
#
# Dates count from today on the account's own clock, so the follow-up that's
# due is due whenever the tests run.

E2E_ACCOUNTS = %w[
  auth
  applications
  board
  columns
  resume-preview
  resume-import
  log-win
  follow-up
  interview-prep
].freeze
E2E_PASSWORD = "password123"

E2E_RESUME = {
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

E2E_ACCOUNTS.each do |name|
  user = User.create!(email_address: "#{name}@e2e.onward.test", password: E2E_PASSWORD, time_zone: "America/Toronto")
  today = user.today

  user.job_applications.create!(company: "Maple & Co", role: "Junior Software Developer", status: "saved", location: "Ottawa, ON")
  brightline = user.job_applications.create!(company: "Brightline", role: "Frontend Developer", status: "applied", date_applied: today - 10)
  northwind = user.job_applications.create!(company: "Northwind Labs", role: "Full Stack Engineer", status: "applied", date_applied: today - 3)

  # One follow-up due today, one coming up.
  brightline.update_columns(follow_up_on: today, follow_ups_sent: 0)
  northwind.update_columns(follow_up_on: today + 5, follow_ups_sent: 0)

  user.resumes.create!(title: "Frontend v3", content: E2E_RESUME)

  # Creating applied cards logs "sent an application" for today, as moving a
  # card would. Clear it, so each account starts with no streak and today's
  # goal not yet done (a done goal folds the Today strip and hides its nudges).
  user.activities.delete_all
end

puts "Loaded #{E2E_ACCOUNTS.size} end-to-end accounts (password: #{E2E_PASSWORD})"
