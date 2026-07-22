import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const resetTrackProgress = vi.fn();
vi.mock("@/app/list/actions", () => ({ resetTrackProgress }));

const { TrackResetButton } = await import("./TrackResetButton");

describe("TrackResetButton", () => {
  it("confirms and resets progress for the track", async () => {
    resetTrackProgress.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <TrackResetButton spotifyAlbumId="album1" spotifyTrackId="track1" trackName="Airbag" />
    );

    await user.click(screen.getByRole("button", { name: "Reset progress for Airbag" }));
    expect(screen.getByText('Mark "Airbag" as unplayed?')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(resetTrackProgress).toHaveBeenCalledWith("album1", "track1");
  });
});
