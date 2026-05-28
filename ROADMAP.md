# FlightCore — Long-Horizon Monetization & Product Plan

## Context

FlightCore today is a beautifully crafted but commercially unwired PWA: a fully client-side, vanilla-JS aviation-themed brain-challenge game (`app.js`, `index.html`, `styles.css`, `sw.js`, `manifest.json`). It has zero backend, no accounts, no payments, no telemetry, and only localStorage for persistence. The core loop is four challenge modules (Checklist, Instrument Scan, ATC, Emergency) wrapped in a cockpit-grade UI, with streaks, levels, scoring, tiers, and per-module accuracy already in place.

**What FlightCore is.** A fun, premium-looking, aviation-flavored recall and pattern-recognition challenge — closer to "Wordle for cockpits" or a brain-training puzzle game with an aviation aesthetic than to a flight-school product. The audience is **casual challenge-seekers, aviation enthusiasts/sim hobbyists, and student pilots looking for a light, gamified way to sharpen general recall**. Adjacent curious users (ATC enthusiasts, engineering-minded folks who like systems puzzles) are welcome too.

**What FlightCore explicitly is NOT.** It is not a professional pilot training tool, not certification prep, not exam prep, not a procedural training aid for any real aircraft. Content is randomized and stylized — checklists, faults, frequencies, and clearances are *inspired by* aviation but are not guaranteed to be technically accurate and must never be used in real-world flight operations. This product targets practice as recreation, not practice as professional preparation. (See "Positioning & Disclaimers" below — this distinction is load-bearing for the entire plan, from marketing copy to sponsor categories to legal terms.)

The 6–12 month plan is **audience-first**, with monetization layered on after retention is proven. Individuals only — no B2B, no flight-school sales, no enterprise. Stack stays static-first with Supabase + Stripe added only when needed. Ads are deferred and, when introduced, must remain minimal and brand-appropriate.

This plan defines the **positioning, product moves, gamification system, stats/telemetry, freemium structure, pricing, sponsorship strategy, and the technical scaffolding** required to get there — sequenced so each phase compounds on the previous one and nothing is built before its KPIs justify it.

---

## Guiding Principles

1. **It's a game, not a training tool.** Every product decision, every word of copy, every feature name. We talk about "challenges", "rounds", "scores", "ranks" — never "training", "proficiency", "certification", or "exam prep". This protects users (no false confidence on real procedures) and protects us (no liability for a misplaced checklist step).
2. **Premium feel is the moat.** The cockpit-grade UX is the differentiator. Anything that cheapens it (intrusive ads, dark-pattern upsells, generic shadcn dashboards) is off-limits.
3. **Local-first stays the default.** Cloud sync, accounts, and Pro features are *additive* — the offline PWA must keep working without an account.
4. **Earn data before charging.** Don't ship Pro until free retention/engagement metrics prove people care enough to pay.
5. **Individuals only.** No teams, no seats, no enterprise. Every feature is designed for one person sitting with their phone — anything that smells like B2B (admin dashboards, SSO, seat management) is out of scope.

---

## Positioning & Disclaimers

This product walks a deliberate line: aviation-themed enough to be evocative and fun, but never holding itself out as authoritative on real-world flight procedure. That line shapes everything downstream — marketing, content, sponsor categories, and legal posture.

### Words we use vs words we avoid

| Use | Avoid |
|---|---|
| Challenge, puzzle, game, brain workout | Training, drill, proficiency program |
| Round, session, run, attempt | Lesson, exam, checkride, evaluation |
| Score, streak, rank, badge | Grade, certification, qualification |
| Aviation-themed, cockpit-inspired, flight-flavored | Pilot training, professional, certified |
| Recall, pattern recognition, memory | Procedural competency, aircraft type knowledge |
| "Inspired by" real procedures | "Accurate to" / "based on" real procedures |

Apply this lexicon to the landing page, app copy, README, App Store listing (if ever), and every social/marketing channel. A grep CI check would not be unreasonable — flag any new copy containing the avoid-list words.

### Visible disclaimers (must ship before public launch)

