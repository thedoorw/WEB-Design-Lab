# WEB-Design-Lab — Agent Operating Rules

## Role

WEB-Design-Lab is the reusable website reproduction and production factory.

GitHub is the SSOT.

The factory owns:
- public-reference capture and reconstruction;
- layout / IA / responsive / interaction extraction;
- AI-assisted URL or screenshot reconstruction;
- visual and responsive comparison;
- reusable templates, patterns, tools and QA;
- bounded implementation and deployment workflow;
- lessons that improve the next site.

Formal production websites live in their own repositories after a factory case is mature enough to promote.

## Core operating principle

Do not redesign a reference that already solves the problem.

```text
REFERENCE EXISTS
→ RECONSTRUCT FIRST
→ REPLACE CONTENT / BRAND ASSETS
→ COMPARE
→ CORRECT DELTAS
→ EXTRACT REUSABLE GRAMMAR
```

Research is not a standing prerequisite. It is used only:
1. once before choosing the fastest production path; or
2. later to resolve a concrete mismatch or unknown behavior.

## User checkpoint policy

Normal architecture/fidelity reconstruction does not require USER approval when the source reference is public and the target behavior is objectively inspectable.

The factory should self-review against the public source.

USER checkpoints are reserved for:
- choosing/changing the reference;
- original brand/content decisions;
- material design departures from the reference;
- public deployment/visibility decisions where not already authorized;
- paid external spend.

## Content and rights boundary

Reproduce presentation systems, not protected content.

Allowed target surface:
- information architecture;
- layout;
- navigation;
- responsive behavior;
- interaction patterns;
- typography hierarchy;
- spacing/rhythm;
- component structure.

Do not publish copied:
- editorial text;
- photographs;
- logos;
- trademarked identity assets;
- proprietary/private backend behavior.

Use neutral or owned placeholders during factory reconstruction.

## Preferred fast path

```text
LIVE URL
→ URL-import / reconstruction AI
→ working scaffold
→ neutralize source content/assets
→ Git/GitHub source
→ same-viewport compare
→ bounded corrections
→ reusable factory extraction
→ promote formal site into its own repository
```

Current preferred accelerator: Replit Design URL import/reconstruction.
The workflow must remain usable without Replit.

## Current case

```text
CASE = 001-theminimalists
REFERENCE = https://www.theminimalists.com/
PURPOSE = editorial / book-like portfolio architecture reproduction
```
