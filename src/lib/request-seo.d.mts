export interface DiscussionForumPostingInput {
  articleBody: string;
  canonicalUrl: string;
  category?: string;
  commentCount?: number;
  datePublished?: string;
  headline: string;
  imageUrl: string;
  websiteId: string;
}

export function createDiscussionForumPostingSchema(
  input: DiscussionForumPostingInput,
): Record<string, unknown>;
