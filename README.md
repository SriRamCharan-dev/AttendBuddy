# AttendBuddy — Deployment Guide

> **Stack:** Google Apps Script + Google Sheets + Telegram Bot API  
> **Cost:** ₹0 / $0  
> **Estimated setup time:** ~20 minutes

## Landing Page

The project includes a standalone animated landing page at `index.html`. Before publishing it, open the file and replace `YourBotUsername` in the `BOT_LINK` constant with the username given by BotFather (without the `@`). Every Telegram CTA on the page uses that single link.

---

## Prerequisites

- A Google account (for Sheets + Apps Script)
- A Telegram account

---

## Step 1 — Create Your Telegram Bot

1. Open Telegram and search for **[@BotFather](https://t.me/BotFather)**
2. Send `/newbot`
3. Choose a name: e.g. `AttendBuddy`
4. Choose a username ending in `bot`: e.g. `AttendBuddyBot`
5. BotFather gives you a **token** like `7123456789:AAFxxxxxx`
6. **Copy and save this token** — you'll need it in Step 4

---

## Step 2 — Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a **New blank spreadsheet**
3. Rename it to **AttendBuddy**
4. Note the Spreadsheet ID from the URL:  
   `https://docs.google.com/spreadsheets/d/**<SPREADSHEET_ID>**/edit`

---

## Step 3 — Set Up Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. A new script editor opens with a default `Code.gs` file
3. **Delete** the default content of `Code.gs`
4. Create the following files by clicking **+** next to "Files":

| File name      | Content from |
|----------------|-------------|
| `Code.gs`      | `src/Code.gs` |
| `sheets.gs`    | `src/sheets.gs` |
| `telegram.gs`  | `src/telegram.gs` |
| `stats.gs`     | `src/stats.gs` |
| `commands.gs`  | `src/commands.gs` |
| `admin.gs`     | `src/admin.gs` |
| `attendance.gs`| `src/attendance.gs` |
| `setup.gs`     | `src/setup.gs` |

> **Tip:** Copy-paste each file's contents from the `src/` folder in this project.

---

## Step 4 — Run First-Time Setup

1. In Apps Script editor, select the function **`onInstall`** from the dropdown
2. Click **▶ Run**
3. Authorize the script when prompted (it needs access to Sheets and external URLs)
4. Check the **Execution log** — you should see "✅ Setup complete!"

This creates five sheets in your spreadsheet: `Users`, `Attendance`, `Holidays`, `Config`, and `AuditLog`.

---

## Step 5 — Fill in the Config Sheet

Open your Google Sheet → **Config** tab and fill in these two values:

| key | value |
|-----|-------|
| `BOT_TOKEN` | Paste the token from BotFather (Step 1) |
| `ADMIN_IDS` | Leave blank for now — fill after Step 7 |

Everything else is pre-filled with defaults. Review and adjust if needed:

| key | default | notes |
|-----|---------|-------|
| `MIN_PERCENT` | `75` | Minimum attendance % required |
| `WORK_DAYS` | `1,2,3,4,5,6` | Mon–Sat. Use `1,2,3,4,5` for Mon–Fri |
| `DAILY_PROMPT_HOUR` / `MIN` | `8` / `30` | 8:30 AM IST |
| `NUDGE_HOUR` / `MIN` | `9` / `15` | 9:15 AM IST nudge |
| `CUTOFF_HOUR` / `MIN` | `9` / `30` | 9:30 AM auto-absent |

---

## Step 6 — Deploy as a Web App

1. In Apps Script: **Deploy → New deployment**
2. Click the gear icon → **Web app**
3. Set:
   - **Description:** `AttendBuddy v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. **Copy the Web App URL** — looks like:  
   `https://script.google.com/macros/s/AKfy.../exec`

---

## Step 7 — Register the Webhook

1. Back in the Apps Script editor, select **`deployWebhook`** and click **▶ Run**
2. Check execution log — you should see:  
   `✅ Webhook successfully registered: https://script.google.com/...`

`deployWebhook()` creates and attaches a private `WEBHOOK_SECRET` automatically. Requests without that secret are ignored.

---

## Step 8 — Add Admin IDs

1. Have **both admins** open Telegram and send `/start` to your bot
2. Each admin gets a welcome message asking for their name — they can complete onboarding, or you can note their chat_id another way
3. To find chat_ids: open the Google Sheet → **Users** tab — the `chat_id` column shows everyone who sent `/start`
4. Copy both admin chat_ids and paste them into the Config sheet:

| key | value |
|-----|-------|
| `ADMIN_IDS` | `123456789,987654321` |

> Use a comma with no spaces between IDs.

---

## Step 9 — Create Triggers

1. In Apps Script, select **`createTriggers`** and click **▶ Run**
2. Check log — you should see 3 triggers created:
   - `sendDailyPrompt @ 08:30 IST`
   - `sendNudge @ 09:15 IST`
   - `autoMarkAbsent @ 09:30 IST`
3. Verify in **Triggers** (clock icon in left sidebar) — 3 triggers should appear

---

## Step 10 — Test Everything

### Quick smoke test
1. Run **`testSendMessage`** (put your own chat_id in the function first)
2. You should receive a test message in Telegram

### Full onboarding test
1. Send `/start` to your bot from Telegram
2. Send `/start`
3. Enter your attended classes so far this month
4. Use `/stats` to see the dashboard

### Manual prompt test
1. Run **`testDailyPrompt`** from the Apps Script editor
2. All registered users should receive the morning check-in message
3. Tap a button → confirm you get an updated stats message back

---

## Daily Operation

| Time | What happens |
|------|-------------|
| 8:30 AM IST | Bot sends morning check-in to all users |
| 9:15 AM IST | Non-responders get a nudge reminder |
| 9:30 AM IST | Non-responders auto-marked absent |
| Anytime | Users can use `/stats`, `/history`, `/holidays`, `/correct` |
| End of month | Admin runs `/monthlystats` → previews summary → optionally broadcasts |

---

## Admin Command Reference

| Command | Usage | Effect |
|---------|-------|--------|
| `/holiday` | `/holiday` or `/holiday list` | Shows weekly offs and this month’s public holidays |
| `/holiday add` | `/holiday add [date] [reason]` | Adds a public/special holiday (date defaults to today) |
| `/holiday remove` | `/holiday remove 2026-08-15` | Removes an admin-added holiday |
| `/broadcast` | `/broadcast Tomorrow is a holiday!` | Sends to all users |
| `/monthlystats` | `/monthlystats` | Preview + optional broadcast of the current attendance snapshot |
| `/settings` | `/settings` | Show admin settings |
| `/settings` | `/settings min 75` | Change minimum attendance threshold |
| `/settings` | `/settings workdays 1,2,3,4,5,6` | Configure working days (0=Sun … 6=Sat) |

The `AuditLog` sheet records holiday changes, attendance corrections, automatic absences, and settings changes.

---

## Troubleshooting

**Bot not responding to messages**
- Check that the webhook is registered: run `deployWebhook()` again
- Verify `BOT_TOKEN` in Config sheet is correct (no extra spaces)
- Check the Apps Script **Executions** log for errors

**Triggers not firing**
- Go to Apps Script → Triggers (clock icon) — confirm 3 triggers exist
- Apps Script triggers fire within ±15 min of scheduled time (this is a Google limitation)

**"Not registered" error for existing user**
- Check the Users sheet — confirm the chat_id row exists
- If they re-installed Telegram, their chat_id may have changed

**Wrong attendance %**
- Check the Attendance sheet for that user's rows
- Verify the onboarding baseline values in the Users sheet are correct
- Holidays must be in the Holidays sheet for them to be excluded

---

## Updating the Bot

When you update code:
1. Make changes in Apps Script editor
2. **Deploy → Manage deployments → Edit** (pencil icon)
3. Change version to **"New version"**
4. Click **Deploy**
5. The webhook URL stays the same — no need to re-register

---

## Inviting All 80 Students

Share the bot link: `https://t.me/YourBotUsername`

Students just tap the link → tap **Start** → bot guides them through onboarding automatically.
