module Types
  # Built on nothing: these are settings for the whole server.
  class ServerSettingsType < Types::BaseObject
    description "How this Onward server is set up. Readable while signed out."

    field :signups, Types::SignupModeEnum, null: false
    field :password_reset_available, Boolean, null: false,
      description: "False when the server has no way to send email, so \"Forgot your password?\" is hidden."

    def signups = Signups.mode
    def password_reset_available = MailSettings.password_reset_available?
  end
end