1. **Landing page hero** — small but visible: *"A brain-challenge game inspired by cockpit operations. Not a flight training tool. Not for use in real aviation."*
2. **First-run modal** in the app — one-time, dismiss-to-confirm: explains this is a game, content is stylized/randomized, do not rely on it for actual flight operations.
3. **About / Settings screen** — permanent link to the full disclaimer + Terms of Use.
4. **Debrief screen footer** — small italic line on every debrief: *"For entertainment only. Not real flight procedure."* Cheap, repeats the message at the moment users feel most "competent".

### Terms of Use clauses (non-negotiable)

- Explicit "for entertainment and casual practice only" clause.
- Disclaimer of fitness for any aviation, training, or safety-of-life purpose.
- Limitation of liability that covers any user who attempts to apply in-app content in real flight.
- No medical, safety, or regulatory advice.
- Get these reviewed by a lawyer before charging anyone real money — cheap insurance once Pro launches.

### Content design rules (engineering, not just marketing)

- **Randomization stays.** It is a *feature*, not a bug — it's what makes this a puzzle and not a checklist. Don't try to make the data "more accurate" as a response to user complaints; lean further into the puzzle framing instead.
- **Procedures are stylized.** Use plausible-sounding but generic terminology. Avoid real aircraft type designators in the *core* free modules — those go in optional themed packs that carry their own "for fun" disclaimer.
- **No safety-critical specifics.** Don't model emergency procedures with realistic enough fidelity that someone could plausibly reach for them under stress. Keep enough abstraction that the puzzle is the point.

### What this excludes from the product roadmap

- Exam prep mode (FAA written, ATPL, EASA) — **dropped**.
- Logbook integration / instructor exports — **dropped**.
- Certification-flavored badges ("PPL-ready", "IR-ready") — **dropped**.
- Real-airline or real-type-rating content packs branded as such — **dropped**. (Themed homages like "single-engine adventure" are fine.)
- Anything that could be used as evidence of training in a regulatory context — **dropped**.

---

## Phased Roadmap

### Phase 0 — Foundation (Month 0–1, pre-monetization)
Audience-building and instrumentation. Nothing paid ships.

- **Landing page + waitlist** (static, on the same Cloudflare/GH Pages host). Email capture via Buttondown/Resend. Hero copy positions FlightCore as a cockpit-themed brain-challenge game with the "not for real flight" disclaimer above the fold.
- **Privacy-respecting analytics** (Plausible or Umami self-host, or PostHog free tier). Page views, session starts, module completion rates, retention cohorts. *No PII, no ad pixels.*
- **In-app event funnel** added to `app.js` — fire-and-forget POSTs (or batched) for: `session_started`, `module_completed`, `session_finished`, `streak_extended`, `settings_changed`. Behind a single `Telemetry.emit()` wrapper so it can be toggled and later swapped.
- **Account-less cloud sync key** (optional): generate a UUID device key, let the user "claim" it later by signing in. Lets us backfill engagement once auth exists.

### Phase 1 — Accounts + Gamification Depth (Month 1–3)
Make people *want* to come back. Still 100% free.

- **Supabase auth** (email magic link + Google OAuth). One table: `profiles(id, email, display_name, persona, created_at)`.
- **Cloud-synced progress.** Migrate the localStorage schema to a `sessions` and `user_stats` table; keep local writes as the source of truth, sync in the background.
- **Gamification layer** — see "Gamification System" below. Persistent XP/levels, badges, weekly challenges, leaderboards (opt-in pseudonymous).
- **Personalized review** — surface weak modules in the home screen ("Your ATC accuracy dropped 12% this week").
- **Daily challenge** — one shared seed per UTC day so all users practice the same scenarios; enables comparative analytics and shareable scores.

### Phase 2 — Pro Launch (Month 3–6)
Introduce the paid tier *only* once Phase 1 retention metrics justify it (target: 25%+ D30 retention, 3+ sessions/week median for power users).

- **Stripe Checkout + Customer Portal** (no custom billing UI). Webhook → Supabase `subscriptions` table.
- **Feature flag layer** (`features.ts`-equivalent in vanilla JS — a `entitlements.js` module that reads from Supabase and gates UI). Single source of truth so flags can be flipped without redeploys.
- **Pro features** — see "Freemium Model" below: deeper history, advanced modules, scenario builder, exports, etc.
- **Founder pricing** — limited-time discounted annual to seed paying base and gather testimonials.
- **Legal review of Terms + disclaimers** by an actual lawyer before charging anyone. This is the one place we don't DIY.

