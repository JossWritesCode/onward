# How Onward sends email (only password reset links, for now).
#
# With SMTP_ADDRESS set, mail goes out through that SMTP server: Gmail with an
# app password, Brevo, or any other provider. Without it, development prints
# each email to the server log (so you can click the link there) and tests
# keep emails in memory.
class LogDelivery
  def initialize(_settings) = nil

  def deliver!(mail)
    Rails.logger.info(<<~LOG)

      ===== Email to #{Array(mail.to).join(", ")}: #{mail.subject} =====
      #{mail.text_part&.decoded || mail.body.decoded}
      ===== (Onward prints emails here because SMTP_ADDRESS isn't set) =====
    LOG
  end
end

module MailSettings
  module_function

  def smtp? = ENV["SMTP_ADDRESS"].present?

  # Whether "Forgot your password?" can work on this server.
  def password_reset_available? = smtp? || !Rails.env.production?
end

ActiveSupport.on_load(:action_mailer) do
  ActionMailer::Base.add_delivery_method :log, LogDelivery

  if MailSettings.smtp?
    self.delivery_method = :smtp
    self.smtp_settings = {
      address: ENV["SMTP_ADDRESS"],
      port: ENV.fetch("SMTP_PORT", 587).to_i,
      user_name: ENV["SMTP_USERNAME"].presence,
      password: ENV["SMTP_PASSWORD"].presence,
      authentication: ENV["SMTP_USERNAME"].present? ? :plain : nil,
      enable_starttls_auto: true,
      open_timeout: 5,
      read_timeout: 10
    }.compact
  elsif Rails.env.test?
    self.delivery_method = :test
  else
    self.delivery_method = :log
  end
  self.raise_delivery_errors = true
end
