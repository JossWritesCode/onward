# Who can create an account.
#
# - "open": anyone.
# - "invite": only people with an invite code, plus the owner (OWNER_EMAIL)
#   and the very first account on a new server, so there's always a way in.
#
# Set with the SIGNUPS environment variable. Defaults to "invite" in
# production and "open" everywhere else.
module Signups
  module_function

  def mode
    value = ENV.fetch("SIGNUPS") { Rails.env.production? ? "invite" : "open" }
    value == "open" ? "open" : "invite"
  end

  def invite_only? = mode == "invite"

  def owner_email
    ENV["OWNER_EMAIL"].to_s.strip.downcase.presence
  end

  # Admins can make invites. The owner, or the first account if no owner is set.
  def admin?(email_address)
    owner = owner_email
    owner ? email_address.to_s.strip.downcase == owner : !User.exists?
  end

  # Whether this email can sign up without an invite.
  def invite_needed?(email_address)
    invite_only? && !admin?(email_address)
  end
end
