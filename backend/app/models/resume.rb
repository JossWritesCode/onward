# A resume: structured content that a template turns into a PDF in the browser.
class Resume < ApplicationRecord
  # Adding a template: add it here, to Types::ResumeTemplateEnum, and to the
  # frontend's template list (see frontend/src/resume-pdf/templates).
  TEMPLATES = %w[classic compact modern].freeze
  PAGE_SIZES = %w[letter a4].freeze

  belongs_to :user
  # Linked to an application, a resume is "tailored" for it. Without a link
  # it's a base resume. An application has at most one.
  belongs_to :job_application, optional: true
  # The resume this one was copied from when it was tailored.
  belongs_to :based_on, class_name: "Resume", optional: true

  enum :template, TEMPLATES.index_with(&:itself), prefix: true, validate: true
  enum :page_size, PAGE_SIZES.index_with(&:itself), prefix: true, validate: true

  normalizes :title, with: ->(title) { title.to_s.strip }
  # Every key present, every value in range, on the way in and on the way out
  # (a resume saved before styles existed has {} stored). See ResumeStyle.
  normalizes :style, with: ->(style) { ResumeStyle.normalize(style) }, apply_to_nil: true

  def style
    ResumeStyle.normalize(super)
  end

  validates :title, presence: true, length: { maximum: 120 }

  validate :job_application_is_yours_and_free

  scope :recent_first, -> { order(updated_at: :desc, id: :desc) }

  # Saves pasted JSON as a new resume, linked to an application if one is
  # given. Returns [resume, problems, filled]:
  # the resume (nil if the paste couldn't be used), what was wrong in plain
  # words, and which contact fields came from the person's last resume.
  # Nothing is saved unless the whole paste checks out.
  def self.import(user, text, job_application: nil)
    if (problem = link_problem(job_application))
      return [ nil, [ problem ], [] ]
    end

    data = ResumeImport.parse(text)
    result = ResumeContent.normalize(data)
    return [ nil, result.problems, [] ] unless result.ok?

    content = result.content
    filled = ResumeContent.fill_contact!(content, user.resumes.recent_first.first&.content)
    return [ nil, [ "Your resume needs a name. Add it to \"name\" in the JSON and paste again." ], [] ] if content["name"].blank?

    title = [ content["title"].presence || "Resume", job_application&.company ].compact.join(" – ")
    resume = user.resumes.create!(title: unused_title(user, title), content:, source_text: text, job_application:)
    [ resume, [], filled ]
  rescue ResumeImport::Error => error
    [ nil, [ error.message ], [] ]
  end

  # "Frontend Developer", then "Frontend Developer v2", "v3", and so on.
  def self.unused_title(user, base)
    base = base.strip[0, 110]
    taken = user.resumes.pluck(:title).to_set
    return base unless taken.include?(base)

    (2..).each do |version|
      candidate = "#{base} v#{version}"
      return candidate unless taken.include?(candidate)
    end
  end

  # Why this application can't take a (different) tailored resume, in plain
  # words, or nil if it can.
  def self.link_problem(job_application, except: nil)
    taken = job_application && Resume.where(job_application:).where.not(id: except&.id).exists?
    "#{job_application.company} already has a tailored resume." if taken
  end

  # A copy of this resume, linked to an application and ready to tailor.
  def tailor_for(job_application)
    user.resumes.create!(
      title: self.class.unused_title(user, "#{title[0, 80]} – #{job_application.company[0, 40]}"),
      template:, page_size:, style:, content: content.deep_dup, source_text:,
      job_application:, based_on: self
    )
  end

  # Replaces the content after checking its shape. Returns the problems.
  def replace_content(data)
    # as_json turns whatever arrived (params, symbols) into plain JSON values.
    result = ResumeContent.normalize(data.as_json)
    self.content = result.content if result.ok?
    result.problems
  end

  def duplicate
    user.resumes.create!(
      title: self.class.unused_title(user, "#{title[0, 100]} copy"),
      template:, page_size:, style:, content: content.deep_dup, source_text:, based_on:
    )
  end

  private

  def job_application_is_yours_and_free
    return if job_application.nil?

    if job_application.user_id != user_id
      errors.add(:job_application, "isn't one of yours")
    elsif (problem = self.class.link_problem(job_application, except: self))
      errors.add(:base, problem)
    end
  end
end
