require "test_helper"

# Reading pasted resume JSON: what's forgiven, and what the error says when
# it can't be read.
class ResumeImportTest < ActiveSupport::TestCase
  CLEAN = <<~JSON
    {
      "name": "Dana Whitfield", "title": "Frontend Developer", "location": "Halifax, NS",
      "phone": "+1 902 555 0142", "email": "dana@example.com",
      "links": ["linkedin.com/in/danawhitfield", "github.com/danawhitfield"],
      "summary": "Frontend developer who likes accessible interfaces.",
      "skills": [
        { "label": "Frontend Development", "items": ["React", "TypeScript"] }
      ],
      "experience": [{
        "title": "Frontend Developer", "company": "Tidewater Apps", "location": "Remote",
        "start": "2022-08", "end": "Present",
        "bullets": ["Rebuilt the booking flow in React.", "Cut load time by 40%."]
      }],
      "education": [{ "school": "Dalhousie University", "degree": "BSc, Computer Science", "date": "2019-05", "honors": "" }],
      "sections": [{
        "heading": "Projects",
        "items": [{ "title": "Trailhead", "subtitle": "A hiking log", "date": "2023", "bullets": ["Built with Rails."] }]
      }]
    }
  JSON

  def content_from(text)
    result = ResumeContent.normalize(ResumeImport.parse(text))
    assert_empty result.problems
    result.content
  end

  def error_from(text)
    assert_raises(ResumeImport::Error) { ResumeImport.parse(text) }.message
  end

  test "reads a clean paste" do
    content = content_from(CLEAN)

    assert_equal "Dana Whitfield", content["name"]
    assert_equal [ "linkedin.com/in/danawhitfield", "github.com/danawhitfield" ], content["links"]
    assert_equal [ { "label" => "Frontend Development", "items" => [ "React", "TypeScript" ] } ], content["skills"]
    job = content["experience"].sole
    assert_equal [ "2022-08", "Present" ], job.values_at("start", "end")
    assert_equal 2, job["bullets"].size
    assert_equal "2019-05", content["education"].sole["date"]
    assert_equal "Trailhead", content["sections"].sole["items"].sole["title"]
  end

  test "forgives code-fence markers and chatter around the JSON" do
    fenced = "Here's your resume:\n\n```json\n#{CLEAN}```\n\nLet me know if you'd like changes!"
    assert_equal content_from(CLEAN), content_from(fenced)
    assert_equal content_from(CLEAN), content_from("```\n#{CLEAN}\n```")
  end

  test "forgives trailing commas" do
    content = content_from('{ "name": "Dana", "links": ["a.com", "b.com",], "skills": [{ "label": "Tools", "items": ["Git",], },], }')
    assert_equal [ "a.com", "b.com" ], content["links"]
    assert_equal [ "Git" ], content["skills"].sole["items"]
  end

  test "forgives curly quotes used as JSON quotes" do
    content = content_from("{ “name”: “Dana Whitfield”, “links”: [“a.com”, “b.com”] }")
    assert_equal "Dana Whitfield", content["name"]
    assert_equal [ "a.com", "b.com" ], content["links"]
  end

  test "keeps curly quotes that are part of the text" do
    straight = content_from("{ \"name\": \"Dana\", \"summary\": \"Built the “sell or trade” flow\" }")
    assert_equal "Built the “sell or trade” flow", straight["summary"]

    curly = content_from("{ “name”: “Dana”, “summary”: “Built the “sell or trade” flow” }")
    assert_equal "Built the “sell or trade” flow", curly["summary"]
  end

  test "forgives leftover ** and bullet symbols in values" do
    content = content_from(<<~JSON)
      { "name": "**Dana Whitfield**",
        "skills": [{ "label": "**Frontend**", "items": ["**React**", "TypeScript"] }],
        "experience": [{ "title": "Developer", "company": "Tidewater", "start": "2022-08", "end": "Present",
                         "bullets": ["• Shipped **fast**.", "- Mentored two interns."] }] }
    JSON

    assert_equal "Dana Whitfield", content["name"]
    assert_equal({ "label" => "Frontend", "items" => [ "React", "TypeScript" ] }, content["skills"].sole)
    assert_equal [ "Shipped fast.", "Mentored two interns." ], content["experience"].sole["bullets"]
  end

  test "says which line is missing a comma" do
    broken = <<~JSON
      {
        "name": "Dana Whitfield",
        "title": "Frontend Developer"
        "location": "Halifax, NS"
      }
    JSON
    assert_equal "Line 3: missing a comma.", error_from(broken)
  end

  test "line numbers count from the top of what was pasted, fence included" do
    assert_equal "Line 3: missing a comma.", error_from("```json\n{\n  \"name\": \"Dana\"\n  \"title\": \"Dev\"\n}\n```")
  end

  test "says when a quote is never closed" do
    assert_equal "Line 2: the text starting with \"Dana Whitfield, is missing its closing quote.",
      error_from("{\n  \"name\": \"Dana Whitfield,\n  \"title\": \"Dev\"\n}")
  end

  test "says when the JSON was cut off" do
    assert_match "The JSON ends early: the [ on line 2 is never closed with ]", error_from("{\n  \"links\": [\"a.com\",")
    assert_match "the { on line 2 is never closed", error_from("```json\n{ \"name\": \"Dana\"")
  end

  test "says when a colon is missing or the brackets don't match" do
    assert_equal "Line 1: missing a colon after \"name\".", error_from('{ "name" "Dana" }')
    assert_match "Line 1: found } where ] was expected", error_from('{ "links": ["a.com" }')
    assert_match "Line 1: expected a name in quotes", error_from("{ name: \"Dana\" }")
  end

  test "says when there's no JSON at all" do
    assert_match "couldn't find any JSON", error_from("Sure! Here is your resume.")
    assert_match "Paste the JSON", error_from("   ")
  end

  test "missing fields become blank, and blank example entries are dropped" do
    content = content_from('{ "name": "Dana", "experience": [{ "title": "", "company": "", "bullets": [""] }, { "company": "Tidewater" }] }')

    assert_equal "", content["phone"]
    assert_equal [], content["links"]
    assert_equal [], content["education"]
    job = content["experience"].sole
    assert_equal "Tidewater", job["company"]
    assert_equal "", job["start"]
    assert_equal [], job["bullets"]
  end

  test "reports fields with the wrong shape" do
    result = ResumeContent.normalize(ResumeImport.parse(<<~JSON))
      { "name": ["Dana"], "skills": "React",
        "experience": [{ "title": "Dev", "start": "last spring", "bullets": [{ "text": "x" }] }] }
    JSON

    assert_equal [
      "\"name\" should be text in quotes.",
      "\"skills\" should be a list in [ ].",
      "experience 1: \"start\" should be a date like \"2022-08\" or \"Present\", but it's \"last spring\".",
      "experience 1: \"bullets\" should only have text in quotes."
    ], result.problems
    assert_not result.ok?

    assert_equal [ "The JSON should be one { ... } block holding the whole resume." ], ResumeContent.normalize([]).problems
  end

  test "reads dates written a few common ways" do
    {
      "2022-08" => "2022-08", "2022-8" => "2022-08", "2022-08-15" => "2022-08", "08/2022" => "2022-08",
      "Aug 2022" => "2022-08", "August 2022" => "2022-08", "Sept. 2022" => "2022-09",
      "2022" => "2022", "present" => "Present", "Current" => "Present", "" => ""
    }.each { |written, stored| assert_equal stored, ResumeContent.parse_date(written), written }

    [ "2022-13", "Smarch 2022", "soon" ].each { |written| assert_nil ResumeContent.parse_date(written), written }
  end

  test "fills blank contact fields from an earlier resume, and only blank ones" do
    previous = content_from(CLEAN)
    content = content_from('{ "name": "Dana W.", "title": "Backend Developer", "phone": "", "email": "new@example.com" }')

    filled = ResumeContent.fill_contact!(content, previous)

    assert_equal %w[location phone links], filled
    assert_equal "Dana W.", content["name"]
    assert_equal "+1 902 555 0142", content["phone"]
    assert_equal "Halifax, NS", content["location"]
    assert_equal "new@example.com", content["email"]
    assert_equal previous["links"], content["links"]
    assert_equal "Backend Developer", content["title"]
    assert_equal "", content["summary"]

    assert_equal [], ResumeContent.fill_contact!(content_from('{ "name": "Dana" }'), nil)
  end
end
