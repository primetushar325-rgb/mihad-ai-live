import { getServerSupabase } from '../../../lib/supabaseServer'

// POST /api/accounts/disconnect
// Body: { accountId }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { accountId } = req.body || {}
  if (!accountId) return res.status(400).json({ error: 'Missing accountId' })

  const { data: account } = await supabase
    .from('connected_accounts')
    .select('channel_title')
    .eq('id', accountId)
    .eq('user_id', session.user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('connected_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', session.user.id)

  if (error) return res.status(400).json({ error: error.message })

  await supabase.from('activity_logs').insert({
    user_id: session.user.id,
    action: 'account_disconnected',
    detail: account?.channel_title || accountId,
  })

  return res.status(200).json({ success: true })
}
