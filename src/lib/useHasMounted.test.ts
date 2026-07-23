import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { useHasMounted } from "./useHasMounted";

function Probe() {
  return createElement("span", null, String(useHasMounted()));
}

describe("useHasMounted", () => {
  it("reports mounted once rendered in the browser", () => {
    const { result } = renderHook(() => useHasMounted());

    expect(result.current).toBe(true);
  });

  it("reports not mounted when rendered on the server", () => {
    expect(renderToStaticMarkup(createElement(Probe))).toBe("<span>false</span>");
  });
});
