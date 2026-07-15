export function createDiscussionForumPostingSchema({
  articleBody,
  canonicalUrl,
  category = "",
  commentCount = 0,
  datePublished = "",
  headline,
  imageUrl,
  websiteId,
}) {
  return {
    "@type": "DiscussionForumPosting",
    "@id": `${canonicalUrl}#request`,
    headline,
    articleBody,
    ...(datePublished ? { datePublished } : {}),
    image: imageUrl,
    about: {
      "@type": "Thing",
      name: headline,
      ...(category ? { category } : {}),
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: Math.max(0, Number(commentCount) || 0),
    },
    isPartOf: { "@id": websiteId },
  };
}
