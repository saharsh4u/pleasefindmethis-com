export type AuthenticatedRequestPage = "landing" | "browse" | "browse-all" | "request-detail";

export const authenticatedRequestPages: readonly AuthenticatedRequestPage[];

export function requiresRequestAuthentication(page: string): page is AuthenticatedRequestPage;

export function canLoadRequestData(
  page: string,
  auth: { authResolved: boolean; signedIn: boolean },
): boolean;
