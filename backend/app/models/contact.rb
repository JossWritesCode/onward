class Contact < ApplicationRecord
  belongs_to :user
  has_many :job_application_contacts, dependent: :destroy
  has_many :job_applications, through: :job_application_contacts

  normalizes :name, :title, :company, :email, :phone, :linkedin_url,
    with: ->(value) { value.strip.presence }

  validates :name, presence: true, length: { maximum: 200 }
  validates :email,
    format: { with: URI::MailTo::EMAIL_REGEXP, message: "doesn't look like an email address" },
    allow_blank: true
  validates :linkedin_url,
    format: { with: %r{\Ahttps?://\S+\z}i, message: "should start with http:// or https://" },
    allow_blank: true
end
