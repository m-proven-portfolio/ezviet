import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: 40,
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 64 64"
          fill="none"
        >
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Arc: curves UP and away - not through text */}
          <path
            d="M16 54 C 20 40, 30 20, 52 6"
            stroke="url(#arcGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* 6-pointed star */}
          <polygon
            points="52,2 53.5,5 57,5.5 54.5,8 55,12 52,10 49,12 49.5,8 47,5.5 50.5,5"
            fill="#38bdf8"
          />

          {/* EZ text */}
          <text
            x="4"
            y="54"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="24"
            fontWeight="800"
            fill="#1e3a8a"
          >
            EZ
          </text>
        </svg>
      </div>
    ),
    { ...size }
  );
}
