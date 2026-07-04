# Acquisition Approval Decisions

Date: July 4, 2026

Scope: pleasefindmethis.com first 100 outside-country funded customers.

This is an approval decision, not proof that posts or submissions were sent. Public comments, DMs, emails, ads, and third-party directory forms still need account access, live page/rule checks, and final action-time confirmation before sending.

## Outside-Country Customer Definition

Decision: use India as the home market for the first-100 customer sprint.

An outside-country customer is a unique payment-confirmed customer who funds at least one request and whose country is outside India.

Counting rules:

- Count only `bounty_funded` / `purchase` payment-confirmed customers.
- Do not count visitors, replies, likes, upvotes, waitlist signups, or checkout starts as customers.
- If the payment provider exposes billing/customer country, use that first.
- If provider country is missing, use GA4 country for the converting session.
- If the country is unknown, do not count it as outside-country.
- If billing country and GA4 country disagree, billing/customer country wins.
- For the 100-customer goal, count each customer once; also report total funded requests separately.

## Search Visibility Status

- Google Search Console: submitted `https://pleasefindmethis.com/sitemap.xml` on July 4, 2026. Status showed Success with 31 discovered pages.
- Bing IndexNow: submitted all 31 sitemap URLs on July 4, 2026. Bing accepted the batch with HTTP 202.
- Bing Webmaster Tools: still needs an authenticated Bing Webmaster Tools session before the sitemap can be submitted inside the dashboard.

## Reddit Approval

Approved to send after live subreddit-rule and thread-status verification: no-platform helpful comments only.

Approved targets:

- `B01-001` Trudi Trudini fawn deer plush
- `B01-002` Vermont Teddy Bear Woodland Bear
- `B01-003` 30-year-old Sanpaotai Gaiwan
- `B01-004` Solyn plush / Calamity fan project
- `B01-005` stuffed bunny with purple ears and gingham feet
- `B01-007` Dad's LL Bean shirt
- `B01-008` childhood plush bunny
- `B01-009` thin bomber jacket
- `B01-010` waffle/textured henley
- `B01-011` discontinued giraffe cat toy
- `B02-001` current baby blanket
- `B02-002` France 1997-1999 baby blanket
- `B02-004` 27 Dresses Jane hair clip
- `B02-005` New Year's Evil jacket
- `B02-006` Richard Ayoade headphones
- `B02-007` exact blanket model
- `B02-008` exact fashion design
- `B02-009` T.I. cardigan
- `B02-010` discontinued Ugg shepra boots
- `B03-001` Abercrombie lace-trim tie-front top
- `B03-002` blue down comforter
- `B03-003` Siaki mug
- `B03-004` 2005-2006 tossed-bear fleece blanket
- `B03-005` exact sentimental spatula replacement
- `B03-006` 2001 Barbie Nutcracker hardcover storybook

Product mentions are not approved by default. Use the disclosed pleasefindmethis.com add-on only when the subreddit rules clearly allow it or moderators approve it.

Manual review or defer:

- `B01-006` lost tiger/lion plush: rule-sensitive lost-item recovery. Use as advice only unless the thread and rules clearly allow it.
- `B01-012` SoBe drinks: consumable/expiry/shipping risk. Do not promote the product.
- `B02-003` childhood unicorn photos: lower purchase intent. No UTM/product link.
- `B03-007` Tic-Tac-Tome book: older/lower-priority thread.
- `B03-008` Days of Our Lives sweater: older/lower-priority thread.
- `B03-009` Less Than Zero paperback cover: older/lower-priority thread.
- `B03-010` discontinued product: details unknown until live manual review.

Do not paste unverified AI-generated answers into r/HelpMeFind. Verify each source claim manually first.

## Social Approval

Approved owned/social surfaces:

- LinkedIn company/founder launch post
- X/Twitter founder post
- Bluesky founder post
- Pinterest business pins for sentimental, fashion, home decor, plush, camera, and repair-part examples
- Instagram Reels / posts using visual bounty examples
- TikTok short demos using visual bounty examples
- YouTube Shorts demo
- Dev.to / Hashnode technical build-story post
- Substack weekly bounty-board digest

Rules for every social post:

- No guaranteed-find, guaranteed-safety, escrow, verified-seller, payout-volume, solve-rate, or customer-count claims.
- Use UTM links.
- Use useful examples, not spammy asks.
- Do not imply Reddit/community endorsement.

## Directory Approval

Approved first:

- LinkedIn Company Page
- Crunchbase
- Pinterest Business
- YouTube
- TikTok
- Instagram
- X/Twitter
- Bluesky
- About.me

Approved launch/startup directories:

- Product Hunt
- BetaList
- Fazier
- Uneed
- Microlaunch
- OpenHunts
- Launching Next
- PitchWall
- Startup Stash
- SideProjectors
- F6S
- Indie Hackers
- Promote Project
- BetaBound

Approved content/profile surfaces:

- Dev.to
- Hashnode
- Substack
- WordPress.com only if maintained
- Blogger only if maintained
- Tumblr only if maintained

Manual review:

- Hacker News Show HN
- AlternativeTo
- Slashdot
- StackShare
- Slant
- GitHub

Deferred:

- G2
- Capterra
- GetApp
- TrustRadius
- Reddit Ads
- Google Ads
- Meta Ads
- Pinterest Ads
- TikTok Ads

Skip unless product fit changes:

- SaaSHub
- SourceForge
- Crozdesk
- SaaSWorthy
- TAAFT
- Futurepedia
- Toolify
- Glama MCP
- AI Agents List
- NoCodeFinder
- No Code MBA

## UTM Rule

Use this format for every approved public touch:

```text
https://pleasefindmethis.com/?utm_source={platform}&utm_medium={comment|founder_post|directory|cpc|paid_social}&utm_campaign=first_100_international&utm_content={surface_or_row_id}
```
