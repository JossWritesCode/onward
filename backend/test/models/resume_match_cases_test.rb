require "test_helper"
require_relative "../support/resume_match_cases"

# The hand-checked answer key for job match (issue #19). These tests make
# sure every case is filled in correctly, and once the posting reader
# exists, report how close it gets to the answers.
class ResumeMatchCasesTest < ActiveSupport::TestCase
  # Start here, then raise or lower once the posting reader has real numbers.
  RECALL_FLOOR = 0.80
  PRECISION_FLOOR = 0.90
  MIN_CASES = 12

  def result
    @result ||= ResumeMatchCases.load(Pathname(file_fixture_path).join(ResumeMatchCases::DIR))
  end

  test "every case is filled in correctly" do
    assert_empty result.problems, "Fix these job match cases:\n#{result.problems.join("\n")}"
  end

  test "the cases cover every situation the reader and score need to handle" do
    assert_operator result.cases.size, :>=, MIN_CASES, "There should be at least #{MIN_CASES} job match cases."

    missing = ResumeMatchCases::COVERS - result.cases.flat_map(&:covers)
    assert_empty missing, "No case covers: #{missing.join(', ')}"

    poor_fits = result.cases.count { |kase| kase.fit == "poor" }
    assert_operator poor_fits, :>=, 2, "There should be at least two résumés checked against a posting they don't fit."
  end

  test "the worked example in issue #19 comes to about 70%" do
    kase = result.cases.find { |found| found.id == "lantern_frontend" }
    must = kase.requirements.select { |requirement| requirement["importance"] == "must" }

    assert_equal 70, (kase.hand_score / 5).round * 5
    assert_equal 8, must.size
    assert_equal 6, must.count { |requirement| ResumeMatchCases.credit(requirement).positive? }
  end

  test "a broken case gets a message that says what to fix" do
    good = YAML.safe_load(file_fixture("#{ResumeMatchCases::DIR}/lantern_frontend.yml").read)
    broken = good.deep_dup
    broken["expected"]["requirements"][1]["credit"] = "lots"
    broken["expected"]["requirements"][2]["evidence"] = [ "experience.9.bullets.0" ]
    broken["expected"]["requirements"][3]["evidence"] = [ "sections.0.items.0.bullets.7" ]
    broken["expected"]["score_band"] = [ 90, 100 ]

    problems = ResumeMatchCases.check("broken" => broken, "fine" => good).problems

    assert_includes problems, "broken.yml: requirement 2 (react): credit: should be shown, named, related, or none."
    assert_includes problems, "broken.yml: requirement 3 (typescript): with no credit, evidence: should be left out."
    assert_includes problems, "broken.yml: requirement 4 (graphql): evidence \"sections.0.items.0.bullets.7\" isn't anywhere in the résumé."
    assert problems.none? { |problem| problem.start_with?("fine.yml") }
  end

  test "a score that doesn't fit its band is caught" do
    good = YAML.safe_load(file_fixture("#{ResumeMatchCases::DIR}/lantern_frontend.yml").read)
    good["expected"]["score_band"] = [ 90, 100 ]

    problems = ResumeMatchCases.check("off" => good).problems

    assert_equal [ "off.yml: the requirements work out to 70.4%, outside score_band: [90, 100]." ], problems
  end

  test "a poor fit has to score well below the same résumé's good fit" do
    good = YAML.safe_load(file_fixture("#{ResumeMatchCases::DIR}/lantern_frontend.yml").read)
    close = { "name" => "Too close", "resume_from" => "good", "posting_from" => "good", "fit" => "poor",
              "today" => "2026-11-26", "expected" => good["expected"] }

    problems = ResumeMatchCases.check("good" => good, "close" => close).problems

    assert_equal [ "close.yml: the résumé should score at least 20 points higher on good than here, but the gap is 0." ], problems
  end

  test "recall and precision count requirements that share a skill id" do
    found = Struct.new(:skills, :importance)
    kase = result.cases.find { |each| each.id == "kestrel_java" }

    report = ResumeMatchCases.report([ kase ]) do
      [
        found.new([ "java" ], "must"),
        found.new([ "spring_boot" ], "must"),
        found.new([ "javascript" ], "nice"),
        found.new([ "react" ], "nice"),
        found.new([ "jira" ], "nice")
      ]
    end

    # 4 of the 7 expected were found, and 4 of the 5 found were right.
    assert_in_delta 4.0 / 7, report.recall
    assert_in_delta 4.0 / 5, report.precision
    assert_equal 3, report.importance_right
    assert_equal({ "kestrel_java" => [ "years", "sql", "insurance" ] }, report.misses)
  end

  test "reports how well the posting reader finds requirements" do
    skip "The posting reader (ResumeMatch::Posting) comes in issue #21." unless defined?(ResumeMatch::Posting)

    report = ResumeMatchCases.report(result.cases) { |kase| ResumeMatch::Posting.read(kase.posting).requirements }
    puts "\n#{report}"

    assert_operator report.recall, :>=, RECALL_FLOOR, report.to_s
    assert_operator report.precision, :>=, PRECISION_FLOOR, report.to_s
  end
end