### Phase 3 — Content Expansion + Light Sponsorships (Month 6–9)
Broaden the moat and add a secondary revenue stream that doesn't cheapen the UX. All features remain Pro/Free for individuals.

- **Themed content packs** as additional depth for Pro subscribers — strictly recreational, no real-aircraft branding: "Bush Pilot" mode (light planes, mountain strips), "Space Shuttle" mode (orbital re-entry vibes), "Retro Cockpit" (analog gauges), "Helicopter Challenge", "ATC Rush Hour" (clearance pattern packs), "Systems Sleuth" (general engineering-puzzle pack). All bundled inside Pro — no separate à la carte SKUs (keeps pricing simple). **Explicitly no FAA/ATPL/EASA exam packs and no real type-rating content** (per Positioning & Disclaimers).
- **Native sponsorships only** — sponsor categories must align with the game framing, not training: sim hardware (yoke/throttle/HOTAS makers), flight-sim software, aviation merch/apparel, aviation publications/podcasts, gaming peripherals. **Excluded sponsor categories: flight schools, exam-prep services, type-rating providers, anything that would imply we're a training product.** Shown as tasteful "Brought to you by" cards on the debrief screen, max one per session, never during a round. **No programmatic ad networks, no Google AdSense.**
- **Referral loop** — share-your-debrief image cards (Canva/HTML-to-image), watermark drives organic growth.

### Phase 4 — Polish & Retention (Month 9–12+)
With Pro shipped and content packs flowing, the final phase invests in keeping individual users engaged long-term.

- **Adaptive difficulty engine** — tune scenario depth to each user's weak areas automatically.
- **Long-form analytics** — month-over-month trends, "your best week" recaps, year-in-review (great for organic shares).
- **Notification & cadence design** — gentle daily-challenge reminders via web push (opt-in, easy to mute). No email spam.
- **Localization** — pick 1–2 languages where aviation training is large (likely ES, FR, or DE based on landing-page signal).
- **Accessibility pass** — full keyboard navigation, screen reader labels, reduced-motion mode (we owe this regardless of monetization).

---

## Gamification System

Layered on top of the existing streak/level/score primitives in `app.js` — *extend*, don't replace.

| Element | Mechanic | Reward | Free / Pro |
|---|---|---|---|
| **XP** | Earned per round (scaled by difficulty + accuracy) | Persistent rank progression | Free |
| **Rank** | XP thresholds → playful, game-y tier names (e.g. Rookie → Co-Pilot → Captain → Ace → Legend). Cockpit-styled flair only; no real-world equivalents. | Visual flair, badge on profile | Free |
| **Daily Streak** | Already exists — extend with milestone rewards (7/30/100 days) | Cosmetic accents, unlockable themes | Free |
| **Badges/Achievements** | "100 perfect ATC reads", "Zero-error emergency session", "All four modules ≥90% in one session" | Profile collection, shareable | Free |
| **Daily Challenge** | Same shared seed UTC-wide; one shot per day | Global leaderboard placement | Free |
| **Weekly Challenge** | Themed week (e.g. "Emergency week") with cumulative scoring | Limited-time badge | Free |
| **Leaderboards** | Pseudonymous, opt-in, weekly resets | Bragging rights | Free |
| **Scenario Builder** | Drag-and-drop custom checklists/emergencies | Save & share | **Pro** |
| **Custom Difficulty Curves** | Tune timer multiplier, level scaling, fault depth | Persisted profiles | **Pro** |
| **Replay & Annotate** | Re-watch a session, see exactly where you failed | Learning tool | **Pro** |

**Design rule**: every gamification element must be *cockpit-aesthetic* — no cartoon mascots, no confetti explosions. Think instrument-cluster glow and authentication-style tier ribbons.

---

## Stats & Telemetry Architecture

Two parallel data streams that share a schema:

