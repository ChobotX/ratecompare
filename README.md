# RateCompare

Vue app comparing three uses of spare cash against an existing loan:
- **Invest all** spare cash, keep loan untouched.
- **Paydown** loan principal with spare cash, pocket freed monthly payment.
- **Paydown then invest** freed monthly payment (plus any overflow cash).

All three paths are evaluated over the baseline loan payoff horizon, in both nominal and inflation-adjusted (real) terms.

## Inputs
- Loan principal
- Any 2 of: annual rate (% p.a.), monthly payment, payments left — third is derived
- Spare cash available today
- Expected investment return (% p.a.)
- Annual inflation (% p.a.)

## Math Model
- Loan: fixed-payment amortization, monthly rate = `annualRate / 12`, cap 1200 months.
- Investment: monthly end-of-period compounding with initial balance + optional monthly contribution.
- Horizon: baseline loan payoff duration (0 if negative amortization).
- Freed payment after paydown: re-amortize reduced principal over original `paymentsLeft`.
- Winner chosen by real (inflation-adjusted) gain; tie threshold 0.01.

## Prefilled rates
On load the app fetches 10-year averages (with static fallbacks on failure):
- S&P 500 CAGR from `github.com/datasets/s-and-p-500`.
- ECB euro-area HICP inflation + MIR consumer-loan rate (MIR + 3 p.p. CZ premium).

## Local Development
Prerequisite: Node.js 22+ and npm.

```bash
npm ci
npm run dev
```

Run tests:
```bash
npm run test
```

Build:
```bash
npm run build
```

## CapRover Deployment
Repo-driven deploy via CapRover's GitHub integration — no GitHub Actions.

Files:
- `Dockerfile` (multi-stage build, nginx runtime)
- `captain-definition` (schemaVersion 2, Dockerfile path)
- `.dockerignore`

### One-time setup
1. Create the app in CapRover dashboard.
2. App → **Deployment** → *Method 3: Deploy from GitHub/Bitbucket/GitLab*:
   - Repository: `github.com/ChobotX/ratecompare`
   - Branch: `main`
   - Username: GitHub username (any non-empty value when using SSH key)
   - SSH key: leave the generated one or paste your own private key
3. Copy the **public deploy key** shown by CapRover.
4. GitHub repo → **Settings → Deploy keys → Add deploy key**, paste the public key (read-only is fine).
5. CapRover shows a **webhook URL** — add it in GitHub repo → **Settings → Webhooks** (content type `application/json`, event: `push`).

### Deploys
`git push origin main` → GitHub webhook → CapRover pulls via SSH → builds Dockerfile → live.
