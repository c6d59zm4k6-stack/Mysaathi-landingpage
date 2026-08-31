# Reference funnels — quiz-based landing pages

Notes from a design discussion on whether/how to restructure the Garbha
Saathi landing page as a quiz funnel (like Phases) instead of a scrolling
sales page. Kept here since there's no direct "write to Claude memory"
tool available in this session — a repo file is more durable anyway,
since it's versioned and doesn't depend on any particular session.

**Confidence levels differ below.** Phases is verified from its own
source in this repo's sibling project. Everything about Traya, Noom,
Prose, etc. is from general/training knowledge, not a live inspection —
this session has no web browsing access. Re-verify by actually opening
these funnels before treating specifics as fact.

## Traya (Indian hair-loss D2C) — closest reference, revisit this one first

- Ad (Meta/Instagram) → lands directly on the quiz, no homepage first.
- A long intake (10+ questions: gender, age, duration, family history,
  stress, diet, medical history) — long because it's building toward an
  actual diagnosis claim.
- "Analyzing…" processing screen — their branded hook is combining
  Ayurveda + Allopathy + Nutrition.
- Diagnosis reveal — names the likely cause/stage, sometimes with a
  visual comparison.
- Plan + upsell — a recommended kit, bundled with a free doctor
  consultation offer.
- Checkout — 1/3/6-month tiers, standard price-anchoring (bigger bundle
  = better per-month price).

**Why it's the closest fit:** same market (India, same ad platforms,
same payment norms), same shape (diagnosis quiz → named
condition/type → plan → afford­able entry point → bigger upsell after).

**Key difference from our case:** Traya's long intake belongs on the
quiz page because the *product* (which kit) depends on the answers.
Our equivalent long intake (10+ questions) belongs inside the actual
*workshop* (where the MySaathi assistant builds her plan live) —
not on the pre-purchase landing page. The landing page's own quiz stays
short, like Phases'.

## Noom — the closest structural match, but with a real caveat

- Long, gamified quiz *before* she ever sees a price — builds
  investment/personalization feeling ahead of the paywall.
- Commercially a genuine success (large valuation, huge user base) —
  the quiz-first mechanic is a real driver of that, not incidental.
- Also the standard example cited when critiquing this pattern: faced
  real backlash, including regulatory scrutiny, over auto-renewal/
  cancellation practices — NOT over the quiz mechanic itself. Worth
  separating: funnel design sound, billing practices need to be
  handled honestly.
- Its personalization is largely *presentational* — most users land on
  a fairly standard core app underneath. Worth naming since our
  workshop's plan is genuinely different per person (see below) — a
  stronger, more honest position than Noom's.

## Prose / Function of Beauty / Curology / Care of — the category itself

- All DTC (hair/skin/vitamins). Quiz funnel is the entire acquisition
  model, not a section of a larger page.
- Their personalization is *real* — the quiz changes the actual product
  shipped (different formula/blend), not just the framing.
- Tooling exists specifically for this pattern (Octane AI, Prehook,
  Typeform's quiz builder) — evidence this is an established approach
  with off-the-shelf support, not a novel bet.

## Where MySaathi sits on this spectrum

- The **workshop session** is standardized (same for everyone) — like
  Noom's core app.
- The **plan built during the workshop** differs per person — closer to
  Prose/Curology's real-output personalization than to Noom's mostly-
  presentational version.
- Traffic source matches all of these: cold ad traffic landing directly
  on the quiz, not a homepage.

## Decision made in this conversation (see chat for full reasoning)

- Not copying the generic "quiz funnel" 9-step shape floated early on —
  that was an unverified composite, not drawn from a real funnel.
- Keeping **Phases' actual verified 16-screen structure** as the base
  (see this repo's `Personalized-pcos-app-onboarding-` sibling project
  for the source), since it's real and already proven to feel
  engaging.
- Phases has **no payment step at all** — it only captures an email.
  Getting a real purchase means appending checkout (already built:
  `api/create-order.js`, `api/verify-payment.js`,
  `api/razorpay-webhook.js`) after Phases' own email-capture point, not
  modeling that part on Phases.
- Adding a richer hero (video + headline, from the current landing
  page) in place of Phases' plain text-only welcome screen.
