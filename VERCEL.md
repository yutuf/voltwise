# Deploy Voltwise on Vercel

## 1. Push to GitHub

```bash
cd voltwise
git init
git add .
git commit -m "Voltwise Next.js for Vercel"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import **`yutuf/voltwise`**
2. **Framework preset:** `Services` (required when repo has `vercel.json` → `experimentalServices`)
3. `vercel.json` is already in the repo — deploys **Next.js only** at `/`

## 3. Add Neon Postgres (for profiles + auth)

1. Vercel project → **Storage** → **Connect Store** → **Neon**
2. Vercel auto-sets `DATABASE_URL`
3. Redeploy

## 4. Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | For save/auth | Auto from Neon |
| `SECRET_KEY` | Yes | Random string for JWT |
| `ADMIN_API_KEY` | Yes | For `/admin` dashboard |

Generate in Vercel → Settings → Environment Variables.

## 5. What works without DB

- `/` — full energy analysis app
- `/api/analyze` — always works (stateless)
- `/admin` — works, shows empty cohort until DB + profiles

## 6. CLI deploy

```bash
npx vercel
npx vercel --prod
```

## URLs after deploy

- `https://your-app.vercel.app` — product
- `https://your-app.vercel.app/admin` — Enerjisa pilot dashboard
