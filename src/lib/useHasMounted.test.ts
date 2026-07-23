import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHasMounted } from "./useHasMounted";

describe("useHasMounted", () => {
  it("reports mounted once rendered in the browser", () => {
    const { result } = renderHook(() => useHasMounted());

    expect(result.current).toBe(true);
  });
});
