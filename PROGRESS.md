# MySaathi landing page — build progress

Written so this can be picked back up (by you, or a fresh Claude session)
without re-reading the whole chat history.

## What this is

The landing page for a ₹149 live PCOS workshop, plus two small serverless
functions (`api/`) that take payment through Razorpay. See `README.md` for
setup/deploy steps — this file is about **what's been built, what's
tested, and what's still open.**

Branch: `claude/saathi-landing-page-redesign-nc5rpb`, merged into `main`
after each change (that's what Vercel deploys from). Everything below is
committed and pushed — nothing is sitting locally, unpushed, or only in
chat.

## Three versions exist — `preview.html` is the one going to production

- **`index.html`** — the original scrolling sales page. Full sections
  (founder story, packages, FAQ), Hindi/English toggle.
- **`quiz.html`** — Phases' actual 16-screen quiz mechanic, ported and
  extended with a hero, testimonials, and checkout.
- **`preview.html`** — a card-based, scroll-snap funnel (tap-through
  quiz → personalized result → testimonials → post-workshop options →
  FAQ → price pitch → payment popup). **This is the current production
  candidate** — `index.html` and `quiz.html` are intentionally frozen
  for now, not being iterated on.

All three share the same payment backend (`api/create-order.js`,
`api/verify-payment.js`, `api/razorpay-webhook.js`) and the same brand
(MySaathi, renamed from Garbha Saathi).

## What's built on `preview.html`, in order

1. Hero with a real intro video (tap-to-play, native progress/pause
   controls, real poster frame extracted from the video) and a headline
   covering all the symptoms including fertility.
2. A 2-question tappable quiz (symptoms, then a "same diagnosis, same
   plan?" realization) feeding a personalized result card — including an
   actual plan-sample screenshot, not just a text description.
3. Real testimonials (verbatim quotes from earlier services — see "Open
   items" below, names still pending) and post-workshop options (DIY /
   90-Day Program at ₹1,499 / clinic visit), ported from `index.html`.
4. An FAQ addressing the "will 2 hours actually help" skepticism.
5. A price-pitch card, followed by a Razorpay checkout popup (name/
   WhatsApp/email → Razorpay → verified confirmation) — same popup
   pattern as `index.html`, reachable from any card via the sticky bar.
6. Legal pages: `privacy.html`, `terms.html`, `refund.html`,
   `contact.html` — linked from the price-pitch card. **These are solid
   drafts, not reviewed by a lawyer** — see "Open items."

Tested directly throughout (not just described): forged Razorpay
signatures rejected, tampered amounts rejected, the checkout popup opens
correctly from every entry point, a failed email never flips a real
payment to "unconfirmed," and the personalized-focus pill correctly
shows a generic message (not a fake-specific one) when she reserves
before answering the quiz.

## How to actually test what's built

**Without any setup** (pull the branch, open `preview.html`): the whole
quiz, personalization, testimonials, options, and FAQ are client-side —
testable immediately, no server needed. Tapping "Reserve" opens the
checkout popup and validates the form even with no backend.

**Payment itself won't complete without a backend** — expected, not a
bug. With no `/api` behind it, submitting the form shows *"Payment isn't
switched on yet"* — the fallback working correctly. Real checkout needs
the repo imported into Vercel plus `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`
set (see README). You've already confirmed a full test-mode Razorpay
checkout works end to end.

## Open items — needs you, not more code

**Blockers before real money can flow:**
- Razorpay live-mode KYC (business PAN, bank account) — not started.
  Test keys work today; this is what unlocks real payments.
- Confirm `RAZORPAY_WEBHOOK_SECRET` and `RESEND_API_KEY` are actually set
  in Vercel — without them, no confirmation email ever sends.
- Legal pages exist now but are drafts with placeholders (`[ ... ]`
  markers) for things only you know: registered business name, address,
  support email/phone, whether sessions are recorded, your actual
  cancellation-window policy, and whether a named Grievance Officer is
  required for your business (confirm with a professional — this isn't
  legal advice, just a reasonable starting draft).

**Content still placeholder:**
- Workshop date is still `[ Sun 22 June · 11 AM ]` everywhere.
- Testimonials have real quotes now (from earlier services) but real
  names are still `[ Name ]`, and the photos are still randomuser.me
  stand-ins, not the actual people's photos.
- FAQ's "What if I can't join live?" still says `[ Replay policy to
  confirm before launch ]`.
- The plan-sample screenshot (`assets/plan-sample.webp`) still visually
  shows the old "Garbha Saathi" name baked into the image itself — it's
  a real screenshot, not editable text, so it needs a fresh one.

**Decided, worth noting:**
- 90-Day Program price: ₹1,499 (set).
- Platform: Google Meet, not Zoom (set on `preview.html` only —
  `index.html`/`quiz.html` still say Zoom, but they're frozen for now).

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
  `Mysaathi-landingpage`, merged into `main` after each change, all pushed.
- Setup/deploy steps: `README.md` in this repo.
- This file: what's done, what's tested, what's still open.
