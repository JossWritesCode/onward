# Gentle reminders about things that might need you, worked out fresh each
# time from your board, contacts, and interview prep. Up to 3 at a time.
#
# - interview_prep: an interview in the next 2 days whose checklist isn't done
# - follow_up: an application whose follow-up date is today or past
# - quiet_application: an application with no change in 2 weeks (and no
#   follow-up date, since those get follow_up nudges instead)
# - quiet_contact: someone you haven't talked to in 3 weeks
#
# They come in that order, with oldest follow-ups first and quiet
# applications and people mixed together.
#
# Each nudge has a key that includes the date it's about, so dismissing one
# hides it until things change. If you follow up and it goes quiet again
# later, a new nudge appears.
class Nudges
  LIMIT = 3
  INTERVIEW_WINDOW = 2.days
  QUIET_APPLICATION_DAYS = 14
  QUIET_CONTACT_DAYS = 21

  Nudge = Struct.new(:key, :kind, :since, :job_application, :contact, :interview_round, keyword_init: true)

  def self.for(user)
    new(user).to_a
  end

  def initialize(user)
    @user = user
    @today = user.today
  end

  def to_a
    hidden = @user.nudge_dismissals.hiding_on(@today).pluck(:key).to_set
    visible = ->(nudges) { nudges.reject { |nudge| hidden.include?(nudge.key) } }

    prep = visible.call(interview_prep)
    due = visible.call(follow_ups)
    applications = visible.call(quiet_applications)
    contacts = visible.call(quiet_contacts)

    # Interviews come first, then follow-ups, then a mix of applications and people.
    mixed = applications.zip(contacts).flatten.compact + contacts.drop(applications.size)
    (prep + due + mixed).first(LIMIT)
  end

  private

  def interview_prep
    InterviewRound
      .joins(:job_application)
      .where(job_applications: { user_id: @user.id, status: "interviewing" })
      .where(scheduled_at: Time.current..INTERVIEW_WINDOW.from_now, prepped_at: nil)
      .includes(:checklist_items, :job_application)
      .order(:scheduled_at)
      .select { |round| round.checklist_items.any? && !round.complete? }
      .map do |round|
        Nudge.new(key: "prep:#{round.id}", kind: "interview_prep", job_application: round.job_application, interview_round: round)
      end
  end

  def follow_ups
    @user.job_applications
      .where(status: JobApplication::FOLLOW_UP_STATUSES, follow_up_on: ..@today)
      .order(:follow_up_on, :id)
      .map do |application|
        Nudge.new(key: "follow_up:#{application.id}:#{application.follow_up_on.iso8601}", kind: "follow_up",
          since: application.follow_up_on, job_application: application)
      end
  end

  def quiet_applications
    applications = @user.job_applications.where(status: JobApplication::FOLLOW_UP_STATUSES, follow_up_on: nil).to_a
    last_activity = @user.activities.where(job_application_id: applications.map(&:id)).group(:job_application_id).maximum(:occurred_on)

    applications.filter_map do |application|
      last_change = [ @user.local_date(application.updated_at), application.date_applied, last_activity[application.id] ].compact.max
      next if (@today - last_change).to_i < QUIET_APPLICATION_DAYS

      Nudge.new(key: "application:#{application.id}:#{last_change.iso8601}", kind: "quiet_application",
        since: last_change, job_application: application)
    end.sort_by(&:since)
  end

  def quiet_contacts
    @user.contacts.filter_map do |contact|
      last_talked = contact.last_contacted_on || @user.local_date(contact.created_at)
      next if (@today - last_talked).to_i < QUIET_CONTACT_DAYS

      Nudge.new(key: "contact:#{contact.id}:#{last_talked.iso8601}", kind: "quiet_contact", since: last_talked, contact:)
    end.sort_by(&:since)
  end
end