### Personal stats (user-facing, surfaced in app)
- Per-session record (already exists in localStorage) → mirrored to Supabase `sessions(user_id, ts, score, accuracy, tier, max_level, max_streak, module_accuracy jsonb)`.
- Aggregated `user_stats(user_id, total_sessions, lifetime_xp, current_rank, weak_module, ...)` updated via Supabase RPC or trigger.
- **Insights surface** on home/debrief: "Your weakest module this week is **Emergency Diagnostics** (62%). Practice it →"

### Product analytics (PM-facing, for decisions)
- Plausible/PostHog for funnel events. Self-host if cost matters.
- Cohort retention dashboard from Supabase materialized views — daily, weekly retention by signup cohort.
- **Pre-Pro KPIs to clear before charging**: D7 ≥ 35%, D30 ≥ 15%, median weekly sessions ≥ 3 for top quartile, "would you pay $29/yr?" survey ≥ 25% yes. (Slightly lower bars than a training-product plan would set, because the casual-game audience is broader but lighter-touch.)

### Privacy posture
- No third-party trackers, no fingerprinting. This is a *feature* — say so on the landing page.
- Telemetry opt-out toggle in settings (already has a settings panel).
- GDPR-clean data export + delete from the user's profile page.

---

## Freemium Model

**Free tier** — the entire current product, plus all gamification and basic cloud sync. Generosity here is the marketing budget; never gate the core loop.

**FlightCore Pro** — depth and customization for players who love the game:
- Unlimited session history + richer stats screens (trend lines, per-module accuracy heatmaps, time-of-day patterns)
- **Harder challenge modes** — longer sequences, faster timers, multi-layer faults, "iron mode" (one mistake ends the session)
- **Themed content packs** included (Bush Pilot, Retro Cockpit, Space Shuttle, ATC Rush Hour, Helicopter, Systems Sleuth — all framed as fun, never as real-aircraft training)
- **Custom challenge mode** — drag-and-drop your own sequences for personal fun (saved locally and to cloud, **not shareable as instructional content**)
- **Custom difficulty curves** — tune timer multiplier, level scaling, fault depth
- **Replay & review** — re-watch a session, see exactly where you slipped
- **Cosmetic flair** — subtle instrument-cluster theme variants (no functional gameplay difference)
- **Export your score history** to JSON/CSV for personal use (clearly framed as personal stats, not for any training/logbook purpose)
- Priority on Pro-only feature voting

**Explicitly NOT in Pro** (per Positioning & Disclaimers):
- No exam prep mode.
- No instructor exports, no logbook integration.
- No real-airline or real-type-rating content packs.
- No certification-flavored badges or progression claims.

**Hard rules:**
- Never paywall the daily challenge or leaderboards (they drive viral growth).
- Never paywall the four base modules.
- Never time-limit a free session.
- Free users hit Pro upsells **at most twice per session** (debrief screen + one contextual nudge), never during a round.

---

## Pricing

Deliberately simple — two SKUs, one decision. Free is generous, Pro is the only upgrade. No lifetime tier, no à la carte content, no teams, no enterprise. Pricing is consciously **lower than aviation-training competitors** because we're a game, not a training tool — closer to mobile-puzzle/indie-game pricing than to study-aid pricing.

| Plan | Price | Notes |
|---|---|---|
| **Free** | $0 | Core loop, all four modules, gamification, cloud sync, daily challenge & leaderboards |
| **Pro Monthly** | $4.99/mo | Anchor option for hesitant users |
| **Pro Annual** | **$29/yr** (~$2.42/mo, ~52% off monthly) | The recommended plan; bulk of revenue |

That's the whole menu. Reference points: mobile puzzle subscriptions ($3–7/mo), indie game season passes ($10–30/yr), aviation training apps ($40–$200/yr — we're deliberately below them because we're not competing on that axis).

**Founder pricing** at Phase 2 launch: first 500 annual subscribers get $19/yr locked in for life. Drives early conversion and creates a vocal advocate cohort.

**Revenue model napkin math** (12-month target, individuals only, recreational positioning):
- 30k free users × 2% conversion to Pro Annual × $29 = **~$17k ARR**
- 30k free users × 0.5% conversion to Pro Monthly × $4.99 × 12 = **~$9k ARR**
- Sponsorship (Phase 3+): 2 partners × $400/mo = **~$10k**
- **Year-1 target: ~$35k ARR.** Modest by design — the pivot to game-not-training trades some willingness-to-pay for a much larger top-of-funnel (challenge-game audience >> professional pilot audience) and far lower legal/positioning risk.

