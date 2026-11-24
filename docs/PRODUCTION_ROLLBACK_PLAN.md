# FLOVA: Production Incident Response & Rollback Procedures

**Target Environment:** Production (`myflova.vercel.app` & Supabase `msjzkylvafuwlkkujxpv`)  
**Scope:** Remediation procedures for production incidents following deployment.  
**Critical Safety Principle:** Never weaken access controls, bypass Row Level Security, or grant public execute on internal database functions during an incident. Ad-hoc privilege grants and insecure RLS rollbacks introduce severe vulnerabilities (such as IDOR and PostgREST RPC exposure) and are strictly prohibited.

---

## 1. Incident Severity & Decision Framework

Rollback or emergency intervention is initiated only upon confirmed P0 or P1 incidents:

| Severity | Incident Pattern | Detection Metric | Permitted Action |
| :---: | :--- | :--- | :--- |
| **P0** | Global Authentication Failure | User login failure rate > 5% after release | Vercel instant rollback; verify Supabase Auth redirect URLs |
| **P0** | Database Lock Contention / Outage | Query latency > 5000ms or blocked sessions in `pg_locks` | Inspect locking transactions; terminate blocking PID; restore from snapshot if corrupted |
| **P1** | Edge Function Invocations Failing | HTTP 500/503 errors > 10% on voice or receipt processing | Redeploy previous Edge Function revision; verify Groq API status |
| **P1** | Rate Limiter False Positives | Legitimate traffic throttled under configured threshold | Temporarily increase quota configuration via SQL (do not disable rate limiter code) |
| **P1** | Content Security Policy Blocking | Browser console errors blocking application scripts/fonts | Roll back Vercel deployment; inspect CSP headers in `vercel.json` |

---

## 2. Temporary Mitigations vs. Permanent Rollbacks

### A. Temporary Mitigation (Non-Destructive)
A temporary mitigation adjusts runtime parameters to restore service while preserving all security guarantees. It does **not** alter schema structure, drop tables, weaken RLS, or grant broad privileges.

- **Example (Rate Limiting Spike):** If legitimate users experience rate limiting during peak hours, do **not** replace the rate limiter with an always-allow stub or revoke authentication requirements. Instead, temporarily adjust window limits via SQL configuration:
  ```sql
  -- Safe parameter adjustment: increases short-window and daily capacity without schema alterations
  UPDATE public.edge_function_rate_limit_configs
  SET short_max_calls = 30, daily_max_calls = 150, updated_at = now()
  WHERE function_name IN ('process-voice', 'extract-receipt');
  ```
- **Example (Edge Function Upstream API Latency):** If Groq API experiences high latency, Edge Function timeouts fail closed safely. Mitigate by adjusting client retry intervals.

### B. Permanent Rollback (Destructive / Structural)
A permanent rollback reverts code, Edge Functions, or database migrations to a previous state.
- **Mandatory Precondition:** Requires an active database snapshot and explicit sign-off from the Lead Security Engineer and Release Engineer.
- **Execution Rule:** Database structural rollbacks must restore from verified snapshots rather than executing ad-hoc privilege grants or dropping security policies.

---

## 3. Component-by-Component Recovery Procedures

### 3.1 Web Frontend Rollback (Vercel)

Vercel provides instant, immutable deployment rollbacks without code modifications or Git commits:

1. Open **Vercel Dashboard** &rarr; Project `flova` &rarr; **Deployments**.
2. Locate the previous stable production deployment hash (prior to the release deployment).
3. Click the options menu (`...`) next to that deployment and select **Instant Rollback**.
4. Confirm the rollback. Production traffic redirects to the previous immutable bundle in < 10 seconds.
5. Verify web app accessibility and headers:
   ```bash
   curl -I https://myflova.vercel.app/
   ```

---

### 3.2 Supabase Edge Functions Rollback

If newly deployed Edge Functions (`process-voice` or `extract-receipt`) fail or encounter runtime exceptions:

