# FLOVA frontend

React + Vite + TypeScript. No chart library: the income chart is a small SVG component.

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173, proxies /api to the backend on :8000
npm run build
```

Tabs:
- **My week**: sign up (or load a demo rider), log a payout, see salary, buffer, why, the 4-week outlook, and earned vs. salary.
- **SMS mode**: keypad-phone simulator for `PAY` / `STATUS` / `UNDO`.
- **Evidence**: backtest table (baseline vs. FLOVA) and one simulated year per rider type.

Set `VITE_API_URL` to call a backend somewhere other than `/api`.
