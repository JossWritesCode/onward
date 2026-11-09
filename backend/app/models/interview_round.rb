# One round of interviews for an application, like "Phone screen", with its
# own prep checklist and an optional date for the countdown.
class InterviewRound < ApplicationRecord
  belongs_to :job_application
  belongs_to :stage, optional: true
  has_many :checklist_items, -> { order(:position, :id) }, dependent: :delete_all, inverse_of: :interview_round

  validates :name, presence: true, length: { maximum: 60 }

  delegate :user, to: :job_application

  # Setting the date of the round a card is in moves its thank-you note to the
  # day after the interview, until the thank-you is sent.
  after_update :reschedule_thank_you, if: :saved_change_to_scheduled_at?

  # Called when an application lands in an interview column. Each column gets
  # its own round, created once, with a fresh copy of your checklist template.
  def self.start_for!(job_application)
    stage = job_application.stage
    return unless stage&.kind_interviewing?
    return if exists?(job_application:, stage:)

    transaction do
      round = create!(job_application:, stage:, name: stage.name)
      job_application.user.checklist_template_items.each_with_index do |item, position|
        round.checklist_items.create!(text: item.text, position:)
      end
      round
    end
  end

  def complete?
    checklist_items.any? && checklist_items.all?(&:done?)
  end

  # Finishing the checklist the first time counts as a prep activity.
  def record_progress!
    return if prepped_at.present? || !complete?

    update!(prepped_at: Time.current)
    user.activities.create!(kind: "interview_prepped", automatic: true, job_application:)
  end

  private

  def reschedule_thank_you
    application = job_application
    return unless scheduled_at&.future?
    return unless application.status_interviewing? && application.stage_id == stage_id && application.follow_ups_sent.zero?

    application.update_columns(follow_up_on: user.local_date(scheduled_at) + 1, updated_at: Time.current)
  end
end
