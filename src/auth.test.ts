import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts. Its identity
// survives vi.resetModules() below (vitest memoizes vi.mock factory results
// independently of the module registry reset), so auth.ts re-imported fresh
// each test still resolves to this same mock instance.
const mockDataClient = dataClient as unknown as MockDataClient;

const refreshAccessToken = vi.fn();
vi.mock("@/lib/spotify", () => ({ refreshAccessToken }));

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect }));

const nextAuthDefault = vi.fn();
vi.mock("next-auth", () => ({ default: nextAuthDefault }));
vi.mock("next-auth/providers/spotify", () => ({ default: vi.fn((config) => ({ id: "spotify", ...config })) }));
vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config) => ({ id: "credentials", ...config })),
}));

let mockAuth: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
  mockAuth = vi.fn();
  nextAuthDefault.mockReturnValue({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  });
});

describe("previewLoginEnabled", () => {
  it("is false by default", async () => {
    vi.stubEnv("ENABLE_PREVIEW_LOGIN", undefined as unknown as string);
    const { previewLoginEnabled } = await import("./auth");
    expect(previewLoginEnabled).toBe(false);
  });

  it("is true when ENABLE_PREVIEW_LOGIN=true", async () => {
    vi.stubEnv("ENABLE_PREVIEW_LOGIN", "true");
    const { previewLoginEnabled } = await import("./auth");
    expect(previewLoginEnabled).toBe(true);
  });

  it("adds a second preview credentials provider only when enabled", async () => {
    vi.stubEnv("ENABLE_PREVIEW_LOGIN", "true");
    const { authConfig } = await import("./auth");
    expect(authConfig.providers).toHaveLength(2);
  });

  it("registers only the Spotify provider when disabled", async () => {
    vi.stubEnv("ENABLE_PREVIEW_LOGIN", "false");
    const { authConfig } = await import("./auth");
    expect(authConfig.providers).toHaveLength(1);
  });
});

