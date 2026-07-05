# BountyBay — Competitor Profile

**URL**: https://bountybay.co  
**Generated**: 2026-07-05  
**Depth**: Deep public workflow scan from homepage metadata, sitemap, App Store listing, and public app bundle evidence.

---

## At a Glance

| Metric | Value |
|---|---|
| Tagline | "Find The Unfindable" |
| App Store subtitle | "Post a bounty. Get it found." |
| Category | Shopping |
| Developer | BountyBay Inc. |
| Target audience | People who want rare, discontinued, sentimental, regional, or hard-to-find items found by verified hunters |
| Pricing starts at | Free app; reward/payment mechanics are success-oriented |
| Reviews | App Store reports 0 reviews/ratings overview as of this pull |
| Domain rank / traffic | Not pulled; DataForSEO unavailable in this environment |

---

## Positioning & Messaging

**Primary value proposition**: BountyBay positions itself as a demand-first marketplace: users post exactly what they want, verified hunters search, and the requester reviews the submission before the reward is released.

**Target audience**: Consumer shoppers and collectors who are tired of browsing listings themselves, especially for discontinued products, rare collectibles, sentimental items, hard-to-find parts, and regional/international goods.

**Key messaging themes**:
- "Reverse marketplace" / demand-first shopping instead of browsing inventory.
- Verified hunter network, with Stripe Identity named in App Store copy.
- Pay/release only after the poster accepts a submission.
- Human search across internet, local shops, estate sales, and other non-indexed sources.
- Category SEO pages for lost media, collectibles, vintage cars, plushies/blankets, and fashion.

---

## Product & Features

### Core Capabilities
- Post a bounty with description, photos, reward, item budget, deadline, tags, and verification requirements.
- Browse public bounties and public bounty detail pages.
- Hunter claim/submission workflow with accepted/rejected states.
- Profile completion/onboarding route and public user profiles.
- Stripe Identity and Stripe Connect style payout readiness signals in the app bundle.
- Messages route with unread badge logic.
- Hunter tiers and rating/review logic.
- Support ticket routes and admin support routes.
- Team/admin dashboards for users, traffic, revenue, accepted claims, disputes, and support.

### Notable Differentiators
- The competitor emphasizes identity-verified hunters before they can claim a bounty.
- They have an explicit messaging loop, support ticket loop, and profile completion gate.
- The public app bundle shows routes for `/verification`, `/connect-complete`, `/identity-complete`, `/messages`, `/support`, `/me/profile`, `/u/:userId`, and hunter tiers.

### Product Direction Signals
- App Store version notes mention bounty claim fixes, Stripe verification fixes, messaging bug fixes, and Google/Apple sign-in additions in May-June 2026.
- The sitemap includes many public bounty detail URLs, which suggests they are investing in public listing pages for SEO and browsing.

---

## Pricing

| Area | Evidence | Notes |
|---|---|---|
| App | Free on App Store | App Store JSON-LD lists price 0 USD. |
| Reward model | Poster sets a reward; hunter is paid when accepted | App Store copy says the user reviews a submission and only pays the reward when accepted. |
| Fees | Public bundle includes copy about hunter-side fees and Stripe processing | Pricing copy appears inconsistent across bundle contexts, so treat exact fee model as unconfirmed. |

---

## Strengths

- Stronger trust loop than a simple request board: identity status, payout readiness, support tickets, messages, ratings, and hunter tiers are present in routes or public bundle strings.
- Marketplace lifecycle is broad: post, browse, claim, message, review, payout/Connect, identity verification, public profile, support, admin.
- Mobile distribution is active through the App Store, with recent release notes in June 2026.
- SEO structure is deliberate: sitemap includes category pages and public bounty detail pages.

## Weaknesses / Risks

- App Store says there are not enough ratings or reviews to show an overview, so public social proof appears limited.
- Several public claims use "escrow" or held-payment language. That can be risky unless payment/legal setup fully supports it.
- Public web pages are client-rendered; without JS the homepage mostly exposes metadata, not crawlable body content.
- Version notes mention claim and Stripe verification bugs, implying these loops recently needed fixes.
- Exact pricing/fee model is not clearly published in one stable public page.

---

## Competitive Implications for pleasefindmethis.com

**Where BountyBay is stronger**:
- Account/profile completion is part of the product path.
- Finder identity and payout readiness are explicit.
- Messaging and support ticket loops are first-class routes.
- Hunter tiers and public user profiles create visible reputation mechanics.

**Where pleasefindmethis.com is stronger**:
- Fee language is clearer in-product: 12% platform fee, 3% trust/payment protection fee, and the finder payout remains the reward.
- Protected source reveal and duplicate-source priority are modeled in schema, UI, and staff review.
- Current copy avoids unsupported "escrow" wording.

**Action Taken in This Repo**:
- Added account profile and payout-readiness UI.
- Added a protected Messages route tied to revealed source cases.
- Converted support into a structured ticket intake with mail fallback.
- Added Supabase migration for `profiles`, `finder_payout_profiles`, `finder_payout_cases`, `source_messages`, `support_tickets`, and `support_ticket_messages`.
- Added accepted-source payout cases so a finder can see payable reward amount, release window, dispute hold status, and processor transfer references.
- Added staff-only `/api/admin/payout-cases` actions with Supabase token verification, admin allowlist/app-metadata checks, service-role updates, and `payout_case_events` audit logging for hold, processing, note, and paid decisions.
- Extended the same staff-only review path to source disputes and support tickets, including `source_dispute_events` and `support_ticket_events` audit logs, dispute outcome side effects on payout cases, and support ticket status/reply handling.
- Strengthened duplicate-source priority by fingerprinting the canonical source instead of finder notes/email, recording duplicate attempts in `source_duplicate_flags`, and giving staff audited review/link/dismiss actions.
- Replaced demo trust profile copy with saved account/readiness state.

---

## Raw Data Sources

- Homepage HTML: `competitor-profiles/raw/bountybay/2026-07-05/scrapes/homepage.html`
- Sitemap: `competitor-profiles/raw/bountybay/2026-07-05/scrapes/sitemap.xml`
- Public app bundle: `competitor-profiles/raw/bountybay/2026-07-05/scrapes/app-bundle.js`
- Bundle string context index: `competitor-profiles/raw/bountybay/2026-07-05/scrapes/bundle-string-contexts.md`
- Web app manifest: `competitor-profiles/raw/bountybay/2026-07-05/scrapes/manifest.json`
- App Store raw page: `competitor-profiles/raw/bountybay/2026-07-05/reviews/app-store.html`
- App Store clean summary: `competitor-profiles/raw/bountybay/2026-07-05/reviews/app-store-summary.md`
- Live public sources checked: https://bountybay.co and https://apps.apple.com/us/app/bountybay-find-the-unfindable/id6760129460