Year-2 levers are all volume and retention: drive free-user growth via the daily challenge / referral loop, then squeeze conversion via better Pro features. No new SKUs needed.

---

## Ads & Sponsorship Strategy

The user explicitly wants this minimal. Plan accordingly:

- **No programmatic ads.** No AdSense, no Mediavine, no third-party SDKs.
- **Sponsorships only**, sold directly:
  - One slot, debrief screen, "Brought to you by [Brand]" card. Max one per session. Never during a round.
  - **Game-aligned categories only**: sim hardware (HOTAS, yokes, throttles), flight-sim software (MSFS, X-Plane add-ons), aviation merch/apparel, aviation podcasts/publications, gaming peripherals, aviation-themed indie games.
  - **Excluded**: flight schools, exam-prep services, type-rating providers, anything that frames us as a training product. Headset makers are borderline — only run them if their pitch is "for sim/enthusiast use", not "for pilot training".
  - Flat monthly rate ($300–800/mo each), not CPM.
- **Pro removes sponsorships entirely.**
- **Sponsorship copy reviewed by us** before going live — keep the cockpit feel.

This caps ad load at ~1 impression/session and keeps the brand intact while giving free users a soft reason to upgrade.

---

## Technical Scaffolding

Minimal, in line with the "stay static + Supabase + Stripe" choice.

### New modules to introduce in the existing codebase
- `auth.js` — Supabase client init, magic-link + Google OAuth flows. Lazy-loaded so logged-out users pay zero JS cost.
- `sync.js` — Local-first writer: localStorage stays authoritative; debounced background push to Supabase. Conflict policy: last-write-wins per session row (sessions are immutable once finalized, so this is safe).
- `entitlements.js` — Single source of truth for "is this user Pro?". Reads `subscriptions` table, caches in memory, exposes `has(feature)` predicate. All gates in the UI call this.
- `telemetry.js` — `Telemetry.emit(event, props)` wrapper. Buffers and batches. Respects opt-out toggle.
- `gamification.js` — XP calc, rank thresholds, badge evaluators. Pure functions, easy to test.

### Supabase schema (initial)
- `profiles(id, email, display_name, created_at)` — no profession/persona field; we don't ask "are you a pilot?" because the answer doesn't change the product.
- `sessions(id, user_id, ts, score, accuracy_pct, tier, max_level, max_streak, module_accuracy jsonb, daily_challenge_seed nullable)`
- `user_stats(user_id PK, lifetime_xp, current_rank, current_streak, weak_module, updated_at)` — denormalized rollup, refreshed by trigger or cron.
- `badges(user_id, badge_key, earned_at)`
- `subscriptions(user_id, stripe_customer_id, plan, status, current_period_end)`
- Row Level Security on everything from day 1; no service-key calls from the client.
- **No `organizations` / `org_members` / SSO tables.** Individuals only — schema stays flat.

### Stripe wiring
- Stripe Checkout (hosted) + Customer Portal (hosted). No custom billing UI.
- One Edge Function / Supabase Function: `stripe-webhook` → upserts `subscriptions`. That's it.

### Files in the current repo most likely to change
- `app.js` — splits into the existing engine plus new module imports (auth, sync, entitlements, telemetry, gamification). Existing state at lines ~124–150 and scoring at ~1378 become the contract `sync.js` reads from.
- `index.html` — adds an account/profile drawer, debrief upsell card, leaderboard view, daily-challenge banner. Same screen-toggle pattern, no router needed.
- `styles.css` — extends the existing design tokens with tier ribbons, badge chips, sponsor card styling. No new design system.
- `sw.js` — keep offline-first; auth/sync endpoints bypass the cache.
- New: `landing/` directory for the marketing/waitlist page (still static).

### What we explicitly **don't** do
- No SSR / Next.js migration.
- No mobile app builds (PWA install covers it).
- No custom backend service — Supabase + Stripe webhooks only.
- No analytics vendor with ad-tech ties (no GA4, no Meta pixel).

---

## Environment Separation (Dev vs Production)

