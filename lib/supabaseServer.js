import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Use inside pages/api/* routes: reads the caller's session from
// cookies so RLS applies as that user (never bypasses RLS).
export function getServerSupabase(req, res) {
  return createPagesServerClient({ req, res })
}

// Admin client — service role key, server-only, bypasses RLS.
// Only use this for operations that must run outside a user's
// context (e.g. scheduled sync jobs). Never import this in
// anything that ships to the browser.
export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
