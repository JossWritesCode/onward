require "test_helper"

class ResumesTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  IMPORT = <<~GRAPHQL
    mutation($text: String!) {
      importResume(text: $text) {
        resume { id title template pageSize content }
        filledFields
        errors { field message }
      }
    }
  GRAPHQL

  PASTE = <<~JSON
    ```json
    {
      "name": "Dana Whitfield", "title": "Frontend Developer", "location": "Halifax, NS",
      "phone": "+1 902 555 0142", "email": "dana@example.com",
      "links": ["github.com/danawhitfield"],
      "summary": "Frontend developer who likes accessible interfaces.",
      "skills": [{ "label": "Frontend", "items": ["React", "TypeScript",] }],
      "experience": [{
        "title": "Frontend Developer", "company": "Tidewater Apps", "location": "Remote",
        "start": "2022-08", "end": "Present", "bullets": ["Rebuilt the **booking flow** in React."]
      }],
      "education": [{ "school": "Dalhousie University", "degree": "BSc", "date": "2019-05", "honors": "" }],
      "sections": []
    }
    ```
  JSON

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  def import(text)
    graphql(IMPORT, variables: { text: }).dig("data", "importResume")
  end

  test "imports a pasted resume" do
    result = import(PASTE)

    assert_empty result["errors"]
    assert_empty result["filledFields"]
    resume = result["resume"]
    assert_equal "Frontend Developer", resume["title"]
    assert_equal "CLASSIC", resume["template"]
    assert_equal "LETTER", resume["pageSize"]
    assert_equal "Dana Whitfield", resume.dig("content", "name")
    assert_equal [ "React", "TypeScript" ], resume.dig("content", "skills", 0, "items")
    assert_equal [ "Rebuilt the booking flow in React." ], resume.dig("content", "experience", 0, "bullets")

    saved = @user.resumes.sole
    assert_equal PASTE, saved.source_text
    assert_equal "2022-08", saved.content.dig("experience", 0, "start")
  end

  test "broken JSON saves nothing and says where it broke" do
    result = import("{\n  \"name\": \"Dana\"\n  \"title\": \"Dev\"\n}")

    assert_nil result["resume"]
    assert_equal [ { "field" => "text", "message" => "Line 2: missing a comma." } ], result["errors"]
    assert_equal 0, @user.resumes.count
  end

  test "a paste with the wrong shape saves nothing" do
    result = import('{ "name": "Dana", "experience": [{ "title": "Dev", "start": "last spring" }] }')

    assert_nil result["resume"]
    assert_match "experience 1: \"start\" should be a date", result["errors"].sole["message"]
    assert_equal 0, @user.resumes.count
  end

  test "a resume needs a name" do
    result = import('{ "title": "Developer" }')

    assert_nil result["resume"]
    assert_match "needs a name", result["errors"].sole["message"]
    assert_equal 0, @user.resumes.count
  end

  test "fills blank contact fields from the most recent resume" do
    import(PASTE)
    older = @user.resumes.sole
    newest = older.duplicate
    newest.update!(content: newest.content.merge("phone" => "+1 902 555 0199"), updated_at: 1.minute.from_now)

    result = import('{ "name": "", "title": "Frontend Developer", "email": "work@example.com", "summary": "Tailored." }')

    assert_empty result["errors"]
    assert_equal %w[name location phone links], result["filledFields"]
    content = result.dig("resume", "content")
    assert_equal "Dana Whitfield", content["name"]
    assert_equal "+1 902 555 0199", content["phone"]
    assert_equal "work@example.com", content["email"]
    assert_equal [ "github.com/danawhitfield" ], content["links"]
    # The same headline again gets a version number instead of a duplicate title.
    assert_equal "Frontend Developer v2", result.dig("resume", "title")
  end

  test "doesn't fill contact fields from someone else's resume" do
    other = create_user
    Resume.import(other, PASTE)

    result = import('{ "name": "Robin Vale", "title": "Developer" }')

    assert_empty result["filledFields"]
    assert_equal "", result.dig("resume", "content", "phone")
  end

  test "lists, updates, duplicates, and deletes" do
    id = import(PASTE).dig("resume", "id")

    content = @user.resumes.sole.content.merge("summary" => "Now tailored.", "experience" => [])
    updated = graphql(<<~GRAPHQL, variables: { id:, content: }).dig("data", "updateResume")
      mutation($id: ID!, $content: JSON) {
        updateResume(id: $id, input: { title: "Frontend v3", pageSize: A4, content: $content }) {
          resume { title pageSize content }
          errors { field message }
        }
      }
    GRAPHQL
    assert_empty updated["errors"]
    assert_equal "Frontend v3", updated.dig("resume", "title")
    assert_equal "A4", updated.dig("resume", "pageSize")
    assert_equal "Now tailored.", updated.dig("resume", "content", "summary")
    assert_equal [], updated.dig("resume", "content", "experience")

    copy = graphql("mutation($id: ID!) { duplicateResume(id: $id) { resume { id title pageSize content } } }", variables: { id: })
      .dig("data", "duplicateResume", "resume")
    assert_equal "Frontend v3 copy", copy["title"]
    assert_equal "A4", copy["pageSize"]
    assert_equal "Now tailored.", copy.dig("content", "summary")

    listed = graphql("query { resumes { id title } }").dig("data", "resumes")
    assert_equal [ "Frontend v3", "Frontend v3 copy" ], listed.map { |resume| resume["title"] }.sort

    fetched = graphql("query($id: ID!) { resume(id: $id) { title } }", variables: { id: copy["id"] })
    assert_equal "Frontend v3 copy", fetched.dig("data", "resume", "title")

    graphql("mutation($id: ID!) { deleteResume(id: $id) { id } }", variables: { id: })
    assert_equal [ "Frontend v3 copy" ], @user.resumes.pluck(:title)
  end

  test "updating rejects content with the wrong shape and a blank title" do
    id = import(PASTE).dig("resume", "id")

    bad_content = graphql(<<~GRAPHQL, variables: { id:, content: { name: "Dana", skills: "React" } }).dig("data", "updateResume")
      mutation($id: ID!, $content: JSON) {
        updateResume(id: $id, input: { content: $content }) { resume { id } errors { field message } }
      }
    GRAPHQL
    assert_equal [ { "field" => "content", "message" => "\"skills\" should be a list in [ ]." } ], bad_content["errors"]

    blank_title = graphql('mutation($id: ID!) { updateResume(id: $id, input: { title: " " }) { errors { field } } }', variables: { id: })
    assert_equal [ "title" ], blank_title.dig("data", "updateResume", "errors").map { |error| error["field"] }

    assert_equal "Frontend Developer", @user.resumes.sole.title
    assert_equal [ "React", "TypeScript" ], @user.resumes.sole.content.dig("skills", 0, "items")
  end

  test "you can't see or change someone else's resume" do
    other = create_user
    theirs, = Resume.import(other, PASTE)
    id = theirs.id.to_s

    assert_empty graphql("query { resumes { id } }").dig("data", "resumes")

    [
      "query($id: ID!) { resume(id: $id) { id } }",
      'mutation($id: ID!) { updateResume(id: $id, input: { title: "Mine now" }) { resume { id } } }',
      "mutation($id: ID!) { duplicateResume(id: $id) { resume { id } } }",
      "mutation($id: ID!) { deleteResume(id: $id) { id } }"
    ].each do |operation|
      result = graphql(operation, variables: { id: })
      assert_equal "We couldn't find that.", result.dig("errors", 0, "message"), operation
    end

    assert_equal "Frontend Developer", theirs.reload.title
    assert_equal 1, other.resumes.count
    assert_equal 0, @user.resumes.count
  end

  test "resumes need you to be signed in" do
    graphql("mutation { signOut { success } }")

    assert_equal "You need to sign in first.", graphql("query { resumes { id } }").dig("errors", 0, "message")
    assert_equal "You need to sign in first.", graphql(IMPORT, variables: { text: PASTE }).dig("errors", 0, "message")
    assert_equal 0, Resume.count
  end

  # --- Tailored resumes: linked to a job application ---------------------

  TAILOR = <<~GRAPHQL
    mutation($id: ID!, $jobApplicationId: ID!) {
      tailorResume(id: $id, jobApplicationId: $jobApplicationId) {
        resume { id title pageSize content basedOn { id } jobApplication { id company role } }
        errors { field message }
      }
    }
  GRAPHQL

  LINK = <<~GRAPHQL
    mutation($id: ID!, $jobApplicationId: ID) {
      updateResume(id: $id, input: { jobApplicationId: $jobApplicationId }) {
        resume { id jobApplication { id } }
        errors { field message }
      }
    }
  GRAPHQL

  def application(company: "Brightline", role: "Frontend Developer", user: @user)
    user.job_applications.create!(company:, role:, status: "saved")
  end

  def tailor(id, job_application)
    graphql(TAILOR, variables: { id:, jobApplicationId: job_application.id.to_s }).dig("data", "tailorResume")
  end

  test "tailors a base resume for an application" do
    base = Resume.import(@user, PASTE).first
    base.update!(page_size: "a4")
    brightline = application

    result = tailor(base.id.to_s, brightline)

    assert_empty result["errors"]
    tailored = result["resume"]
    assert_equal "Frontend Developer – Brightline", tailored["title"]
    assert_equal "A4", tailored["pageSize"]
    assert_equal "Dana Whitfield", tailored.dig("content", "name")
    assert_equal base.id.to_s, tailored.dig("basedOn", "id")
    assert_equal({ "id" => brightline.id.to_s, "company" => "Brightline", "role" => "Frontend Developer" }, tailored["jobApplication"])

    # The base is untouched, and still a base resume.
    assert_nil base.reload.job_application
    assert_equal 2, @user.resumes.count

    card = graphql("query($id: ID!) { jobApplication(id: $id) { resume { id title } } }", variables: { id: brightline.id.to_s })
    assert_equal tailored["id"], card.dig("data", "jobApplication", "resume", "id")
    board = graphql("query { stages { jobApplications { company resume { title } } } }").dig("data", "stages")
    assert_equal [ "Frontend Developer – Brightline" ], board.flat_map { |stage| stage["jobApplications"] }.filter_map { |a| a.dig("resume", "title") }
  end

  test "an application has at most one tailored resume" do
    base = Resume.import(@user, PASTE).first
    brightline = application
    first = tailor(base.id.to_s, brightline)["resume"]

    again = tailor(base.id.to_s, brightline)
    assert_nil again["resume"]
    assert_equal [ { "field" => "jobApplicationId", "message" => "Brightline already has a tailored resume." } ], again["errors"]

    linked = graphql(LINK, variables: { id: base.id.to_s, jobApplicationId: brightline.id.to_s }).dig("data", "updateResume")
    assert_equal "Brightline already has a tailored resume.", linked["errors"].sole["message"]

    pasted = graphql("mutation($text: String!, $app: ID) { importResume(text: $text, jobApplicationId: $app) { resume { id } errors { message } } }",
      variables: { text: PASTE, app: brightline.id.to_s }).dig("data", "importResume")
    assert_nil pasted["resume"]
    assert_equal "Brightline already has a tailored resume.", pasted["errors"].sole["message"]

    assert_equal [ first["id"] ], @user.resumes.where(job_application: brightline).pluck(:id).map(&:to_s)
    assert_equal 2, @user.resumes.count

    # The database refuses a second one too, whatever the app code does.
    assert_raises(ActiveRecord::RecordNotUnique) do
      Resume.transaction(requires_new: true) { base.update_column(:job_application_id, brightline.id) }
    end
    # Saving the linked one again is fine: it doesn't collide with itself.
    assert Resume.find(first["id"]).update(title: "Renamed")
  end

  test "links, moves, and unlinks a resume from the editor" do
    resume = Resume.import(@user, PASTE).first
    brightline = application
    northwind = application(company: "Northwind Labs", role: "Full Stack Engineer")

    link = ->(job_application) { graphql(LINK, variables: { id: resume.id.to_s, jobApplicationId: job_application&.id&.to_s }).dig("data", "updateResume") }

    assert_equal brightline.id.to_s, link.call(brightline).dig("resume", "jobApplication", "id")
    assert_equal northwind.id.to_s, link.call(northwind).dig("resume", "jobApplication", "id")
    assert_nil brightline.reload.resume

    assert_nil link.call(nil).dig("resume", "jobApplication")
    assert_nil resume.reload.job_application

    # Leaving jobApplicationId out keeps the link as it is.
    link.call(brightline)
    graphql('mutation($id: ID!) { updateResume(id: $id, input: { title: "Renamed" }) { resume { id } } }', variables: { id: resume.id.to_s })
    assert_equal brightline, resume.reload.job_application
  end

  test "a pasted resume can be linked to an application right away" do
    brightline = application

    result = graphql("mutation($text: String!, $app: ID) { importResume(text: $text, jobApplicationId: $app) { resume { title jobApplication { company } } errors { message } } }",
      variables: { text: PASTE, app: brightline.id.to_s }).dig("data", "importResume")

    assert_empty result["errors"]
    assert_equal "Frontend Developer – Brightline", result.dig("resume", "title")
    assert_equal "Brightline", result.dig("resume", "jobApplication", "company")
  end

  test "deleting an application keeps its resume, as a base resume" do
    base = Resume.import(@user, PASTE).first
    brightline = application
    tailored_id = tailor(base.id.to_s, brightline).dig("resume", "id")

    graphql("mutation($id: ID!) { deleteJobApplication(id: $id) { id } }", variables: { id: brightline.id.to_s })

    kept = @user.resumes.find(tailored_id)
    assert_nil kept.job_application_id
    assert_equal base, kept.based_on
  end

  test "deleting the base keeps the tailored resume, and a copy of a tailored resume is a base resume" do
    base = Resume.import(@user, PASTE).first
    tailored_id = tailor(base.id.to_s, application).dig("resume", "id")

    copy = graphql("mutation($id: ID!) { duplicateResume(id: $id) { resume { id jobApplication { id } } } }", variables: { id: tailored_id })
      .dig("data", "duplicateResume", "resume")
    assert_nil copy["jobApplication"]

    graphql("mutation($id: ID!) { deleteResume(id: $id) { id } }", variables: { id: base.id.to_s })
    assert_nil @user.resumes.find(tailored_id).based_on_id
  end

  test "you can't link resumes and applications across accounts" do
    other = create_user
    their_application = application(user: other, company: "Theirs")
    their_resume = Resume.import(other, PASTE).first
    mine = Resume.import(@user, PASTE).first
    my_application = application

    attempts = [
      [ TAILOR, { id: mine.id.to_s, jobApplicationId: their_application.id.to_s } ],
      [ TAILOR, { id: their_resume.id.to_s, jobApplicationId: my_application.id.to_s } ],
      [ LINK, { id: mine.id.to_s, jobApplicationId: their_application.id.to_s } ],
      [ "mutation($text: String!, $app: ID) { importResume(text: $text, jobApplicationId: $app) { resume { id } } }", { text: PASTE, app: their_application.id.to_s } ]
    ]
    attempts.each do |operation, variables|
      assert_equal "We couldn't find that.", graphql(operation, variables:).dig("errors", 0, "message"), operation
    end

    assert_equal 0, Resume.where.not(job_application_id: nil).count
    assert_equal [ 1, 1 ], [ @user.resumes.count, other.resumes.count ]
    # The model refuses too, if anything ever skips the lookups above.
    assert_not mine.update(job_application: their_application)
  end

  # --- Style: text size, spacing, margins, accent ---------------------------

  test "a new resume gets the default style, and copies keep it" do
    resume = Resume.import(@user, PASTE).first
    assert_equal ResumeStyle::DEFAULTS, resume.style

    resume.update!(style: { "fontSize" => 9, "margin" => 0.4 }, template: "modern")
    assert_equal 9.0, resume.reload.style["fontSize"]
    assert_equal 1.35, resume.style["lineHeight"], "keys left out get the default"

    copy = resume.duplicate
    tailored = resume.tailor_for(application)
    assert_equal resume.style, copy.style
    assert_equal resume.style, tailored.style
    assert_equal "modern", tailored.template
  end

  test "a resume saved before styles existed reads as Normal" do
    resume = Resume.import(@user, PASTE).first
    resume.update_column(:style, {})

    assert_equal ResumeStyle::DEFAULTS, Resume.find(resume.id).style
    listed = graphql("query { resumes { style { fontSize accent } } }").dig("data", "resumes", 0, "style")
    assert_equal({ "fontSize" => 9.5, "accent" => "#4f46e5" }, listed)
  end

  test "changes the style and template from the editor" do
    id = import(PASTE).dig("resume", "id")

    result = graphql(<<~GRAPHQL, variables: { id: }).dig("data", "updateResume")
      mutation($id: ID!) {
        updateResume(id: $id, input: { template: COMPACT, style: { fontSize: 9, sectionGap: 6, accent: "#0F766E" } }) {
          resume { template style { fontSize lineHeight margin sectionGap accent } }
          errors { field message }
        }
      }
    GRAPHQL

    assert_empty result["errors"]
    assert_equal "COMPACT", result.dig("resume", "template")
    assert_equal({ "fontSize" => 9.0, "lineHeight" => 1.35, "margin" => 0.45, "sectionGap" => 6.0, "accent" => "#0f766e" },
      result.dig("resume", "style"))

    # A second change keeps what the first one set.
    again = graphql('mutation($id: ID!) { updateResume(id: $id, input: { style: { lineHeight: 1.2 } }) { resume { style { fontSize lineHeight } } } }', variables: { id: })
    assert_equal({ "fontSize" => 9.0, "lineHeight" => 1.2 }, again.dig("data", "updateResume", "resume", "style"))
  end

  test "style values outside the range are brought back in" do
    id = import(PASTE).dig("resume", "id")

    result = graphql('mutation($id: ID!) { updateResume(id: $id, input: { style: { fontSize: 2, margin: 5, accent: "red" } }) { resume { style { fontSize margin accent } } errors { message } } }', variables: { id: })

    assert_equal({ "fontSize" => 8.5, "margin" => 1.0, "accent" => "#4f46e5" }, result.dig("data", "updateResume", "resume", "style"))
  end

  test "every template can be picked" do
    id = import(PASTE).dig("resume", "id")

    %w[CLASSIC COMPACT MODERN].each do |template|
      result = graphql("mutation($id: ID!) { updateResume(id: $id, input: { template: #{template} }) { resume { template } errors { message } } }", variables: { id: })
      assert_equal template, result.dig("data", "updateResume", "resume", "template")
    end
  end
end
