class User < ApplicationRecord
  MINIMUM_PASSWORD_LENGTH = 8

  has_secure_password

  has_many :sessions, dependent: :destroy
  has_many :activities, dependent: :delete_all
  has_many :job_applications, dependent: :destroy
  has_many :contacts, dependent: :destroy
  # Declared after job_applications so applications are deleted before their columns.
  has_many :stages, -> { order(:position, :id) }, dependent: :delete_all
  has_many :stories, dependent: :delete_all
  has_many :questions, dependent: :delete_all
  has_many :practices, dependent: :delete_all
  has_many :checklist_template_items, -> { order(:position, :id) }, dependent: :delete_all
  has_many :study_sessions, dependent: :delete_all
  has_many :interview_rounds, through: :job_applications
  has_many :integration_snapshots, dependent: :delete_all

  # A personal access token with no permissions, used only to read your public
  # GitHub contribution calendar. Encrypted in the database.
  encrypts :github_token

  after_create :set_up_defaults

  normalizes :email_address, with: ->(email) { email.strip.downcase }

  validates :email_address,
    presence: true,
    uniqueness: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, message: "doesn't look like an email address" }
  validates :password, length: { minimum: MINIMUM_PASSWORD_LENGTH }, allow_nil: true
  validate :time_zone_exists
  validates :leetcode_username, format: { with: /\A[A-Za-z0-9_.-]{1,40}\z/, message: "can only have letters, numbers, dots, dashes, and underscores" }, allow_blank: true
  validates :github_username, format: { with: /\A[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}\z/, message: "isn't a valid GitHub username" }, allow_blank: true

  normalizes :leetcode_username, :github_username, with: ->(name) { name.strip.delete_prefix("@").presence }
  normalizes :github_token, with: ->(token) { token.strip.presence }

  # :saved, :none, or :unreadable. A token is unreadable when it was encrypted
  # with different keys than this server has (for example, if backend/.env
  # changed). Reading github_token directly would raise in that case.
  def github_token_status
    github_token.present? ? :saved : :none
  rescue ActiveRecord::Encryption::Errors::Decryption
    :unreadable
  end

  # Saves (or clears) the GitHub token without reading the old one first, so
  # replacing a token encrypted with old keys always works.
  def replace_github_token!(token)
    token = token.to_s.strip.presence
    ciphertext = token && self.class.type_for_attribute(:github_token).serialize(token)
    self.class.where(id:).update_all([ "github_token = ?", ciphertext ])
    @attributes.write_from_database("github_token", ciphertext)
  end

  # The date right now on this person's clock, which is what streaks count by.
  def today
    Time.current.in_time_zone(time_zone_object).to_date
  end

  private

  def set_up_defaults
    Stage.create_defaults_for(self)
    Question::STARTERS.each { |prompt| questions.create!(prompt:) }
    ChecklistTemplateItem::STARTERS.each_with_index { |text, position| checklist_template_items.create!(text:, position:) }
  end

  def time_zone_object
    ActiveSupport::TimeZone[time_zone.to_s] || ActiveSupport::TimeZone["UTC"]
  end

  def time_zone_exists
    errors.add(:time_zone, "isn't a time zone we recognize") unless ActiveSupport::TimeZone[time_zone.to_s]
  end
end
