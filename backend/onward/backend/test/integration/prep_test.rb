require "test_helper"

class PrepTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  test "creates a story and practices with it" do
    created = graphql('mutation { createStory(input: { title: "Rescued the launch", action: "Rebuilt the pipeline", tags: ["Ownership"] }) { story { id tags } errors { message } } }')
    story_id = created.dig("data", "createStory", "story", "id")
    assert_equal [ "ownership" ], created.dig("data", "createStory", "story", "tags")

    question_id = @user.questions.first.id.to_s
    result = graphql(<<~GRAPHQL, variables: { storyId: story_id, questionId: question_id })
      mutation($storyId: ID, $questionId: ID) {
        logPractice(storyId: $storyId, questionId: $questionId, rating: NAILED_IT, seconds: 95) {
          story { practiceCount lastRating lastPracticedOn }
          errors { message }
        }
      }
    GRAPHQL

    story = result.dig("data", "logPractice", "story")
    assert_equal 1, story["practiceCount"]
    assert_equal "NAILED_IT", story["lastRating"]
  end

  test "checks off a checklist and reports when it's finished" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", status: "interviewing")
    items = application.interview_rounds.sole.checklist_items.to_a

    toggle = "mutation($id: ID!) { setChecklistItemDone(id: $id, done: true) { justPrepped interviewRound { prepped } } }"
    items[0..-2].each do |item|
      assert_not graphql(toggle, variables: { id: item.id.to_s }).dig("data", "setChecklistItemDone", "justPrepped")
    end
    last = graphql(toggle, variables: { id: items.last.id.to_s }).dig("data", "setChecklistItemDone")
    assert last["justPrepped"]
    assert last.dig("interviewRound", "prepped")
  end

  test "schedules a round and shows it on the card" do
    application = @user.job_applications.create!(company: "Acme", role: "Dev", status: "interviewing")
    round = application.interview_rounds.sole
    at = 2.days.from_now.change(usec: 0)

    graphql("mutation($id: ID!, $at: ISO8601DateTime) { updateInterviewRound(id: $id, scheduledAt: $at) { interviewRound { scheduledAt } } }",
      variables: { id: round.id.to_s, at: at.iso8601 })

    upcoming = graphql("query { upcomingInterviewRounds { name jobApplication { company nextInterviewAt } } }").dig("data", "upcomingInterviewRounds")
    assert_equal [ "Phone screen" ], upcoming.map { |r| r["name"] }
    assert_equal at, Time.iso8601(upcoming.first.dig("jobApplication", "nextInterviewAt"))
  end

  test "replaces the checklist template" do
    result = graphql('mutation { updateChecklistTemplate(items: ["Research", "  ", "Pick an outfit"]) { items { text } errors { message } } }')
    assert_equal [ "Research", "Pick an outfit" ], result.dig("data", "updateChecklistTemplate", "items").map { |i| i["text"] }
  end

  test "short study sessions don't count" do
    short = graphql('mutation { logStudySession(topic: "LeetCode", minutes: 4) { counted } }')
    assert_not short.dig("data", "logStudySession", "counted")

    long = graphql('mutation { logStudySession(topic: "LeetCode", minutes: 25) { counted } }')
    assert long.dig("data", "logStudySession", "counted")
    assert_equal [ "LeetCode" ], graphql("query { studyTopics }").dig("data", "studyTopics")
  end

  test "can't touch someone else's checklist" do
    stranger = create_user
    application = stranger.job_applications.create!(company: "Secret", role: "Spy", status: "interviewing")
    item = application.interview_rounds.sole.checklist_items.first

    result = graphql("mutation($id: ID!) { setChecklistItemDone(id: $id, done: true) { justPrepped } }", variables: { id: item.id.to_s })
    assert_equal "We couldn't find that.", result.dig("errors", 0, "message")
    assert_not item.reload.done
  end
end