1. In the Supabase Dashboard &rarr; Project `msjzkylvafuwlkkujxpv` &rarr; **Edge Functions**:
   - Select `process-voice` &rarr; View Deployment History.
   - Re-activate or re-deploy the previous known-good deployment.
   - Repeat for `extract-receipt`.
2. Alternatively, redeploy from the verified commit via CLI:
   ```bash
   # Deploy previous commit functions (requires explicit approval)
   git checkout <PREVIOUS_RELEASE_COMMIT> -- backend/supabase/functions/
   npx supabase functions deploy process-voice --project-ref msjzkylvafuwlkkujxpv
   npx supabase functions deploy extract-receipt --project-ref msjzkylvafuwlkkujxpv
   ```
3. Verify function health via authenticated OPTIONS preflight:
   ```bash
   curl -I -X OPTIONS https://msjzkylvafuwlkkujxpv.supabase.co/functions/v1/process-voice
   ```

---

### 3.3 Database Incident Remediation & Recovery

#### Rule 1: Never Revert Child Table RLS to Insecure State
- **Prohibited:** Never execute `DROP POLICY` to restore `USING (auth.uid() = user_id)` on `wish_contributions` or `invoice_settlements`. Doing so re-opens the critical IDOR vulnerability (SEC-01) allowing cross-user financial record manipulation.
- **Remediation if Contribution/Settlement Writes Fail:** Inspect the incoming payload to verify that the client application passes a `goal_id` or `invoice_id` that belongs to the authenticated user.

#### Rule 2: Never Grant Broad EXECUTE to Authenticated on Internal Functions
- **Prohibited:** Never execute `GRANT EXECUTE ON FUNCTION sync_payout_received(uuid) TO authenticated;` or `GRANT EXECUTE ON FUNCTION transactions_sync_payout() TO authenticated;`. These functions are internal triggers and helper routines. Exposing them grants unauthorized PostgREST RPC access, allowing users to invoke lock queries against arbitrary records.
- **Remediation if Payout Triggers Fail:** Inspect whether the trigger has `SECURITY DEFINER` and `SET search_path = public, pg_temp` intact:
  ```sql
  SELECT proname, prosecdef, proconfig FROM pg_proc
  WHERE proname = 'transactions_sync_payout';
  -- Must return prosecdef = true and search_path = public, pg_temp
  ```

#### Rule 3: Database Restoration from Snapshot (Permanent Recovery)
If database schema corruption or deadlocks cannot be resolved safely:
1. Obtain explicit written authorization from the Lead DBA and Release Engineer.
2. Confirm the pre-deployment snapshot is available in Supabase Dashboard -> **Database** -> **Backups**.
3. Restore the database to the point-in-time snapshot captured immediately prior to migration execution.
4. Notify all active sessions and re-verify data integrity.

---

### 3.4 Android Native App Incident Procedures

If a critical issue is identified on the Android native release:

1. **Halt Rollout in Google Play Console:**
   - Navigate to Google Play Console &rarr; **Release** &rarr; **Production** (or **Closed Testing**).
   - Click **Halt Rollout** immediately to prevent new users from downloading the build.
2. **Emergency Hotfix Release:**
   - In Android development, rollbacks require deploying a higher `versionCode`.
   - Increment `versionCode` in `frontend/android/app/build.gradle` (e.g. from `1` to `2`).
   - Revert the offending code locally, compile a signed release bundle (`./gradlew bundleRelease`), and submit it with 100% rollout to supersede the broken release.

---

## 4. Post-Rollback Verification Checklist

Following any emergency rollback or mitigation:

- [ ] Confirm web app loads at `https://myflova.vercel.app` with valid Content-Security-Policy headers.
- [ ] Verify user authentication works (email/password and Google OAuth).
- [ ] Verify that existing financial transactions and balances remain accurate.
- [ ] Confirm no internal functions are exposed to unauthenticated or authenticated PostgREST RPC.
- [ ] Document root cause, incident timeline, and remediation plan before re-attempting rollout.
