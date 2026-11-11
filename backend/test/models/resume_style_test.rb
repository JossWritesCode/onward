require "test_helper"

class ResumeStyleTest < ActiveSupport::TestCase
  test "fills in the defaults" do
    assert_equal ResumeStyle::DEFAULTS, ResumeStyle.normalize(nil)
    assert_equal ResumeStyle::DEFAULTS, ResumeStyle.normalize({})
    assert_equal ResumeStyle::DEFAULTS, ResumeStyle.normalize("not a hash")
  end

  test "keeps values that are in range, from strings or symbols" do
    style = ResumeStyle.normalize(fontSize: "10", "lineHeight" => 1.25, margin: 0.6, sectionGap: 8, accent: "#1D4ED8")

    assert_equal({ "fontSize" => 10.0, "lineHeight" => 1.25, "margin" => 0.6, "sectionGap" => 8.0, "accent" => "#1d4ed8" }, style)
  end

  test "brings values outside the range back in, and onto the step" do
    style = ResumeStyle.normalize("fontSize" => 30, "lineHeight" => 0.2, "margin" => 0.47, "sectionGap" => 9.6)

    assert_equal 11.0, style["fontSize"]
    assert_equal 1.15, style["lineHeight"]
    assert_equal 0.45, style["margin"]
    assert_equal 10.0, style["sectionGap"]
  end

  test "unreadable values fall back to the default, and unknown keys are dropped" do
    style = ResumeStyle.normalize("fontSize" => "big", "lineHeight" => nil, "accent" => "blue", "fontFamily" => "Comic Sans")

    assert_equal 9.5, style["fontSize"]
    assert_equal 1.35, style["lineHeight"]
    assert_equal "#4f46e5", style["accent"]
    assert_not style.key?("fontFamily")
    assert_equal ResumeStyle::DEFAULTS.keys.sort, style.keys.sort
  end
end
