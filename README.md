# RateCompare

Vue app for quick interactive comparison:
- keep paying loan vs immediate full payoff,
- invest loan amount + monthly contributions,
- compare monthly/yearly average delta and final gain/loss at loan payoff horizon.

## Inputs
- Loan value
- Loan interest rate (% p.a.)
- Monthly payment
- Initial investment (automatically equals loan value)
- Expected investment return (% p.a.)
- Monthly investment

## Math Model
- Loan: fixed monthly payment amortization, monthly interest (`annualRate / 12`).
- Investment: monthly compounding with initial + monthly contributions.
- Horizon: baseline loan payoff duration.
- Final net delta:
  - `investmentEndingBalance + interestSavedByPayoff - loanValue`

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
Project includes:
- `Dockerfile` (multi-stage, static nginx runtime)
- `captain-definition`
- GitHub Actions workflow `.github/workflows/deploy-caprover.yml`

Set GitHub repository secrets:
- `CAPROVER_SERVER` (example: `https://captain.example.com`)
- `CAPROVER_APP` (CapRover app name)
- `CAPROVER_PASSWORD` (CapRover app/token password)

Workflow deploys on push to `main` or manual dispatch.
