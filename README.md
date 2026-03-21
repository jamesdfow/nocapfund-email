# No Cap Fund — Easy Action Tool

A low-friction web form that lets visitors email their U.S. House representative about repealing the 1929 Apportionment Act — in under 60 seconds.

---

## What it does

1. User enters their name, email, and ZIP code
2. Their House representative is auto-detected (via Google Civic Information API)
3. A pre-written email template is shown — personalized with the rep's name and fully editable
4. User clicks **Send Email** — delivered via Action Network API
5. Success state prompts them to share with friends

Templates rotate randomly across 10 distinct variants (founders' intent, gerrymandering, representation math, etc.) to avoid congressional offices receiving identical form emails.

---

## File Structure

```
nocapfund-email/
├── index.html        # Markup only — no inline JS
├── styles.css        # All styling
└── js/
    ├── templates.js  # 10 email template variants
    └── app.js        # All form logic
```

---

## Setup

No build step. Open `index.html` in a browser or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

---

## API Integration (not yet wired up)

Both integration points are stubbed with `// ── STUB ──` blocks and TODO comments in `js/app.js`. Replace each stub with a real `fetch()` call when ready.

### 1. Rep Lookup — Google Civic Information API

**Location:** `lookupRepByZip()` in `js/app.js`

**Endpoint:**
```
GET https://civicinfo.googleapis.com/civicinfo/v2/representatives
  ?address={ZIP}
  &levels=country
  &roles=legislatorLowerBody
  &key={GOOGLE_CIVIC_API_KEY}
```

Free tier. Requires a Google Cloud project with the Civic Information API enabled.

On success, parse `officials[]` and `offices[]` from the response, find the U.S. House member, and call `setRep()` with:
```js
{
  fullName:   "Rep. Jane Smith",
  lastName:   "Smith",
  office:     "OR-02",
  email:      null,        // most reps don't expose direct email
  webFormUrl: "https://...",
}
```

On failure, call `setRepError()` — the UI falls back to a link to house.gov.

### 2. Email Delivery — Action Network API

**Location:** `submitAction()` in `js/app.js`

**Recommended:** [Action Network](https://actionnetwork.org) (~$15/mo nonprofit pricing). Handles delivery, CRM, and opt-in list management.

The submission payload (already built by `buildPayload()`) includes:
- `firstName`, `lastName`, `email`, `zip`
- `optIn` — whether to add to the No Cap Fund list
- `rep` — full rep object from the lookup step
- `templateId` — which of the 10 variants was used
- `emailSubject`, `emailBody` — final text after any user edits and personal note

### Environment Variables

When deploying, keep API keys out of client-side JS. Route API calls through a lightweight serverless function (e.g. Vercel, Netlify Functions, Cloudflare Workers) that holds the keys server-side.

| Key | Used for |
|-----|----------|
| `GOOGLE_CIVIC_API_KEY` | ZIP → rep lookup |
| `ACTION_NETWORK_API_KEY` | Email delivery + CRM |

---

## Email Templates

All 10 variants live in `js/templates.js` as `window.EMAIL_TEMPLATES`. Each uses these placeholders, substituted at render time:

| Placeholder | Replaced with |
|---|---|
| `{{REP_LAST_NAME}}` | Representative's last name |
| `{{REP_FULL_NAME}}` | Representative's full name |
| `{{CONSTITUENT_NAME}}` | Constituent's first + last name |

One variant is chosen randomly on page load and locked for that session.

### Variants

| # | Angle |
|---|-------|
| 1 | Founders' intent and historical precedent |
| 2 | Plain-spoken constituent voice |
| 3 | Gerrymandering and electoral integrity |
| 4 | Representation ratio math / international comparison |
| 5 | Civic distance and constituent access |
| 6 | Executive branch balance of power |
| 7 | Campaign finance and donor influence |
| 8 | Bipartisan framing (nonpartisan research) |
| 9 | Personal urgency / present-moment stakes |
| 10 | Constitutional first principles |

---

## Open Questions

| Question | Owner | Status |
|---|---|---|
| Action Network vs. Resistbot — confirm delivery method | Dev | Needs decision |
| Embed in existing Squarespace site or standalone hosted page? | Dev | Needs decision |
| Does the email template need legal review before launch? | Walter / Jeff | Open |

---

*No Cap Fund · Internal · Not for public distribution*
