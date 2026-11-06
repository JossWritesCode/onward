require "test_helper"

class ContactsTest < ActionDispatch::IntegrationTest
  include GraphqlRequestHelpers

  setup do
    @user = create_user
    sign_in_as(@user)
  end

  test "creates a contact linked to an application" do
    application = @user.job_applications.create!(company: "Acme", role: "Developer")

    result = graphql(<<~GRAPHQL, variables: { appId: application.id.to_s })
      mutation($appId: ID!) {
        createContact(input: { name: "Sam Okafor", company: "Acme", jobApplicationIds: [$appId] }) {
          contact { name jobApplications { company } }
          errors { field message }
        }
      }
    GRAPHQL

    contact = result.dig("data", "createContact", "contact")
    assert_equal "Sam Okafor", contact["name"]
    assert_equal [ "Acme" ], contact["jobApplications"].map { |a| a["company"] }
  end

  test "lists contacts alphabetically" do
    @user.contacts.create!(name: "zoe")
    @user.contacts.create!(name: "Adam")

    names = graphql("query { contacts { name } }").dig("data", "contacts").map { |c| c["name"] }
    assert_equal [ "Adam", "zoe" ], names
  end

  test "rejects an invalid email" do
    result = graphql('mutation { createContact(input: { name: "Sam", email: "not-an-email" }) { contact { id } errors { field } } }')
    assert_equal [ "email" ], result.dig("data", "createContact", "errors").map { |e| e["field"] }
  end

  test "ignores applications that belong to someone else when linking" do
    stranger_application = create_user.job_applications.create!(company: "Secret Co", role: "Spy")
    contact = @user.contacts.create!(name: "Sam")

    graphql(<<~GRAPHQL, variables: { id: contact.id.to_s, appId: stranger_application.id.to_s })
      mutation($id: ID!, $appId: ID!) {
        updateContact(id: $id, input: { jobApplicationIds: [$appId] }) { contact { id } errors { message } }
      }
    GRAPHQL

    assert_empty contact.reload.job_applications
  end
end
