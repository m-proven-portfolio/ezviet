'use client';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon' | 'monochrome';
  showText?: boolean;
}

/**
 * EZViet Logo Component
 *
 * Wordmark logo featuring:
 * - "EZViet" text in navy blue
 * - Arc that starts from the V and curves UP and AWAY to a star
 * - The arc does NOT go through the text
 * - 6-pointed star at the top right
 */
export function Logo({ size = 32, className = '', variant = 'full', showText = true }: LogoProps) {
  // Icon-only version for small sizes
  if (variant === 'icon' || !showText) {
    return (
      <div className={className}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <defs>
            <linearGradient id={`arcGrad-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={variant === 'monochrome' ? 'currentColor' : '#1e3a8a'} />
              <stop offset="100%" stopColor={variant === 'monochrome' ? 'currentColor' : '#38bdf8'} />
            </linearGradient>
          </defs>

          {/* Arc: curves UP and away to star - doesn't scratch through */}
          <path
            d="M16 54 C 20 40, 30 20, 52 6"
            stroke={variant === 'monochrome' ? 'currentColor' : `url(#arcGrad-${size})`}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* 6-pointed star */}
          <polygon
            points="52,2 53.5,5 57,5.5 54.5,8 55,12 52,10 49,12 49.5,8 47,5.5 50.5,5"
            fill={variant === 'monochrome' ? 'currentColor' : '#38bdf8'}
          />

          {/* EZ text */}
          <text
            x="4"
            y="54"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="24"
            fontWeight="800"
            fill={variant === 'monochrome' ? 'currentColor' : '#1e3a8a'}
          >
            EZ
          </text>
        </svg>
      </div>
    );
  }

  // Full wordmark logo - arc goes from V upward to star ABOVE the text
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={size * 5.5}
        height={size * 1.5}
        viewBox="0 0 220 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={`arcGradFull-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Arc: starts from V area, curves UP and to the right, ABOVE the text */}
        <path
          d="M75 52 C 85 30, 120 10, 175 4"
          stroke={`url(#arcGradFull-${size})`}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* 6-pointed star at end of arc */}
        <polygon
          points="178,2 180,6 184,6.5 181,10 182,14 178,11.5 174,14 175,10 172,6.5 176,6"
          fill="#38bdf8"
        />

        {/* EZViet text */}
        <text
          x="8"
          y="50"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="42"
          fontWeight="700"
          fill="#1e3a8a"
        >
          EZViet
        </text>

        {/* The dot on the i is a circle (matching the logo) */}
        <circle cx="148" cy="28" r="3" fill="#1e3a8a" />
      </svg>
    </div>
  );
}

/**
 * Favicon-optimized version
 */
export function FaviconSVG() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="favArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Arc curving up and away */}
      <path
        d="M16 54 C 20 40, 30 20, 52 6"
        stroke="url(#favArcGrad)"
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
  );
}
