# Signal Desk

A public, server-rendered market-research dashboard for stocks, ETFs and leveraged ETNs. It normalizes and validates arbitrary ticker input, retrieves fresh server-side data, classifies the instrument, calculates technicals, scores the result, saves one canonical daily report, and exposes dated history routes.

## Architecture

- React/Vite responsive frontend with native SVG charts
- Netlify Functions API (`research`, `recent`, `scheduled-refresh`)
- One shared research engine for public searches and scheduled runs
- Keyless Yahoo Finance adapter for quotes, history, fundamentals, estimates, news and fund summaries
- Netlify Blobs persistent history by default; optional Supabase Postgres adapter for relational deployments
- GitHub Actions DST-safe schedule at 7:00 AM `America/New_York`

## Local setup

1. Install Node 22+ and run `npm install`.
2. Copy `.env.example` to `.env`. No market-data key is required for the default provider.
3. Production history uses Netlify Blobs automatically. Supabase remains an optional alternative via `database/schema.sql`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Run `npm run dev`, then open `http://localhost:8888`.
5. Run `npm test`, `npm run lint`, and `npm run build` before deployment.

Yahoo Finance does not publish an official public API or uptime guarantee. The adapter is keyless but can be throttled or changed. The server caches complete reports (default 30 minutes), deduplicates daily storage, and limits forced refreshes per process/IP. Review Yahoo's terms and configure a licensed provider before commercial redistribution.

## Deployment

Create a Netlify site from this repository. Add the environment variables from `.env.example`; never expose the service-role or market-data key as a `VITE_` variable. Netlify provides HTTPS and deploy previews. Apply `database/schema.sql` in Supabase first. Set GitHub Actions secrets `PUBLIC_SITE_URL` and `CRON_SECRET` to match production.

This configuration targets $0/month using Netlify Hobby, Supabase Free and GitHub Actions, subject to each provider's current limits and acceptable-use terms. Do not enable a paid plan without reviewing spend controls.

## Operations

- Manual ticker refresh: use **Refresh analysis** on a report (IP-limited).
- Manual watchlist refresh: run the **Daily market research** workflow in GitHub Actions.
- Watchlist: edit `config/securities.yaml` and the `WATCHLIST` constant in `scheduled-refresh.mjs` (a future iteration should generate both from one build-time source).
- Schedule: edit `.github/workflows/daily-research.yml`. The IANA timezone makes 7:00 AM DST-safe.
- Cache: change `CACHE_TTL_MINUTES`.
- Rate limit: change `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW_MINUTES`.
- Rating thresholds/weights: edit `config/rating_weights.yaml`; current runtime thresholds match that file.
- Provider replacement: implement the same normalized shape as `src/server/provider.js` and call it from `research.js`.
- Rotate keys: create the replacement at the provider, update Netlify/GitHub secrets, redeploy, verify, then revoke the old key.
- Failed jobs: inspect the GitHub Actions response. Each watchlist ticker is isolated, so one failure does not stop the other.

## Coverage and limitations

The implemented stock path includes prices, valuation multiples, fundamentals returned by the provider, news, 1-year history, moving averages, RSI, MACD, ATR, realized volatility, drawdown, scenarios, model rating, confidence, source lineage and daily comparison. The ETF/ETN routes correctly classify CHAT and FNGU and never apply company valuation directly.

Yahoo fund summaries provide top holdings for SPY and CHAT; look-through P/E/forward P/E/PEG are calculated only over covered positive-earnings weight and coverage is displayed. Official full issuer holdings and FANG+ constituent ingestion are not guessed. FNGU-vs-FANG+ tracking values remain unavailable until a verified underlying series adapter is configured. Read [METHODOLOGY.md](METHODOLOGY.md) for formulas and validation rules.
