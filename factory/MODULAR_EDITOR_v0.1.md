# Modular Editor v0.1

STATUS = PASS
IMPLEMENTATION = factory/templates/modular-editorial-v0.1/site/admin/

## Purpose

Provide a browser editor for the modular site data layer before adding authentication or GitHub-write persistence.

The editor changes a draft bundle, not repository files.

```text
repository JSON
→ load into editor
→ edit draft
→ sessionStorage
→ live preview
→ export JSON bundle
```

## Proven controls

### Site settings

- site name;
- tagline;
- default desktop content width;
- mobile content width;
- display type size;
- entry title size;
- page and ink colors.

### Page settings

- page selection;
- page title;
- inherit site width;
- page-specific content-width override.

### Module editing

- add module;
- delete module;
- drag-and-drop reorder;
- button reorder fallback;
- select module;
- edit complete module JSON.

Supported module registry remains:

- promo
- introSplit
- featuredEntry
- entryStream
- richText
- archiveList
- spacer
- pagination

### Content editing

- edit project title;
- kind;
- year;
- media label;
- summary;
- add project;
- delete project.

### Preview

The preview uses the same site runtime as production rendering.

Viewport buttons set the iframe to real widths:

- Desktop = 1440px
- Compact = 1024px
- Mobile = 390px

The preview is not CSS-scaled to fit the editor. If the selected viewport is wider than the workspace, the editor scrolls horizontally.

### Draft handling

- current draft stored in sessionStorage;
- reset to repository source;
- export full JSON bundle;
- import full JSON bundle;
- copy JSON bundle.

## Runtime preview bridge

`runtime.js` now supports:

```text
?preview=admin&page=<page-id>
```

The editor sends in-memory draft bundles with `postMessage`.

Normal site rendering still loads repository JSON files directly.

## Security / persistence boundary

v0.1 intentionally does not:

- authenticate a user;
- hold a GitHub token;
- write to GitHub;
- upload production media;
- deploy Pages;
- alter repository files from the browser.

Therefore this Editor can be safely tested as a static UI without exposing credentials.

## Next persistence layer

Recommended next architecture:

```text
/admin/
→ GitHub sign-in
→ authorized server-side / serverless write boundary
→ validate changed JSON/assets
→ commit to Site Repo
→ GitHub Actions
→ deploy
```

Do not put a personal access token in GitHub Pages JavaScript.

## QA evidence

Workflow:
`Modular Editor QA`

Run:
`37317054754`

Artifact:
`11347414828`

Result:
`PASS`

Verified:
- existing modular-site regression QA = PASS;
- 1440 / 1024 / 390 exact preview widths;
- site default vs page override;
- inherit site width;
- live identity editing;
- live content editing;
- add module;
- drag reorder;
- button reorder;
- module JSON edit;
- page-recipe switch;
- JSON export;
- reset to source;
- page errors = 0;
- module errors = 0;
- boot errors = 0.
