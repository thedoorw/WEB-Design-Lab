# WEB Current Work Order

ROLE = WEB Factory / WR
CASE = 001-theminimalists
REFERENCE = https://www.theminimalists.com/
STATUS = CASE_001_BASELINE_PASS
USER_FIDELITY_GATE_REQUIRED = NO

## Completed objective

The first website-reproduction case has established a working factory loop:

```text
public reference
→ fast architecture classification
→ synthetic-content reconstruction
→ browser capture
→ fallback when live capture is blocked
→ validated visual baseline
→ frozen geometry
→ automated responsive comparison
→ bounded correction
→ PASS
```

## Case 001 acceptance

```text
DESKTOP_1440 = PASS
COMPACT_1024 = PASS
MOBILE_390 = PASS
HORIZONTAL_OVERFLOW = 0
BASELINE_PASS = true
```

Evidence:
- `cases/001-theminimalists/CASE_STATUS.md`
- `cases/001-theminimalists/TRU_BASELINE_v0.1.json`
- `factory/capture/case001-capture.mjs`
- GitHub Actions run `37310869405`

## Current factory rule

Do not begin future cases with exhaustive manual research.

```text
TARGET
→ classify quickly
→ choose reconstruction path
→ build working first version
→ establish/freeze valid baseline
→ automate comparison
→ correct measured deltas
```

External reference recapture is evidence refresh, not a required dependency for every revision.

## Next

Extract Case 001 into a reusable starter/template and define the handoff boundary for the first formal Site Repo.

No USER fidelity approval is required for the completed Case 001 baseline.
