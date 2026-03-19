# Jassi's Betting App — WhatsApp Statement Sender

## What We're Building

A simple, one-screen web app that lets Jassi upload his Excel file every Sunday and send each customer their personal account statement via WhatsApp — in one click.

---

## The Problem We're Solving

Right now, Jassi's weekly workflow looks like this:

1. Updates an Excel file with each player's losses and net balance
2. Opens WhatsApp individually for each person
3. Manually types or copies their data and sends it

This is slow, repetitive, and error-prone — especially as the number of players grows.

---

## How the Excel File is Structured

Jassi's Excel file has the following sheets:

| Sheet | What it contains |
|---|---|
| **Net Balance** | One row per customer — shows their current net balance |
| **All Accounts** | Master list of all customers (named Dummy1, Dummy2, etc.) with their WhatsApp numbers |
| **Dummy1, Dummy2...** | One sheet per customer — their full individual transaction history |

> Each "Dummy" represents a real customer. The names are placeholders — we'll map them to real WhatsApp numbers stored separately or in the Accounts sheet.

---

## What the App Needs to Do

### Core Flow
1. Jassi opens the web app on his phone or laptop
2. He uploads his Excel file (or it auto-reads a saved one)
3. The app parses each customer's individual sheet + their net balance
4. Jassi presses a button — the app sends each person their statement on WhatsApp

### Two Primary Actions

| Button | What it does |
|---|---|
| **Send to All** | Loops through every customer and sends their statement via WhatsApp |
| **Send to One** | Shows a dropdown/list of customers — Jassi picks one and sends only to them |

---

## User Experience (Jassi's View)

The screen should have:
- A file upload area (drag or click to upload Excel)
- A preview of how many customers were found
- **Button 1 — "Send to All"** (prominent, clear)
- **Button 2 — "Send to Someone"** (secondary, opens a selector)
- Minimal text, no clutter, no settings to worry about

Jassi is non-technical — every label must be plain English. No jargon.

---

## How WhatsApp Sending Works (Technical Note)

There are two approaches:

### Option A — WhatsApp Web Deep Links (Free, No API needed)
- Clicking the button opens WhatsApp Web with a pre-filled message for each contact
- Jassi just hits send on each one
- Works on phone and desktop
- No setup, no cost
- Downside: requires Jassi to manually confirm each send

### Option B — WhatsApp Business API (Automated, Fully hands-off)
- Messages send automatically with one click
- Requires WhatsApp Business account + a third-party API provider (e.g. Twilio, Wati, 360dialog)
- Has a small per-message cost
- Best for scale

**Recommendation:** Start with Option A (deep links) — zero cost, no setup, works immediately. Upgrade to Option B later if volume grows.

---

## Message Format (What Gets Sent)

Each customer receives something like:

```
Hi [Name], here's your weekly account summary:

Net Balance: -₹2,400
Week: 17 March – 23 March 2026

Transaction History:
• 18 Mar — Lost ₹800
• 20 Mar — Lost ₹1,200
• 22 Mar — Lost ₹400

For any questions, contact Jassi.
```

The exact format will be refined once we see the actual Excel data.

---

## What We Need from Jassi

- [ ] Share the actual Excel file (with dummies is fine) so we can see the real column names and sheet structure
- [ ] Confirm: does the Excel already have WhatsApp numbers, or are those stored elsewhere?
- [ ] Confirm: does he want to send from his personal WhatsApp or a business number?
- [ ] Confirm: phone or laptop — where does he do this weekly task?

---

## Build Plan (Simple Phases)

| Phase | What gets built |
|---|---|
| **1 — Parse** | Upload Excel → read all sheets → extract customer data |
| **2 — Preview** | Show a clean list of customers + their balances on screen |
| **3 — Send (links)** | "Send to All" and "Send to One" using WhatsApp deep links |
| **4 — Automate (optional)** | Upgrade to WhatsApp API for true one-click sending |

We'll start with Phase 1 and move fast.

---

## Tech Stack (Planned)

- **Frontend:** Plain HTML + CSS + JavaScript (no framework — keeps it simple and fast)
- **Excel Parsing:** SheetJS (a free JS library that reads .xlsx files in the browser)
- **WhatsApp:** Deep links (`https://wa.me/...`) to start — no backend needed
- **Hosting:** Can run locally on Jassi's laptop or deploy to a free host (Netlify/Vercel)

No backend, no database, no login — everything happens in the browser. Simple and safe.
