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

Each important technical event now also sends a simple GA4 event and a `what_happened` field. The simple events are meant for reading reports without needing developer words.

| Simple event | Plain meaning |
| --- | --- |
| `user_went_to_page` | User went to a page |
| `user_viewed_homepage` | User viewed the homepage |
| `user_opened_prefilled_link` | User opened a Reddit/social/source link that prefilled the request form |
| `user_clicked_start_request` | User clicked a button to start a request |
| `user_requested_signup_code` | User asked for a signup code |
| `user_requested_login_code` | User asked for a login code |
| `user_signed_in` | User signed in |
| `user_chose_item_category` | User chose the item category |
| `user_added_photo` | User added a reference photo |
| `user_completed_item_details` | User completed the item details step |
| `user_set_reward` | User set the finder reward |
| `user_started_checkout` | User clicked the checkout button |
| `user_went_to_payment` | User was sent to the payment page |
| `checkout_did_not_start` | Checkout failed before payment page opened |
| `customer_paid_for_request` | Customer paid for a request |
| `finder_submitted_source` | Finder submitted a source |
| `poster_revealed_source` | Poster revealed a source |
| `poster_accepted_source` | Poster accepted a source |
| `poster_sent_source_to_review` | Poster sent a source to review |

| Event | Trigger | Properties | PII policy |
| --- | --- | --- | --- |
| `page_view` + `user_went_to_page` | SPA route change | `route`, `page_name`, `what_happened`, `bounty_id` when applicable, `category` when applicable, `signed_in`, `page_path`, `page_title`, `referrer_host`, UTM fields, first/latest attribution fields | URL query strings are not added to custom properties |
| `landing_view` + `user_viewed_homepage` | Landing route viewed | `signed_in`, `page_path`, `page_title`, UTM fields, first/latest attribution fields | No PII |
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
| `bounty_funded` + `customer_paid_for_request` | Payment provider webhook confirms paid request | `request_id`, `category`, `reward`, `service_fee`, `protection_reserve`, `finder_payout`, `total_due`, `payment_provider`, `home_market_country`, `customer_country`, `customer_country_source`, `is_outside_home_market`, `first_channel`, `latest_channel`, current UTM fields, first/latest attribution fields | Server-side GA4 only; customer email/name/item text are not sent |
| `purchase` | Same payment-confirmed webhook as `bounty_funded` | `transaction_id`, `currency`, `value`, generic `items` payload, country fields, first/latest attribution fields | Uses generic item name `Funded request` |
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
| `VITE_SIMPLE_DIRECT_GTAG_EVENTS` | Browser | Sends the plain-English simple events directly to GA4; defaults to `true` so reports work even if GTM has no custom-event triggers |
| `VITE_ANALYTICS_DEBUG_MODE` | Browser | Adds GA4 debug mode to browser events |
| `GA4_MEASUREMENT_ID` | Server | Measurement Protocol target for webhook-confirmed payment events |
| `GA4_API_SECRET` | Server | Measurement Protocol API secret; never expose as `VITE_` |
| `GA4_MEASUREMENT_PROTOCOL_DEBUG` | Server | Sends webhook events to the GA4 debug endpoint for validation |
| `HOME_MARKET_COUNTRY` | Server | Two-letter home market country code for outside-country reporting; defaults to `IN` |

Account setup:
- Add and verify `pleasefindmethis.com` in Search Console. DNS verification is strongest; HTML tag verification is supported by `VITE_GOOGLE_SITE_VERIFICATION`.
- Submit `https://pleasefindmethis.com/sitemap.xml` in Search Console.
- In GA4, create or select a web data stream for `https://pleasefindmethis.com`.
- In GTM, create custom event triggers for the event names above. Send them to GA4 with matching event parameters.
- If using GTM to send GA4, keep `VITE_DIRECT_GTAG_EVENTS=false`. The simple events still send directly by default through `VITE_SIMPLE_DIRECT_GTAG_EVENTS=true` so they show up without extra GTM trigger setup.
- In GA4 Admin, mark `start_bounty`, `checkout_started`, `bounty_funded`, `submit_source`, and `source_accepted` as key events/conversions.
- Create custom dimensions for `what_happened`, `action_type`, `button_name`, `funnel_step`, `page_name`, `simple_event`, `category`, `source_type`, `payment_provider`, `current_source`, `current_channel`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer_host`, `first_source`, `first_channel`, `first_landing_page`, `first_referrer_host`, `first_utm_source`, `first_utm_medium`, `first_utm_campaign`, `latest_source`, `latest_channel`, `latest_landing_page`, `latest_referrer_host`, `latest_utm_source`, `latest_utm_medium`, `latest_utm_campaign`, `home_market_country`, `customer_country`, `customer_country_source`, and `is_outside_home_market`.
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

The app stores first-touch and latest-touch attribution locally for up to 90 days. This means a visitor who lands from a campaign, navigates through the app, signs in, and reaches checkout later should still carry campaign fields into the payment-confirmed `bounty_funded` and `purchase` events.

## Outside-Country Customer Definition

Home market for this sprint: India (`HOME_MARKET_COUNTRY=IN`).

An outside-country customer is a unique payment-confirmed customer who funds at least one request and whose country is outside India.

Country precedence:

1. Payment-provider billing/customer country, when the webhook exposes a two-letter country code.
2. GA4 country for the converting session.
3. Unknown country does not count as outside-country.

If provider country and GA4 country disagree, use provider country. Count each customer once for the 100-customer goal, and report total funded requests separately.

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
| Outside-country funded customers | Unique `bounty_funded` customers outside India by provider country first, GA4 country second |
| `submit_source` | Finders who submitted a lead |
| `source_accepted` | Accepted source outcomes |
| Acquired posters | Unique people who posted at least one request |

## Data Quality Rules

- Do not mark a person as acquired from a like, upvote, reply, or site visit.
- Mark `acquired` only when the person creates a request or confirms they posted.
- Keep the outreach row id in UTM content so each post or reply can be traced.
- Do not put emails, names, filenames, URLs to private source leads, item free-text details, source notes, review notes, or raw query strings in analytics properties.
- Treat the client return from checkout as informational only. The conversion is `bounty_funded`, which comes from the payment webhook.
