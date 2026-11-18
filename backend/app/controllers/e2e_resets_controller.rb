# Rebuilds one end-to-end test account, so each test in frontend/e2e starts
# from the same data however the test before it (or its own failed first try)
# left things. See lib/e2e_accounts.rb.
#
# The route only exists in the test environment (see config/routes.rb), and
# this answers 404 unless the database is an _e2e one, so it can never touch
# real accounts or the database `bin/rails test` uses.
class E2eResetsController < ApplicationController
  def create
    account = params[:account].to_s
    return head :not_found unless E2eAccounts.enabled? && E2eAccounts::ACCOUNTS.include?(account)

    E2eAccounts.reset(account)
    head :no_content
  end
end
