---
status: testing
phase: 01-auth-flow
source:
  - .planning/phases/01-auth-flow/01-01-SUMMARY.md
started: 2026-11-20T20:10:00Z
updated: 2026-11-20T20:10:00Z
---

## Current Test

number: 1
name: Logged out redirect to /login
expected: |
  In a clean or incognito browser (or logged out state), open http://localhost:5173/
  You should be automatically redirected to http://localhost:5173/login displaying the unstyled login form.
awaiting: user response

## Automated Pre-Checks

### A. Live RLS Test
command: cd backend && npm run test:rls-live
result: pass
details: All 8 live RLS checks passed against Supabase project.

### C. Secret Tracking Hygiene
command: git status --short
result: pass
details: No .env or .env.local files listed.

## Tests

### 1. Logged out redirect to /login (B1)
expected: Logged out, open http://localhost:5173/ -> redirected to /login
result: pending

### 2. Sign up with new email and display name (B2)
expected: /signup with a NEW email + display name -> lands on / showing "Signed in as <email>"
result: pending

### 3. Session persistence on refresh (B3)
expected: Refresh page while on / -> still signed in as the user
result: pending

### 4. Logout and route protection (B4)
expected: Click "Log out" button -> redirected to /login; navigating to / again -> redirected back to /login
result: pending

### 5. Login error handling (B5)
expected: Submit wrong password at /login -> readable error in role="alert", submit button re-enabled and usable
result: pending

### 6. Redirect authenticated user away from /login (B6)
expected: While logged in, open /login -> redirected to /
result: pending

### 7. Client-side password length validation (B7)
expected: Enter a 5-character password at /signup -> blocked with a message ("Password must be at least 6 characters"), submit aborted
result: pending

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
