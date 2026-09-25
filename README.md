# Signal Desk

A public, server-rendered market-research dashboard for stocks, ETFs and leveraged ETNs. It normalizes and validates arbitrary ticker input, retrieves fresh server-side data, classifies the instrument, calculates technicals, scores the result, saves one canonical daily report, and exposes dated history routes.

## Architecture

- React/Vite responsive frontend with native SVG charts
- Netlify Functions API (`research`, `recent`, `scheduled-refresh`)
- One shared research engine for public searches and scheduled runs
- Alpha Vantage provider adapter; issuer/index adapters are intentionally required before displaying portfolio metrics
- Optional Supabase Postgres persistence; in-process storage is a local-development fallback only
- GitHub Actions DST-safe schedule at 7:00 AM `America/New_York`

## Local setup

1. Install Node 22+ and run `npm install`.
2. Copy `.env.example` to `.env` and set `ALPHA_VANTAGE_API_KEY`.
3. For persistent history, create a Supabase project, execute `database/schema.sql`, and set `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`.
4. Run `npm run dev`, then open `http://localhost:8888`.
5. Run `npm test`, `npm run lint`, and `npm run build` before deployment.

The Alpha Vantage free plan currently documents 25 daily requests, so public traffic can exhaust it quickly. The server caches complete reports (default 30 minutes), deduplicates daily storage, and limits forced refreshes per process/IP. For meaningful public use, configure a provider with redistribution terms and quota suited to expected traffic.

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

Issuer holdings and official FANG+ constituent ingestion are not guessed. Until production adapters are configured, ETF holdings, look-through P/E/forward P/E/PEG, earnings-contribution tables, and FNGU-vs-FANG+ tracking values remain explicitly unavailable and data quality is `DEGRADED`. This is safer than publishing stale or fabricated portfolio data. Read [METHODOLOGY.md](METHODOLOGY.md) for formulas and validation rules.
