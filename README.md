# Onward

A job hunt tracker that makes the search feel rewarding. Track your applications on a drag-and-drop board, get a little celebration every time you move forward, keep a daily streak, and watch your effort fill in a GitHub-style heat map, whether or not it pays off right away.

![The job board](docs/screenshot.png)

**Guiding principle: reward effort, not outcomes.** Applying, networking, and prepping are wins on their own.

## What's here so far

Onward is being built in milestones. So far:

**Milestone 1**
- Accounts: sign up, sign in, sign out
- Job applications with dates, links, salary, location, work arrangement, job description, resume version, and notes
- Contacts, linked to the applications they're connected to
- Light and dark mode, and a layout that works on phones

**The board and encouragement**
- A drag-and-drop board, the main view on computers. Phones get a list view by default, and on the board you press and hold a card to drag it.
- Customizable columns: add, rename, reorder, and delete them. Each column has a type (saved, applied, interviewing, offer, rejected), so "Phone screen" and "Final round" both count as interviewing.
- A daily quote at the top of the board. Every quote's wording was checked against its original source.
- Celebrations that scale: confetti and a chime for applying, more for an interview, a full-screen celebration for an offer, and a kind word when you get a rejection.
- A sound toggle in the header. Confetti is skipped when your device is set to reduce motion.
- Add a contact right from an application's form.

**Milestone 2: streak and progress**
- A daily streak, shown as a flame in the header. Any activity counts, and the day follows your own time zone.
- Streak freezes: earn one for every 7 days in a row, hold up to 2, and a missed day uses one automatically.
- A Progress page with "Log a win" buttons for networking messages, coffee chats, follow-ups, and tailored resumes or cover letters.
- Applying, interviews, offers, and rejections on the board are logged for you, once per application for each stage type.
- A GitHub-style heat map of your activity: a year on computers, about four months on phones.
- A weekly recap you can copy as text or share as an image, with company names left out unless you include them.
- Celebrations at streak milestones like 7, 30, and 100 days.

**Milestone 3a: interview prep**
- A Prep page in the header.
- A story bank: write your best stories once, in STAR form (situation, task, action, result), with tags.
- Practice mode: a random question from your question bank, a story to answer with, a 2-minute timer, and a "nailed it" or "needs work" rating. New accounts start with 15 general behavioral questions you can edit or delete.
- A prep checklist for every interview round, created when a card lands in an interview column. Set the interview's date to see a countdown on the card. Finishing a checklist gets a celebration.
- An editable checklist template for new rounds.
- A study timer with 15, 25, and 45 minute presets or a custom length, and your own topics. It keeps running while you use the rest of the app, and sessions of 10 minutes or more count toward your streak.

**Software engineering track** (optional, turned on from Prep → Customize)
- An Engineering page, linked in the header, with your LeetCode streak, problems solved by difficulty, and a submissions heat map.
- Days you submit on LeetCode count toward your Onward streak, starting from the day you connect, on your own clock.
- Your GitHub contribution calendar.
- Hours studied this week, this month, and all time, by week and by topic, plus "Add time" for studying away from the timer.

**Milestone 3b: daily goals and nudges**
- Daily goals you pick yourself, like "Apply to 1 job," "Study for 25 min," "Solve 1 LeetCode problem," or "Make 1 GitHub contribution." Each one has a number and can be every day or weekdays only. They check themselves off as you go. New accounts start with "Apply to 1 job."
- A Today strip above the board with your goals and up to 3 nudges. It shrinks to one line once every goal is done.
- Perfect days: finishing every goal gets a celebration, a gold square on the heat map, and a perfect-day streak next to your regular streak. Days with no goals (like weekends, for weekday goals) don't break it. Your regular streak still counts any action at all.
- Custom actions, like "Went to a meetup," logged from "Log a win" and usable as goals. Deleting one keeps it in your history.
- Nudges for interviews in the next 2 days with an unfinished checklist, follow-ups that are due (see **Follow-up dates** below), applications with no change in 2 weeks (unless they have a follow-up date), and people you haven't talked to in 3 weeks. Act on one right from the strip ("I followed up"), snooze it, or dismiss it. Interview prep comes first, then follow-ups (oldest first), then a mix of quiet applications and people, up to 3 at a time.

