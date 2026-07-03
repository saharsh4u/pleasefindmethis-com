# Poster Acquisition Tracking Plan

Date: July 3, 2026

Primary goal: 100 people post requests on pleasefindmethis.com.

Primary conversion: a person creates and funds a request.

Measurement stack:
- Google Search Console for search visibility, indexing, sitemap submission, and query/page reporting.
- Google Tag Manager and/or GA4 for product and conversion events.
- GA4 Measurement Protocol for payment-confirmed server events from checkout webhooks.

Secondary conversions:
- starts a bounty flow
- requests signup/login code
- completes request description
- uploads reference image
- sets reward
- starts checkout
- funds a request
- submits a source
- accepts a source

## Implemented Events

| Event | Trigger | Properties | PII policy |
| --- | --- | --- | --- |
| `page_view` | SPA route change | `route`, `bounty_id` when applicable, `category` when applicable, `signed_in`, `page_path`, `page_title`, `referrer_host`, UTM fields | URL query strings are not added to custom properties |
| `landing_view` | Landing route viewed | `signed_in`, `page_path`, `page_title`, UTM fields | No PII |
| `starter_link_viewed` | Starter prompt URL opens | `starter_id`, `starter_label`, `has_item_param` | Starter labels only; item free text is not tracked |
| `start_bounty` | User clicks a post CTA or starter prompt | `location`, `signed_in`, `prompt`, `starter_id`, `from_starter_link`, `page_path`, UTM fields | No PII |
| `signup_code_requested` | Valid signup email submitted | `account_type`, `pending_route`, `page_path`, UTM fields | Email is not tracked |
| `login_code_requested` | Valid login email submitted | `account_type`, `pending_route`, `page_path`, UTM fields | Email is not tracked |
| `auth_completed` | Signup/login completes from an active auth flow | `provider`, `pending_route` | Email/user id is not tracked |
| `category_selected` | Poster changes request category | `category` | No item text is tracked |
| `post_describe_completed` | User continues from description step | `category`, `has_item_name`, `has_details`, `reference_image_count` | Item text is not tracked |
| `upload_reference_image` | User uploads reference images | `category`, `reference_image_count` | Filenames and images are not tracked |
| `set_reward` | User continues from reward step | `category`, `duration_days`, `reward`, `total_due` | No PII |
| `checkout_started` | User starts checkout after valid name/email inputs | `category`, `duration_days`, `has_reference_images`, `reference_image_count`, `reward`, `total_due` | Name and email are not tracked |
| `checkout_redirected` | Checkout URL returned and redirect begins | `category`, `duration_days`, `reward`, `total_due`, `checkout_provider` | No PII |
| `checkout_failed` | Checkout cannot start | `category`, `error_type`, `reward`, `total_due` | Error message is not tracked |
| `bounty_funded` | Payment provider webhook confirms paid request | `request_id`, `category`, `reward`, `service_fee`, `protection_reserve`, `finder_payout`, `total_due`, `payment_provider`, UTM fields | Server-side GA4 only; customer email/name/item text are not sent |
| `purchase` | Same payment-confirmed webhook as `bounty_funded` | `transaction_id`, `currency`, `value`, generic `items` payload | Uses generic item name `Funded request` |
| `submit_source` | Finder successfully saves a source submission | `bounty_id`, `category`, `source_type`, `has_source_link`, `has_price_or_terms`, `proof_file_count` | Source URL, notes, contact email, and files are not tracked |
| `source_revealed` | Poster reveals a protected source | `request_id`, `source_type` | Hidden source details are not tracked |
| `source_accepted` | Poster accepts a revealed source | `request_id`, `source_type` | Hidden source details are not tracked |
| `source_sent_to_review` | Poster rejects/sends a source to review | `request_id`, `source_type`, `review_reason` | Review note is not tracked |

## Google Configuration

Environment variables:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_GOOGLE_SITE_VERIFICATION` | Browser build | Injects the Search Console HTML verification meta tag at build time |
| `VITE_GTM_ID` | Browser | Loads Google Tag Manager and pushes all custom events to `dataLayer` |
| `VITE_GA4_MEASUREMENT_ID` | Browser/server fallback | Loads the direct Google tag and helps parse GA cookies |
| `VITE_DIRECT_GTAG_EVENTS` | Browser | Sends events directly with `gtag`; keep `false` when GTM sends GA4 events to avoid duplicates |
| `VITE_ANALYTICS_DEBUG_MODE` | Browser | Adds GA4 debug mode to browser events |
| `GA4_MEASUREMENT_ID` | Server | Measurement Protocol target for webhook-confirmed payment events |
| `GA4_API_SECRET` | Server | Measurement Protocol API secret; never expose as `VITE_` |
| `GA4_MEASUREMENT_PROTOCOL_DEBUG` | Server | Sends webhook events to the GA4 debug endpoint for validation |

Account setup:
- Add and verify `pleasefindmethis.com` in Search Console. DNS verification is strongest; HTML tag verification is supported by `VITE_GOOGLE_SITE_VERIFICATION`.
- Submit `https://pleasefindmethis.com/sitemap.xml` in Search Console.
- In GA4, create or select a web data stream for `https://pleasefindmethis.com`.
- In GTM, create custom event triggers for the event names above. Send them to GA4 with matching event parameters.
- If using GTM to send GA4, keep `VITE_DIRECT_GTAG_EVENTS=false`. If not using GTM, set `VITE_GA4_MEASUREMENT_ID` and `VITE_DIRECT_GTAG_EVENTS=true`.
- In GA4 Admin, mark `start_bounty`, `checkout_started`, `bounty_funded`, `submit_source`, and `source_accepted` as key events/conversions.
- Create custom dimensions for `category`, `source_type`, `payment_provider`, `utm_source`, `utm_medium`, `utm_campaign`, and `referrer_host`.
- Create a Measurement Protocol API secret and set `GA4_API_SECRET` so webhook-confirmed `bounty_funded` and `purchase` events fire after real payment confirmation.

## Attribution Rules

Every approved acquisition touch should use:

```text
https://pleasefindmethis.com/?utm_source={{source}}&utm_medium={{medium}}&utm_campaign=first_100_posters&utm_content={{row_id}}
```

Examples:

```text
https://pleasefindmethis.com/?utm_source=reddit_helpmefind&utm_medium=comment&utm_campaign=first_100_posters&utm_content=001
https://pleasefindmethis.com/?utm_source=owned_social&utm_medium=founder_post&utm_campaign=first_100_posters&utm_content=096
```

## Acquisition Dashboard Metrics

Track daily:

| Metric | Definition |
| --- | --- |
| Touches approved | Outreach rows approved for sending |
| Touches sent | Outreach rows actually sent |
| Replies | Human responses to outreach |
| `start_bounty` | Visitors who entered the posting flow |
| `post_describe_completed` | Visitors who completed the first form step |
| `set_reward` | Visitors who picked a payout and duration |
| `checkout_started` | Visitors who attempted payment |
| `bounty_funded` | Primary conversion from confirmed checkout webhook |
| `submit_source` | Finders who submitted a lead |
| `source_accepted` | Accepted source outcomes |
| Acquired posters | Unique people who posted at least one request |

## Data Quality Rules

- Do not mark a person as acquired from a like, upvote, reply, or site visit.
- Mark `acquired` only when the person creates a request or confirms they posted.
- Keep the outreach row id in UTM content so each post or reply can be traced.
- Do not put emails, names, filenames, URLs to private source leads, item free-text details, source notes, review notes, or raw query strings in analytics properties.
- Treat the client return from checkout as informational only. The conversion is `bounty_funded`, which comes from the payment webhook.
