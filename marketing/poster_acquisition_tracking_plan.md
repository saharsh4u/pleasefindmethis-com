# Poster Acquisition Tracking Plan

Date: July 3, 2026

Primary goal: 100 people post requests on pleasefindmethis.com.

Primary conversion: a person creates and funds a request.

Secondary conversions:
- starts a bounty flow
- requests signup/login code
- completes request description
- uploads reference image
- sets reward
- starts checkout

## Implemented Events

| Event | Trigger | Properties | PII policy |
| --- | --- | --- | --- |
| `start_bounty` | User clicks a post CTA or starter prompt | `location`, `signed_in`, `prompt`, `page_path`, `page_search` | No PII |
| `signup_code_requested` | Valid signup email submitted | `account_type`, `pending_route`, `page_path`, `page_search` | Email is not tracked |
| `login_code_requested` | Valid login email submitted | `account_type`, `pending_route`, `page_path`, `page_search` | Email is not tracked |
| `post_describe_completed` | User continues from description step | `category`, `has_item_name`, `has_details`, `reference_image_count` | Item text is not tracked |
| `upload_reference_image` | User uploads reference images | `category`, `reference_image_count` | Filenames and images are not tracked |
| `set_reward` | User continues from reward step | `category`, `duration_days`, `reward`, `total_due` | No PII |
| `checkout_started` | User starts checkout after valid name/email inputs | `category`, `duration_days`, `has_reference_images`, `reference_image_count`, `reward`, `total_due` | Name and email are not tracked |
| `checkout_redirected` | Checkout URL returned and redirect begins | `category`, `duration_days`, `reward`, `total_due` | No PII |
| `checkout_failed` | Checkout cannot start | `category`, `error_type`, `reward`, `total_due` | Error message is not tracked |

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
| Funded requests | Primary conversion |
| Acquired posters | Unique people who posted at least one request |

## Data Quality Rules

- Do not mark a person as acquired from a like, upvote, reply, or site visit.
- Mark `acquired` only when the person creates a request or confirms they posted.
- Keep the outreach row id in UTM content so each post or reply can be traced.
- Do not put emails, names, filenames, URLs to private source leads, or item free-text details in analytics properties.
