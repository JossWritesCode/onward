# Using Onward

[Back to the README](../README.md)

## The board

- Each column has a type: saved, applied, interviewing, offer, or rejected. So "Phone screen" and "Final round" both count as interviewing.
- Add, rename, reorder, and delete columns from **Add or edit columns**. With a mouse, you can also drag a column by the grip in its header.
- On a phone, press and hold a card to drag it.
- **Mistakes don't count.** Move a card back to an earlier column within a day, and Onward takes back what the first move recorded: the activity, the streak day, the prep checklist (if you haven't touched it), and the follow-up date. After a day, a move back is treated as real news.

## Follow-up dates

Cards in applied and interviewing columns get a date to follow up. Onward picks it for you:

- **Applied:** follow up after a week, and again a week later. A week after that, it asks "Time to let this one go?"
- **Interviewing:** a thank-you note the day after, then a check-in each week for two weeks, then a last gracious note, then "Time to let this one go?"

When a date comes up, the Today strip above the board reminds you. **I followed up** logs it and sets the next date. **Let it go** moves the card to rejected with a kind message. You can change or clear any date on the application's form.

## Streaks, goals, and progress

- Any activity keeps your daily streak going, on your own time zone. You earn a streak freeze for every 7 days in a row (you can hold 2), and a missed day uses one automatically.
- Pick your own daily goals, like "Apply to 1 job" or "Study for 25 min". They check themselves off as you go.
- Board moves are logged for you. Log everything else, like networking messages, coffee chats, and tailored resumes, with **Log a win** on the Progress page. You can add your own kinds of wins too.
- The weekly recap leaves out company names unless you choose to include them. **Share** lets you download the recap as an image, copy the image, or text it to someone. On a phone, texting it sends the image too. On a computer, it opens your messages app with the text filled in.

## Interview prep

The Prep page has a story bank (written in STAR form), practice questions with a 2-minute timer, and a study timer. Every interview round gets a prep checklist when its card lands in an interviewing column. You can edit the questions and the checklist under **Customize questions and checklist**.

Study sessions of 10 minutes or more count toward your streak.

## Making a resume

1. Open **Resumes → New resume** and click **Copy prompt**.
2. Paste the prompt into any AI chat, with your current resume under it.
3. Paste the AI's reply into Onward and press **Format**.
4. Read it through, fix anything, and click **Download PDF**.

If Format finds a problem, it names the line to look at. Asking the AI to "reply again with valid JSON only" usually fixes it.

**To fit one page,** open **Design** above the preview and pick **Tight**, or use **Fine-tune**. The Compact template fits the most.

## Tailoring a resume for a job

Open the application, and in its Resume section:

1. Pick the resume to start from, and paste in the job description if it isn't there yet.
2. Click **Copy message for ChatGPT**, and paste it into ChatGPT or any AI chat.
3. Paste the whole reply back into Onward and click **Make tailored resume**.
4. Read it through, since an AI can still stretch the truth, then download the PDF.

To change what the message asks for, click **Edit instructions**. **Save as my default** keeps your changes for next time. To give the AI more to work with, add real skills and experience under "More about me" at the end of the instructions.

**Re-tailor** gives a tailored resume another pass. Each application can have one tailored resume.

## The "Save to Onward" bookmark

In **Settings → Your account**, drag **Save to Onward** to your bookmarks bar. On a job posting, click it, and Onward opens with the job filled in. Nothing is saved until you click **Add application**.

It reads the page in your own browser, so it works on LinkedIn and Indeed while you're signed in, and the page isn't sent anywhere else. If a site changes and some fields come up empty, the code is in `frontend/src/lib/bookmarklet.ts`. After an update, drag the button to your bookmarks bar again.

## LeetCode and GitHub

Turn on the engineering track in **Settings → Engineering**, then add:

- **Your LeetCode username.** Your profile needs to be public.
- **Your GitHub username and a token.** Make one on [GitHub's new token page](https://github.com/settings/personal-access-tokens/new). Leave it on "Public repositories" and don't add any permissions.

Onward checks both at most every 30 minutes, or right away when you press **Refresh**. Your LeetCode days follow your own clock. GitHub decides which day its contributions count for.

The token is stored encrypted, with keys that `bin/setup` writes to `backend/.env`. Keep that file private.

## Accounts and invites

The `SIGNUPS` setting decides who can sign up:

- `open` (the default on your own computer): anyone.
- `invite` (the default when hosted): only people with an invite link. The owner (`OWNER_EMAIL`) can always sign up, and is the admin.

The admin makes invite links in **Settings → Your account**. Each link works once.

On your own computer, password reset emails aren't really sent. They're printed in the terminal running `bin/rails server`, link included.

Under **Settings → Your account** you can also download all your data as JSON, or delete your account.
