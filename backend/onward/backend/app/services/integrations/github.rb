module Integrations
  # Reads someone's GitHub contribution calendar (the green squares) through
  # GitHub's official GraphQL API. It needs a personal access token, but the
  # token doesn't need any permissions.
  module Github
    URL = "https://api.github.com/graphql".freeze

    QUERY = <<~GRAPHQL.freeze
      query onwardContributions($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks { contributionDays { date contributionCount } }
            }
          }
        }
      }
    GRAPHQL

    module_function

    def fetch(username, token)
      raise Error, "Add a GitHub token to see your contributions." if token.blank?

      response = Http.post_json(URL, { query: QUERY, variables: { login: username } },
        headers: { "Authorization" => "Bearer #{token}" }, service: "GitHub") do |raw|
        if raw.is_a?(Net::HTTPUnauthorized)
          raise Error, "GitHub didn't accept your token. It may have expired. Create a new one and save it in your prep settings."
        end
      end

      if (message = response.dig("errors", 0, "message"))
        raise Error, response.dig("errors", 0, "type") == "NOT_FOUND" ? "GitHub doesn't have a user named \"#{username}\"." : "GitHub said: #{message}"
      end

      calendar = response.dig("data", "user", "contributionsCollection", "contributionCalendar")
      raise Error, "GitHub doesn't have a user named \"#{username}\"." if calendar.nil?

      days = calendar["weeks"].flat_map { |week| week["contributionDays"] }
        .to_h { |day| [ day["date"], day["contributionCount"].to_i ] }

      { "username" => username, "total_contributions" => calendar["totalContributions"].to_i, "days" => days }
    end
  end
end
