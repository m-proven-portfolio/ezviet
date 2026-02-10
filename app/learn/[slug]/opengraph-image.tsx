import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";
import { getStorageUrl } from "@/lib/utils";

export const runtime = "edge";
export const alt = "EZViet Vietnamese Flashcard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  // Fetch card data
  const supabase = createAdminClient();
  const { data: card } = await supabase
    .from("cards")
    .select(
      `
      *,
      terms:card_terms(*)
    `
    )
    .eq("slug", slug)
    .single();

  const viTerm = card?.terms?.find(
    (t: { lang: string; region: string }) =>
      t.lang === "vi" && t.region === "south"
  );
  const enTerm = card?.terms?.find(
    (t: { lang: string }) => t.lang === "en"
  );
  const imageUrl = card?.image_path
    ? getStorageUrl("cards-images", card.image_path)
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
          position: "relative",
        }}
      >
        {/* Decorative arc in corner - curves UP and away */}
        <svg
          width="300"
          height="150"
          viewBox="0 0 300 150"
          fill="none"
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            opacity: 0.25,
          }}
        >
          <defs>
            <linearGradient id="cardArc" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path
            d="M20 140 C 40 80, 120 30, 250 10"
            stroke="url(#cardArc)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <polygon
            points="260,5 263,12 272,14 266,20 268,28 260,23 252,28 254,20 248,14 257,12"
            fill="#38bdf8"
          />
        </svg>

        {/* Left side - Card info */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 40,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Vietnamese word */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#1e3a8a",
              marginBottom: 16,
            }}
          >
            {viTerm?.text || "Vietnamese"}
          </div>

          {/* Romanization */}
          {viTerm?.romanization && (
            <div
              style={{
                fontSize: 36,
                color: "#64748b",
                marginBottom: 24,
              }}
            >
              /{viTerm.romanization}/
            </div>
          )}

          {/* English translation */}
          <div
            style={{
              fontSize: 40,
              color: "#475569",
              marginBottom: 40,
            }}
          >
            {enTerm?.text || "Word"}
          </div>

          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="brandArc" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <path
                d="M16 54 C 20 40, 30 20, 52 6"
                stroke="url(#brandArc)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <polygon
                points="52,2 53.5,5 57,5.5 54.5,8 55,12 52,10 49,12 49.5,8 47,5.5 50.5,5"
                fill="#38bdf8"
              />
              <text
                x="4"
                y="54"
                fontFamily="system-ui"
                fontSize="24"
                fontWeight="800"
                fill="#1e3a8a"
              >
                EZ
              </text>
            </svg>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#1e3a8a",
              }}
            >
              EZViet
            </span>
          </div>
        </div>

        {/* Right side - Card image */}
        <div
          style={{
            width: 400,
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            borderRadius: 32,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={380}
              height={380}
              style={{
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 120,
                color: "#1e3a8a",
              }}
            >
              🇻🇳
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
