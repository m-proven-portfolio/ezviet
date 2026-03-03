import Link from 'next/link';

/**
 * Custom 404 page. Kept minimal so it does not pull in Supabase or other
 * server deps during static generation (fixes Vercel build when env is missing).
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-(--text-secondary) mb-6">This page could not be found.</p>
      <Link
        href="/"
        className="text-emerald-600 hover:text-emerald-700 font-medium"
      >
        Back to home
      </Link>
    </div>
  );
}
