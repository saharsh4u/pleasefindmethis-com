# First 100 International Customers Sprint

Date: July 4, 2026

Goal: acquire 100 funded request customers from outside India.

Decision: use India as the home market for this sprint. An outside-country customer is a unique payment-confirmed funded request customer whose payment-provider billing/customer country is outside India. If provider country is missing, use GA4 country for the converting session. Unknown country does not count. If billing country and GA4 country disagree, billing/customer country wins.

## Current State

- Live domain resolves at `https://pleasefindmethis.com/`.
- `robots.txt` is public and references `https://pleasefindmethis.com/sitemap.xml`.
- Generated guide and request-category pages return 200 and include canonical metadata plus JSON-LD.
- The live sitemap now contains 31 canonical URLs, includes generated guide/request pages, and excludes 404 Markdown URLs.
- IndexNow is configured with a hosted key file and the current 31 sitemap URLs have been submitted to Bing's IndexNow endpoint.
- Google Search Console sitemap submission was completed on July 4, 2026; Search Console showed Success with 31 discovered pages.
- Bing Webmaster Tools dashboard submission still needs an authenticated Bing session; IndexNow submission has already been accepted by Bing.
- First/latest UTM attribution is now preserved through app navigation and sent with checkout/payment analytics.
- Payment-confirmed analytics now include `home_market_country`, payment-provider `customer_country` when available, `customer_country_source`, and `is_outside_home_market`.
- 100 poster acquisition rows and 32 direct Reddit drafts already exist, but no external comments, DMs, emails, directory submissions, or ads have been sent from this environment.
- Outreach and directory approval decisions are recorded in `marketing/acquisition_approval_decisions_2026-07-04.md`.

## Non-Negotiable Guardrails

- Do not claim guaranteed finds, guaranteed safety, escrow, verified sellers, payout volume, solve rate, or customer count until those claims are operationally true and measured.
- Do not post, comment, DM, email, submit forms, launch paid ads, or create public profiles without action-time approval and the right account access.
- Do not bypass subreddit, directory, or platform rules.
- Keep organic community work helpful-first. Product mentions need disclosure and must be allowed by the community.
- Do not put emails, names, item free text, private source URLs, filenames, or raw query strings into analytics.

## Phase 1: Indexing Foundation

Owner: founder/operator with Search Console and Bing access.

1. Add/verify the domain in Google Search Console. Completed.
2. Submit `https://pleasefindmethis.com/sitemap.xml` in Search Console. Completed July 4, 2026; Success, 31 discovered pages.
3. Add/verify the domain in Bing Webmaster Tools and submit the same sitemap. Pending authenticated Bing session.
4. Verify IndexNow receipt in Bing Webmaster Tools. Pending authenticated Bing session; API submission accepted with HTTP 202.
5. Inspect these URLs in Search Console:
   - `https://pleasefindmethis.com/`
   - `https://pleasefindmethis.com/guides/find-item-from-photo/`
   - `https://pleasefindmethis.com/guides/pay-someone-to-find-an-item/`
   - `https://pleasefindmethis.com/requests/sentimental-items/`
   - `https://pleasefindmethis.com/requests/fashion/`

Success metric: sitemap processed successfully, no 404 sitemap URLs, generated pages discovered.

## Phase 2: Measurement

Owner: founder/operator with GA4/GTM/payment-provider access.

1. Confirm GA4 receives browser events: `landing_view`, `start_bounty`, `post_describe_completed`, `set_reward`, `checkout_started`.
2. Confirm a test payment webhook sends `bounty_funded` and `purchase`.
3. Create GA4 custom dimensions for current UTM, first-touch, latest-touch, country, category, source type, and payment provider fields listed in `marketing/poster_acquisition_tracking_plan.md`.
4. Mark `start_bounty`, `checkout_started`, `bounty_funded`, `submit_source`, and `source_accepted` as key events.
5. Build a weekly report with:
   - funded customers by country
   - funded customers outside India
   - `bounty_funded` by `first_utm_source`
   - `bounty_funded` by `latest_utm_source`
   - funnel conversion by landing page

Success metric: every paid customer can be attributed to country, landing page, and first/latest source where data is available.

## Phase 3: Direct Demand

Owner: founder/operator with approved account access.

1. Review the 32 direct Reddit drafts:
   - `marketing/poster_acquisition_direct_batch_01.md`
   - `marketing/poster_acquisition_direct_batch_02.md`
   - `marketing/poster_acquisition_direct_batch_03.md`
2. For each target, re-check current subreddit rules, thread status, and whether product mentions are allowed.
3. Send no-platform helpful comments first where promotion is not allowed.
4. Use disclosed product add-ons only where rules allow or moderators approve.
5. Track each sent touch in `marketing/poster_acquisition_pipeline_100.csv`.

Daily target: 10 approved helpful touches.

Success metric: 100 sent touches, 20 replies, 10 started bounties, 3 funded requests from the first direct batch.

## Phase 4: Directory And Entity Surface

Owner: founder/operator with brand assets and account access.

Start only after the regenerated sitemap is deployed and the main request flow is verified.

Priority submissions:

1. LinkedIn Company Page
2. Product Hunt upcoming page
3. BetaList
4. Fazier
5. Uneed
6. Microlaunch
7. Startup Stash
8. SideProjectors
9. F6S
10. Crunchbase
11. Pinterest Business
12. YouTube
13. TikTok
14. Instagram
15. X/Twitter

Use distinct positioning by surface. Do not submit to AI/MCP/no-code directories until the product has a real AI, MCP, or no-code angle.

Success metric: 15 approved/live profile or launch surfaces, each logged in `marketing/directory_submission_tracker.csv`.

## Phase 5: International Channel Tests

Start after Phase 2 measurement is verified.

Run small country-cluster tests with UTM discipline:

| Cluster | Wedge | Channels | Landing angle |
| --- | --- | --- | --- |
| US/Canada | sentimental, plush, fashion | Reddit, Pinterest, Google Search | exact item from photo |
| UK/Ireland | fashion, home decor, sentimental | Google Search, Pinterest, TikTok | discontinued item finder |
| EU English | plush, vintage, repair parts | Reddit, Google Search, forums | protected finder bounty |
| Japan-interest buyers | cameras, watches, retro gaming | Reddit, X, collector forums | rare gear source lead |
| Australia/NZ | fashion, home decor, repair parts | Google Search, Pinterest | where can I buy this exact item |

UTM format:

```text
utm_source={platform}&utm_medium={comment|founder_post|directory|cpc|paid_social}&utm_campaign=first_100_international&utm_content={surface_or_row_id}
```

Success metric: 100 funded customers outside India, not 100 clicks.

## Approval Queue

- Bing Webmaster Tools access is still needed for dashboard sitemap submission and receipt verification.
- Reddit drafts are approved according to `marketing/acquisition_approval_decisions_2026-07-04.md`; live rule/thread checks are still required before sending.
- Directory submissions are approved according to `marketing/acquisition_approval_decisions_2026-07-04.md`; account login and form review are still required before submitting.
- Approve any paid ad budget before spend.
