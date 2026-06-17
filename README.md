# Voltwise

**Next.js app for Vercel** — consumer energy app + Enerjisa pilot admin.

The old FastAPI server (`backend/`) is legacy. **Deploy this folder to Vercel.**

## Deploy (3 steps)

1. Push `voltwise/` to GitHub
2. [vercel.com/new](https://vercel.com/new) → import repo
3. Add **Neon Postgres** in Vercel Storage + set `SECRET_KEY` and `ADMIN_API_KEY`

Full guide: **[VERCEL.md](./VERCEL.md)**

## Local dev (needs Node 18+)

```bash
npm install
cp .env.example .env.local   # add DATABASE_URL from Neon
npm run dev
```

## Routes

| URL | What |
|-----|------|
| `/` | Product — device analysis, savings, tour (E key) |
| `/admin` | Pilot dashboard for Enerjisa |
| `/api/health` | Health check |
| `/api/analyze` | Energy engine (works without DB) |

## Stack

Next.js 15 · Neon Postgres · JWT auth · TypeScript

Contact: ykk@zilant.one
