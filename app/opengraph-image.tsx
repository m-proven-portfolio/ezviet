import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EZViet - Learn Vietnamese the Fun Way";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Arc that goes ABOVE the text, from V area up to star */}
        <svg
          width="600"
          height="200"
          viewBox="0 0 600 200"
          fill="none"
          style={{
            position: "absolute",
            top: 120,
            left: 300,
          }}
        >
          <defs>
            <linearGradient id="bgArc" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          {/* Arc curves up and away */}
          <path
            d="M50 180 C 80 100, 200 30, 400 10"
            stroke="url(#bgArc)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          {/* 6-pointed star */}
          <polygon
            points="410,5 414,15 425,17 417,25 420,36 410,29 400,36 403,25 395,17 406,15"
            fill="#38bdf8"
          />
        </svg>

        {/* EZViet wordmark */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: "#1e3a8a",
            marginBottom: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          EZViet
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "#64748b",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Learn Vietnamese the Fun Way
        </div>

        {/* Features pills */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 40,
          }}
        >
          {["🎴 Flashcards", "🎵 Music", "🎤 Pronunciation"].map((item) => (
            <div
              key={item}
              style={{
                background: "#f1f5f9",
                padding: "12px 24px",
                borderRadius: 50,
                fontSize: 22,
                color: "#1e3a8a",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
