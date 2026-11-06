class User < ApplicationRecord
  MINIMUM_PASSWORD_LENGTH = 8

  has_secure_password

  has_many :sessions, dependent: :destroy
  has_many :job_applications, dependent: :destroy
  has_many :contacts, dependent: :destroy
  # Declared after job_applications so applications are deleted before their columns.
  has_many :stages, -> { order(:position, :id) }, dependent: :delete_all

  after_create { Stage.create_defaults_for(self) }

  normalizes :email_address, with: ->(email) { email.strip.downcase }

  validates :email_address,
    presence: true,
    uniqueness: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, message: "doesn't look like an email address" }
  validates :password, length: { minimum: MINIMUM_PASSWORD_LENGTH }, allow_nil: true
end