Hard rule: **production data, production payments, and production users must never be touchable from a dev workflow.** Set this up *before* the first Supabase row or Stripe customer exists — retrofitting it is painful.

### Three environments, three of everything

| Env | Purpose | Host URL | Git branch | Supabase project | Stripe |
|---|---|---|---|---|---|
| **local** | Developer machine | `localhost` / `127.0.0.1` | feature branches | `flightcore-dev` (shared) or local CLI | Stripe **test mode** |
| **staging** | Pre-prod verification, demos, share links | `dev.flightcore.app` (or `staging.flightcore.app`) | `develop` | `flightcore-staging` | Stripe **test mode** |
| **production** | Real users | `flightcore.app` | `main` | `flightcore-prod` | Stripe **live mode** |

- **Separate Supabase projects per env.** Not just separate schemas — separate projects, separate URLs, separate anon keys. RLS policies are deployed via migrations to all three; data never crosses over.
- **Separate Stripe accounts/modes.** Use Stripe test mode keys in local + staging, live mode only in production. Webhook endpoints registered per env.
- **Separate domains.** `flightcore.app` (prod) vs `dev.flightcore.app` (staging). Service worker is scoped per origin, so caching never bleeds across.
- **Separate OAuth client IDs.** Google/etc. OAuth apps have their own redirect URIs per env so a misconfigured dev build can't sign users into prod.

### Config via build-time env vars

Even with vanilla JS and no bundler today, we need *some* config layer. Pick one:
- **Option A (simplest):** A generated `config.js` written by the deploy step (Cloudflare Pages / GH Actions) that exports `{ SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY, ENV }`. Different file content per env, never committed.
- **Option B:** Adopt a tiny build step (esbuild/vite) and use `import.meta.env`. Worth it once we have 2+ env-specific values.

Either way: **secrets live in CI/host config, never in the repo.** Add `config.js` to `.gitignore` and ship a `config.example.js`.

### Visible environment indicator

When `ENV !== 'production'`, render a fixed banner ("STAGING — not real users") in a corner. Cheap insurance against demoing on the wrong URL or running a destructive script against prod.

### Git/deploy flow

- `main` → auto-deploys to production (Cloudflare Pages production branch).
- `develop` → auto-deploys to staging.
- Feature branches → preview deploys (Cloudflare gives these free) pointing at the **staging** Supabase + Stripe test mode. Never at prod.
- Protect `main`: required PR review, required passing checks, no direct pushes. (Configurable in GitHub branch protection.)

### Database migrations

- Use Supabase CLI migrations checked into the repo under `supabase/migrations/`.
- CI applies migrations to **staging on merge to `develop`**, and to **production on merge to `main`** — never from a developer's laptop.
- Destructive migrations (drop column, drop table) require a manual approval step in CI.

### Seed & test data

- A `supabase/seed.sql` populates staging with realistic but synthetic users so we can demo and QA without touching prod.
- Local dev uses the same seed against the local Supabase CLI or the shared `flightcore-dev` project.
- **Never** copy prod data down to staging or local (PII + payment data risk). If reproducing a prod bug needs real-looking data, write a synthetic generator.

### Stripe-specific safety

- Webhook secrets and signing keys are env-scoped; the prod webhook endpoint rejects test-mode events and vice versa.
- A startup assertion in the app: if `ENV === 'production'` but the Stripe publishable key starts with `pk_test_`, refuse to boot. Same for Supabase URL mismatches. Belt-and-braces.

### Operational guardrails

- Production Supabase project: only the owner (you) has write access initially. Service-role key never leaves the CI secret store.
- A `scripts/` directory for any maintenance/admin script must read `ENV` and refuse to run against production unless invoked with an explicit `--prod` flag *and* an interactive confirmation. (Same pattern Rails/Django ecosystems use for `rails db:drop`.)
- Logging: staging logs are verbose; production logs strip user emails/IDs from anything that could reach a third party.

This setup costs maybe a day of plumbing in Phase 1 and pays for itself the first time you almost wipe a table.

---

## Security & Privacy

Privacy-respecting design is part of the brand (we explicitly position against ad-tech surveillance products), so security and privacy are product requirements, not afterthoughts. Bake these in from Phase 1, before any real user data exists.

### Threat model — who and what we're defending against

