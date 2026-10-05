# Modular Site Architecture v0.1

STATUS = PROVEN
IMPLEMENTATION = factory/templates/modular-editorial-v0.1/

## Definition

A website is no longer treated as one fixed HTML composition.

```text
Site Settings
+ Site Shell
+ Page Recipe
+ Content Modules
+ Content Data
= Website
```

## 1. Site Settings

Global defaults belong in `config/site.json`.

Examples:
- desktop content width;
- mobile content width;
- breakpoint;
- colors;
- typography scale;
- vertical rhythm.

Example:

```json
{
  "contentWidth": 540,
  "mobileWidth": 330
}
```

## 2. Page Settings

A page can override the site default.

Example:

```text
SITE DEFAULT = 540px
HOME OVERRIDE = 500px
START = inherit 540px
ARCHIVE = inherit 540px
```

Precedence:

```text
site default
→ page override
→ temporary preview/editor override
```

## 3. Site Shell

Shared across pages:
- masthead;
- identity;
- primary navigation;
- footer;
- global settings.

The shell is data-driven from `site.json`.

## 4. Page Recipe

Each page JSON declares an ordered module list.

Example:

```json
{
  "modules": [
    {"type":"promo"},
    {"type":"introSplit"},
    {"type":"featuredEntry","projectId":"p001"},
    {"type":"entryStream","projectIds":["p002","p003"]},
    {"type":"pagination"}
  ]
}
```

Changing order changes page composition without rewriting the page shell.

## 5. Content Modules

Current registry:
- `promo`
- `introSplit`
- `featuredEntry`
- `entryStream`
- `richText`
- `archiveList`
- `spacer`
- `pagination`

New modules can be added to the runtime registry without changing existing recipes.

## 6. Content Data

Content is stored separately from layout recipes.

Current proof:
- projects live in `config/content/projects.json`;
- recipes reference content by ID;
- repeated project data is not duplicated inside HTML.

## 7. Runtime

`runtime.js`:
1. loads site settings;
2. loads page recipe;
3. loads content data;
4. applies CSS-variable settings;
5. renders the shared shell;
6. renders modules in recipe order.

Route HTML files are intentionally tiny boot shells.

## 8. Future Admin Boundary

A future `/admin/` should edit:
- Site Settings;
- Page Settings;
- Page Recipe module order;
- Module parameters;
- Content Data.

It should not need to rewrite runtime code for routine content/layout changes.

Prototype:
`site/settings-preview/`

This currently proves live width control:
- 500px;
- 540px;
- other preset widths;
- mobile width;
- display size.

Persistence/authentication are intentionally not included yet.

## Proven QA

GitHub Actions:
`Modular Editorial QA`

Run:
`37315358965`

Result:
`PASS`

Verified:
- page-level width override;
- site default inheritance;
- mobile width inheritance;
- module rendering;
- content references;
- settings-preview live controls;
- zero horizontal overflow;
- zero boot/module errors.

## Factory consequence

Website reproduction now has two outputs:

```text
1. visual/behavioral reproduction
2. reusable modular grammar
```

A successful reproduction is not complete until its useful rules can be expressed as settings, modules, page recipes, or content structures.
