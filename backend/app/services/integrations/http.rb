require "net/http"

module Integrations
  # A small JSON-over-HTTPS helper with short timeouts, so a slow outside
  # service never holds up the app for long.
  module Http
    module_function

    def post_json(url, body, headers: {}, service:)
      uri = URI(url)
      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request["Accept"] = "application/json"
      request["User-Agent"] = "Onward job hunt tracker"
      headers.each { |key, value| request[key] = value }
      request.body = body.to_json

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 4, read_timeout: 8) do |http|
        http.request(request)
      end

      yield response if block_given?
      unless response.is_a?(Net::HTTPSuccess)
        raise Error, "#{service} answered with an error (#{response.code}). Try again later."
      end

      JSON.parse(response.body)
    rescue JSON::ParserError
      raise Error, "#{service} sent back something unexpected. Try again later."
    rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET, OpenSSL::SSL::SSLError
      raise Error, "Couldn't reach #{service}. Check your internet connection, then try again."
    end
  end
end