- **Casual attackers** scraping leaderboards, abusing free-tier APIs, scripting fake signups → rate limiting, CAPTCHA on auth, RLS.
- **Account takeover** via credential stuffing or phishing → email magic-link / OAuth (no passwords to leak), short session lifetimes, MFA option for Pro.
- **Insider mistake** (us shipping a bad query that leaks data) → RLS, least-privilege keys, staging-first migrations.
- **Supply-chain compromise** (malicious dependency, CDN takeover) → minimal deps, SRI on third-party scripts, strict CSP.
- **Payment fraud / chargebacks** → Stripe Radar handles this; we never see card data.
- **What we are NOT defending against** (call it out): nation-state actors, hardware compromise, targeted physical attacks. We're a training app, not a defense system — proportionate controls only.

### Authentication

- Supabase Auth with **passwordless magic links + Google/Apple OAuth**. No passwords stored or transmitted means no password leak class of bugs.
- **Short session lifetimes** (e.g. 1 hour access tokens, 30-day refresh) with refresh-token rotation enabled.
- **MFA (TOTP)** optional for free users, **strongly nudged for Pro accounts** (their data and billing live there).
- Rate-limit magic-link sends per email and per IP (Supabase has built-in limits — keep them tight).
- Devices/sessions list in the user's profile with one-click "sign out everywhere".

### Authorization (database)

- **Row Level Security on every table from day 1.** No exceptions. CI fails if a table is created without RLS enabled.
- Default-deny policies — explicit `select`/`insert`/`update`/`delete` rules per table per role.
- The browser never holds the Supabase **service role key**. Service-role calls happen only in Edge Functions/webhooks.
- RLS smoke tests in CI: a test suite logs in as User A and asserts it gets 0 rows when querying User B's data. This catches policy regressions before they ship.

### Payments

- **Stripe-hosted Checkout + Customer Portal**, never a custom card form. This keeps us at PCI SAQ-A scope — the lowest possible.
- Webhook signature verification on every event; reject anything that doesn't validate.
- Idempotency keys on subscription mutations so a replayed webhook can't double-charge.
- Entitlements are derived from the `subscriptions` table populated by webhook, never trusted from client claims.

### Data minimization & PII

- Collect only what's needed: email, display name (optional), persona, training sessions. **No DOB, address, phone, location.**
- `display_name` defaults to a generated handle so leaderboards never expose emails.
- Session records contain no free-text user input that could carry PII — they're all module/score data.
- Logs scrub email and user IDs before leaving our infra. Use opaque request IDs to correlate instead.

### Privacy by design (GDPR / CCPA / general decency)

- **Privacy policy and terms** live on the marketing site before launch, written in plain English (not just lawyer copy). Spell out: what we collect, what we don't, who we share with (Stripe, Supabase — that's it), and retention.
- **User self-serve**: profile page has "Export my data" (JSON dump) and "Delete my account" (hard delete + Stripe customer detach) — required for GDPR Art. 15 & 17, and just the right thing.
- **Telemetry is opt-out** in settings, defaults to on but anonymous (no email/user-id in event payloads — use a separate analytics pseudonym).
- **No third-party ad pixels, no GA4, no Meta Pixel.** Plausible or self-hosted PostHog only. We say this on the landing page — it's a differentiator.
- **Cookie banner**: only show if/when we add anything that requires consent. Privacy-respecting analytics generally don't.
- **Children**: terms exclude under-13/under-16 (per jurisdiction). Aviation training skews adult, so this is low-risk but should be explicit.

### Transport & at-rest

- HTTPS-only via Cloudflare; HSTS preloaded; `_headers` already enforces a CSP — tighten it as we add Supabase/Stripe origins (allowlist, no wildcards).
- Supabase Postgres is encrypted at rest by default. Don't store secrets *in* the DB — secrets belong in env vars / Supabase Vault.
- Backups: Supabase's PITR (point-in-time recovery) enabled on production. Tested restore at least once before go-live.

### Frontend hardening

