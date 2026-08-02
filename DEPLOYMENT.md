# Deployment guide — GitHub + Vercel

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: MIHAD AI.LIVE"
git branch -M main
git remote add origin https://github.com/<your-username>/mihad-ai-live.git
git push -u origin main
```

## 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Add the environment variables from `.env.example` under
   **Project Settings → Environment Variables** for the Production,
   Preview, and Development environments:

   | Name | Where it's used |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | client + server |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server |
   | `SUPABASE_SERVICE_ROLE_KEY` | server only |
   | `GOOGLE_CLIENT_ID` | Supabase Auth provider config |
   | `GOOGLE_CLIENT_SECRET` | server only |
   | `YOUTUBE_API_KEY` | server only |
   | `NEXT_PUBLIC_SITE_URL` | set to your production URL, e.g. `https://mihad.ai.live` |

4. Deploy.

## 3. Update OAuth redirect URLs

Once you have a production URL:

- In **Google Cloud Console → Credentials**, add
  `https://<your-project>.supabase.co/auth/v1/callback` (this doesn't change
  per-deploy — it's your Supabase project's own callback).
- In **Supabase → Authentication → URL Configuration**, set the Site URL to
  your Vercel production domain and add `/dashboard`, `/accounts`, and
  `/login` under redirect URLs.

## 4. Custom domain (optional)

Add your domain under **Project Settings → Domains** in Vercel, then update
`NEXT_PUBLIC_SITE_URL` and the Supabase redirect URLs to match.

## 5. Post-deploy checklist

- [ ] Sign in with Google end-to-end on the production URL
- [ ] Connect a YouTube account and confirm it appears in Supabase
- [ ] Add a video in Multi Live Monitor and confirm the embed loads
- [ ] Confirm RLS: try querying another user's row from the SQL editor
      as a non-service-role user and confirm it's denied
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` if it was ever shared or committed
