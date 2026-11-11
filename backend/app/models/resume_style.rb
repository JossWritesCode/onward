# A resume's look, apart from its template: text size, line spacing, margins,
# the space between sections, and an accent colour (used by Modern).
#
# Values are kept within sensible ranges here, so a resume can't be saved at
# 4pt by a stray slider. The frontend's Design panel offers the same ranges
# (see frontend/src/lib/resume/style.ts); keep the two in step.
#
# Plain Ruby on purpose (no Rails helpers), so it's easy to test on its own.
module ResumeStyle
  # name => [minimum, maximum, step]
  RANGES = {
    "fontSize" => [ 8.5, 11.0, 0.5 ],    # body text, in points
    "lineHeight" => [ 1.15, 1.6, 0.05 ], # as a multiple of the text size
    "margin" => [ 0.4, 1.0, 0.05 ],      # page margins, in inches
    "sectionGap" => [ 4.0, 20.0, 1.0 ]   # space above each section heading, in points
  }.freeze

  # The "Normal" density. Roomy and Tight live in the frontend, since they're
  # only shortcuts that set these four values.
  DEFAULTS = {
    "fontSize" => 9.5,
    "lineHeight" => 1.35,
    "margin" => 0.45,
    "sectionGap" => 11.0,
    "accent" => "#4f46e5"
  }.freeze

  ACCENT = /\A#\h{6}\z/

  module_function

  # The stored style with every key present and every value within range.
  # Unknown keys are dropped, and anything unreadable falls back to the default.
  def normalize(style)
    style = style.is_a?(Hash) ? style.to_h.transform_keys(&:to_s) : {}
    DEFAULTS.merge(style.slice(*DEFAULTS.keys)).to_h do |key, value|
      [ key, key == "accent" ? accent(value) : number(key, value) ]
    end
  end

  def number(key, value)
    minimum, maximum, step = RANGES.fetch(key)
    number = Float(value, exception: false)
    return DEFAULTS[key] if number.nil? || !number.finite?

    stepped = minimum + ((number - minimum) / step).round * step
    stepped.clamp(minimum, maximum).round(2)
  end

  def accent(value)
    string = value.to_s.strip.downcase
    string.match?(ACCENT) ? string : DEFAULTS["accent"]
  end
end
