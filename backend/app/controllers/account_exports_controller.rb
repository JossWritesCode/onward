# "Download my data": everything you've put into Onward, as one JSON file.
class AccountExportsController < ApplicationController
  include Authentication

  def show
    user = current_user
    return head(:unauthorized) if user.nil?

    filename = "onward-export-#{user.today.iso8601}.json"
    send_data JSON.pretty_generate(AccountExport.new(user).as_json),
      filename:, type: "application/json", disposition: "attachment"
  end
end
