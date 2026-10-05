# Web Reproduction Fast-Path Research v0.1

DATE = 2026-10-05
STATUS = COMPLETE
PURPOSE = choose the fastest practical architecture-reproduction path before Case 001 implementation

## Question

What is the most direct current method to reproduce a public website's architecture, responsive behavior and interaction model without first performing a long manual design study?

## Current tool findings

### Replit Design — preferred accelerator

Official Replit Design currently exposes:
- Import URL;
- Recreate screenshot;
- Import Figma;
- design-system starting points.

Replit's version-control tooling supports Git and GitHub connectivity, including importing, modifying and pushing code between Replit and GitHub.

Factory interpretation:

```text
public URL
→ Replit Design import/reconstruction
→ editable/runnable first scaffold
→ replace protected content/assets
→ connect/push source to GitHub
→ factory compare/correct loop
```

Why preferred:
- begins directly from the existing website rather than a prose description;
- produces a working/testable web artifact;
- keeps a route back to GitHub-owned source;
- suitable for iterative correction rather than redesign.

Official references:
- https://replit.com/design
- https://docs.replit.com/replit-workspace/workspace-features/version-control

### Framer Agents — strong reconstruction, secondary route

Framer Agents explicitly support migration/reconstruction from a live website and can rebuild pages, structure and visual style.

Strength:
- highly direct native visual reconstruction;
- editable pages/components/responsive behavior.

Tradeoff for this factory:
- production source and deployment naturally remain Framer-centered;
- therefore less direct when the desired canonical artifact is a GitHub-hosted code repository.

Official reference:
- https://www.framer.com/agents/

### 10Web Clone Agent — fastest literal clone, not production baseline

10Web currently supports cloning from a public URL.

Officially documented limits:
- page-level rather than full-site;
- approximately 70% stated accuracy;
- WordPress-oriented output.

Use only as an optional comparison/prototyping aid, not as the canonical factory architecture.

Official reference:
- https://10web.io/product-release/clone-agent/

## Decision

The factory adopts an implementation-first workflow.

```text
NO LONG PRE-RESEARCH PHASE

LIVE PUBLIC REFERENCE
→ FAST RECONSTRUCTION
→ OWN/NEUTRAL CONTENT
→ GITHUB
→ SAME-VIEWPORT COMPARISON
→ FIX ONLY OBSERVED DELTAS
→ EXTRACT REUSABLE RULES
```

Primary accelerator:
```text
Replit Design URL import/reconstruction
```

Fallback:
```text
direct browser observation/capture
→ AI-generated independent implementation
→ compare/correct
```

## Review model

The user is not the normal fidelity reviewer.

Reference fidelity is reviewed by:
- the public source;
- same-viewport screenshots;
- measurable layout/responsive differences;
- link/navigation/interaction checks.

USER intervention is required only for subjective/original choices, not for whether the reconstruction matches the chosen source.

## Factory consequence

The first case is an engineering/reproduction exercise, not a new design exercise.

The source website is treated like an existing garment pattern:
- preserve the useful construction;
- adapt content and identity;
- adjust only where the target content/body differs;
- do not redesign merely because reconstruction is being performed.
