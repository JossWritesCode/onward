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

  user.job_applications.create!(
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
  user.job_applications.create!(
    company: "Northwind Labs",
    role: "Full Stack Engineer",
    status: "interviewing",
    date_applied: 3.weeks.ago.to_date,
    work_arrangement: "remote",
    posting_url: "https://example.com/jobs/full-stack",
    notes: "Technical interview next Thursday.",
    contacts: [ sam ]
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
end

puts "Demo account ready: demo@onward.test / password123"