**Milestone 4: polish, accounts, and going online**
- Onward's own dropdown arrows, the pointing-hand cursor on everything clickable, a shuffle button for the daily quote, and a smooth animation when you hide it.
- An Account page (click your email in the header): download all your data as JSON, delete your account, and read what Onward stores.
- Invite codes, so friends can join a hosted Onward without opening sign-ups to everyone.
- "Forgot your password?" with an emailed reset link.
- A "Save to Onward" bookmark (on the Account page): click it on a LinkedIn, Indeed, or company job posting and Onward opens with the company, title, location, salary, work arrangement, link, and description filled in. It warns you if you've already saved that job.
- Ready to host on [Render](https://render.com): Rails serves the API and the React app together. See [Putting Onward online](#putting-onward-online).

**Follow-up dates**
- Cards in applied and interview columns get a date to follow up, shown as a "Follow up Nov 16" tag on the board and in the phone list. It's grey while it's coming up and violet on the day and while it's overdue.
- Onward picks the dates for you, counting from the day you log each follow-up, on your own clock:
  - Applied: follow up a week after the card lands there, once more a week later, then a week after that it asks "Time to let this one go?"
  - Interviewing: a thank-you note tomorrow (or the day after the interview, once that round has a date), a check-in a week later and another a week after that, then "Send a last gracious note?", then "Time to let this one go?"
  - Moving to a later interview column starts the interview steps over. Moving to offer, rejected, or back to saved clears the date.
- Change or clear the date on the application's form. A date you set yourself stays until the card moves or you log a follow-up.
- When a date comes up, the Today strip asks you to follow up, send a thank-you, check in, or send a last note. "I followed up" logs it (and so does logging a follow-up from "Log a win" with the application picked), and the next date is set for you. "Remind me in 3 days" moves the date, and dismissing clears it.
- "Let it go" moves a card that never wrote back to your first rejected column, with a kinder message than a rejection. It counts as closure, like any other move to rejected. "Keep it open" clears the date instead.
- Applications from before this feature start without a date. They get one the next time they move or you log a follow-up.

## Tech stack

| Part | Tools |
| --- | --- |
| Backend | Ruby on Rails 8 (API only), PostgreSQL |
| API | GraphQL via [graphql-ruby](https://graphql-ruby.org) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Data fetching | Apollo Client, with types generated by GraphQL Code Generator |

The app is two parts that run side by side: the Rails API in `backend/` and the React app in `frontend/`. In development, Vite forwards API requests to Rails, so you only ever open one address in your browser.

## Setting up

You'll need:

- **Ruby 3.2 or newer** (3.3 recommended)
- **Node.js 20 or newer**
- **PostgreSQL 14 or newer**

Pick the steps for your computer, then continue with [Running Onward](#running-onward).

### macOS

1. Install [Homebrew](https://brew.sh) if you don't have it.
2. Install the tools:

   ```sh
   brew install rbenv ruby-build node postgresql@16
   brew services start postgresql@16
   ```

3. Make PostgreSQL's command-line tools available (the Ruby `pg` gem needs them to install). Add this line to your `~/.zshrc`, then open a new terminal:

   ```sh
   export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
   ```

4. Install Ruby and make it your default:

   ```sh
   rbenv init      # follow the instructions it prints, then open a new terminal
   rbenv install 3.3.6
   rbenv global 3.3.6
   ```

On macOS, PostgreSQL lets your user connect without a password, so there's nothing else to configure.

### Linux (Ubuntu or Debian)

1. Install build tools, PostgreSQL, and the libraries Ruby needs:

   ```sh
   sudo apt update
   sudo apt install -y build-essential git curl libssl-dev libyaml-dev zlib1g-dev libffi-dev libpq-dev postgresql
   ```

2. Start PostgreSQL and create a database user that matches your login, so Rails can connect without a password:

   ```sh
   sudo service postgresql start
   sudo -u postgres createuser --superuser "$USER"
   ```

3. Install Ruby with [rbenv](https://github.com/rbenv/rbenv#installation):

   ```sh
   curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash
   # follow the instructions it prints, then open a new terminal
   rbenv install 3.3.6
   rbenv global 3.3.6
   ```

4. Install Node.js with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating):

   ```sh
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
   # open a new terminal
   nvm install --lts
   ```

### Windows

Rails runs best on Windows through **WSL** (Windows Subsystem for Linux), which gives you a real Linux environment.

1. Open PowerShell as administrator and run:

   ```powershell
   wsl --install
   ```

2. Restart when asked, then open **Ubuntu** from the Start menu and create a Linux username and password.
3. Inside Ubuntu, follow the [Linux steps](#linux-ubuntu-or-debian) above.
4. Keep the project inside your Linux home folder (for example `~/code/onward`), not under `/mnt/c/`. It runs much faster there.

PostgreSQL in WSL doesn't start on its own. When you open a new Ubuntu window, run `sudo service postgresql start` before starting Onward.

### If PostgreSQL needs a password

If your PostgreSQL setup uses a username and password, copy the example settings file and fill them in:

```sh
cd backend
cp .env.example .env
# then edit .env and set DATABASE_USERNAME and DATABASE_PASSWORD
```

## Running Onward

### 1. Set up and start the API

```sh
cd backend
bin/setup          # installs gems, creates the database, writes the GraphQL schema
bin/rails server   # starts the API on http://localhost:3000
```

Want sample data to click around with? In another terminal, run `bin/rails db:seed` from `backend/`. It creates a demo account you can sign in with: **demo@onward.test** / **password123**.

### 2. Start the frontend

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and create an account.

Keep both terminals running while you use the app.

## Updating to a new version

When you get a new version of the code, update the database and the GraphQL schema before starting the app:

```sh
cd backend
bin/setup          # installs any new gems, runs new migrations, rewrites the schema
bin/rails server
```

Then, in a second terminal, start the frontend as usual with `npm run dev` in `frontend/`.

Migrations update your existing data. For example, the board's migration gives everyone the default columns and puts each existing application in the column that matches its status. Some leave old data as it was: applications from before follow-up dates start without one.

## Connecting LeetCode and GitHub

Turn on the software engineering track from **Prep → Customize questions and checklist** (once it's on, the Engineering page's **Settings** button goes there too), then add:

- **Your LeetCode username.** Your profile needs to be public. LeetCode has no official API, so Onward reads the same public data its website shows. If LeetCode changes how that works, the LeetCode card shows an error and the rest of the app keeps working.
- **Your GitHub username and a token.** GitHub only shares the contribution calendar with a token, but the token doesn't need any permissions:
  1. Go to [GitHub's new token page](https://github.com/settings/personal-access-tokens/new).
  2. Name it "Onward" and pick an expiration date.
  3. Leave repository access on "Public repositories" and don't add any permissions.
  4. Generate the token and paste it into Onward.

The token is encrypted in the database with keys that `bin/setup` writes to `backend/.env`. Keep that file private. If you deploy Onward, set `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY`, `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY`, and `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT` on your host.

Onward checks LeetCode and GitHub at most every 30 minutes. The Refresh button on the Engineering page, or **Check now** in the Today strip, checks right away.

**Which day things count for.** LeetCode's own calendar runs on UTC, so an evening submission in North America shows up there as the next day. Onward reads the exact times of your recent submissions instead, so LeetCode days and LeetCode goals follow your clock. GitHub decides which day a contribution belongs to, and only counts contributions on github.com. Private repositories count only if your GitHub profile has "Include private contributions" turned on.

## Accounts, invites, and email

**Who can sign up** is set by the `SIGNUPS` environment variable:

- `open` (the default on your own computer): anyone can create an account.
- `invite` (the default when hosted): new accounts need an invite code. The owner (`OWNER_EMAIL`), or the very first account if no owner is set, can always sign up, and is the admin.

Admins make invite links on the Account page. Each link works once.

**Password reset emails.** On your own computer, Onward doesn't send real email. It prints each email, including the reset link, in the terminal running `bin/rails server`. To send real email, set the SMTP settings described in [Sending email with Gmail](#sending-email-with-gmail).

## Saving jobs with the bookmark

On the Account page, drag **Save to Onward** to your browser's bookmarks bar. On a job posting, click it: a new Onward tab opens with the job filled in, and nothing is saved until you click **Add application**.

It reads the page in your own browser, so it works on LinkedIn and Indeed while you're signed in to them, and nothing about the page is sent anywhere except into your new Onward tab. On LinkedIn and Indeed it reads what's on screen. Elsewhere it uses the job details many sites include for Google (common on company career pages), and falls back to the page title.

If LinkedIn or Indeed change how their pages are built, some fields may come up empty until the bookmark is updated. The code lives in `frontend/src/lib/bookmarklet.ts`; after an update, drag the button to your bookmarks bar again to replace the old one.

## Putting Onward online

Onward is set up for [Render](https://render.com) with a free web server and a $6/month database. The file `render.yaml` describes both, so most of this is clicking through Render's screens.

**What to expect from the free server:** it goes to sleep after 15 minutes without visitors. The next visit shows a loading page for about a minute while it wakes up, then it's normal speed. Your data is in the paid database, so sleeping never loses anything. If the wait gets annoying, switch the web service to a paid plan in Render ($7/month).

### 1. Check that it builds

On your computer:

```sh
cd frontend
npm run build      # type-checks and builds the app into backend/public
```

Fix anything it reports before going further, because Render runs the same build.

### 2. Let Render's Linux servers install your gems

Your `Gemfile.lock` was made on a Mac. Add Linux to it, then commit and push:

```sh
cd backend
bundle lock --add-platform x86_64-linux
cd ..
git add -A
git commit -m "feat: get ready for Render"
git push
```

### 3. Create the app on Render

1. Sign up at [render.com](https://render.com) with your GitHub account. When it asks which repositories it can see, include `onward`.
2. In the Render dashboard, click **New → Blueprint**, and pick the `onward` repository.
3. Render reads `render.yaml` and lists a web service called `onward` and a database called `onward-db`. It asks for a few values:
   - `OWNER_EMAIL`: the email you'll sign up with. That account becomes the admin.
   - `SMTP_ADDRESS`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`: leave these empty for now. You can add email later.
4. Click **Apply**. Render asks for a card for the $6/month database.
5. The first build takes about 5 minutes. When the web service says **Live**, open its address (it looks like `https://onward-xxxx.onrender.com`) and sign up with your `OWNER_EMAIL`.

Render made the secret keys for you, including the ones that encrypt GitHub tokens. Don't change those later, or saved tokens can't be read anymore.

### 4. Invite friends

Open **Account** (your email in the header, or **⋯ → Your account** on a phone), click **Make an invite link**, and send the copied link.

### Updating the hosted app

Push to GitHub. Render rebuilds and redeploys automatically, including any new database migrations.

### Sending email with Gmail

For "Forgot your password?" to work on the hosted app, Onward needs a way to send email. The simplest is your own Gmail account:

1. Turn on [2-Step Verification](https://myaccount.google.com/security) for your Google account, if it isn't already.
2. Create an [app password](https://myaccount.google.com/apppasswords) named "Onward." Google shows a 16-letter password once. Copy it.
3. In Render, open the `onward` web service → **Environment**, and set:
   - `SMTP_ADDRESS` = `smtp.gmail.com`
   - `SMTP_USERNAME` = your Gmail address
   - `SMTP_PASSWORD` = the app password, without spaces
4. Save. Render restarts the app, and "Forgot your password?" appears on the sign-in page.

Reset emails will come from your Gmail address. Any other email service that offers SMTP (like Brevo, which has a free plan) works the same way with its own address, username, and password, plus `MAIL_FROM` set to the address it lets you send from.

## Running the tests

```sh
cd backend
bin/rails test
```

## Changing the API

The frontend's TypeScript types come from the backend's GraphQL schema. After you change anything in `backend/app/graphql/`:

```sh
cd backend
bin/rails graphql:dump_schema   # updates backend/schema.graphql

cd ../frontend
npm run codegen                 # regenerates the types in src/gql/
```

`npm run dev` and `npm run build` run codegen for you, and a backend test fails if `schema.graphql` is out of date, so it's hard to forget.

All the queries and mutations the frontend sends live in `frontend/src/graphql/operations.ts`.

## Project layout

```
render.yaml           How Render hosts Onward (see "Putting Onward online")
backend/
  bin/render-build    What Render runs on each deploy
  app/graphql/        GraphQL schema: types, queries, and mutations
  app/models/         Users, board columns, applications, contacts, activities, streaks, interview prep
  db/migrate/         Database tables
  test/               Model and API tests
  schema.graphql      Generated schema the frontend reads
frontend/
  src/pages/          One file per screen
  src/components/     Shared building blocks (buttons, layout, icons)
  src/graphql/        Every query and mutation the app uses
  src/lib/            Helpers: quotes, celebrations, sounds, confetti, settings
```

## Troubleshooting

**`bin/setup` says permission denied.** Some unzip tools drop the "executable" flag. Run `chmod +x backend/bin/*` and try again.

**Installing the `pg` gem fails.** Ruby can't find PostgreSQL's tools. On macOS, check step 3 of the macOS setup. On Linux, make sure `libpq-dev` is installed.

**"Connection refused" or "could not connect to server."** PostgreSQL isn't running. Start it with `brew services start postgresql@16` (macOS) or `sudo service postgresql start` (Linux and WSL).

**"role does not exist."** Create a PostgreSQL user for yourself: `sudo -u postgres createuser --superuser "$USER"`.

**The app says it couldn't reach the Onward server.** The Rails API isn't running. Start it with `bin/rails server` in `backend/`.

**The frontend says a field doesn't exist, or `npm run dev` fails at "codegen."** The GraphQL schema file is out of date. Run `bin/rails graphql:dump_schema` in `backend/`, then try again.

**Opening http://localhost:3000 shows "This is the Onward API."** That's expected on your own computer. Use http://localhost:5173, which the frontend serves.

**Saving a GitHub token says Onward can't encrypt it yet.** The encryption keys are missing. Run `bin/setup` in `backend/` (it adds them to `.env`), restart `bin/rails server`, and try again.

**The hosted app shows a loading page for about a minute.** The free server was asleep. It wakes up on the first visit after 15 minutes without visitors.

**The Render build fails at `bundle install` with a platform error.** Run `bundle lock --add-platform x86_64-linux` in `backend/`, then commit and push (step 2 of [Putting Onward online](#putting-onward-online)).

**"Forgot your password?" doesn't appear on the hosted app.** It shows once email is set up. See [Sending email with Gmail](#sending-email-with-gmail).

**There's no sound.** Check the speaker button in the header, and that your device isn't muted. Browsers only play sound after you've clicked or tapped something on the page.

## License

[MIT](LICENSE) © 2026 JossWritesCode
