import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const addAlbum = vi.fn();
vi.mock("./actions", () => ({ addAlbum }));

const { useAddAlbum } = await import("./useAddAlbum");

const album = {
  spotifyAlbumId: "album1",
  spotifyArtistId: "artist1",
  name: "OK Computer",
  artistName: "Radiohead",
  totalTracks: 12,
  albumType: "album" as const,
};

describe("useAddAlbum", () => {
  it("marks an album as added after a successful add", async () => {
    addAlbum.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAddAlbum());

    expect(result.current.addedIds.has("album1")).toBe(false);

    await act(async () => {
      result.current.add(album);
    });

    await waitFor(() => expect(result.current.addedIds.has("album1")).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it("sets an error message when the add fails, without marking it added", async () => {
    addAlbum.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAddAlbum());

    await act(async () => {
      result.current.add(album);
    });

    await waitFor(() => expect(result.current.error).toBe("Couldn't add that album. Try again."));
    expect(result.current.addedIds.has("album1")).toBe(false);
  });

  it("allows clearing the error", async () => {
    addAlbum.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAddAlbum());

    await act(async () => {
      result.current.add(album);
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });
});
