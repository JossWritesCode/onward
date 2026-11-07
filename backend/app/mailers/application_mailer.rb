class ApplicationMailer < ActionMailer::Base
  # MAIL_FROM, or the SMTP username (which is what Gmail requires), or a placeholder.
  default from: -> {
    ENV["MAIL_FROM"].presence ||
      (ENV["SMTP_USERNAME"].to_s.include?("@") ? "Onward <#{ENV['SMTP_USERNAME']}>" : "Onward <no-reply@onward.local>")
  }

  private

  # Where links in emails point: APP_URL if set, Render's own address on
  # Render, or the Vite dev server locally.
  def app_url
    (ENV["APP_URL"].presence || ENV["RENDER_EXTERNAL_URL"].presence || "http://localhost:5173").chomp("/")
  end
end
