# WEB-Design-Lab

AI-assisted web design, reproduction, capture, comparison, QA, and deployment workflow lab.

## Purpose

This repository is the reusable Web factory.

It stores:
- reconstruction methods;
- AI workflows;
- capture/compare/QA rules;
- reusable layout/component knowledge;
- templates and tooling;
- experimental reproduction cases.

Formal websites should eventually live in their own repositories with their own code, content, assets and deployment lifecycle.

## Current operating model

```text
PUBLIC REFERENCE
→ reconstruct first
→ replace content / protected assets
→ compare automatically against source
→ correct observed deltas
→ extract reusable grammar
→ promote mature site to its own repository
```

Research is not a recurring prerequisite.

## Current case

```text
CASE 001 = The Minimalists
REFERENCE = https://www.theminimalists.com/
TARGET = editorial / book-like portfolio architecture
STATUS = STARTED
```

Current Work Order:
- `ACTIVE/WEB_CURRENT_WORK_ORDER.md`

Fast-path research:
- `research/WEB_REPRODUCTION_FAST_PATH_RESEARCH_v0.1.md`

Factory workflow:
- `factory/WEB_REPRODUCTION_WORKFLOW_v0.1.md`

## Repository structure

```text
/
├─ 我說.md
├─ AGENTS.md
├─ ACTIVE/
├─ research/
├─ factory/
└─ cases/
```

## Migration from INK

Reusable Web-method material is being moved from `thedoorw/INK-Browser-QA` into this repository.

INK-specific product governance and Creative Reproduction Benchmark material remain in INK.
