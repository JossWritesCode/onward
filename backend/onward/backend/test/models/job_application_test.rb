require "test_helper"

class JobApplicationTest < ActiveSupport::TestCase
  setup do
    @user = create_user
  end

  test "requires a company and role" do
    application = @user.job_applications.new(company: "  ", role: nil)
    assert_not application.valid?
    assert application.errors[:company].any?
    assert application.errors[:role].any?
  end

  test "defaults to the saved status" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    assert application.status_saved?
  end

  test "fills in today's date when moved to applied" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    application.update!(status: "applied")
    assert_equal Date.current, application.date_applied
  end

  test "keeps an existing applied date" do
    application = @user.job_applications.create!(
      company: "Acme", role: "Developer", status: "applied", date_applied: Date.new(2026, 10, 1)
    )
    assert_equal Date.new(2026, 10, 1), application.date_applied
  end

  test "rejects posting links that aren't web addresses" do
    application = @user.job_applications.new(company: "Acme", role: "Developer", posting_url: "javascript:alert(1)")
    assert_not application.valid?
    assert application.errors[:posting_url].any?
  end

  test "won't link a contact that belongs to someone else" do
    stranger_contact = create_user.contacts.create!(name: "Not Yours")
    application = @user.job_applications.create!(company: "Acme", role: "Developer")
    link = application.job_application_contacts.new(contact: stranger_contact)
    assert_not link.valid?
  end
end
