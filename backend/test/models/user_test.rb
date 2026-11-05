require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "normalizes the email address" do
    user = create_user(email_address: "  Joss@Example.COM ")
    assert_equal "joss@example.com", user.email_address
  end

  test "rejects duplicate email addresses regardless of case" do
    create_user(email_address: "joss@example.com")
    duplicate = User.new(email_address: "JOSS@example.com", password: "password123")
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:email_address], "has already been taken"
  end

  test "requires a password of at least 8 characters" do
    user = User.new(email_address: "short@example.com", password: "short")
    assert_not user.valid?
    assert user.errors[:password].any?
  end
end
