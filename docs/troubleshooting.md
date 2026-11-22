# If something doesn't work

[Back to the README](../README.md)

These are the most common hiccups. If yours isn't here, please open an issue.

## Setting up

**`npm install` warns about an "Unsupported engine".** Your Node.js is older than 22.15. Update it with `brew upgrade node` on macOS, or `nvm install --lts`.

**rbenv says a Ruby version "is not installed".** Run `rbenv install` from the Onward folder.

**"Permission denied" when running `bin/setup` or `bin/test`.** Run `chmod +x bin/* backend/bin/*` from the Onward folder.

**Installing the `pg` gem fails.** Ruby can't find PostgreSQL's tools. On macOS, check that the `PATH` line from the setup steps is in `~/.zshrc`. On Linux, install `libpq-dev`.

**"Connection refused" or "could not connect to server".** PostgreSQL isn't running. Start it with `brew services start postgresql@16` (macOS) or `sudo service postgresql start` (Linux and WSL).

**"role does not exist".** Run `sudo -u postgres createuser --superuser "$USER"`.

**The app says it couldn't reach the Onward server.** Start the API with `bin/rails server` in `backend/`.

**`npm run dev` fails at "codegen", or says a field doesn't exist.** Run `bin/rails graphql:dump_schema` in `backend/`, then try again.

**http://localhost:3000 says "This is the Onward API".** That's expected. Use http://localhost:5173.

**Saving a GitHub token says Onward can't encrypt it yet.** Run `bin/setup` in `backend/`, restart `bin/rails server`, and try again.

## Tests

**`bin/e2e` says a port is in use.** An earlier run is probably still going. Stop it with `lsof -ti :3001,5174 | xargs kill`.

**`bin/e2e` says Chromium doesn't exist.** Download it first. See [End-to-end tests](development.md#end-to-end-tests).

## Hosting

**The Render build fails at `bundle install` with a platform error.** See [Before you start](hosting.md#before-you-start).

**"Forgot your password?" doesn't appear on the hosted app.** Set up email first. See [Sending email with Gmail](hosting.md#sending-email-with-gmail).

## Using the app

**The resume preview never appears.** Some privacy extensions block the tool that draws it. Try with extensions off. **Download PDF** works either way.

**There's no sound.** Check the speaker button in the header and your device's volume. Browsers only play sound after you've clicked something on the page.
