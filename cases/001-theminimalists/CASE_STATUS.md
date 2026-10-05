# Case 001 Status

```text
CASE = 001-theminimalists
BRANCH = work/case-001-theminimalists
REFERENCE = https://www.theminimalists.com/
VISUAL_BASELINE = https://tru.spyr.me/
PHASE = REPRODUCTION_BASELINE_PASS
SOURCE_QA = PASS
SYNTHETIC_CONTENT = PASS
LOCAL_RENDER_CAPTURE = PASS
RESPONSIVE_STRUCTURE = PASS
FROZEN_BASELINE_COMPARE = PASS
REFERENCE_HEADLESS_CAPTURE = BLOCKED_BY_CLOUDFLARE
USER_FIDELITY_GATE = NOT REQUIRED
```

## Implemented

- homepage editorial stream;
- detail/article page;
- Start-style long-form page;
- Resources-style repeated resource page;
- Archives/index page;
- shared masthead/navigation/footer;
- mobile navigation toggle;
- synthetic text and CSS-only media placeholders;
- framework-free static implementation.

No reference-site editorial copy, photography, logo, or proprietary assets are included.

## Reference acquisition

The Minimalists live site blocks GitHub Actions headless Chromium with Cloudflare.

Factory fallback:

```text
The Minimalists live
→ textual / IA verification

BYLT tru Theme
→ visual paper-pattern baseline

validated capture
→ frozen canonical geometry

local reconstruction
→ automated baseline comparison
```

BYLT publicly identifies `tru` as based on the custom website created for The Minimalists.

Validated baseline:
- `cases/001-theminimalists/TRU_BASELINE_v0.1.json`

Capture / compare:
- `factory/capture/case001-capture.mjs`
- `.github/workflows/case001-capture.yml`

## Acceptance evidence

Final automated comparison run:

```text
RUN_ID = 37310869405
HEAD = 77228b277bff3c76998c32e7817eeca0b6994a38
RESULT = SUCCESS
baselinePass = true
```

### Desktop 1440×900

- content width: 500 / 500
- horizontal overflow: 0
- heading Y deltas: 0 / 0 / 0 / 0 / 0 px
- heading font deltas: 0
- page-height delta: +15 px

### Compact 1024×768

- content width: 500 / 500
- horizontal overflow: 0
- heading Y deltas: 0 / 0 / 0 / 0 / 0 px
- heading font deltas: 0
- page-height delta: +22 px

### Mobile 390×844

- content width: 330 / 330
- horizontal overflow: 0
- heading Y deltas: 0 / 0 / 0 / 0 / -1 px
- heading font deltas: 0
- page-height delta: -34 px

The measurable shell/rhythm baseline is therefore accepted.

## Factory lessons proven by Case 001

1. Build before long analysis.
2. Use synthetic content with comparable density instead of copying source content.
3. Detect anti-bot/challenge pages and reject them as evidence.
4. When a related public theme/demo exists, use it as a secondary structural baseline.
5. Freeze one validated reference capture instead of depending on a changing external page every iteration.
6. Compare local renders automatically against the frozen baseline.
7. Cancel redundant capture runs during rapid commit sequences.
8. USER is not the ordinary fidelity reviewer when the public reference is objectively inspectable.

## Decision

```text
CASE_001_REPRODUCTION_METHOD = PROVEN
WR_RESULT = PASS
READY_FOR_FACTORY_EXTRACTION = YES
READY_FOR_MAIN_INTEGRATION = YES
FORMAL_SITE_REPO = NOT YET CREATED
PAGES_DEPLOYMENT = NOT YET REQUIRED
```
