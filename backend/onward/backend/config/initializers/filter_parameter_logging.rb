# Keep passwords and other sensitive values out of the logs. This also applies
# to GraphQL variables, so a signIn mutation's password never gets logged.
Rails.application.config.filter_parameters += [
  :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc
]
