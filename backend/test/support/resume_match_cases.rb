# Loads the job match answer key in test/fixtures/files/resume_match/ and
# checks that every case is filled in correctly. "Job match cases" in
# docs/development.md explains the format.
#
# The cases are written by hand, before the code that scores them, so the
# posting reader and the score have something real to be checked against.
# The numbers here follow the design in issue #19.
module ResumeMatchCases
  DIR = "resume_match"

  # Must-haves count three times as much as nice-to-haves.
  WEIGHTS = { "must" => 3, "nice" => 1 }.freeze

  # How much each kind of evidence earns:
  #   shown:   in a job, a project, or education
  #   named:   only in the skills list, summary, or title
  #   related: a close skill, like MySQL for PostgreSQL
  CREDITS = { "shown" => 1.0, "named" => 0.7, "related" => 0.5, "none" => 0.0 }.freeze
  SHOWN_IN = %w[experience sections education].freeze
  NAMED_IN = %w[skills summary title].freeze

  # Where each requirement lands in the panel. "counted" means it's credited
  # and there's nothing to suggest.
  GROUPS_FOR_CREDIT = {
    "shown" => %w[counted easy_to_miss],
    "named" => %w[counted easy_to_miss],
    "related" => %w[easy_to_miss maybe_missing],
    "none" => %w[maybe_missing gap],
    # Some of the years asked for. A real gap, since dates aren't something to change.
    "partial" => %w[counted gap]
  }.freeze

  # Why there's no percentage, when there isn't one.
  NOT_ENOUGH_REASONS = %w[no_posting too_short too_few_requirements low_coverage empty_resume].freeze
  MIN_WORDS = 60
  MIN_REQUIREMENTS = 4

  # A résumé should score at least this much higher on a posting it fits
  # than on one it doesn't.
  MIN_GAP_BETWEEN_FITS = 20

  # Situations the set has to cover (issue #20). Each case lists the ones it covers.
  COVERS = %w[
    worked_example no_headings short_posting non_tech degree_or_equivalent years
    java_vs_javascript go_word soft_skills skills_only_resume poor_fit
  ].freeze

  CASE_KEYS = %w[name covers today resume resume_from posting posting_from fit expected].freeze
  EXPECTED_KEYS = %w[score_band not_enough_information no_headings requirements not_scored].freeze
  REQUIREMENT_KEYS = %w[skills importance credit evidence group years field note].freeze
  SKILL_ID = /\A[a-z0-9_]+\z/

  Case = Data.define(:id, :name, :covers, :today, :resume, :posting, :fit, :resume_from, :expected) do
    def scored?
      expected["not_enough_information"].nil?
    end

    def requirements
      expected["requirements"]
    end

    # The score the answer key itself works out to, before rounding.
    def hand_score
      ResumeMatchCases.score(requirements)
    end
  end

  Result = Data.define(:cases, :problems)

  # How well a posting reader did against the answer key.
  Report = Data.define(:expected, :found, :matched, :importance_right, :misses) do
    def recall = expected.zero? ? 1.0 : matched.fdiv(expected)
    def precision = found.zero? ? 1.0 : matched.fdiv(found)

    def to_s
      lines = [
        format("Job match posting reader: recall %d%% (%d of %d), precision %d%% (%d of %d), must or nice right on %d of %d found",
          recall * 100, matched, expected, precision * 100, matched, found, importance_right, matched)
      ]
      misses.each { |id, missed| lines << "  #{id}: missed #{missed.join(', ')}" }
      lines.join("\n")
    end
  end

  module_function

  def load(dir)
    raw = {}
    problems = []
    Pathname(dir).glob("*.yml").sort.each do |path|
      raw[path.basename(".yml").to_s] = YAML.safe_load(path.read)
    rescue Psych::Exception => error
      problems << "#{path.basename} isn't valid YAML: #{error.message}"
    end

    result = check(raw)
    Result.new(cases: result.cases, problems: problems + result.problems)
  end

  # Checks cases given as { "file_name" => parsed YAML }. Returns the cases
  # that passed and a list of problems, each starting with the file name.
  def check(raw)
    problems = []
    cases = raw.filter_map do |id, data|
      found = []
      kase = build(id, data, raw, found)
      problems.concat(found.map { |problem| "#{id}.yml: #{problem}" })
      kase if found.empty?
    end

    by_id = cases.index_by(&:id)
    cases.each do |kase|
      next unless kase.fit == "poor"

      source = by_id[kase.resume_from]
      next unless source&.scored? && kase.scored?

      gap = source.hand_score - kase.hand_score
      next if gap >= MIN_GAP_BETWEEN_FITS

      problems << "#{kase.id}.yml: the résumé should score at least #{MIN_GAP_BETWEEN_FITS} points higher on " \
        "#{source.id} than here, but the gap is #{gap.round}."
    end

    Result.new(cases:, problems:)
  end

  # The weighted share of requirements with evidence, from 0 to 100.
  def score(requirements)
    total = requirements.sum { |requirement| WEIGHTS[requirement["importance"]] }
    return 0.0 if total.zero?

    earned = requirements.sum { |requirement| WEIGHTS[requirement["importance"]] * credit(requirement) }
    earned * 100.0 / total
  end

  def credit(requirement)
    value = requirement["credit"]
    value.is_a?(Numeric) ? value.to_f : CREDITS.fetch(value)
  end

  # Compares what a posting reader found with the answer key. The block gets
  # each case and returns the reader's requirements, each answering `skills`
  # (a list of skill ids) and `importance` ("must" or "nice"). A found
  # requirement matches an expected one when they share a skill id.
  def report(cases)
    totals = { expected: 0, found: 0, matched: 0, importance_right: 0 }
    misses = {}

    cases.each do |kase|
      next if kase.posting.strip.empty?

      found = Array(yield(kase)).map { |requirement| [ Array(requirement.skills).map(&:to_s), requirement.importance.to_s ] }
      unused = found.dup
      missed = []

      kase.requirements.each do |expected|
        index = unused.index { |skills, _| (skills & expected["skills"]).any? }
        if index
          totals[:matched] += 1
          totals[:importance_right] += 1 if unused[index][1] == expected["importance"]
          unused.delete_at(index)
        else
          missed << expected["skills"].join(" or ")
        end
      end

      totals[:expected] += kase.requirements.size
      totals[:found] += found.size
      misses[kase.id] = missed if missed.any?
    end

    Report.new(**totals, misses:)
  end

  # --- checking one case -----------------------------------------------------

  def build(id, data, raw, problems)
    unless data.is_a?(Hash)
      problems << "the file should be one block of keys, like name: and expected:."
      return
    end

    unknown(data, CASE_KEYS, "the case", problems)
    problems << "add a name: that says what the case is about." if blank?(data["name"])

    covers = Array(data["covers"])
    (covers - COVERS).each { |tag| problems << "covers: \"#{tag}\" isn't one of #{COVERS.join(', ')}." }

    resume = borrowed(data, raw, "resume", problems)
    posting = borrowed(data, raw, "posting", problems)
    return if problems.any?

    resume = check_resume(resume, problems)
    posting = posting.to_s
    today = check_today(data["today"], problems)

    fit = data["fit"]
    if fit && fit != "poor"
      problems << "fit: should be \"poor\" or left out."
    elsif fit == "poor" && data["resume_from"].nil?
      problems << "fit: poor needs resume_from:, so there's a case where the same résumé fits."
    end

    expected = data["expected"]
    unless expected.is_a?(Hash)
      problems << "add an expected: block with the hand-checked answers."
      return
    end
    unknown(expected, EXPECTED_KEYS, "expected", problems)

    requirements = expected["requirements"]
    unless requirements.is_a?(Array)
      problems << "expected: needs a requirements: list (it can be empty, [])."
      return
    end
    requirements.each_with_index do |requirement, index|
      check_requirement(requirement, "requirement #{index + 1}", resume, today, problems)
    end
    return if problems.any?

    if expected["no_headings"] && requirements.any? { |requirement| requirement["importance"] != "must" }
      problems << "with no_headings: true, every requirement should be a must, since there's nothing to say otherwise."
    end
    check_outcome(expected, posting, requirements, problems)
    return if problems.any?

    Case.new(id:, name: data["name"], covers:, today:, resume:, posting:, fit:,
      resume_from: data["resume_from"], expected:)
  end

  # The résumé or posting, either written in this case or borrowed from
  # another one with resume_from: or posting_from:.
  def borrowed(data, raw, key, problems)
    from = data["#{key}_from"]
    return data[key] if from.nil?

    if data.key?(key)
      problems << "use #{key}: or #{key}_from:, not both."
    elsif !raw[from].is_a?(Hash) || !raw[from].key?(key)
      problems << "#{key}_from: \"#{from}\" should name another case that has its own #{key}:."
    else
      return raw[from][key]
    end
    nil
  end

  def check_resume(resume, problems)
    result = ResumeContent.normalize(resume)
    result.problems.each { |problem| problems << "resume: #{problem}" }
    result.content
  end

  def check_today(value, problems)
    return if value.nil?

    Date.iso8601(value.to_s)
  rescue Date::Error
    problems << "today: should be a date in quotes, like \"2026-11-26\"."
    nil
  end

  def check_requirement(requirement, where, resume, today, problems)
    unless requirement.is_a?(Hash)
      problems << "#{where} should be a block of keys, like skills: and importance:."
      return
    end
    unknown(requirement, REQUIREMENT_KEYS, where, problems)

    skills = requirement["skills"]
    unless skills.is_a?(Array) && skills.any? && skills.all? { |skill| skill.is_a?(String) && skill.match?(SKILL_ID) }
      problems << "#{where}: skills: should be a list of ids in lowercase_with_underscores, like [ react ] or [ jest, cypress ]."
      return
    end
    where = "#{where} (#{skills.join(' or ')})"

    unless WEIGHTS.key?(requirement["importance"])
      problems << "#{where}: importance: should be must or nice."
    end

    years = skills == [ "years" ]
    if years
      problems << "#{where}: add years:, the number of years the posting asks for." unless requirement["years"].is_a?(Numeric)
      problems << "#{where}: add today: to the case, so years are counted to a fixed date." unless today
    elsif skills.include?("years")
      problems << "#{where}: years should be a requirement of its own."
    end

    credit = requirement["credit"]
    if credit.is_a?(Numeric)
      problems << "#{where}: only a years requirement can have a number for credit:." unless years
      problems << "#{where}: credit: should be between 0 and 1." unless credit.between?(0, 1)
      kind = if credit.zero? then "none" elsif credit >= 1 then "shown" else "partial" end
    elsif CREDITS.key?(credit)
      kind = credit
    else
      problems << "#{where}: credit: should be shown, named, related, or none."
      return
    end

    check_evidence(requirement["evidence"], kind, where, resume, problems)

    group = requirement["group"]
    allowed = GROUPS_FOR_CREDIT.fetch(kind)
    unless allowed.include?(group)
      problems << "#{where}: with credit #{credit}, group: should be #{allowed.join(' or ')}."
    end
  end

  # Evidence is a list of places in the résumé, like experience.0.bullets.2
  # or skills.0.items.1. Counting starts at 0.
  def check_evidence(evidence, kind, where, resume, problems)
    paths = Array(evidence)
    if kind == "none"
      problems << "#{where}: with no credit, evidence: should be left out." if paths.any?
      return
    end
    if paths.empty?
      problems << "#{where}: add evidence:, the places in the résumé that earn the credit."
      return
    end

    paths.each do |path|
      problems << "#{where}: evidence \"#{path}\" isn't anywhere in the résumé." if blank?(dig(resume, path))
    end

    roots = paths.map { |path| path.to_s.split(".").first }
    if %w[shown partial].include?(kind) && (roots & SHOWN_IN).empty?
      problems << "#{where}: shown credit needs evidence in #{SHOWN_IN.join(', ')}."
    elsif kind == "named" && (roots - NAMED_IN).any?
      problems << "#{where}: named credit means it's only in #{NAMED_IN.join(', ')}. Use shown if it's in a job or project."
    end
  end

  def check_outcome(expected, posting, requirements, problems)
    reason = expected["not_enough_information"]
    band = expected["score_band"]

    if reason
      problems << "not_enough_information: should be one of #{NOT_ENOUGH_REASONS.join(', ')}." unless NOT_ENOUGH_REASONS.include?(reason)
      problems << "a case with not_enough_information: shouldn't have a score_band:." if band
      problems << "the posting is blank, so not_enough_information: should be no_posting." if posting.strip.empty? && reason != "no_posting"
      return
    end

    words = posting.split.size
    if posting.strip.empty?
      problems << "the posting is blank, so add not_enough_information: no_posting."
    elsif words < MIN_WORDS
      problems << "the posting has #{words} words, under #{MIN_WORDS}, so add not_enough_information: too_short."
    elsif requirements.size < MIN_REQUIREMENTS
      problems << "there are only #{requirements.size} requirements, under #{MIN_REQUIREMENTS}, so add not_enough_information: too_few_requirements."
    end

    unless band.is_a?(Array) && band.size == 2 && band.all?(Integer) && band[0] <= band[1] && band.all? { |n| n.between?(0, 100) }
      problems << "add score_band: [ low, high ], whole numbers from 0 to 100, or not_enough_information:."
      return
    end

    score = score(requirements)
    unless score.between?(band[0], band[1])
      problems << "the requirements work out to #{score.round(1)}%, outside score_band: #{band.inspect}."
    end
  end

  def unknown(hash, keys, where, problems)
    (hash.keys - keys).each { |key| problems << "#{where} has a key \"#{key}\" that isn't used. Expected: #{keys.join(', ')}." }
  end

  def dig(resume, path)
    path.to_s.split(".").reduce(resume) do |node, part|
      case node
      when Hash then node[part]
      when Array then part.match?(/\A\d+\z/) ? node[part.to_i] : nil
      end
    end
  end

  def blank?(value)
    ResumeContent.empty?(value)
  end
end
