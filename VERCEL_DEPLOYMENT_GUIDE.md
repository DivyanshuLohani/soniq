# Deploying soniq to Vercel (Step-by-Step Guide)

This guide covers everything needed to deploy **soniq** (Frontend + Serverless Express/Prisma Backend + PostgreSQL) on Vercel with zero friction.

---

## 1. Prerequisites

1. **A Hosted PostgreSQL Database**  
   Prisma requires a live PostgreSQL instance for production. You can use any of the following free-tier providers:
   - **Neon Serverless Postgres** (Recommended for Vercel): [https://neon.tech](https://neon.tech)
   - **Vercel Postgres**: Available directly inside the Vercel Storage dashboard.
   - **Supabase**: [https://supabase.com](https://supabase.com)
   - **Render / Railway / Aiven PostgreSQL**

2. **A Spotify Developer App** (Optional, for OAuth login):
   - Spotify Developer Dashboard: [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Note: soniq operates smoothly even without Spotify keys using its embedded preview engine!

---

## 2. Vercel Project Import

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select your repository: **`DivyanshuLohani/soniq`**.
4. Configure Build and Output Settings:
   - **Framework Preset**: Select **Other** (or Vite).
   - **Root Directory**: Leave as `./` (the root repository directory).
   - **Build Command**: Leave as default or verify it uses:
     ```bash
     cd backend && bunx prisma generate && cd ../frontend && bun run build
     ```
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `bun install` (Vercel natively supports Bun).

---

## 3. Environment Variables Configuration

In your Vercel Project Settings under **Environment Variables**, add the following:

| Variable Name | Required | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require` | Connection string to your cloud PostgreSQL database. |
| `JWT_SECRET` | **Yes** | `super-secret-jwt-key-matiks-production-2025` | Strong random secret key used to sign JWT auth tokens. |
| `FRONTEND_URL` | **Yes** | `https://soniq.dibbu.dev` | Your production frontend URL (or your `*.vercel.app` URL). |
| `NODE_ENV` | Optional | `production` | Enables production security flags on auth cookies. |
| `SPOTIFY_CLIENT_ID` | Optional | `72b03ca6731649b48dd3fdede45f1c18` | Spotify Developer App Client ID. |
| `SPOTIFY_CLIENT_SECRET` | Optional | `faee21c6bac04f0c92955ffad1136447` | Spotify Developer App Client Secret. |
| `SPOTIFY_REDIRECT_URI` | Optional | `https://soniq.dibbu.dev/api/auth/spotify/callback` | OAuth redirect URI (must also be added to Spotify App dashboard). |
| `VITE_GA_MEASUREMENT_ID` | Optional | `G-XXXXXXXXXX` | Google Analytics GA4 Measurement ID (if tracking visits). |

> [!IMPORTANT]
> If you configure Spotify credentials, go to your **[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)** → your App → **Settings** → **Redirect URIs**, and add:
> `https://soniq.dibbu.dev/api/auth/spotify/callback`  
> (as well as `https://<your-project>.vercel.app/api/auth/spotify/callback`).
>
> **Development Mode Notice (403 Forbidden Prevention)**:  
> When your Spotify App is in **Development Mode**, Spotify only permits access to Spotify accounts explicitly registered under **User Management** in your Spotify Developer Dashboard. Ensure any tester accounts or your personal account email are added there, or request an Extended Quota if moving to public production.

---

## 4. Push Database Schema to Production

Before the app can save games and query the leaderboard, your production PostgreSQL database must have the Prisma tables created.

Run this once locally pointing to your production database URL:

```bash
DATABASE_URL="postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require" bun run db:push
```

This creates the tables (`User`, `GameSession`, `GameAnswer`, `FeaturedArtist`, `FeaturedTrack`, `AnalyticsCache`, `AnalyticsEvent`).

---

## 5. Deploy & Verify

1. Click **Deploy** in Vercel.
2. Vercel will:
   - Run `bun install`
   - Execute `prisma generate` in `backend`
   - Build the frontend bundle into `frontend/dist`
   - Map `api/index.ts` to serverless function endpoints under `/api/*`
3. Test deployment URLs:
   - `https://soniq.dibbu.dev/api/health` → Should return `{"status":"ok"}`
   - `https://soniq.dibbu.dev/api/auth/status` → Should return `{"spotifyConfigured": true/false}`
   - `https://soniq.dibbu.dev/` → Full single-page app interface.

---

## 6. Custom Domain Setup (`soniq.dibbu.dev`)

1. In the Vercel Dashboard, navigate to **Settings** → **Domains**.
2. Type `soniq.dibbu.dev` and click **Add**.
3. In your DNS provider (Cloudflare, Namecheap, etc.), add the DNS record indicated by Vercel:
   - **Type**: `CNAME`
   - **Name**: `soniq`
   - **Value**: `cname.vercel-dns.com`
4. Once DNS propagates, Vercel will automatically provision a free SSL certificate.
