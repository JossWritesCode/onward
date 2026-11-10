# A resume: structured content that a template turns into a PDF in the browser.
class Resume < ApplicationRecord
  # Adding a template: add it here, to Types::ResumeTemplateEnum, and to the
  # frontend's template list (see frontend/src/resume-pdf/templates).
  TEMPLATES = %w[classic].freeze
  PAGE_SIZES = %w[letter a4].freeze

  belongs_to :user

  enum :template, TEMPLATES.index_with(&:itself), prefix: true, validate: true
  enum :page_size, PAGE_SIZES.index_with(&:itself), prefix: true, validate: true

  normalizes :title, with: ->(title) { title.to_s.strip }

  validates :title, presence: true, length: { maximum: 120 }

  scope :recent_first, -> { order(updated_at: :desc, id: :desc) }

  # Saves pasted JSON as a new resume. Returns [resume, problems, filled]:
  # the resume (nil if the paste couldn't be used), what was wrong in plain
  # words, and which contact fields came from the person's last resume.
  # Nothing is saved unless the whole paste checks out.
  def self.import(user, text)
    data = ResumeImport.parse(text)
    result = ResumeContent.normalize(data)
    return [ nil, result.problems, [] ] unless result.ok?

    content = result.content
    filled = ResumeContent.fill_contact!(content, user.resumes.recent_first.first&.content)
    return [ nil, [ "Your resume needs a name. Add it to \"name\" in the JSON and paste again." ], [] ] if content["name"].blank?

    resume = user.resumes.create!(title: unused_title(user, content["title"].presence || "Resume"), content:, source_text: text)
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
      template:, page_size:, content: content.deep_dup, source_text:
    )
  end
end
