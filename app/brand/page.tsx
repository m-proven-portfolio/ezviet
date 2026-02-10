import { Logo, FaviconSVG } from '@/components/Logo';
import { SponsorCard, LogoExportSVG } from '@/components/SponsorCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EZViet Brand Assets',
  robots: 'noindex',
};

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EZViet Brand Assets</h1>
          <p className="text-gray-600">Logo, icons, and sponsor card designs</p>
        </div>

        {/* Logo Showcase */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Logo Variants</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Full Logo */}
            <div className="bg-white rounded-xl p-8 shadow-sm col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Full Wordmark Logo</h3>
              <div className="flex items-center justify-center h-24">
                <Logo size={48} />
              </div>
            </div>

            {/* Icon Only */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Icon Only</h3>
              <div className="flex items-center justify-center gap-4 h-24">
                <Logo size={64} variant="icon" />
                <Logo size={48} variant="icon" />
                <Logo size={32} variant="icon" />
              </div>
            </div>

            {/* On Dark Background */}
            <div className="bg-slate-900 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-medium text-slate-400 mb-4">On Dark</h3>
              <div className="flex items-center justify-center h-24">
                <Logo size={48} variant="icon" />
              </div>
            </div>

            {/* On Brand Color */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-medium text-blue-100 mb-4">On Brand Gradient</h3>
              <div className="flex items-center justify-center h-24">
                <Logo size={48} variant="icon" />
              </div>
            </div>

            {/* Favicon Preview */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Favicon (browser tab)</h3>
              <div className="flex items-center justify-center gap-8 h-24">
                <div className="space-y-1 text-center">
                  <div className="w-8 h-8 mx-auto rounded overflow-hidden shadow-md border">
                    <Logo size={32} variant="icon" />
                  </div>
                  <span className="text-xs text-gray-400">32px</span>
                </div>
                <div className="space-y-1 text-center">
                  <div className="w-4 h-4 mx-auto rounded overflow-hidden shadow border">
                    <Logo size={16} variant="icon" />
                  </div>
                  <span className="text-xs text-gray-400">16px</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsor Cards */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Sponsor Cards</h2>
          <p className="text-gray-600">For hackathon sponsorships, business cards, and marketing materials</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Light variant */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Light (Default)</h3>
              <SponsorCard variant="default" />
            </div>

            {/* Gradient variant */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Gradient (Recommended)</h3>
              <SponsorCard variant="gradient" />
            </div>

            {/* Dark variant */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Dark</h3>
              <SponsorCard variant="dark" />
            </div>

            {/* Minimal */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Minimal</h3>
              <SponsorCard variant="gradient" showTagline={false} />
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Color Palette</h2>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600">Primary (Navy Blue)</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { name: 'Navy Primary', color: '#183f8c', text: 'text-white' },
                { name: 'Navy 900', color: '#1e3a8a', text: 'text-white' },
                { name: 'Navy 800', color: '#1e40af', text: 'text-white' },
              ].map(({ name, color, text }) => (
                <div
                  key={name}
                  className={`w-32 h-24 rounded-lg flex flex-col items-center justify-center ${text}`}
                  style={{ backgroundColor: color }}
                >
                  <span className="font-medium text-sm">{name.split(' ')[1]}</span>
                  <span className="text-xs opacity-80">{color}</span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-medium text-gray-600 mt-6">Accent (Cyan)</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { name: 'Cyan Primary', color: '#26c6ed', text: 'text-slate-900' },
                { name: 'Light Cyan', color: '#94e1f3', text: 'text-slate-900' },
                { name: 'Pale Cyan', color: '#c8ecf5', text: 'text-slate-900' },
              ].map(({ name, color, text }) => (
                <div
                  key={name}
                  className={`w-32 h-24 rounded-lg flex flex-col items-center justify-center ${text}`}
                  style={{ backgroundColor: color }}
                >
                  <span className="font-medium text-sm">{name.split(' ')[1]}</span>
                  <span className="text-xs opacity-80">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Typography</h2>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Brand Name</span>
                <p className="text-4xl font-bold text-blue-900">EZViet</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tagline</span>
                <p className="text-xl text-gray-700">Learn Vietnamese the Easy Way</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">URL</span>
                <p className="text-lg font-semibold text-blue-600">ezviet.org</p>
              </div>
            </div>
          </div>
        </section>

        {/* Design Philosophy */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Design Philosophy</h2>

          <div className="bg-white rounded-xl p-8 shadow-sm prose max-w-none">
            <h3>The Logo Mark</h3>
            <p>
              The EZViet logo is a wordmark featuring:
            </p>
            <ul>
              <li><strong>The sweeping arc</strong> - Represents the journey of learning, rising from beginner to fluent speaker</li>
              <li><strong>The star</strong> - Symbolizes achievement and the goal of mastery</li>
              <li><strong>Navy blue to cyan gradient</strong> - Professional yet approachable, conveying trust and clarity</li>
              <li><strong>&ldquo;EZViet&rdquo; wordmark</strong> - Clean, bold typography in navy blue</li>
            </ul>

            <h3>Icon Version</h3>
            <p>
              For small sizes (favicons, app icons), the logo condenses to &ldquo;EZ&rdquo; with the arc and star, maintaining brand recognition at any scale.
            </p>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Quick Reference</h2>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Files</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">/public/favicon.svg</code> - Browser favicon</li>
                  <li><code className="bg-gray-100 px-1 rounded">/app/icon.svg</code> - App icon (Next.js)</li>
                  <li><code className="bg-gray-100 px-1 rounded">/app/apple-icon.tsx</code> - Apple Touch Icon</li>
                  <li><code className="bg-gray-100 px-1 rounded">/components/Logo.tsx</code> - React component</li>
                  <li><code className="bg-gray-100 px-1 rounded">/components/SponsorCard.tsx</code> - Sponsor card</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Usage</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { Logo } from '@/components/Logo';

// Full wordmark
<Logo size={48} />

// Icon only (EZ + arc + star)
<Logo size={32} variant="icon" />`}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
