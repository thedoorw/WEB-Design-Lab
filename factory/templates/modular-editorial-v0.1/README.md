# Modular Editorial Starter v0.1

STATUS = ACTIVE DEVELOPMENT
DERIVED_FROM = editorial-shell-v0.1 + Case 001 lessons

## Purpose

Turn website reproduction into reusable structure rather than copied HTML.

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
→ temporary preview override
```

Example:

```json
site.json
{ "contentWidth": 540 }

home.json
{ "settings": { "contentWidth": 500 } }
```

The home page renders at 500px while other pages remain 540px.

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

## Admin direction

The JSON files are the content/config boundary for a future `/admin/` editor.

A later editor can update these data objects without rewriting page HTML.
