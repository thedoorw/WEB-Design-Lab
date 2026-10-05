# Case 001 Status

```text
CASE = 001-theminimalists
BRANCH = work/case-001-theminimalists
REFERENCE = https://www.theminimalists.com/
PHASE = FIRST_SCAFFOLD_RENDERED
SOURCE_QA = PASS
SYNTHETIC_CONTENT = PASS
LOCAL_RENDER_CAPTURE = PASS
RESPONSIVE_STRUCTURE = PASS_WITH_REVISION
REFERENCE_HEADLESS_CAPTURE = BLOCKED_BY_CLOUDFLARE
USER_FIDELITY_GATE = NOT REQUIRED
```

## Implemented

- homepage editorial stream;
- detail/article page;
- Start-style long-form page;
- Resources-style repeated resource page;
- Archives/index page;
- shared header/navigation/footer;
- mobile navigation toggle;
- synthetic text and CSS-only media placeholders;
- framework-free static implementation.

## Source QA

Relative stylesheet/script paths and internal route relationships were checked across the five page types.

No reference-site editorial copy, photography, logo, or proprietary assets are included.

## Render / capture evidence

GitHub Actions workflow:
`.github/workflows/case001-capture.yml`

Reusable capture probe:
`factory/capture/case001-capture.mjs`

Run 1 successfully:
- rendered the local reconstruction at 1440×900, 1024×768 and 390×844;
- produced screenshots and DOM geometry metrics;
- found no local horizontal overflow;
- exposed insufficient mobile reading margins, then corrected them;
- attempted the same reference captures.

Reference capture result:
- The Minimalists returned Cloudflare security verification to GitHub Actions Chromium;
- these challenge screenshots are explicitly invalid as fidelity evidence;
- the capture probe now detects this condition as `BLOCKED_REFERENCE_CAPTURE` so it cannot be mistaken for a valid comparison.

## Factory lesson added by Case 001

```text
TARGET HAS ANTI-BOT
→ HEADLESS CLOUD CAPTURE MAY BE INVALID
→ DETECT CHALLENGE
→ SWITCH REFERENCE-ACQUISITION PATH
→ DO NOT CLAIM VISUAL PASS FROM CHALLENGE PAGE
```

## Next gate

```text
ALTERNATE_REFERENCE_VISUAL_ACQUISITION
→ same-viewport visual comparison
→ correct observed deltas
→ WR_PASS
```

Do not merge the scaffold to main before reference visual comparison is valid.
