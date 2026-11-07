class PasswordMailer < ApplicationMailer
  def reset(user)
    token = user.generate_token_for(:password_reset_link)
    link = "#{app_url}/reset-password?token=#{CGI.escape(token)}"

    mail(to: user.email_address, subject: "Reset your Onward password") do |format|
      format.text { render plain: <<~TEXT }
        Hi,

        Someone (hopefully you) asked to reset the password for your Onward account.
        Choose a new one here:

        #{link}

        The link works for an hour. If you didn't ask for this, you can ignore this
        email and your password stays the same.

        Onward
      TEXT
    end
  end
end
