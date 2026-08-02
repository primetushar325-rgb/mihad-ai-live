import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase instance. Uses the public anon key only —
// this key is safe to expose because every table is protected by
// Row Level Security policies (see supabase/schema.sql).
export const supabase = createBrowserSupabaseClient()
