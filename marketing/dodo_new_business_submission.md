# Dodo New Business Submission Notes

## Email Summary

Dodo Payments said the business model in the existing application differs from the new website. Their requested next step is to create a new business under the same Dodo account for the new website and submit the product form for verification, provided the product complies with their Merchant Acceptance Policy.

## Current Website Model

- Website: https://pleasefindmethis.com
- Product: a marketplace workflow for hard-to-find item requests.
- Poster payment: finder offer plus platform service fee plus payment handling/source review fee.
- Finder role: submits protected source links, seller contacts, local leads, or handoff options.
- Platform role: request hosting, protected source records, reveal logs, source review tooling, dispute evidence, support, moderation, and fraud monitoring.
- Item sale: pleasefindmethis.com does not sell, ship, resell, or broker the requested physical goods. Any item purchase happens separately between the poster and the third-party source or seller.

## Dodo Policy Risk

Dodo's Merchant Acceptance Policy lists physical goods, escrow/stored-value behavior, financial services involving fund management, and marketplaces/resale models as unsupported categories. This app has marketplace and finder-payout behavior, so Dodo checkout should stay disabled unless Dodo explicitly approves this exact new website and business model.

## Product Form Guidance

Use truthful wording like:

> pleasefindmethis.com is a hard-to-find item request marketplace. Posters pay a finder offer plus transparent platform/source-review fees. Finders submit protected source information. The platform records source submissions and review decisions, but does not sell, ship, resell, or broker the requested item.

Do not classify the app as generic SaaS, digital downloads, templates, plugins, apps, donations, or a pure digital product unless the product is actually changed to match that model.

## Code Safeguard

The app now defaults checkout away from Dodo. Dodo checkout is blocked unless all of these are true:

- `PAYMENT_PROVIDER=dodo`
- Dodo credentials are configured
- `DODO_MARKETPLACE_CHECKOUT_ENABLED=true`
- Dodo has explicitly approved this new website and business model
