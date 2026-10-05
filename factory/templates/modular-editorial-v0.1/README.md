# Modular Editorial Starter v0.1

STATUS = MODULAR_EDITOR_v0.1_PASS
DERIVED_FROM = editorial-shell-v0.1 + Case 001 lessons

## Purpose

Turn website reproduction into reusable, editable structure rather than copied HTML.

```text
Site Settings
+ Site Shell
+ Page Recipe
+ Content Modules
+ Content Data
= Rendered Website
```

## Core rule

A reproduced website should leave behind editable grammar.

The same shell can therefore become:
- 500px or 540px wide;
- a journal, portfolio, archive, or hybrid;
- a different home page simply by changing module order;
- a new production site without rewriting the whole HTML document.

## Structure

```text
site/
├─ index.html
├─ start/
│  └─ index.html
├─ archive/
│  └─ index.html
├─ settings-preview/
│  └─ index.html
├─ admin/
│  ├─ index.html
│  ├─ admin.css
│  └─ admin.js
├─ styles.css
├─ runtime.js
└─ config/
   ├─ site.json
   ├─ content/
   │  └─ projects.json
   └─ pages/
      ├─ home.json
      ├─ start.json
      └─ archive.json
```

## Settings precedence

```text
Site default
→ Page override
→ temporary Editor override
```

Example:

```text
site default = 540px
home override = 500px
mobile = 330px
```

## Supported page modules

- promo
- introSplit
- featuredEntry
- entryStream
- richText
- archiveList
- spacer
- pagination

The module registry lives in `runtime.js`.

## Editor

Open:

`site/admin/`

Current Editor capabilities:
- site settings;
- per-page width override/inheritance;
- page selection;
- module add/delete;
- drag reorder;
- module JSON editing;
- content/project editing;
- live preview;
- exact 1440 / 1024 / 390 viewport preview;
- session draft;
- reset;
- JSON bundle import/export.

The Editor does not yet write back to GitHub.

See:
`factory/MODULAR_EDITOR_v0.1.md`

## Production boundary

For routine publishing, a later authenticated persistence layer should commit validated config/content changes to a formal Site Repo.

Do not expose GitHub credentials in static Pages JavaScript.
