/**
 * Label Set Preview Page
 *
 * This page allows admins to preview Picture Quiz (label sets) before they're published.
 * It solves the problem where clicking "View" on a draft quiz in the admin panel
 * would result in a 404, since the public /label/[slug] route only shows published quizzes.
 *
 * Key differences from the public /label/[slug] page:
 * - No `is_published` filter - shows both drafts and published quizzes
 * - Admin-only access - redirects to login if not authenticated as admin
 * - Shows a preview banner with "Draft" indicator for unpublished quizzes
 * - Includes quick navigation back to admin edit page
 * - Uses force-dynamic to ensure fresh content (no caching)
 */

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { LabelPageClient } from '../LabelPageClient';
import type { LabelSetWithLabels } from '@/lib/labels/types';
import { Eye, ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Disable caching for preview pages.
 * Admins need to see the latest changes immediately after editing,
 * so we force dynamic rendering on every request.
 */
export const dynamic = 'force-dynamic';

/**
 * Check if the current user has admin privileges.
 *
 * Authentication flow:
 * 1. Get the current user's session using the browser client (respects RLS)
 * 2. If no user is logged in, return false immediately
 * 3. Query the profiles table using the admin client (bypasses RLS) to check is_admin flag
 *
 * We use the admin client for the profile lookup to ensure we can always
 * read the is_admin field regardless of RLS policies.
 *
 * @returns Promise<boolean> - true if user is authenticated and is an admin
 */
async function isAdmin(): Promise<boolean> {
  // Get the current user's session from cookies
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No user logged in - not an admin
  if (!user) return false;

  // Check the is_admin flag in their profile
  // Using admin client to bypass RLS and ensure we can read the flag
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return profile?.is_admin === true;
}

/**
 * Fetch a label set by slug without the is_published filter.
 *
 * Unlike the public getLabelSet() in /label/[slug]/page.tsx, this function:
 * - Does NOT filter by is_published, allowing preview of drafts
 * - Uses the admin client to bypass any RLS restrictions
 *
 * The query joins:
 * - categories: to get the quiz's category info (name, icon)
 * - labels: all vocabulary labels with their positions, translations, and audio
 *
 * @param slug - The URL slug of the label set
 * @returns The label set with all labels, or null if not found
 */
async function getLabelSetForPreview(slug: string): Promise<LabelSetWithLabels | null> {
  const supabase = createAdminClient();

  const { data: labelSet, error } = await supabase
    .from('label_sets')
    .select(
      `
      *,
      category:categories(id, name, slug, icon),
      labels:labels(
        id, label_set_id, x, y, vietnamese, english,
        pronunciation, audio_url, hints, card_id, sort_order, created_at
      )
    `
    )
    .eq('slug', slug)
    // Note: No .eq('is_published', true) filter here - that's the key difference!
    .single();

  if (error || !labelSet) return null;

  // Sort labels by their defined sort_order for consistent display
  if (labelSet.labels) {
    labelSet.labels.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  return labelSet as LabelSetWithLabels;
}

/**
 * Preview page component for Picture Quiz (label sets).
 *
 * This server component:
 * 1. Validates admin access (redirects to /login if not admin)
 * 2. Fetches the label set by slug (including unpublished drafts)
 * 3. Renders a preview banner indicating the preview/draft status
 * 4. Reuses LabelPageClient for the actual quiz UI
 */
export default async function LabelPreviewPage({ params }: PageProps) {
  const { slug } = await params;

  // Security check: Only admins can access preview pages
  // This prevents unauthorized users from seeing unpublished content
  const adminAccess = await isAdmin();
  if (!adminAccess) {
    redirect('/login');
  }

  // Fetch the label set without the published filter
  const labelSet = await getLabelSetForPreview(slug);

  // Handle case where the quiz doesn't exist at all
  if (!labelSet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Label Set Not Found</h1>
          <p className="mt-2 text-slate-600">
            The quiz &quot;{slug}&quot; doesn&apos;t exist.
          </p>
          <Link
            href="/admin/labels"
            className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Picture Quizzes
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/*
        Preview Banner - Yellow/amber themed to indicate this is not the live version.
        Shows "Draft" badge if the quiz hasn't been published yet.
        Includes quick links to edit the quiz or go back to the admin list.
      */}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
        <div className="container mx-auto flex max-w-4xl items-center justify-between">
          {/* Left side: Preview mode indicator */}
          <div className="flex items-center gap-2 text-amber-800">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">
              Preview Mode
              {/* Show Draft badge for unpublished quizzes */}
              {!labelSet.is_published && (
                <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs">
                  Draft
                </span>
              )}
            </span>
          </div>

          {/* Right side: Quick navigation links */}
          <div className="flex items-center gap-3">
            {/* Edit link - opens the admin editor for this quiz */}
            <Link
              href={`/admin/labels/${slug}`}
              className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
            {/* Back link - returns to the admin quiz list */}
            <Link
              href="/admin/labels"
              className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>
        </div>
      </div>

      {/*
        Main content area - reuses the same LabelPageClient component
        as the public page for consistent quiz experience.
        The client component handles the interactive labeling and quiz UI.
      */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <LabelPageClient labelSet={labelSet} />
      </main>
    </div>
  );
}