describe("authConfig.callbacks.jwt", () => {
  it("copies account tokens and user profile fields onto the token on initial sign-in", async () => {
    const { authConfig } = await import("./auth");
    const token = (await authConfig.callbacks!.jwt!({
      token: {},
      account: {
        access_token: "access1",
        refresh_token: "refresh1",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        providerAccountId: "spotify-user-1",
      },
      user: { name: "Josh", email: "josh@example.com", image: "pic.jpg" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))!;

    expect(token.accessToken).toBe("access1");
    expect(token.spotifyUserId).toBe("spotify-user-1");
    expect(token.name).toBe("Josh");
    // A fresh non-expired token shouldn't trigger a refresh call.
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("returns the token unchanged when there's no refresh token or spotifyUserId yet", async () => {
    const { authConfig } = await import("./auth");
    const token = (await authConfig.callbacks!.jwt!({
      token: { name: "Preview User" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))!;

    expect(token).toEqual({ name: "Preview User" });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("refreshes an expired access token and persists the new refresh token", async () => {
    refreshAccessToken.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    mockDataClient.models.SpotifyAuth.get.mockResolvedValue({ data: null });
    mockDataClient.models.SpotifyAuth.create.mockResolvedValue({ data: {} });

    const { authConfig } = await import("./auth");
    const token = (await authConfig.callbacks!.jwt!({
      token: {
        refreshToken: "old-refresh",
        spotifyUserId: "user1",
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))!;

    expect(refreshAccessToken).toHaveBeenCalledWith("old-refresh");
    expect(token.accessToken).toBe("new-access");
    expect(mockDataClient.models.SpotifyAuth.create).toHaveBeenCalledWith(
      expect.objectContaining({ spotifyUserId: "user1", refreshToken: "new-refresh" })
    );
  });

  it("updates an existing SpotifyAuth row instead of creating a new one", async () => {
    refreshAccessToken.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    mockDataClient.models.SpotifyAuth.get.mockResolvedValue({
      data: { spotifyUserId: "user1" },
    });

    const { authConfig } = await import("./auth");
    await authConfig.callbacks!.jwt!({
      token: {
        refreshToken: "old-refresh",
        spotifyUserId: "user1",
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(mockDataClient.models.SpotifyAuth.update).toHaveBeenCalled();
    expect(mockDataClient.models.SpotifyAuth.create).not.toHaveBeenCalled();
  });

  it("keeps the old token and doesn't persist when the refresh call fails", async () => {
    refreshAccessToken.mockRejectedValue(new Error("refresh failed"));

    const { authConfig } = await import("./auth");
    const token = (await authConfig.callbacks!.jwt!({
      token: {
        refreshToken: "old-refresh",
        accessToken: "old-access",
        spotifyUserId: "user1",
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))!;

    expect(token.accessToken).toBe("old-access");
    expect(mockDataClient.models.SpotifyAuth.create).not.toHaveBeenCalled();
    expect(mockDataClient.models.SpotifyAuth.update).not.toHaveBeenCalled();
  });

  it("does not persist a non-expired token on a non-initial-sign-in call", async () => {
    const { authConfig } = await import("./auth");
    await authConfig.callbacks!.jwt!({
      token: {
        refreshToken: "existing-refresh",
        accessToken: "existing-access",
        spotifyUserId: "user1",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(mockDataClient.models.SpotifyAuth.create).not.toHaveBeenCalled();
  });
});

describe("authConfig.callbacks.session", () => {
  it("copies accessToken, spotifyUserId, and user profile fields onto the session", async () => {
    const { authConfig } = await import("./auth");
    const session = (await authConfig.callbacks!.session!({
      session: { user: {} },
      token: {
        accessToken: "access1",
        spotifyUserId: "user1",
        name: "Josh",
        email: "josh@example.com",
        picture: "pic.jpg",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as { accessToken?: string; spotifyUserId?: string; user?: { name?: string; email?: string; image?: string } };

    expect(session.accessToken).toBe("access1");
    expect(session.spotifyUserId).toBe("user1");
    expect(session.user?.name).toBe("Josh");
    expect(session.user?.email).toBe("josh@example.com");
    expect(session.user?.image).toBe("pic.jpg");
  });
});

describe("requireSpotifyUserIdOrRedirect", () => {
  it("returns the spotifyUserId when signed in", async () => {
    mockAuth.mockResolvedValue({ spotifyUserId: "user1" });
    const { requireSpotifyUserIdOrRedirect } = await import("./auth");

    await expect(requireSpotifyUserIdOrRedirect()).resolves.toBe("user1");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to / when there's no session", async () => {
    mockAuth.mockResolvedValue(null);
    const { requireSpotifyUserIdOrRedirect } = await import("./auth");

    await expect(requireSpotifyUserIdOrRedirect()).rejects.toThrow("REDIRECT:/");
  });
});

describe("requireSpotifyUserIdOrThrow", () => {
  it("returns the spotifyUserId when signed in", async () => {
    mockAuth.mockResolvedValue({ spotifyUserId: "user1" });
    const { requireSpotifyUserIdOrThrow } = await import("./auth");

    await expect(requireSpotifyUserIdOrThrow()).resolves.toBe("user1");
  });

  it("throws when there's no session", async () => {
    mockAuth.mockResolvedValue(null);
    const { requireSpotifyUserIdOrThrow } = await import("./auth");

    await expect(requireSpotifyUserIdOrThrow()).rejects.toThrow("Not signed in");
  });
});

describe("requireSignedIn", () => {
  it("resolves when there's a user session, even without a spotifyUserId", async () => {
    mockAuth.mockResolvedValue({ user: { name: "Preview User" } });
    const { requireSignedIn } = await import("./auth");

    await expect(requireSignedIn()).resolves.toBeUndefined();
  });

  it("throws when there's no user session", async () => {
    mockAuth.mockResolvedValue(null);
    const { requireSignedIn } = await import("./auth");

    await expect(requireSignedIn()).rejects.toThrow("Not signed in");
  });
});
