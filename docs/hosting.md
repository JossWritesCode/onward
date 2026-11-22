# Putting Onward online

[Back to the README](../README.md)

Onward is set up to run on [Render](https://render.com). The file `render.yaml` describes the web server and the database, so most of this is clicking through Render's screens.

## Before you start

Run `npm run build` in `frontend/` and fix anything it reports. Render runs the same build.

`backend/Gemfile.lock` must list `x86_64-linux` under `PLATFORMS`. It does today. If it ever goes missing (for example after updating gems on a Mac), run `bundle lock --add-platform x86_64-linux` in `backend/`, then commit and push.

## Creating the app

1. Sign up at [render.com](https://render.com) with GitHub, and let it see the `onward` repository.
2. Click **New → Blueprint** and pick `onward`.
3. Fill in `OWNER_EMAIL` with the email you'll sign up with. That account becomes the admin. Leave the email settings empty for now.
4. Click **Apply**. The database costs $6 a month.
5. The first build takes about 5 minutes. When it says **Live**, open the address and sign up with your `OWNER_EMAIL`.

Render makes the secret keys for you. Don't change them later, or saved GitHub tokens can't be read anymore.

To invite friends, open **Settings → Your account** and click **Make an invite link**.

To update the hosted app, push to GitHub. Render rebuilds and runs any new migrations on its own.

## Sending email with Gmail

"Forgot your password?" needs a way to send email. The simplest is your own Gmail:

1. Turn on [2-Step Verification](https://myaccount.google.com/security).
2. Make an [app password](https://myaccount.google.com/apppasswords) called "Onward" and copy it.
3. In Render, open the `onward` service → **Environment**, and set:
   - `SMTP_ADDRESS` = `smtp.gmail.com`
   - `SMTP_USERNAME` = your Gmail address
   - `SMTP_PASSWORD` = the app password, without spaces
4. Save. Once Render restarts, "Forgot your password?" appears on the sign-in page.

Any other email service with SMTP works the same way. Also set `MAIL_FROM` to the address it lets you send from.
