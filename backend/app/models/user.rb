class User < ApplicationRecord
  MINIMUM_PASSWORD_LENGTH = 8

  has_secure_password

  has_many :sessions, dependent: :destroy
  has_many :activities, dependent: :delete_all
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
  validate :time_zone_exists

  # The date right now on this person's clock, which is what streaks count by.
  def today
    Time.current.in_time_zone(time_zone_object).to_date
  end

  private

  def time_zone_object
    ActiveSupport::TimeZone[time_zone.to_s] || ActiveSupport::TimeZone["UTC"]
  end

  def time_zone_exists
    errors.add(:time_zone, "isn't a time zone we recognize") unless ActiveSupport::TimeZone[time_zone.to_s]
  end
end
