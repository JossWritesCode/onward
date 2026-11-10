# The shape of a resume's content, shared by every template:
#
#   { "name", "title", "location", "phone", "email", "links" => [],
#     "summary",
#     "skills"     => [ { "label", "items" => [] } ],
#     "experience" => [ { "title", "company", "location", "start", "end", "bullets" => [] } ],
#     "education"  => [ { "school", "degree", "date", "honors" } ],
#     "sections"   => [ { "heading", "items" => [ { "title", "subtitle", "date", "bullets" => [] } ] } ] }
#
# Dates are stored as "YYYY-MM", "YYYY", "Present", or "". Templates turn them
# into "Jan '24 - Present".
#
# Plain Ruby on purpose (no Rails helpers), so it's easy to test on its own.
module ResumeContent
  TEXT_FIELDS = %w[name title location phone email summary].freeze
  # Filled in from your most recent resume when a paste leaves them blank,
  # since the prompt tells the AI never to make these up.
  CONTACT_FIELDS = %w[name location phone email links].freeze

  MAX_TEXT = 3000
  MAX_ITEMS = 40
  MAX_PROBLEMS = 5

  MONTHS = %w[january february march april may june july august september october november december].freeze
  PRESENT_WORDS = %w[present current now today ongoing].freeze

  Result = Struct.new(:content, :problems) do
    def ok?
      problems.empty?
    end
  end

  module_function

  # Checks parsed JSON against the shape above. Returns the tidied content and
  # a list of problems in plain words. Missing fields become blank, and blank
  # entries (like the prompt's empty example job) are dropped.
  def normalize(data)
    return Result.new(nil, [ "The JSON should be one { ... } block holding the whole resume." ]) unless data.is_a?(Hash)

    problems = []
    content = {}
    TEXT_FIELDS.each { |field| content[field] = text(data[field], "\"#{field}\"", problems) }
    content["links"] = strings(data["links"], "\"links\"", problems)

    content["skills"] = entries(data["skills"], "skills", problems) do |group, where|
      {
        "label" => text(group["label"], "#{where}: \"label\"", problems),
        "items" => strings(group["items"], "#{where}: \"items\"", problems)
      }
    end

    content["experience"] = entries(data["experience"], "experience", problems) do |job, where|
      {
        "title" => text(job["title"], "#{where}: \"title\"", problems),
        "company" => text(job["company"], "#{where}: \"company\"", problems),
        "location" => text(job["location"], "#{where}: \"location\"", problems),
        "start" => date(job["start"], "#{where}: \"start\"", problems),
        "end" => date(job["end"], "#{where}: \"end\"", problems),
        "bullets" => bullets(job["bullets"], "#{where}: \"bullets\"", problems)
      }
    end

    content["education"] = entries(data["education"], "education", problems) do |school, where|
      {
        "school" => text(school["school"], "#{where}: \"school\"", problems),
        "degree" => text(school["degree"], "#{where}: \"degree\"", problems),
        "date" => date(school["date"], "#{where}: \"date\"", problems),
        "honors" => text(school["honors"], "#{where}: \"honors\"", problems)
      }
    end

    content["sections"] = entries(data["sections"], "sections", problems) do |section, where|
      {
        "heading" => text(section["heading"], "#{where}: \"heading\"", problems),
        "items" => entries(section["items"], "#{where}: items", problems) do |item, item_where|
          {
            "title" => text(item["title"], "#{item_where}: \"title\"", problems),
            "subtitle" => text(item["subtitle"], "#{item_where}: \"subtitle\"", problems),
            # Free text is fine here: a project might say "2023" or "Ongoing".
            "date" => loose_date(item["date"], "#{item_where}: \"date\"", problems),
            "bullets" => bullets(item["bullets"], "#{item_where}: \"bullets\"", problems)
          }
        end
      }
    end

    Result.new(content, problems.first(MAX_PROBLEMS))
  end

  # Copies contact details the new resume left blank from an earlier one.
  # Returns the names of the fields it filled.
  def fill_contact!(content, previous)
    return [] unless previous.is_a?(Hash)

    CONTACT_FIELDS.select do |field|
      next false unless empty?(content[field]) && !empty?(previous[field])

      content[field] = previous[field]
      true
    end
  end

  def empty?(value)
    case value
    when nil then true
    when String then value.strip.empty?
    when Array then value.all? { |item| empty?(item) }
    when Hash then value.values.all? { |item| empty?(item) }
    else false
    end
  end

  # "2022-08", "2022", "Present", or "". Also reads "Aug 2022", "August 2022",
  # "08/2022", and "2022-08-15". Returns nil when it can't tell.
  def parse_date(value)
    string = value.to_s.strip
    return "" if string.empty?
    return "Present" if PRESENT_WORDS.include?(string.downcase)
    return string if string.match?(/\A\d{4}\z/)

    year, month =
      if (found = string.match(/\A(\d{4})-(\d{1,2})(-\d{1,2})?\z/)) then [ found[1], found[2].to_i ]
      elsif (found = string.match(%r{\A(\d{1,2})/(\d{4})\z})) then [ found[2], found[1].to_i ]
      elsif (found = string.match(/\A([A-Za-z]{3,9})\.?,? (\d{4})\z/))
        # Three letters are enough to tell the months apart ("Mar" from "May").
        named = MONTHS.index { |name| name.start_with?(found[1].downcase) }
        [ found[2], named ? named + 1 : 0 ]
      end
    return nil unless year && month.between?(1, 12)

    format("%s-%02d", year, month)
  end

  # --- helpers -------------------------------------------------------------

  def text(value, where, problems)
    case value
    when nil then ""
    when String then value.strip[0, MAX_TEXT]
    when Numeric then value.to_s
    else
      problems << "#{where} should be text in quotes."
      ""
    end
  end

  # A list of strings. A single string is split on commas, since AIs
  # sometimes write "React, TypeScript" instead of a list.
  def strings(value, where, problems)
    list =
      case value
      when nil then []
      when String then value.split(",")
      when Array then value
      else
        problems << "#{where} should be a list in [ ]."
        []
      end

    list.first(MAX_ITEMS).filter_map do |item|
      unless item.nil? || item.is_a?(String) || item.is_a?(Numeric)
        problems << "#{where} should only have text in quotes."
        next
      end

      cleaned = item.to_s.strip[0, MAX_TEXT]
      cleaned unless cleaned.empty?
    end
  end

  # Like strings, but a single string is one bullet, and bullet symbols the
  # AI added anyway are removed.
  def bullets(value, where, problems)
    value = [ value ] if value.is_a?(String)
    strings(value, where, problems).filter_map do |bullet|
      cleaned = bullet.sub(/\A[•·◦‣*-]\s+/, "")
      cleaned unless cleaned.empty?
    end
  end

  def date(value, where, problems)
    unless value.nil? || value.is_a?(String) || value.is_a?(Integer)
      problems << "#{where} should be a date in quotes, like \"2022-08\"."
      return ""
    end

    parsed = parse_date(value)
    return parsed if parsed

    problems << "#{where} should be a date like \"2022-08\" or \"Present\", but it's \"#{value}\"."
    ""
  end

  def loose_date(value, where, problems)
    return text(value, where, problems) unless value.is_a?(String) || value.is_a?(Integer)

    parse_date(value) || value.to_s.strip[0, 40]
  end

  # A list of { ... } entries. Yields each one with a label like
  # "experience 2" for messages, and drops the ones that come back blank.
  def entries(value, name, problems)
    return [] if value.nil?

    unless value.is_a?(Array)
      problems << "\"#{name}\" should be a list in [ ]."
      return []
    end

    value.first(MAX_ITEMS).each_with_index.filter_map do |entry, index|
      where = "#{name} #{index + 1}"
      unless entry.is_a?(Hash)
        problems << "#{where} should be a { ... } block."
        next
      end

      built = yield(entry, where)
      built unless empty?(built)
    end
  end
end
