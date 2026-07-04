# Simple Google Analytics Event Guide

Date: July 4, 2026

Use this guide when looking at GA4. The site sends both technical events and simple events. The simple events are the ones to read first.

## Most Useful Events

| GA4 event | Simple meaning |
| --- | --- |
| `user_went_to_page` | User went to a page |
| `user_clicked_start_request` | User clicked a start-request button |
| `user_completed_item_details` | User finished describing the item |
| `user_added_photo` | User added a reference photo |
| `user_set_reward` | User set the finder reward |
| `user_started_checkout` | User clicked checkout |
| `user_went_to_payment` | User reached the payment provider |
| `customer_paid_for_request` | Customer paid for a request |
| `finder_submitted_source` | Finder submitted a source |
| `poster_accepted_source` | Poster accepted a finder source |

## Plain-English Fields

Create these as GA4 custom dimensions so reports are readable:

| Field | What it tells you |
| --- | --- |
| `what_happened` | A sentence like "User clicked the checkout button" |
| `button_name` | The button or action name |
| `page_name` | The page the user was on |
| `funnel_step` | The step in the request/payment flow |
| `first_channel` | First remembered channel, like Reddit, Google, Pinterest, TikTok |
| `latest_channel` | Most recent remembered channel before checkout |
| `first_source` | First exact source, like `reddit_helpmefind` or `google` |
| `latest_source` | Latest exact source |
| `is_outside_home_market` | `true` if the paid customer is outside India, when country is known |

## How To Answer The Main Questions

1. "What are people doing?"
   - Open GA4 Reports or Explore.
   - Use event name and `what_happened`.

2. "Which pages are people visiting?"
   - Use event `user_went_to_page`.
   - Add `page_name` and `page_path`.

3. "Where do paying customers come from?"
   - Use event `customer_paid_for_request`.
   - Break it down by `first_channel`, `latest_channel`, `first_source`, and `latest_source`.

4. "Are Reddit/Google/Pinterest/TikTok working?"
   - Compare `customer_paid_for_request` by `first_channel`.
   - Also compare `user_started_checkout` by `first_channel` to see channels that almost pay.

## Important Privacy Rule

The site does not send customer email, customer name, item text, source URLs, private notes, filenames, or raw query strings into GA4.
