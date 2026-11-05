# Links a contact to a job application, like the recruiter or the friend who referred you.
class JobApplicationContact < ApplicationRecord
  belongs_to :job_application
  belongs_to :contact

  validates :contact_id, uniqueness: { scope: :job_application_id }
  validate :same_owner

  private

  def same_owner
    return if job_application.nil? || contact.nil?
    return if job_application.user_id == contact.user_id

    errors.add(:contact, "must belong to you")
  end
end
