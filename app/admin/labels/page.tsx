'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  MousePointerClick,
  Eye,
  Edit,
  Trash2,
  Search,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  ImageIcon,
  Target,
  Gamepad2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface LabelSetRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  difficulty: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  labels: { count: number }[];
}

export default function AdminLabelsPage() {
  const [labelSets, setLabelSets] = useState<LabelSetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchLabelSets();
  }, []);

  async function fetchLabelSets() {
    try {
      const res = await fetch('/api/labels?admin=true');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLabelSets(data.data || []);
    } catch (error) {
      console.error('Failed to fetch label sets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Are you sure you want to delete this label set?')) return;

    setDeleting(slug);
    try {
      const res = await fetch(`/api/labels/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setLabelSets((prev) => prev.filter((ls) => ls.slug !== slug));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete label set');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = labelSets.filter(
    (ls) =>
      ls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ls.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <MousePointerClick className="h-7 w-7 text-emerald-600" />
              Picture Quiz
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create vocabulary quizzes from images
            </p>
          </div>
          <Link
            href="/admin/labels/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            New Picture Quiz
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          searchQuery ? (
            /* Search with no results */
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-700">
                No matching quizzes
              </h3>
              <p className="mt-1 text-sm text-slate-500">Try a different search term</p>
            </div>
          ) : (
            /* Empty state with onboarding */
            <div className="space-y-6">
              {/* Hero card */}
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-lg">
                <div className="flex flex-col items-center text-center md:flex-row md:text-left">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                      Create Interactive Vocabulary Quizzes! 🎯
                    </h2>
                    <p className="mt-2 text-emerald-100">
                      Upload an image, add labels to objects, and let students learn Vietnamese
                      words by clicking and typing. Perfect for visual learners!
                    </p>
                    <Link
                      href="/admin/labels/new"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-600 shadow-md transition-transform hover:scale-105"
                    >
                      <Sparkles className="h-5 w-5" />
                      Create Your First Quiz
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="mt-6 flex-shrink-0 md:ml-8 md:mt-0">
                    <div className="relative h-32 w-32 rounded-xl bg-white/20 p-4">
                      <MousePointerClick className="h-full w-full text-white/80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works - 3 steps */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-center text-lg font-semibold text-slate-700">
                  How It Works (3 Easy Steps!)
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Step 1 */}
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                      <ImageIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                        Step 1
                      </span>
                    </div>
                    <h4 className="mt-2 font-semibold text-slate-800">Upload an Image</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Pick a photo with things to label – like a kitchen, classroom, or street
                      scene
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                      <Target className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                        Step 2
                      </span>
                    </div>
                    <h4 className="mt-2 font-semibold text-slate-800">Click to Add Labels</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Click on objects in the image and type the Vietnamese + English words
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <Gamepad2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                        Step 3
                      </span>
                    </div>
                    <h4 className="mt-2 font-semibold text-slate-800">Students Play & Learn</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Share the link – students explore labels, then take a typing quiz!
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 text-center">
                  <Link
                    href="/admin/labels/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
                  >
                    <Plus className="h-5 w-5" />
                    Let&apos;s Create One!
                  </Link>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">💡 Pro tip:</span> Start with simple images
                  (5-10 objects). Photos of food, rooms, or everyday items work great for
                  beginners!
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((labelSet) => (
              <div
                key={labelSet.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={labelSet.image_url}
                    alt={labelSet.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Status badge */}
                  <div className="absolute left-2 top-2">
                    {labelSet.is_published ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <XCircle className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </div>
                  {/* Words count */}
                  <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                    {labelSet.labels[0]?.count || 0} words
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800">{labelSet.title}</h3>
                  {labelSet.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {labelSet.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {labelSet.view_count} views
                    </span>
                    <span>{formatDate(labelSet.created_at)}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                      {labelSet.difficulty}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-slate-100">
                  <Link
                    href={`/label/${labelSet.slug}/preview`}
                    target="_blank"
                    className="flex flex-1 items-center justify-center gap-1 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Link>
                  <Link
                    href={`/admin/labels/${labelSet.slug}`}
                    className="flex flex-1 items-center justify-center gap-1 border-l border-slate-100 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(labelSet.slug)}
                    disabled={deleting === labelSet.slug}
                    className="flex flex-1 items-center justify-center gap-1 border-l border-slate-100 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === labelSet.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
