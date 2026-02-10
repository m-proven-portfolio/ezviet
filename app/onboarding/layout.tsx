import Link from 'next/link';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <header className="px-4 py-4 flex justify-center">
        <Link href="/" className="text-2xl font-bold text-emerald-600">
          EZViet
        </Link>
      </header>
      {children}
    </div>
  );
}
