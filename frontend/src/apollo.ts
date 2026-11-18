import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

/**
 * The app's cache. A stage's list of cards always arrives whole (from the
 * Board query, or from moving a card in src/lib/boardCache.ts), so the new
 * list replaces the old one. Saying so explicitly also stops Apollo warning
 * that cards might be lost each time the list changes.
 */
export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Stage: { fields: { jobApplications: { merge: false } } },
    },
  });
}

export const client = new ApolloClient({
  // In development, Vite forwards /graphql to the Rails server (see vite.config.ts).
  link: new HttpLink({ uri: '/graphql', credentials: 'same-origin' }),
  cache: createCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
