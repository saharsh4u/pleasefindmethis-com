export const authenticatedRequestPages = Object.freeze([]);

const authenticatedRequestPageSet = new Set(authenticatedRequestPages);

export function requiresRequestAuthentication(page) {
  return authenticatedRequestPageSet.has(page);
}

export function canLoadRequestData(page, { authResolved, signedIn }) {
  return !requiresRequestAuthentication(page) || (authResolved && signedIn);
}
