# Reference Baseline Protocol v0.1

## Purpose

Make website reproduction fast and repeatable without depending on a live third-party page during every correction cycle.

## Canonical loop

```text
LIVE REFERENCE
→ capture once successfully
→ verify capture validity
→ freeze geometry baseline
→ reconstruct with neutral/owned content
→ capture local
→ compare local to frozen baseline
→ correct measured deltas
→ PASS
```

## Why freeze a baseline

External websites can change or fail during automated capture because of:
- anti-bot / Cloudflare;
- CDN or asset failures;
- lazy loading;
- A/B tests;
- temporary third-party failures;
- responsive or script instability.

A new external capture must therefore never silently replace a previously validated baseline.

## Reference capture validity

Reject a reference capture when any of the following is observed:
- challenge / security-verification page;
- unexpected horizontal overflow;
- implausible page-height change;
- missing primary images or stylesheet;
- layout materially inconsistent with previously validated evidence;
- navigation or content surface clearly not the intended site.

Rejected state:

```text
INVALID_REFERENCE_CAPTURE
→ preserve last validated baseline
→ do not correct local output against invalid evidence
```

## Baseline contents

Store only geometry needed for reliable reproduction, for example:
- viewport;
- content width;
- key X/Y positions;
- heading/font metrics;
- nav geometry;
- representative media geometry;
- page height as a non-critical diagnostic;
- tolerance values;
- provenance: source, capture run, commit, date.

Do not store protected reference content merely to create the baseline.

## Routine QA

Routine revisions should render the local site only.

Compare:
- content width;
- key vertical rhythm;
- typography sizes;
- horizontal overflow;
- breakpoint transformation.

External recapture is optional evidence refresh, not a prerequisite for each commit.

## Refreshing a baseline

Refresh only when:
- the user intentionally chooses a newer reference state;
- the target site materially changes;
- existing evidence is proven wrong;
- a new viewport or interaction must be modeled.

A refresh requires a valid capture and must preserve provenance.

## Case 001 proof

Case:
`001-theminimalists`

The live reference blocked cloud-headless capture, while the related BYLT `tru` demo supplied a valid public structural baseline.

A validated `tru` capture was frozen, and subsequent local renders were automatically compared against it.

Final Case 001 result:
`baselinePass = true`
