# Everything someone has put into Onward, for "Download my data". Secrets
# (password hash, GitHub token) and internal ids for other people are left out.
class AccountExport
  def initialize(user)
    @user = user
  end

  def as_json(*)
    user = @user
    {
      exported_at: Time.current.iso8601,
      account: user.as_json(only: %i[email_address time_zone engineering_track leetcode_username github_username created_at]),
      board_columns: rows(user.stages),
      job_applications: user.job_applications.includes(:contacts, interview_rounds: :checklist_items).map do |application|
        application.as_json(except: %i[user_id]).merge(
          "contact_ids" => application.contact_ids,
          "interview_rounds" => application.interview_rounds.map do |round|
            round.as_json(except: %i[job_application_id]).merge("checklist" => rows(round.checklist_items, except: %i[interview_round_id]))
          end
        )
      end,
      contacts: rows(user.contacts),
      activities: rows(user.activities.order(:occurred_on, :id)),
      daily_goals: rows(user.daily_goals),
      perfect_days: user.perfect_days.order(:achieved_on).pluck(:achieved_on),
      custom_actions: rows(user.custom_actions),
      stories: rows(user.stories),
      questions: rows(user.questions),
      practices: rows(user.practices),
      checklist_template: rows(user.checklist_template_items),
      study_sessions: rows(user.study_sessions)
    }
  end

  private

  def rows(scope, except: %i[user_id])
    scope.map { |record| record.as_json(except:) }
  end
end
