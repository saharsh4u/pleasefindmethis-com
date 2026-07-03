# Dodo New Business Submission Notes

## Email Summary

Dodo Payments said the business model in the existing application differs from the new website. Their requested next step is to create a new business under the same Dodo account for the new website and submit the product form for verification, provided the product complies with their Merchant Acceptance Policy.

## Current Website Model

- Website: https://pleasefindmethis.com
- Product: an online request-board/source-lead web app for hard-to-find item requests.
- Poster payment: finder offer plus platform service fee plus payment handling/source review fee.
- Finder role: submits online source leads such as protected listing URLs, seller contact paths, or public availability information through the website.
- Platform role: request hosting, protected source records, reveal logs, source review tooling, dispute evidence, support, moderation, and fraud monitoring.
- Delivery/fulfillment: pleasefindmethis.com does not deliver items, dispatch people, arrange pickup, provide courier work, provide personal shopping, or perform in-person services.
- Item sale: pleasefindmethis.com does not sell, ship, resell, store, authenticate, or broker the requested physical goods. Any item purchase happens separately between the poster and the third-party source or seller.

## Dodo Policy Risk

Dodo's Merchant Acceptance Policy lists physical goods, escrow/stored-value behavior, financial services involving fund management, and marketplaces/resale models as unsupported categories. This app has a source-lead/finder-reward workflow, so Dodo checkout should stay disabled unless Dodo explicitly approves this exact new website and business model.

## Live Dashboard Review - 2026-07-03

Initial status in Dodo dashboard: `Product Review Failed`.

Exact rejection reason shown in the Dodo verification page:

> We appreciate your product, however we do not currently support manual fulfillment or delivery methods, nor do we support SaaS platforms that lead to in-person or real-world services. We do not support marketplace business model.

The initial submitted product form disclosed:

- Category: `Marketplace or platform`
- Delivery: `Instant access (login, download etc)` and `Manual fulfilment`
- Human involvement: `Medium human involvement`
- Product description: hard-to-find item request marketplace where posters pay a finder offer and source-review/platform fees, finders manually submit protected source links, seller contacts, local leads, or handoff options, and any item purchase happens separately with third-party sources.

Correction after product clarification:

- The product is not a manual delivery or physical fulfillment service.
- The product does not dispatch people for delivery, pickup, courier work, personal shopping, or in-person services.
- Customers receive immediate access to an online request workspace.
- Source leads are online information records, such as listing URLs, seller contact paths, or public availability details.
- Human involvement in product delivery should be treated as low: moderation/support/review tooling, not manual item fulfillment.

Appeal submitted in Dodo dashboard on 2026-07-03. Dodo showed `Appeal submitted successfully`; Product Information status changed to `Under Review`.

Appeal framing used:

> pleasefindmethis.com is not a manual fulfillment or delivery service, and we do not provide in-person or real-world services. Customers receive immediate access to a web app where they publish an online request workspace. Other users may submit online source leads only, such as listing URLs, seller contact paths, or public availability information, through the website. No person is dispatched for delivery, pickup, courier work, personal shopping, or in-person service.

The appeal still disclosed that checkout covers platform access/workflow and any eligible finder reward for online source information.

If Dodo still rejects the product as an unsupported marketplace model, minimum changes likely required before a compliant Dodo resubmission:

- Remove the marketplace/finder-payout model entirely.
- Remove paid user-submitted source leads as the product's core value if Dodo treats them as a marketplace.
- Stop charging through Dodo for funded requests, bounty payouts, held funds, or review-dependent payouts.
- Convert the offer into an immediate digital product Dodo supports, such as self-serve software, automated search tooling, subscriptions, templates, plugins, or apps, only if the live product actually changes to match that model.
- Ensure the purchase delivers digital value directly after checkout and does not facilitate a real-world item/service transaction, physical goods purchase, escrow-like flow, or third-party marketplace transaction.

## Product Form Guidance

Use truthful wording like:

> pleasefindmethis.com is an online request-board web app for hard-to-find items. Customers pay for access to publish a request and use the protected source-lead workflow, including any eligible finder reward for online source information. Other users can submit source leads such as listing URLs, seller contact paths, or public availability information through the website. The platform records source submissions, reveal logs, and review decisions, but does not sell, ship, resell, broker, store, authenticate, or deliver requested items. Any item purchase happens separately between the customer and a third-party seller.

For Dodo delivery fields, use:

- Category: `SaaS/ AI software` only with explicit disclosure of the online source-lead/finder-reward workflow.
- Customer receipt after payment: `Instant access (login, download etc)`.
- Do not select `Manual fulfilment` unless the product changes to include merchant-provided delivery or manual customer delivery.
- Human involvement: `Low human involvement`, because platform delivery is automated access plus moderation/support, not physical fulfillment.

Do not classify the app as digital downloads, templates, plugins, apps, donations, or a pure digital product unless the product is actually changed to match that model.

## Code Safeguard

The app now defaults checkout away from Dodo. Dodo checkout is blocked unless all of these are true:

- `PAYMENT_PROVIDER=dodo`
- Dodo credentials are configured
- `DODO_MARKETPLACE_CHECKOUT_ENABLED=true`
- Dodo has explicitly approved this new website and business model
