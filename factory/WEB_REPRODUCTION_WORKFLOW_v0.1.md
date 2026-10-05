# Web Reproduction Workflow v0.1

## Canonical fast loop

```text
REFERENCE URL
→ AI reconstruction / import
→ working scaffold
→ neutralize content/assets
→ browser run
→ reference/reproduction same-viewport capture
→ visual + responsive diff
→ bounded correction
→ interaction check
→ PASS
→ extract reusable patterns
→ optional promotion to dedicated Site Repo
```

## Target viewports

Default:
- 1440 × 900
- 1024 × 768
- 390 × 844

A case may add viewports when the reference exposes a material breakpoint not covered above.

## What to compare

- outer content width;
- column/read width;
- navigation geometry;
- typography hierarchy;
- vertical rhythm;
- repeated-item spacing;
- media sizing/crop behavior;
- detail-page flow;
- footer;
- mobile transformation;
- overflow/scrolling;
- material hover/focus/expand/collapse behavior.

## Correction rule

Do not rewrite working areas because a theoretical system would be cleaner.

```text
OBSERVED DELTA
→ FIX

NO OBSERVED DELTA
→ LEAVE ALONE
```

## User intervention

No USER review gate for objective reference matching.

Escalate only:
- original content/brand decisions;
- desired intentional departures;
- publication/visibility decisions not already authorized;
- paid external services.

## Output of every case

A completed case should return:
- working reconstruction;
- reference URL;
- implementation source;
- screenshots/evidence;
- delta log;
- reusable pattern notes;
- tool effectiveness notes;
- promotion decision.
