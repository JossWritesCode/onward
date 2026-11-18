# Accounts for the end-to-end tests in frontend/e2e. `bin/rails e2e:seed` loads
# this into an empty database (bin/e2e does it for you). What's in each account,
# and how the tests reset one before every test, is in lib/e2e_accounts.rb.

E2eAccounts.seed_all

puts "Loaded #{E2eAccounts::ACCOUNTS.size} end-to-end accounts (password: #{E2eAccounts::PASSWORD})"
