# MySaathi landing page — build progress

Written so this can be picked back up (by you, or a fresh Claude session)
without re-reading the whole chat history.

## What this is

The landing page for a ₹149 live PCOS workshop. One static `index.html`,
plus two small serverless functions (`api/`) that take payment through
Razorpay. See `README.md` for setup/deploy steps — this file is about
**what's been built, what's tested, and what's still open.**

Branch: `claude/saathi-landing-page-redesign-nc5rpb`. Everything below is
committed and pushed — nothing is sitting locally, unpushed, or only in
chat.

## What's built, in order

1. **Payment CTA wired up.** The "Reserve my seat" button was a dead
   `href="#"`. Now it opens a real checkout sheet.
2. **The 208KB inline image → 36KB external file.** The sample plan
   screenshot was base64-encoded directly into the HTML, bloating the page
   and blocking first paint. Now it's `assets/plan-sample.webp`, lazy-loaded.
3. **The Problem section redesigned**, matching the reference panel you
   shared: scattered conflicting opinions (mum / friend / doctor /
   Instagram) converging into one real point, instead of a paragraph.
4. **The symptom grid is now an interactive 3-second quiz.** Tap the
   symptoms that apply, and a personalized "focus" card appears below —
   her likely PCOS type (cycle / skin / metabolic / mood) plus one real
   fact — with a button into the plan section. Works in both languages.
5. **Copy trimmed** in Isha's bio, "Why this works," the 2-hours steps, and
   testimonials — cut repeated points, not just shortened sentences.
6. **Razorpay Checkout**, phase 2. A bottom sheet collects name/WhatsApp/
   email, then opens Razorpay over the page with those fields prefilled and
   her quiz result attached to the order. Falls back to a plain hosted
   Payment Link (or a clear "not set up yet" message) if the backend isn't
   configured — so the page never looks broken, it just does less.
7. **Confirmation email.** Once a payment verifies, she gets a bilingual
   email with the Zoom link (once you've set one) and her quiz result.
8. **A Razorpay webhook as a reliability backstop.** If she pays and closes
   the tab immediately, the browser-based confirmation never gets a chance
   to run. The webhook fires from Razorpay's own servers regardless, so the
   email still goes out. This is the only thing that sends the email — the
   browser path just shows her the "booked" screen — specifically so a
   normal payment doesn't get emailed twice.

Everything above was tested directly (not just described): forged
signatures rejected, tampered payloads rejected, a failed email never
flips a real payment to "unconfirmed," the full quiz → checkout → payment →
confirmation flow passes in a real headless browser, in both languages.

## How to actually test what's built

**Without any setup** (just pull the branch and open `index.html`):
- Language toggle, the symptom quiz and its personalized result, the
  redesigned Problem section, all copy — all client-side, all testable
  immediately, in a plain browser, no server needed.
- Tapping "Reserve my seat" opens the checkout sheet and validates the
  form (empty name, bad email, short phone all get caught) — also works
  with no backend.

**Payment itself won't complete yet** — and that's expected, not a bug.
Opening `index.html` as a plain file (or hosting it on GitHub Pages) has no
`/api` behind it, so submitting the checkout form will show *"Payment
isn't switched on yet"*. That's the fallback working correctly. Real
checkout needs:
1. The repo imported into Vercel (so `/api/*` actually runs), and
2. `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` set (test-mode keys are fine
   to start — see README for the full env var list).

Once those two things exist, the whole flow — quiz → checkout → Razorpay
→ confirmation email — is live end to end.

## What's not done — needs you, not more code

- **Razorpay account + Vercel import.** Nothing above can go live without
  these two.
- **Content placeholders**: workshop date, 90-day program price, replay
  policy, 3 real testimonial names, 2–4 real medical/partner logos.
- **Real photos.** Isha and the Bhopal clinic are still stock Unsplash
  photos; testimonial faces are randomuser.me placeholders. There's a dark
  "DEMO" banner at the top of the page flagging this — it needs to come out
  before real visitors see it.
- **Razorpay live-mode approval.** Test keys work today; real payments need
  Razorpay to approve live mode (business KYC), which takes a few days, not
  minutes.
- **Legal pages.** Razorpay's live-mode approval typically expects a
  Privacy Policy, Terms & Conditions, a Refund/Cancellation policy, and a
  Contact page on the site. None exist yet.

## The bigger vision (cross-app, not yet built)

Separate from the landing page itself: Sukoon (the other app in this
account) already has a real PCOS Care journey, its own AI-generated plan,
and real user accounts — it's not just a cousin app waiting to match colors.

The shape being considered: however someone finds the product — this
workshop, or the Sukoon app directly — she answers one shared basic
questionnaire, which lands in one shared profile. From there, anyone can
upgrade to a paid "premium" plan, through either entry point, flipping the
same field on the same record.

Sukoon's database already has pieces of this half-built (a `quiz_answers`
field, a placeholder premium flag). Nothing has been built for this yet —
it was scoped out in detail, not started. Two things are still an open
decision, not an engineering question:
1. Whether Phases (the standalone PCOS onboarding app) gets folded into
   Sukoon's own onboarding, or kept as a third entry point.
2. Whether the premium upgrade is a one-time payment or a recurring
   subscription — this changes which Razorpay integration gets built.

## Where things live

- Code + all commits: `claude/saathi-landing-page-redesign-nc5rpb` on
  `Mysaathi-landingpage`, all pushed.
- Setup/deploy steps: `README.md` in this repo.
- This file: what's done, what's tested, what's still open.
