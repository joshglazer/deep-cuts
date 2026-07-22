import { describe, expect, it, vi } from "vitest";

const Auth = vi.fn();
vi.mock("@auth/core", () => ({ Auth }));

const authConfig = { providers: [] };
vi.mock("@/auth", () => ({ authConfig }));

const { GET, POST } = await import("./route");

describe("GET /api/auth/[...nextauth]", () => {
  it("rebuilds the request with the real Host header hostname before calling Auth()", async () => {
    Auth.mockResolvedValue(new Response("ok"));
    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: { host: "127.0.0.1:3000" },
    });

    await GET(request);

    const [forwarded, config] = Auth.mock.lastCall as [Request, unknown];
    expect(new URL(forwarded.url).hostname).toBe("127.0.0.1");
    expect(new URL(forwarded.url).port).toBe("3000");
    expect(config).toBe(authConfig);
  });

  it("clears a stale port when the Host header has none", async () => {
    Auth.mockResolvedValue(new Response("ok"));
    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: { host: "example.com" },
    });

    await GET(request);

    const [forwarded] = Auth.mock.lastCall as [Request];
    expect(new URL(forwarded.url).hostname).toBe("example.com");
    expect(new URL(forwarded.url).port).toBe("");
  });

  it("passes the request through unchanged when there's no Host header", async () => {
    Auth.mockResolvedValue(new Response("ok"));
    const request = new Request("http://localhost:3000/api/auth/session");
    request.headers.delete("host");

    await GET(request);

    expect(Auth).toHaveBeenLastCalledWith(request, authConfig);
  });
});

describe("POST /api/auth/[...nextauth]", () => {
  it("rebuilds the request with the real Host header hostname before calling Auth()", async () => {
    Auth.mockResolvedValue(new Response("ok"));
    const request = new Request("http://localhost:3000/api/auth/callback/spotify", {
      method: "POST",
      headers: { host: "127.0.0.1:3000", "content-type": "application/x-www-form-urlencoded" },
    });

    await POST(request);

    const [forwarded] = Auth.mock.lastCall as [Request];
    expect(forwarded.method).toBe("POST");
    expect(new URL(forwarded.url).hostname).toBe("127.0.0.1");
  });
});
