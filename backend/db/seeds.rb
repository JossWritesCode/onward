# Creates a demo account with some sample data so you can try the app quickly.
# Run with: bin/rails db:seed
#
# Sign in with demo@onward.test / password123

user = User.find_or_initialize_by(email_address: "demo@onward.test")
user.password = "password123" if user.new_record?
user.save!

if user.job_applications.none?
  priya = user.contacts.create!(
    name: "Priya Shah",
    title: "Engineering Manager",
    company: "Brightline",
    email: "priya@example.com",
    last_contacted_on: 3.weeks.ago.to_date,
    notes: "Met at the September frontend meetup. Offered to refer me."
  )
  sam = user.contacts.create!(
    name: "Sam Okafor",
    title: "Technical Recruiter",
    company: "Northwind Labs",
    linkedin_url: "https://www.linkedin.com/in/example",
    last_contacted_on: 5.days.ago.to_date
  )

  today = user.today

  brightline = user.job_applications.create!(
    company: "Brightline",
    role: "Frontend Developer",
    status: "applied",
    date_applied: 10.days.ago.to_date,
    work_arrangement: "hybrid",
    location: "Toronto, ON",
    salary_range: "$95k–$115k",
    resume_version: "Frontend v3",
    contacts: [ priya ]
  )
  northwind = user.job_applications.create!(
    company: "Northwind Labs",
    role: "Full Stack Engineer",
    status: "interviewing",
    date_applied: 3.weeks.ago.to_date,
    work_arrangement: "remote",
    posting_url: "https://example.com/jobs/full-stack",
    notes: "Technical interview next Thursday.",
    contacts: [ sam ]
  )
  copperleaf = user.job_applications.create!(
    company: "Copperleaf",
    role: "UI Engineer",
    status: "applied",
    date_applied: 4.weeks.ago.to_date,
    work_arrangement: "remote"
  )
  user.job_applications.create!(
    company: "Maple & Co",
    role: "Junior Software Developer",
    status: "saved",
    work_arrangement: "onsite",
    location: "Ottawa, ON"
  )
  user.job_applications.create!(
    company: "Lumen Health",
    role: "React Developer",
    status: "rejected",
    date_applied: 6.weeks.ago.to_date,
    work_arrangement: "remote"
  )

  # Follow-up dates in a few states, so the board and the Today strip have
  # something to show: one due now, one coming up, and one to maybe let go.
  brightline.update_columns(follow_up_on: today - 3, follow_ups_sent: 0)
  northwind.update_columns(follow_up_on: today + 4, follow_ups_sent: 1)
  copperleaf.update_columns(follow_up_on: today, follow_ups_sent: 2)
end

if user.custom_actions.none?
  meetup = user.custom_actions.create!(name: "Went to a meetup", category: "networking")
  user.daily_goals.create!(kind: "networking", target: 1)
  user.daily_goals.create!(kind: "study", target: 25, weekdays_only: true)
  user.activities.create!(kind: "custom", custom_action: meetup, occurred_on: 2.days.ago.to_date)
end

puts "Demo account ready: demo@onward.test / password123"
