# Methodology and data policy

## Classification

Provider metadata routes common stocks, ADRs and funds. Explicit overrides classify CHAT as an actively managed thematic ETF and FNGU as a 3× daily leveraged ETN linked to NYSE FANG+. Ambiguous instruments are marked unsupported or limited.

## Valuation

Company multiples are reported provider values with null preservation. PEG is accepted only when reported by the configured provider or calculated from a compatible P/E and expected annual EPS-growth percentage.

ETF P/E uses weighted earnings yield, not an average of P/E ratios: `EY = Σ(weight × EPS / price)` and `P/E = 1 / EY`. Forward P/E substitutes forward EPS. Negative earners, cash, derivatives and missing observations are excluded, with portfolio coverage and excluded weight displayed. ETF PEG is forward portfolio P/E divided by compatible portfolio EPS growth; constituent PEGs are never averaged.

## Leveraged products

Daily leveraged return is modeled as `Π(1 + leverage × daily underlying return − daily drag) − 1`. It is compared against simple leverage times the underlying cumulative return. The gap captures compounding, volatility, fees, financing and tracking effects but is not attributed to one cause without evidence. Tactical scenarios use a daily path; they are not intrinsic values.

## Recommendation

Scores are normalized to 0–100. Thresholds are: STRONG BUY 85–100, BUY 70–84, HOLD 45–69, SELL 30–44, STRONG SELL 0–29. Stock, ETF and leveraged-product weights differ. Confidence is independent and reflects coverage, freshness and agreement.

## Data quality and history

Validation preserves nulls, rejects incompatible units/denominators, requires price, flags stale or missing holdings, and reports portfolio coverage. `GOOD`, `PARTIAL`, and `DEGRADED` summarize fitness. Reports upsert on `(ticker, report_date)` to avoid duplicate daily snapshots. Comparisons are structured field differences, not generated prose.
