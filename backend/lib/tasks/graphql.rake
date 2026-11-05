namespace :graphql do
  desc "Write the GraphQL schema to schema.graphql, which the frontend uses to generate TypeScript types"
  task dump_schema: :environment do
    path = Rails.root.join("schema.graphql")
    File.write(path, OnwardSchema.to_definition)
    puts "Wrote #{path}"
  end
end
