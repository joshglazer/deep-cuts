import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141414",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <svg width="160" height="160" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#1c1c1c" stroke="#3f3f46" />
            <circle cx="16" cy="16" r="11" stroke="#ffffff" strokeOpacity="0.14" />
            <circle cx="16" cy="16" r="8.5" stroke="#ffffff" strokeOpacity="0.14" />
            <circle cx="16" cy="16" r="5.5" fill="#1DB954" />
            <path
              d="M13 16.2L15.2 18.5L19.5 13.5"
              stroke="#000000"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 92,
                fontWeight: 700,
                color: "#fafafa",
                letterSpacing: -2,
              }}
            >
              Deep Cuts
            </div>
            <div style={{ fontSize: 32, color: "#a1a1aa" }}>
              Add albums to your list, see when you actually listened
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
