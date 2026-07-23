import { vi } from "vitest";

/**
 * Minimal stand-in for the generated Amplify Data client's `models` surface.
 * Only the operations actually called anywhere in this app are stubbed —
 * add more as new dataClient.models.* calls are introduced.
 */
export function createMockDataClient() {
  return {
    models: {
      Album: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Artist: {
        list: vi.fn(),
        delete: vi.fn(),
      },
      ListenEvent: {
        listListenEventBySpotifyUserIdAndSpotifyAlbumId: vi.fn(),
        delete: vi.fn(),
      },
      SpotifyAuth: {
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
}

export type MockDataClient = ReturnType<typeof createMockDataClient>;
