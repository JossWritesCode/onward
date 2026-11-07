# Serves the React app for every page address (like /progress), so links and
# reloads work. In production, bin/render-build builds the app into public/.
class SpaController < ApplicationController
  def index
    index_file = Rails.public_path.join("index.html")

    if index_file.exist?
      response.headers["Cache-Control"] = "no-cache"
      send_file index_file, type: "text/html", disposition: "inline"
    else
      render plain: "This is the Onward API. In development, open http://localhost:5173 (run npm run dev in frontend/).",
        status: :not_found
    end
  end
end
