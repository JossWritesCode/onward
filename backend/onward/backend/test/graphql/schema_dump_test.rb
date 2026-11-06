require "test_helper"

# The frontend generates its TypeScript types from schema.graphql. This test
# fails when the Ruby schema changes but the file wasn't regenerated.
class SchemaDumpTest < ActiveSupport::TestCase
  test "schema.graphql is up to date" do
    dumped = Rails.root.join("schema.graphql").read
    assert_equal OnwardSchema.to_definition, dumped,
      "schema.graphql is out of date. Run: bin/rails graphql:dump_schema"
  end
end
