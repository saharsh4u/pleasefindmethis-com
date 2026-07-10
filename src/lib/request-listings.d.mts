export function mergeRequestListings<T extends { id: string }>(primary: T[], fallback: T[]): T[];
