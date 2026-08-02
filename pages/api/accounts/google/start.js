import { getServerSupabase } from '../../../../lib/supabaseServer'

// GET /api/accounts/google/start
// Redirects to Google's own OAuth consent screen directly (NOT through
// supabase.auth.signInWithOAuth). This is deliberate: signInWithOAuth
// would replace the user's main app login session with whichever Google
// account they pick here. Going straight to Google, and exchanging the
// code for a token ourselves in /callback, leaves the existing Supabase
// session completely untouched.
export default async function handler(req, res) {
  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.redirect('/login')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const redirectUri = `${siteUrl}/api/accounts/google/callback`

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent select_account',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ].join(' '),
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
