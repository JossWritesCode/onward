namespace :e2e do
  desc "Load the end-to-end test accounts into an empty _e2e database. bin/e2e runs this; see the README's Testing section"
  task seed: :environment do
    database = ActiveRecord::Base.connection_db_config.database.to_s
    # A guard, since this fills whatever database it's pointed at.
    abort "e2e:seed only runs on a database whose name ends in _e2e, not #{database}." unless database.end_with?("_e2e")

    load Rails.root.join("db/seeds/e2e.rb")
  end
end
