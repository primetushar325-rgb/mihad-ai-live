import { getServerSupabase } from '../../../../lib/supabaseServer'
import { fetchMyChannel } from '../../../../lib/youtube'

// GET /api/accounts/google/callback
// Google redirects here with ?code=... after the user grants consent.
// We exchange that code for an access token ourselves (server-side,
// using the OAuth client secret), find out which channel it belongs to,
// and save it against whoever is currently logged into the app — the
// main session was never touched, so this works even if the person
// authorizes a different Google account than the one they're logged in
// with.
export default async function handler(req, res) {
  const { code, error: googleError } = req.query
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (googleError) {
    return res.redirect(`${siteUrl}/accounts?error=${encodeURIComponent(googleError)}`)
  }
  if (!code) {
    return res.redirect(`${siteUrl}/accounts?error=missing_code`)
  }

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.redirect(`${siteUrl}/login`)

  try {
    const redirectUri = `${siteUrl}/api/accounts/google/callback`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed')
    }

    const { access_token, refresh_token, id_token } = tokenData
    const channel = await fetchMyChannel(access_token)
    if (!channel) throw new Error('No YouTube channel found on this Google account')

    // Pull the granting account's email out of the Google ID token (JWT)
    // just for display purposes — no verification needed since it came
    // straight from Google over HTTPS in the same request.
    let googleAccountEmail = null
    try {
      const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString('utf8'))
      googleAccountEmail = payload.email || null
    } catch {
      // Non-fatal — email is informational only.
    }

    const { count } = await supabase
      .from('connected_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if ((count ?? 0) >= 20) {
      return res.redirect(`${siteUrl}/accounts?error=${encodeURIComponent('Maximum of 20 connected accounts reached')}`)
    }

    const { data: savedAccount, error: upsertError } = await supabase
      .from('connected_accounts')
      .upsert(
        {
          user_id: session.user.id,
          channel_id: channel.channelId,
          channel_title: channel.title,
          channel_thumbnail: channel.thumbnail,
          google_account_email: googleAccountEmail,
          status: 'active',
          encrypted_refresh_token: refresh_token || null,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,channel_id' }
      )
      .select()
      .single()

    if (upsertError) throw new Error(upsertError.message)

    if (savedAccount) {
      await supabase.from('youtube_channels').insert({
        connected_account_id: savedAccount.id,
        user_id: session.user.id,
        channel_id: channel.channelId,
        subscriber_count: channel.subscriberCount || 0,
        view_count: channel.viewCount || 0,
        video_count: channel.videoCount || 0,
      })
    }

    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      action: 'account_connected',
      detail: channel.title || channel.channelId,
    })

    return res.redirect(`${siteUrl}/accounts?connected=1`)
  } catch (err) {
    return res.redirect(`${siteUrl}/accounts?error=${encodeURIComponent(err.message || 'connect_failed')}`)
  }
}
