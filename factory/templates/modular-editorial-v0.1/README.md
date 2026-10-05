# Modular Editorial Starter v0.1

STATUS = PERSISTENT_ADMIN_v0.2_PASS
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
│  ├─ admin.js
│  ├─ draft-store.js
│  ├─ admin-api.js
│  └─ admin-config.json
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

Current proof:

```text
site default = 540px
home override = 500px
mobile = 330px
```

## Supported modules

- promo
- introSplit
- featuredEntry
- entryStream
- richText
- archiveList
- spacer
- pagination

## Admin

Open:

`site/admin/`

Current capabilities:

- site settings;
- per-page width inheritance/override;
- module add/delete;
- drag reorder;
- module JSON editing;
- project/content editing;
- exact 1440 / 1024 / 390 preview;
- IndexedDB persistent draft;
- revision snapshots + restore;
- JSON bundle import/export;
- repository sync-state display;
- authenticated Admin API client boundary;
- Save-to-GitHub control enabled only when the Admin API reports an authenticated session.

## Persistence

Local persistence is real and proven.

Repository persistence is separated behind:

`factory/ADMIN_PERSISTENCE_API_CONTRACT_v0.1.md`

The included mock backend proves validation, conflict detection and allow-listed bundle-to-file mapping.

It does not claim a real GitHub commit.

See:

- `factory/MODULAR_EDITOR_v0.1.md`
- `factory/PERSISTENT_ADMIN_v0.2.md`
- `factory/PERSISTENT_ADMIN_QA_v0.2.md`

## Security

Never expose GitHub PATs, OAuth secrets or GitHub App private keys in static Pages JavaScript.

The trusted persistence service owns repository credentials and commit operations.
