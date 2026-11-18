require "test_helper"

class E2eResetsTest < ActionDispatch::IntegrationTest
  test "does nothing unless the database is an end-to-end one" do
    E2eAccounts.seed("board")
    assert_not E2eAccounts.enabled?, "bin/rails test uses onward_test, not an _e2e database"

    post "/e2e/reset/board"

    assert_response :not_found
    assert User.exists?(email_address: E2eAccounts.email_for("board"))
  end

  test "rebuilds one account as it was seeded, leaving the others alone" do
    with_stub(E2eAccounts, :enabled?, true) do
      board = E2eAccounts.seed("board")
      other = E2eAccounts.seed("columns")
      original_ids = board.job_applications.pluck(:id)

      # What a test might leave behind: a moved card, a new one, a streak.
      board.job_applications.find_by!(company: "Maple & Co").update!(status: "applied")
      board.job_applications.create!(company: "Shopify", role: "Backend Developer", status: "saved")
      other.job_applications.create!(company: "Kept", role: "Developer", status: "saved")

      post "/e2e/reset/board"
      assert_response :no_content

      fresh = User.find_by!(email_address: E2eAccounts.email_for("board"))
      assert_not_equal board.id, fresh.id
      assert_empty fresh.job_applications.where(id: original_ids)
      assert_equal({ "Brightline" => "applied", "Maple & Co" => "saved", "Northwind Labs" => "applied" },
        fresh.job_applications.order(:company).pluck(:company, :status).to_h)
      assert_equal fresh.today, fresh.job_applications.find_by!(company: "Brightline").follow_up_on
      assert_equal 1, fresh.resumes.count
      assert_equal 0, fresh.activities.where(occurred_on: fresh.today).count
      assert_equal fresh, User.authenticate_by(email_address: E2eAccounts.email_for("board"), password: E2eAccounts::PASSWORD)

      assert other.job_applications.exists?(company: "Kept")
    end
  end

  test "builds an account that isn't there yet, and refuses names it doesn't know" do
    with_stub(E2eAccounts, :enabled?, true) do
      post "/e2e/reset/undo-move"
      assert_response :no_content
      assert User.exists?(email_address: E2eAccounts.email_for("undo-move"))

      post "/e2e/reset/someone-else"
      assert_response :not_found
    end
  end
end
