module Mutations
  class RequestPasswordReset < BaseMutation
    description "Emails a link to choose a new password. Always succeeds, so it doesn't reveal who has an account."

    argument :email_address, String, required: true

    field :sent, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(email_address:)
      unless MailSettings.password_reset_available?
        return { sent: false, errors: [ { field: nil, message: "This server can't send email yet, so password reset isn't available." } ] }
      end

      email = email_address.to_s.strip.downcase
      user = User.find_by(email_address: email)
      # At most one email a minute per address, so nobody can flood someone's inbox.
      if user && Rails.cache.write("password-reset:#{user.id}", true, expires_in: 1.minute, unless_exist: true)
        PasswordMailer.reset(user).deliver_now
      end

      { sent: true, errors: [] }
    rescue StandardError => error
      Rails.logger.error("Password reset email failed: #{error.class}: #{error.message}")
      { sent: false, errors: [ { field: nil, message: "We couldn't send the email. Try again in a few minutes." } ] }
    end
  end
end
