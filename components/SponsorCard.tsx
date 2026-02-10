'use client';

interface SponsorCardProps {
  variant?: 'default' | 'dark' | 'gradient';
  showTagline?: boolean;
  showUrl?: boolean;
}

/**
 * Sponsor Card Component
 *
 * A beautiful, print-ready card design for hackathon sponsorships,
 * business cards, or marketing materials.
 */
export function SponsorCard({ variant = 'default', showTagline = true, showUrl = true }: SponsorCardProps) {
  const baseClasses = "relative overflow-hidden rounded-2xl p-8 transition-all duration-300";

  const variants = {
    default: "bg-white border border-gray-100 shadow-xl",
    dark: "bg-slate-900 text-white",
    gradient: "bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 text-white",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]}`} style={{ width: 400, height: 240 }}>
      {/* Decorative arc - curves UP and away, not through */}
      <svg
        className="absolute"
        style={{ top: 10, left: 10, opacity: variant === 'default' ? 0.15 : 0.2 }}
        width="200"
        height="100"
        viewBox="0 0 200 100"
        fill="none"
      >
        <defs>
          <linearGradient id="cardArcDeco" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={variant === 'default' ? '#1e3a8a' : '#ffffff'} />
            <stop offset="100%" stopColor={variant === 'default' ? '#38bdf8' : '#ffffff'} />
          </linearGradient>
        </defs>
        <path
          d="M10 90 C 30 50, 80 20, 170 5"
          stroke="url(#cardArcDeco)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <polygon
          points="175,2 177,7 183,8 179,12 180,18 175,14 170,18 171,12 167,8 173,7"
          fill={variant === 'default' ? '#38bdf8' : '#ffffff'}
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Top: Logo */}
        <div className="flex items-center gap-3">
          <div className={variant === 'default' ? '' : 'drop-shadow-lg'}>
            <LogoIcon size={56} white={variant !== 'default'} />
          </div>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${
              variant === 'default' ? 'text-blue-900' : 'text-white'
            }`}>
              EZViet
            </h1>
            {showTagline && (
              <p className={`text-sm ${
                variant === 'default' ? 'text-slate-500' : 'text-white/80'
              }`}>
                Learn Vietnamese the Easy Way
              </p>
            )}
          </div>
        </div>

        {/* Bottom: Features & URL */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {['Flashcards', 'Audio', 'Free'].map((feature) => (
              <span
                key={feature}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  variant === 'default'
                    ? 'bg-blue-50 text-blue-700'
                    : variant === 'dark'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-white/20 text-white'
                }`}
              >
                {feature}
              </span>
            ))}
          </div>

          {showUrl && (
            <p className={`text-lg font-semibold ${
              variant === 'default' ? 'text-blue-600' : 'text-white'
            }`}>
              ezviet.org
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Logo icon - arc curves UP and away, doesn't scratch through
 */
function LogoIcon({ size = 48, white = false }: { size?: number; white?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={white ? '#ffffff' : '#1e3a8a'} />
          <stop offset="100%" stopColor={white ? '#ffffff' : '#38bdf8'} />
        </linearGradient>
      </defs>

      {/* Arc curves up and away */}
      <path
        d="M16 54 C 20 40, 30 20, 52 6"
        stroke="url(#logoArcGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* 6-pointed star */}
      <polygon
        points="52,2 53.5,5 57,5.5 54.5,8 55,12 52,10 49,12 49.5,8 47,5.5 50.5,5"
        fill={white ? '#ffffff' : '#38bdf8'}
      />

      {/* EZ text */}
      <text
        x="4"
        y="54"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill={white ? '#ffffff' : '#1e3a8a'}
      >
        EZ
      </text>
    </svg>
  );
}

/**
 * Print-ready SVG export of the full logo
 */
export function LogoExportSVG() {
  return (
    <svg
      width="400"
      height="120"
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="exportArc" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Arc curves from V area UP and to the right */}
      <path
        d="M130 95 C 150 60, 220 25, 350 8"
        stroke="url(#exportArc)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* 6-pointed star */}
      <polygon
        points="360,4 363,12 373,14 366,21 368,30 360,24 352,30 354,21 347,14 357,12"
        fill="#38bdf8"
      />

      {/* Text */}
      <text
        x="20"
        y="95"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="72"
        fontWeight="700"
        fill="#1e3a8a"
      >
        EZViet
      </text>
    </svg>
  );
}
