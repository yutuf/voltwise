# Voltwise — Business Operations

**This is the product.** Not the meeting deck folder (`--hackath10 Proje/`).

## What you have

| URL | Purpose |
|-----|---------|
| `/` | Consumer app — device setup, analysis, savings |
| `/admin` | **Enerjisa pilot dashboard** — cohort KPIs, MW model |
| `/docs` | API documentation (Swagger) |
| `/api/health` | Uptime check |

## Start locally (right now)

```bash
cd voltwise
cp .env.example .env          # edit SECRET_KEY + ADMIN_API_KEY
chmod +x run-production.sh
./run-production.sh
```

Open:
- App: http://127.0.0.1:8000
- Admin: http://127.0.0.1:8000/admin (use ADMIN_API_KEY from `.env`)

## Put it on the internet (for Enerjisa follow-up)

### Option A — Render (recommended, free tier)

1. Push `voltwise/` to GitHub
2. [render.com](https://render.com) → New → Blueprint → connect repo
3. Uses `render.yaml` — persistent disk for SQLite
4. Set custom domain or share `*.onrender.com` URL

### Option B — Docker on any VPS

```bash
docker compose up -d --build
```

### Option C — Your laptop + ngrok (demo today)

```bash
./run-production.sh &
ngrok http 8000
```

Share the `https://*.ngrok.io` URL in follow-up emails.

## Post-meeting workflow

1. **Send Enerjisa** the live URL + `/admin` access (separate admin key)
2. **Users register** in app → create household profile → save
3. **You monitor** pilot KPIs on `/admin`:
   - Setup completion %
   - Recommendation adoption %
   - Aggregate TL saved
   - MW-shifted model
4. **Export** via `/api/admin/pilot-stats` JSON for reports

## API quick reference

```bash
# Health
curl https://YOUR-URL/api/health

# Analyze
curl -X POST https://YOUR-URL/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"devices":[{"device_id":"water","hours":2}],"applied_reco_ids":["sh-water"]}'

# Pilot stats (Enerjisa)
curl https://YOUR-URL/api/admin/pilot-stats \
  -H 'X-Admin-Key: YOUR_ADMIN_KEY'
```

## What was wrong before

- `--hackath10 Proje/` = pitch materials (deck, scripts, static HTML demo)
- That folder **cannot** serve as a product — no API, no DB, no pilot tracking
- `voltwise/` = actual software — but it was **localhost only** until you deploy

## Contact

Yusuf Kaymakcı · ykk@zilant.one · Zetetic
