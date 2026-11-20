# Phase 2 Context: Profile & Onboarding Data

**Phase:** 02-profile-onboarding-data  
**Status:** Completed  
**Decisions Covered:** D-01 through D-07

## Decisions

- **D-01:** Implement `ProfileProvider.tsx` and `useProfile.ts` in `frontend/src/profile/`. Exposes `{ profile, loading, error, reload, save(patch) }`. `save()` updates stored state so UI updates without reload.
- **D-02:** Consume only `getMyProfile()` and `updateMyProfile(userId, patch)` from `frontend/src/services/data.ts`. No direct Supabase calls.
- **D-03:** Implement `parseRupees.ts` pure function `parseOptionalRupees(text)` converting rupee strings to integer paise via `toPaise()`. Empty -> null, rejects negative, > 2 decimal places, non-numbers, and > ₹1,00,000/day.
- **D-04:** Implement `RequireOnboarded.tsx` guard on `/`. Redirects `onboarding_completed: false` to `/onboarding`. Shows loading and error retry state.
- **D-05:** Implement `OnboardingPage.tsx` replacing `OnboardingPlaceholder.tsx`. Form with display name, work profile radio (delivery default, others disabled with "(coming soon)"), payout pattern select, language select (en, others disabled), daily living and work spend with hints. Pre-fills from profile.
- **D-06:** Update `HomePlaceholder.tsx` to display work type, payout pattern, daily estimates formatted with `formatINR` or "Not provided", and an "Edit profile" link to `/onboarding`.
- **D-07:** Implement unit tests in `frontend/src/profile/__tests__/parseRupees.test.ts` matching runner style.
