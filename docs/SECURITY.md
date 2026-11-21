# FLOVA: Security, Authentication & Database RLS Architecture

## 1. Zero Trust Data Architecture
FLOVA is architected so that client devices have access strictly to the authenticated user's own financial records.

---

## 2. Row Level Security (RLS) Implementation

All primary tables enforce RLS:
- `transactions`
- `profiles`
- `payouts`
- `commitments`
- `balance_checkins`
- `invoices`
- `invoice_items`
- `invoice_settlements`
- `wish_goals`
- `wish_contributions`

### Canonical Policy Structure
```sql
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete own transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Invariants Verified by Automated Database Tests (`test:db`):
- Anonymous callers have zero access to database tables (`permission denied for table`).
- User B cannot read, update, insert, or delete User A's records.
- Foreign key constraints prevent linking transactions to another user's payouts or invoices.

---

## 3. Edge Function & Service-to-Service Security

1. **Client JWT Validation:**
   - Both `process-voice` and `extract-receipt` inspect `req.headers.get("Authorization")`.
   - Validate token via `supabase.auth.getUser(token)` before performing processing.
2. **Internal STT Service Key:**
   - The FastAPI IndicConformer service requires the header `X-FLOVA-STT-KEY` matching `FLOVA_STT_INTERNAL_KEY`.
   - Rejects unauthorized external calls with HTTP 401.
3. **Secret Hygiene:**
   - Client code (`frontend/src/`) contains only public identifiers (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Private keys (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FLOVA_STT_INTERNAL_KEY`, `HF_TOKEN`) reside exclusively in server-side environment variables and Edge Function secrets.
   - Zero secrets are logged to stdout or embedded in client bundles.
