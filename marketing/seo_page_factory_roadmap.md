# SEO Page Factory Roadmap

The highest-leverage marketing loop is to turn funded demand into crawlable pages: open bounty pages, solved-find pages, category hubs, finder profiles, and image-search pages.

## Current Blockers Observed

- `pleasefindmethis.com` did not resolve from this environment on July 2, 2026.
- Public request data exists in `public_request_cards` in `server.mjs`.
- `public/sitemap.xml` currently lists static app paths, but the SEO loop needs dynamic request, solved, category, finder, and image sitemaps.
- Bounty detail metadata in `src/main.tsx` currently marks active bounty detail pages `noindex,follow`; funded public bounty pages should become indexable only when moderated and content-rich.
- The app appears to be a client-rendered SPA. Programmatic SEO will need crawlable path URLs and server-rendered or pre-rendered metadata for unique pages.

## URL System

Use lowercase, hyphenated, path-based URLs:

```txt
/requests/
/requests/{category-slug}/
/requests/{category-slug}/{item-slug}-{id}/
/solved/{category-slug}/{item-slug}-{id}/
/finders/{handle}/
/image-search/{category-slug}/{item-slug}-{image-id}/
```

Redirect legacy/hash URLs to path URLs. Self-canonical every indexable page.

## Open Bounty Page

Target queries:

- `find {item}`
- `where to buy {item}`
- `{item} wanted`
- `{item} reward`
- `help find {item}`

Template:

```txt
Title: Find {Item Name} - ${Reward} Finder Bounty
Meta: Help find {item name}. ${reward} payout for a valid source. See reference photos, must-have details, location, and submit a protected lead.
H1: Find {Item Name}
URL: /requests/{category}/{item-slug}-{id}/
```

Visible modules:

- Breadcrumbs
- Main reference image
- Status, reward, days remaining, submission count
- What the poster needs
- Must match
- Helpful clues
- Where it can ship
- Submit a source CTA
- Similar open bounties
- Solved finds in same category
- Safety/payment FAQ

Schema:

- `WebPage`
- `BreadcrumbList`
- `Demand`
- `Thing` or `Product` only when appropriate
- `ImageObject`

## Solved Page

Target queries:

- `where to find {item}`
- `{item} found`
- `{item} source`
- `{item} replacement`

Template:

```txt
Title: Found: {Item Name} Source - pleasefindmethis.com
Meta: See how a finder sourced {item name}, what details matched, and how similar hard-to-find {category} requests get solved.
H1: Found: {Item Name}
URL: /solved/{category}/{item-slug}-{id}/
```

Visible modules:

- Solved badge
- Original reference image
- Reward paid or accepted status where legally and operationally true
- Time to solve
- Original request
- Match criteria
- How it was found, without exposing private seller info
- What made the match valid
- Similar solved finds
- Post a similar request CTA

Schema:

- `WebPage`
- `Article` only when there is a real narrative
- `BreadcrumbList`
- `ImageObject`
- `ItemList` for related solved finds

## Category Hubs

Target queries:

- `hard to find {category}`
- `find discontinued {category}`
- `rare {category} finder`
- `{category} bounty`

Template:

```txt
Title: Hard-to-Find {Category} Bounties
Meta: Browse open {category} find requests with funded payouts, reference photos, and protected source submissions from expert finders.
H1: Hard-to-Find {Category} Requests
URL: /requests/{category-slug}/
```

Priority hubs:

1. `/requests/sentimental-items/`
2. `/requests/cameras/`
3. `/requests/watches/`
4. `/requests/repair-parts/`
5. `/requests/retro-gaming/`
6. `/requests/home-goods/`

Modules:

- Category-specific intro
- Top open bounties
- Highest rewards
- Closing soon
- Recently solved
- Common clues for category
- Top finders in category
- FAQ

Schema:

- `CollectionPage`
- `ItemList`
- `BreadcrumbList`

## Finder Profiles

Template:

```txt
Title: {Display Name} - {Primary Category} Finder
Meta: View {display name}'s finder profile, accepted sources, categories, ratings, and solved hard-to-find item requests.
H1: {Display Name}
URL: /finders/{handle}/
```

Index only verified, content-rich profiles with public stats. Do not expose private contact details.

Schema:

- `ProfilePage`
- `Person` as `mainEntity`
- `InteractionCounter` only for real visible stats

## Image-Search Pages

Target queries:

- `find this {object} from photo`
- `identify {category} from image`
- Google Images and visual search traffic

Template:

```txt
Title: Find This {Item Name} From a Photo
Meta: Use this reference image to identify or source {item name}. View visual details, matching clues, category, and related hard-to-find requests.
H1: Find this {Item Name} from a photo
URL: /image-search/{category}/{item-slug}-{image-id}/
```

Image rules:

- Descriptive filename: `/find-requests/{category}/{item-slug}-{image-id}.webp`
- Alt text: `{item name} reference photo for a hard-to-find {category} request`
- Surrounding text describes color, material, shape, markings, tag, model, and must-match details.

Schema:

- `ImageObject` linked to parent request page.

## Indexing Rules

Index only pages that are:

- Public
- Funded or solved
- Moderated
- Legal and policy-safe
- Unique enough to avoid thin/duplicate content
- Not exposing private seller/contact info

Noindex:

- Drafts
- Checkout
- Dashboards
- Disputes
- Account/admin pages
- Thin or expired unresolved pages
- Unverified finder profiles
- Prohibited goods or safety-risk requests

## Internal Linking Rules

Every open bounty links to:

- Category hub
- Image-search pages
- 4 similar active bounties
- 4 solved finds in same category
- Relevant public finder profiles

Every solved page links to:

- Category hub
- Similar solved pages
- Post a similar request CTA
- Finder profile if public
- Image-search page

Every category hub links to:

- All indexable active requests
- Top solved pages
- Top finders
- Adjacent categories

## Sitemaps

Use a sitemap index:

```txt
/sitemap.xml
/sitemaps/static.xml
/sitemaps/requests.xml
/sitemaps/solved.xml
/sitemaps/categories.xml
/sitemaps/finders.xml
/sitemaps/images.xml
```

Update daily for open/solved request changes.

## 30-Day Build Order

1. Fix DNS/live domain resolution.
2. Confirm canonical public app paths work without hash routing.
3. Add server/pre-rendered metadata for dynamic request pages.
4. Remove `noindex` only for funded, moderated, content-rich public bounty pages.
5. Add solved page state and URLs.
6. Add category hubs for sentimental items and cameras first.
7. Generate dynamic XML sitemaps.
8. Add JSON-LD for `WebPage`, `BreadcrumbList`, `Demand`, and `ImageObject`.
9. Add OG images for public bounty and solved pages.
10. Submit sitemap in Google Search Console after DNS is confirmed.