- **Strict CSP**: `default-src 'self'`; allowlist Supabase, Stripe, Plausible explicitly; `script-src` has no `'unsafe-inline'` or `'unsafe-eval'`. The existing `_headers` file is the right place — audit it on every new third-party integration.
- **Subresource Integrity** on any external script we load.
- **No localStorage of tokens we control** — Supabase handles its own token storage with `httpOnly`-equivalent semantics where possible; we don't roll our own.
- Input sanitization on any user-displayed string (display names, future custom-scenario titles) — render through textContent, never innerHTML.

### Secret management

- Secrets live in Cloudflare Pages env vars / GitHub Actions secrets / Supabase Vault — **never in the repo**.
- A pre-commit hook (gitleaks or trufflehog) scans for accidentally-committed keys. CI re-runs it on PRs.
- Rotation playbook documented before launch: how to rotate Supabase keys, Stripe keys, OAuth secrets. Test it once on staging.

### Supply chain

- Stay zero-dep on the frontend as long as feasible. Every dep added is a security review item.
- If we add a build step (esbuild/vite), lockfile-only updates and Dependabot enabled.
- No loading scripts from random CDNs — vendor them or self-host.

### Logging, monitoring, incident response

- Application logs: Cloudflare + Supabase built-in. No PII (see above).
- **Error monitoring**: Sentry (or self-hosted GlitchTip) with PII scrubbing rules on — strip emails, tokens, full URLs with query strings.
- **Security alerts**: Stripe Radar alerts, Supabase auth anomaly alerts, GitHub Dependabot alerts — all routed to email.
- **Incident response basics**: a written runbook (even one page) covering: key rotation, user notification template, Supabase point-in-time restore procedure, and the disclosure timeline (notify affected users within 72h per GDPR if PII is breached).
- **Vulnerability reporting**: a `security.txt` at `/.well-known/security.txt` with a contact email and PGP key (or Signal). Cheap, signals seriousness.

### Pre-launch security checklist (must be green before paid tier goes live)

- [ ] RLS enabled on every table, smoke-tested in CI.
- [ ] Stripe webhook signature verification implemented and tested.
- [ ] Strict CSP deployed; no `unsafe-inline`/`unsafe-eval`.
- [ ] HSTS preload submitted.
- [ ] Secrets scanner running in CI; no secrets in repo history.
- [ ] User data export + delete endpoints implemented and tested end-to-end.
- [ ] Privacy policy + terms published and linked from the app.
- [ ] Sentry/error monitor configured with PII scrubbing verified.
- [ ] Cross-env startup assertion live (refuses to boot on key mismatch).
- [ ] Backup restore drill performed on staging.
- [ ] `security.txt` published.
- [ ] Terms of Use + Privacy Policy reviewed by a lawyer (not just AI-drafted).
- [ ] First-run "this is a game, not training" modal implemented and shown to every new user.
- [ ] Landing-page hero, app About screen, and every debrief footer carry the "not for real flight" disclaimer.
- [ ] Copy lexicon check (grep for forbidden words: "training", "exam", "certification", "proficiency", "checkride") passes on landing page + in-app strings.

---

## Verification & Go/No-Go Gates

Each phase ships behind explicit metrics so we don't build Pro into the void.

**End of Phase 0**: landing page live, 500+ waitlist signups, telemetry visible in dashboard, no measurable perf regression (Lighthouse ≥95 mobile).

**End of Phase 1**: 5k+ accounts, D7 ≥ 40%, D30 ≥ 20%, ≥3 sessions/week for top quartile, qualitative interviews with 10+ users naming the feature(s) they'd pay for. **If we miss these, we do not launch Pro — we iterate on retention.**

**End of Phase 2**: ≥1.5% free→Pro conversion, <8% monthly churn, NPS ≥ 40 among Pro users, founding cohort testimonials captured.

**End of Phase 3**: 1+ active sponsor, 2+ content packs shipped, organic share rate (debrief shares / sessions) ≥ 5%.

**End of Phase 4**: 1+ localized version shipped, Pro renewal rate ≥ 70%, accessibility audit passed (WCAG AA on core flows).

**Manual verification per release**:
- Run the existing static site locally; confirm offline-first still works with service worker.
- Stripe test mode end-to-end checkout → webhook → entitlement flip → gated UI unlocks.
- RLS smoke test: log in as User A, verify you cannot read User B's sessions via Supabase client.
- Lighthouse mobile audit before each ship; reject anything that drops Performance below 90.
