import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Using any for flexibility with existing code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createServerClient<any>>;

/** No-op client used when Supabase env vars are missing (e.g. during Vercel build). */
function noopSupabaseClient(): SupabaseClient {
  const emptyPromise = Promise.resolve({ data: null, error: null });
  const emptyArrayPromise = Promise.resolve({ data: [], error: null });
  // Chainable query builder that always resolves to empty result
  const chain = (): unknown => ({
    select: () => chain(),
    eq: () => chain(),
    in: () => chain(),
    order: () => chain(),
    limit: () => emptyArrayPromise,
    single: () => emptyPromise,
    maybeSingle: () => emptyPromise,
    then: (resolve: (v: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
    catch: (fn: (e: unknown) => void) => (fn(null), emptyPromise),
  });
  return {
    from: () => ({ select: () => chain(), insert: () => emptyPromise, update: () => chain(), delete: () => chain(), single: () => emptyPromise }),
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }), getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }), upload: () => emptyPromise, download: () => Promise.resolve({ data: null, error: null }) }) },
    rpc: () => emptyPromise,
  } as unknown as SupabaseClient;
}

export async function createClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return noopSupabaseClient();
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

// Admin client with service role (use carefully - bypasses RLS)
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return noopSupabaseClient();
  }

  return createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
