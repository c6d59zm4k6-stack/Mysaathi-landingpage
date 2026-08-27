# Garbha Saathi — landing page

One static page (`index.html`) plus two small serverless functions that take
payment for the ₹149 live workshop.

## Taking payments

There are two ways to collect money. The page tries the first, and quietly
falls back to the second if it isn't available — so it never shows a broken
button.

### Option A — Razorpay Checkout (what's wired up)

The visitor enters her name, WhatsApp number and email on the page, then pays
in a Razorpay window that opens over it. Her workshop focus from the symptom
quiz rides along, so the Razorpay dashboard shows what each buyer came in for.

Needs hosting that runs the `api/` functions. Vercel is set up for it:

1. Import this repo into Vercel (framework preset: **Other** — it's a static
   page with functions; no build step).
2. In **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `RAZORPAY_KEY_ID` | from Razorpay → Settings → API Keys |
   | `RAZORPAY_KEY_SECRET` | shown once when you generate the key — save it |
   | `WORKSHOP_AMOUNT_PAISE` | optional, defaults to `14900` (₹149) |
   | `RESEND_API_KEY` | optional — enables the confirmation email, see below |
   | `EMAIL_FROM` | optional, e.g. `Garbha Saathi <hello@yourdomain.com>` |
   | `WORKSHOP_ZOOM_LINK` | optional — included in the confirmation email once you have one |
   | `WORKSHOP_DATE_LABEL` | optional, e.g. `Sunday, 22 June · 11 AM` |

3. Redeploy.

Use Razorpay **test mode** keys first (`rzp_test_…`). Test card `4111 1111 1111
1111`, any future expiry, any CVV. Switch to live keys once a test payment
completes end to end.

### Option B — hosted Payment Link (no backend)

Works on plain static hosting like GitHub Pages.

1. Razorpay dashboard → **Payment Links** → create a ₹149 link.
2. In `index.html`, find `var RAZORPAY_LINK = "";` and paste the URL between
   the quotes.

The visitor leaves the page to pay, and her quiz answer isn't attached to the
order — that's the trade-off.

With neither set up, the button explains that booking isn't open yet instead
of failing silently.

## Local development

```bash
npm install -g vercel
vercel link
vercel env pull .env.local   # pulls the Razorpay keys down
vercel dev
```

Without the functions you can still preview the page itself with any static
server (`python3 -m http.server`); checkout will use the Option B path.

Never commit `.env.local` — `.gitignore` already covers it.

## How the money path works

- `api/create-order.js` asks Razorpay to open an order. **The amount is set
  here, on the server** — the browser doesn't get to choose it, so a tampered
  page can't buy a ₹149 seat for ₹1. The key secret stays server-side; only
  the publishable key id is sent to the browser.
- `api/verify-payment.js` re-computes Razorpay's HMAC signature over
  `order_id|payment_id`. The browser reporting its own success isn't proof, so
  a seat only counts as booked once this check passes.

Once a payment verifies, `verify-payment.js` looks up the order's notes back
on Razorpay (name, email, quiz track — set server-side in `create-order.js`,
not trusted from the browser) and, if `RESEND_API_KEY` is set, emails her a
confirmation in her chosen language with the Zoom link (once `WORKSHOP_ZOOM_LINK`
is set — until then it just says the link is coming on WhatsApp) and the one
fact from her quiz result. **This is best-effort by design**: if the email
fails to send, the payment is still reported as verified, because it already
happened — an email hiccup must never make a real payment look unconfirmed.

Without `RESEND_API_KEY`, no email is sent and nothing else changes — Razorpay's
dashboard stays the record of who paid.

### Confirmation email — Resend setup

1. Sign up at [resend.com](https://resend.com) (free tier is enough to start).
2. For a quick start, leave `EMAIL_FROM` unset — it defaults to Resend's own
   `onboarding@resend.dev`, which sends to anyone with no setup. To send from
   your own address (recommended before real launch), verify your domain in
   Resend and set `EMAIL_FROM` to an address on it.
3. Copy the API key into `RESEND_API_KEY`.

### WhatsApp confirmation — not wired up yet, on purpose

Automated WhatsApp messages need a Business API provider (Meta's Cloud API,
Twilio, or Gupshup are the common choices) — that means a Meta Business
verification and message-template approval, which usually takes a few days
and needs decisions only you can make (which provider, which phone number).
There's nothing to half-build here yet; the spot for it is marked in
`verify-payment.js` next to the email call, ready to add once you've picked a
provider. Until then, the confirmation email is the automated channel, and the
existing "message us on WhatsApp" links throughout the page cover the manual
one.

## Files

- `index.html` — the whole page: markup, styles, Hindi translation layer, quiz and checkout
- `api/create-order.js` — creates the Razorpay order
- `api/verify-payment.js` — verifies the payment signature
- `assets/` — page images

## Editing copy

The Hindi version is a lookup table (`var I18N`) near the bottom of
`index.html`, matched against the **exact** English text on the page. If you
reword an English string, update its key in that table in the same edit —
otherwise that line silently stays in English for Hindi readers.
