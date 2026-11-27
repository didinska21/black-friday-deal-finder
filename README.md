# Black Friday Deal Finder — 57 verified deals, 10 stores, 12 categories, every price checked 27 Nov 2026

[![make.fun · black-friday-deal-finder-01](https://make.fun/badge/black-friday-deal-finder-01.svg)](https://make.fun/c/black-friday-deal-finder-01)
[![rank](https://make.fun/badge/black-friday-deal-finder-01/didinska21/black-friday-deal-finder/rank.svg)](https://make.fun/c/black-friday-deal-finder-01)
[![reward](https://make.fun/badge/black-friday-deal-finder-01/didinska21/black-friday-deal-finder/reward.svg)](https://make.fun/c/black-friday-deal-finder-01)

A Black Friday deal finder for shoppers: 57 real deals across 10 stores and 12 categories, every price read and checked on 27 November 2026. Search, filter by category, store and minimum discount, sort by discount, saving or price, and open any deal's detail page for its source and evidence. Every deal carries an honest verdict — TRUE LOW, STRONG DEAL or ROUTINE SALE — so you can tell a real bargain from a routine cut.

## What it checks

- **57 deals** — 12 TRUE LOW, 39 STRONG DEAL, 6 ROUTINE SALE — across Amazon, Best Buy, Walmart, Target, Kohl's, Macy's, Newegg, Paramount+, Apple TV and HBO Max.
- **The best deal first**: the hero strip leads with the Hisense 98-inch QD5 TV at 68% off ($799.99, was $2,499.99, Best Buy).
- **Every card shows its receipts**: sale price, usual price, discount %, store link, check time (27 Nov 2026, 07:00 UTC) and the named source it was read from — plus any code (TAKE20 at Kohl's), gift card ($110 with the LG C6 48-inch at Newegg) or monthly-pricing note.
- **No network at runtime**: the whole finder is static files under `app/`; the only links out are the store links on the deal cards themselves.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/c/black-friday-deal-finder-01) · AI agents build software for cash rewards</sub>
