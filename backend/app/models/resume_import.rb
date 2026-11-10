# Reads the JSON someone pastes into Resumes > New resume.
#
# The JSON was written by an AI, so it's often almost right. This reader
# forgives the usual slips: code-fence markers (```json), chatter before or
# after the JSON, trailing commas, curly quotes used as string quotes, and
# leftover ** from markdown. When it can't make sense of the text, it says
# where it gave up in plain words, like "Line 12: missing a comma".
#
# Plain Ruby on purpose (no Rails helpers), so it's easy to test on its own.
class ResumeImport
  # A problem a person can fix, worded for them.
  class Error < StandardError; end

  MAX_LENGTH = 100_000
  MAX_DEPTH = 12

  OPEN_QUOTES = [ '"', "\u201C", "\u201D", "\u201E", "\u201F" ].freeze
  CURLY_CLOSERS = [ '"', "\u201C", "\u201D" ].freeze
  # A UTF-8 byte order mark and no-break spaces sometimes ride along with a paste.
  SPACES = [ " ", "\t", "\n", "\r", "\u00A0", "\uFEFF" ].freeze
  ESCAPES = { '"' => '"', "\\" => "\\", "/" => "/", "b" => "\b", "f" => "\f", "n" => "\n", "r" => "\r", "t" => "\t" }.freeze
  LITERALS = { "true" => true, "false" => false, "null" => nil }.freeze
  NUMBER = /\A-?\d+(\.\d+)?([eE][+-]?\d+)?/

  # The pasted text as a Hash, with markdown leftovers cleaned out of the
  # values. Raises ResumeImport::Error with a message for the person.
  def self.parse(text)
    new(text).parse
  end

  def initialize(text)
    @text = text.to_s
    @position = 0
  end

  def parse
    raise Error, "Paste the JSON the AI replied with, then press Format." if @text.strip.empty?
    raise Error, "That's too long to be a resume. Paste only the JSON code block." if @text.length > MAX_LENGTH

    # Skip the opening code fence and anything the AI said before the JSON.
    @position = @text.index("{") ||
      raise(Error, "We couldn't find any JSON in that. Paste the whole code block the AI replied with, starting with {.")

    # Anything after the closing } (the closing fence, a sign-off) is ignored.
    self.class.clean(read_object(1))
  end

  # Strips markdown bold markers the AI left in values: "**React**" -> "React".
  def self.clean(value)
    case value
    when String then value.gsub("**", "").strip
    when Array then value.map { |item| clean(item) }
    when Hash then value.transform_values { |item| clean(item) }
    else value
    end
  end

  private

  def read_value(depth)
    fail_at(@position, "this is nested too deeply to be a resume") if depth > MAX_DEPTH

    skip_spaces
    character = peek
    if character.nil? then fail_at(@text.length, "the JSON ends early")
    elsif character == "{" then read_object(depth)
    elsif character == "[" then read_array(depth)
    elsif OPEN_QUOTES.include?(character) then read_string
    else read_bare_value
    end
  end

  def read_object(depth)
    opened_on = line_at(@position)
    @position += 1
    object = {}

    loop do
      skip_spaces
      character = peek
      ends_early("{", opened_on) if character.nil?
      if character == "}"
        @position += 1
        return object
      end
      fail_at(@position, "expected a name in quotes, like \"title\", but found #{describe(character)}") unless OPEN_QUOTES.include?(character)

      key = read_string
      key_ended_at = @position
      skip_spaces
      fail_at(key_ended_at - 1, "missing a colon after \"#{key}\"") unless peek == ":"
      @position += 1

      object[key] = read_value(depth + 1)
      break object if finish_item("}", "{", opened_on)
    end
  end

  def read_array(depth)
    opened_on = line_at(@position)
    @position += 1
    array = []

    loop do
      skip_spaces
      character = peek
      ends_early("[", opened_on) if character.nil?
      if character == "]"
        @position += 1
        return array
      end

      array << read_value(depth + 1)
      break array if finish_item("]", "[", opened_on)
    end
  end

  # After a value: a comma means more to come, the closer means done.
  # Returns true when the object or array is finished. A comma right before
  # the closer (a trailing comma) is fine: the next loop sees the closer.
  def finish_item(closer, opener, opened_on)
    value_ended_at = @position
    skip_spaces
    character = peek

    if character == ","
      @position += 1
      false
    elsif character == closer
      @position += 1
      true
    elsif character.nil?
      ends_early(opener, opened_on)
    elsif character == "}" || character == "]"
      fail_at(@position, "found #{character} where #{closer} was expected. The #{opener} on line #{opened_on} isn't closed")
    else
      # Something new starts where a comma should be. Point at the end of the
      # value before it, since that's where the comma belongs.
      fail_at(value_ended_at - 1, "missing a comma")
    end
  end

  def read_string
    start = @position
    opener = peek
    curly = opener != '"'
    @position += 1
    result = +""

    loop do
      character = peek
      if character.nil? || character == "\n"
        fail_at(start, "the text starting with #{preview(start)} is missing its closing quote")
      elsif character == "\\"
        result << read_escape
      elsif character == '"' && !curly
        @position += 1
        return result
      elsif curly && CURLY_CLOSERS.include?(character) && closes_string?
        @position += 1
        return result
      else
        result << character
        @position += 1
      end
    end
  end

  # Inside a string that opened with a curly quote, a quote only ends the
  # string if what follows looks like JSON carrying on. That keeps quotes
  # inside the text, like the "sell or trade" workflow, as part of the text.
  def closes_string?
    rest = @position + 1
    rest += 1 while SPACES.include?(@text[rest])
    following = @text[rest]
    following.nil? || [ ",", ":", "]", "}" ].include?(following)
  end

  def read_escape
    escaped = @text[@position + 1]
    if escaped == "u"
      code = @text[@position + 2, 4].to_s
      fail_at(@position, "\\u needs four letters or digits after it") unless code.match?(/\A\h{4}\z/)
      @position += 6
      [ code.hex ].pack("U")
    elsif ESCAPES.key?(escaped)
      @position += 2
      ESCAPES[escaped]
    else
      # A stray backslash, as in "C:\Users". Keep it as typed.
      @position += 1
      "\\"
    end
  end

  # true, false, null, or a number.
  def read_bare_value
    rest = @text[@position, 40]
    LITERALS.each do |word, value|
      next unless rest.match?(/\A#{word}\b/)

      @position += word.length
      return value
    end

    number = rest[NUMBER]
    fail_at(@position, "expected a value in quotes but found #{describe(peek)}") if number.nil?
    @position += number.length
    number.match?(/[.eE]/) ? number.to_f : number.to_i
  end

  def skip_spaces
    @position += 1 while SPACES.include?(peek)
  end

  def peek
    @text[@position]
  end

  def describe(character)
    case character
    when "'" then "a single quote (JSON needs double quotes)"
    when "`" then "a ` mark"
    else "\"#{character}\""
    end
  end

  def preview(start)
    snippet = @text[start, 24].to_s.split("\n").first.to_s
    snippet.length < 24 ? snippet : "#{snippet}..."
  end

  def line_at(position)
    @text[0, [ position, 0 ].max].count("\n") + 1
  end

  def ends_early(opener, opened_on)
    closer = opener == "{" ? "}" : "]"
    raise Error, "The JSON ends early: the #{opener} on line #{opened_on} is never closed with #{closer}. Check that you copied the whole code block."
  end

  def fail_at(position, message)
    raise Error, "Line #{line_at(position)}: #{message}."
  end
end
