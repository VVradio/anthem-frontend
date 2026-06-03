# Anthem — Frontend

The Anthem studio UI (React + Vite). Deploys as a static site to Vercel or Netlify.

## Run locally

1. Install Node.js 18+.
2. `npm install`
3. `npm run dev` → opens on http://localhost:5173
4. `npm run build` → outputs a production bundle to `dist/`

## Demo mode vs live mode

The app reads one environment variable, `VITE_API_BASE`:

- **Empty** (default): demo mode — agents call the AI directly so the preview works
  with zero backend. Great for showing the product off.
- **Set to your backend URL**: live mode — the app shows a login screen and routes
  every agent message through your backend, keeping your AI key server-side.

For local dev, `cp .env.example .env` and fill in `VITE_API_BASE` if you want live mode.

## Deploy to Vercel (recommended)

1. Push this folder to a GitHub repo.
2. In Vercel: New Project → import the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist`.
4. Add an Environment Variable: `VITE_API_BASE = https://your-backend-url` (or leave
   unset for demo mode).
5. Deploy. You'll get a URL like `https://anthem.vercel.app`.
6. Copy that URL into your backend's `CLIENT_ORIGIN` variable so CORS allows it.

## Deploy to Netlify (alternative)

Same idea: build command `npm run build`, publish directory `dist`, and set
`VITE_API_BASE` under Site settings → Environment variables.

## Custom domain

Add your domain (e.g. anthem.fm) in Vercel/Netlify's domain settings and follow the
DNS instructions. Update the backend `CLIENT_ORIGIN` to the final domain.
