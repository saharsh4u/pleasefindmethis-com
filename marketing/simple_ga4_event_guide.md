# Simple GA4 Event Guide

Track the free public request-board journey with product-neutral events.

| Event | Meaning |
| --- | --- |
| `view_home` | Visitor viewed the home page |
| `start_request` | Visitor started a new request |
| `request_reference_added` | Requester added a photo or reference link |
| `request_details_completed` | Requester completed the request details |
| `request_published` | A free public request was published |
| `request_shared` | Requester used a share action |
| `view_public_request` | Visitor viewed a public request |
| `public_clue_started` | Visitor opened the public clue form |
| `public_clue_submitted` | A public clue was accepted |
| `public_clue_reported` | A public clue was reported for moderation |
| `sign_in_completed` | User completed sign-in |

Do not include email addresses, free-text request details, source URLs, or other personal data in analytics parameters. Useful low-cardinality parameters include request category, entry page, authenticated state, and whether a request has a reference image.
