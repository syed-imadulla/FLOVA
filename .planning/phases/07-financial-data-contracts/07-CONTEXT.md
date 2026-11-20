# Phase 7: General-Purpose Financial Data Contracts - Context & Invariants

**Phase:** 07-financial-data-contracts
**Author:** M1 (Team Lead, Backend & Database)
**Status:** In Execution

---

## 1. Core Invariants
1. **Activity Timeline Classification:** Check-ins are balance snapshots, NOT income or expense transactions. The activity timeline model must explicitly type check-ins as `"checkin"` and keep them distinct from money movements.
2. **Uncertainty & Truthfulness:** AI-extracted receipt and voice candidate models must represent missing or uncertain fields as `null` and flag `needsReview: true`. Financial amounts and categories must **never be invented** or defaulted to zero.
3. **Zero Schema Alterations:** Use existing PostgreSQL enum values (`source in ('manual', 'voice', 'ai_suggestion', 'demo')`) and columns without requiring new database migrations.
4. **Strict Integer Paise:** All money in contracts and services is typed as `Paise` (integers).
