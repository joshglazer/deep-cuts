import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const push = vi.fn();
const usePathname = vi.fn(() => "/list");
const useSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

const { useSearchParamUpdater } = await import("./useSearchParamUpdater");

describe("useSearchParamUpdater", () => {
  it("navigates to the bare pathname when the resulting query string is empty", () => {
    usePathname.mockReturnValue("/list");
    useSearchParams.mockReturnValue(new URLSearchParams());
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current("sort", null);

    expect(push).toHaveBeenCalledWith("/list");
  });

  it("adds a query param", () => {
    usePathname.mockReturnValue("/list");
    useSearchParams.mockReturnValue(new URLSearchParams());
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current("sort", "artist");

    expect(push).toHaveBeenCalledWith("/list?sort=artist");
  });

  it("replaces an existing query param", () => {
    usePathname.mockReturnValue("/list");
    useSearchParams.mockReturnValue(new URLSearchParams("sort=artist"));
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current("sort", "album");

    expect(push).toHaveBeenCalledWith("/list?sort=album");
  });

  it("removes a param while preserving others", () => {
    usePathname.mockReturnValue("/list");
    useSearchParams.mockReturnValue(new URLSearchParams("sort=artist&completed=show"));
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current("sort", null);

    expect(push).toHaveBeenCalledWith("/list?completed=show");
  });
});
