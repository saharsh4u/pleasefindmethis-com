export function mergeRequestListings(primary, fallback) {
  const seenIds = new Set();

  return [...primary, ...fallback].filter((request) => {
    if (seenIds.has(request.id)) {
      return false;
    }

    seenIds.add(request.id);
    return true;
  });
}
