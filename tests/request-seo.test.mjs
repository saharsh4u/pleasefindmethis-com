import assert from "node:assert/strict";
import { test } from "node:test";

import { createDiscussionForumPostingSchema } from "../src/lib/request-seo.mjs";

test("public request pages expose discussion posting structured data", () => {
  const schema = createDiscussionForumPostingSchema({
    articleBody: "Looking for the exact rose-print blanket from an older collection.",
    canonicalUrl: "https://pleasefindmethis.com/requests/request-id/rose-blanket",
    category: "Sentimental items",
    commentCount: 2,
    datePublished: "2026-07-14T12:00:00.000Z",
    headline: "Vintage rose blanket",
    imageUrl: "https://pleasefindmethis.com/rose-blanket.jpg",
    websiteId: "https://pleasefindmethis.com/#website",
  });

  assert.deepEqual(schema, {
    "@type": "DiscussionForumPosting",
    "@id": "https://pleasefindmethis.com/requests/request-id/rose-blanket#request",
    headline: "Vintage rose blanket",
    articleBody: "Looking for the exact rose-print blanket from an older collection.",
    datePublished: "2026-07-14T12:00:00.000Z",
    image: "https://pleasefindmethis.com/rose-blanket.jpg",
    about: {
      "@type": "Thing",
      name: "Vintage rose blanket",
      category: "Sentimental items",
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: 2,
    },
    isPartOf: { "@id": "https://pleasefindmethis.com/#website" },
  });
});
