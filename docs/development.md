# Working on Onward

[Back to the README](../README.md)

Onward has two parts that run side by side: a Rails GraphQL API in `backend/` and a React app in `frontend/`. In development, Vite forwards API requests to Rails, so you only open one address.

## Running the tests

Start PostgreSQL, then run everything the way CI does, from the top folder:

```sh
bin/test
```

It stops at the first failure. To run one part:

```sh
cd backend && bin/rails test        # Rails: models and the GraphQL API
cd frontend && npm test             # unit tests, next to the code as *.test.ts
cd frontend && npm run typecheck    # TypeScript
bin/e2e                             # end-to-end tests in a real browser
```

## End-to-end tests

The first time, download Chromium:

- **macOS:** `cd frontend && npx playwright install chromium`
- **Linux and WSL:** `cd frontend && npx playwright install --with-deps chromium`

If the download is blocked, point the tests at a Chrome you already have with `CHROME_PATH`.

`bin/e2e` uses its own database, `onward_e2e`, and runs Rails on port 3001 and the app on 5174, so your own data and dev servers are left alone. Each spec file has its own account, named for the file (`board.spec.ts` uses `board@e2e.onward.test`), and that account is rebuilt before every test.

When you write a spec:

- Import `test` from `./helpers`, not from `@playwright/test`. That's what resets the account.
- Add the new file's account to `ACCOUNTS` in both `backend/lib/e2e_accounts.rb` and `frontend/e2e/helpers.ts`.
- Use `moveCard`, not a raw drag, when the test keeps working with the card afterward.

Anything after `bin/e2e` goes to Playwright, like `bin/e2e e2e/board.spec.ts` for one spec or `bin/e2e --ui` to watch each step. When a test fails, its screenshot and trace are in `frontend/test-results/`.

CI (`.github/workflows/ci.yml`) runs the Rails tests, the type check and unit tests, and the end-to-end tests on every push.

## Changing the API

The frontend's types come from the backend's GraphQL schema. After changing anything in `backend/app/graphql/`:

```sh
cd backend && bin/rails graphql:dump_schema   # updates schema.graphql, which you commit
cd frontend && npm run codegen                # regenerates src/gql/, which isn't committed
```

Every query and mutation the frontend sends is in `frontend/src/graphql/operations.ts`.

## Adding a resume template

A template is one React component that takes the resume's content, a page size, and a theme (see `frontend/src/resume-pdf/theme.ts`).

1. Write it next to `frontend/src/resume-pdf/templates/Classic.tsx`, and add it to `templates/index.ts`.
2. Add it to `TEMPLATE_DETAILS` in `frontend/src/lib/resume/style.ts` and to `TEMPLATES` in `frontend/src/lib/resume/types.ts`.
3. Add it to `Resume::TEMPLATES` and `Types::ResumeTemplateEnum` in the backend, then run `bin/rails graphql:dump_schema`.

## Job match cases

Job match (issue #19) is checked against sample résumés and postings with answers worked out by hand. They're in `backend/test/fixtures/files/resume_match/`, one case per `.yml` file. Everyone in them is made up. `backend/test/models/resume_match_cases_test.rb` checks every case and, once the posting reader exists, prints how many requirements it found (recall) and how many of those were right (precision).

To add a case, copy one that's close to what you want, then fill in:

- `name`: what the case is about, in a few words.
- `covers`: which tricky situations it tests, like `no_headings` or `go_word`. The full list is `COVERS` in `backend/test/support/resume_match_cases.rb`.
- `resume`: the résumé, in the same shape as a saved résumé's content. Or `resume_from: other_case` to reuse one.
- `posting`: the job description as plain text. Or `posting_from: other_case`.
- `today`: the date years of experience are counted to, like `"2026-11-26"`. Needed when the posting asks for years.
- `fit: poor`: for a résumé checked against a posting it doesn't fit. It has to score at least 20 points below the case it came from.
- `expected`: what a careful person would say. Either `score_band: [ low, high ]` or `not_enough_information:` with a reason, plus a `requirements` list.

Each requirement has:

- `skills`: one or more ids, like `[ react ]`. Several ids mean any one of them counts, as in "Jest, Playwright, or Cypress". Use `[ years ]` with `years: 3` for "3+ years", and `[ degree ]` for a degree.
- `importance`: `must` or `nice`.
- `credit`: `shown` (in a job, project, or education), `named` (only in skills, summary, or title), `related` (a close skill), or `none`. A years requirement can use a number instead, like `0.72` for 3.6 of 5 years.
- `evidence`: where in the résumé the credit comes from, like `experience.0.bullets.2`. Counting starts at 0. Leave it out when there's no credit.
- `group`: where it shows up. `counted`, `easy_to_miss` (it's there but hidden), `maybe_missing` (ask the person), or `gap` (the résumé says otherwise, so don't add it).
- `note`: optional, a sentence on why.

Run `bin/rails test test/models/resume_match_cases_test.rb`. If something's off, the message names the file and the requirement, like `kestrel_java.yml: requirement 4 (javascript): with no credit, evidence: should be left out.` The test also works out each case's score from its requirements and checks that it lands inside the band, so a typo in a credit shows up right away.

## Where things live

```
bin/test, bin/e2e     Run the tests
render.yaml           How Render hosts Onward
backend/
  app/graphql/        Types, queries, and mutations
  app/models/         Applications, columns, activities, streaks, prep, resumes
  app/services/       Talking to LeetCode and GitHub
  test/               Model and API tests
frontend/
  src/pages/          One file per screen
  src/components/     Shared pieces like buttons, layout, and icons
  src/lib/            Logic you can test: dates, goals, sounds, resume prompts
  src/resume-pdf/     Resume templates, loaded only on the resume editor
  e2e/                End-to-end tests
```
