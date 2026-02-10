import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Karaoke Hero - Vietnamese Songs with Synced Lyrics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #581c87 0%, #4c1d95 30%, #1e1b4b 70%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated music notes decoration */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 60,
            fontSize: 60,
            opacity: 0.3,
          }}
        >
          🎵
        </div>
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 100,
            fontSize: 50,
            opacity: 0.25,
          }}
        >
          🎶
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 120,
            fontSize: 45,
            opacity: 0.2,
          }}
        >
          🎵
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            right: 80,
            fontSize: 55,
            opacity: 0.3,
          }}
        >
          🎶
        </div>

        {/* Glowing orbs for atmosphere */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -100,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Main microphone icon */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            boxShadow: "0 0 60px rgba(236,72,153,0.5)",
          }}
        >
          <span style={{ fontSize: 60 }}>🎤</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            marginBottom: 8,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          KARAOKE HERO
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          Vietnamese Songs with Synced Lyrics 🇻🇳
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            { icon: "🎵", text: "Curated Vietnamese Songs" },
            { icon: "⚡", text: "Real-time Synced Lyrics" },
            { icon: "🎧", text: "Learn Through Music" },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                padding: "12px 24px",
                borderRadius: 50,
                fontSize: 20,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            padding: "16px 40px",
            borderRadius: 50,
            fontSize: 24,
            fontWeight: 700,
            color: "white",
            boxShadow: "0 8px 30px rgba(236,72,153,0.4)",
          }}
        >
          Sing Along Now →
        </div>

        {/* EZViet branding */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            EZViet
          </span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 40,
            fontSize: 18,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          ezviet.org/karaoke
        </div>
      </div>
    ),
    { ...size }
  );
}
