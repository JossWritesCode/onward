require "test_helper"

# bin/rails db:seed has to keep working as the models change, so it runs here
# on the empty test database, the way it runs on a fresh one.
class SeedsTest < ActiveSupport::TestCase
  def seed
    silence_stream($stdout) { load Rails.root.join("db/seeds.rb") }
  end

  def silence_stream(stream)
    original = stream.dup
    stream.reopen(File::NULL)
    yield
  ensure
    stream.reopen(original)
  end

  test "makes the demo account, with a resume tailored for Brightline" do
    seed

    user = User.find_by!(email_address: "demo@onward.test")
    assert_equal user, User.authenticate_by(email_address: "demo@onward.test", password: "password123")
    assert user.job_applications.count >= 5

    brightline = user.job_applications.find_by!(company: "Brightline")
    tailored = brightline.resume
    assert_equal "Frontend v3 – Brightline", tailored.title
    assert_equal user.resumes.find_by!(title: "Frontend v3"), tailored.based_on
    assert_match(/Drawn to Brightline's focus on design systems/, tailored.content["summary"])
  end

  test "can run again without failing or adding anything" do
    seed
    counts = -> { [ User.count, JobApplication.count, Resume.count, Contact.count ] }
    before = counts.call

    seed

    assert_equal before, counts.call
  end
end
