# Persistent Admin v0.2

STATUS = PASS
IMPLEMENTATION = factory/templates/modular-editorial-v0.1/site/admin/

## Purpose

Extend Modular Editor v0.1 from a session-only editor into a persistent browser-admin model with a secure repository-write boundary.

The browser still does not hold GitHub credentials.

## Architecture

```text
Repository source JSON
→ Editor draft
→ IndexedDB persistent draft
→ version snapshots
→ live preview
→ authenticated Admin API
→ validated bundle mapping
→ GitHub commit
```

The final GitHub step is currently represented by a validated mock backend. Real GitHub authentication / serverless deployment is not yet configured.

## Local persistence

Implementation:

`site/admin/draft-store.js`

IndexedDB stores:

- site ID;
- draft schema version;
- update timestamp;
- SHA-256 bundle fingerprint;
- full modular bundle;
- repository-sync metadata.

Drafts survive:

- reload;
- tab close;
- complete browser-context restart.

## Revision snapshots

The Editor supports manual snapshots.

Each revision stores:

- timestamp;
- label;
- bundle fingerprint;
- complete bundle.

Current policy keeps the latest 20 revisions.

The Editor can restore a revision back into the active draft.

## Sync state

The Editor explicitly reports:

```text
local changes pending
```

or:

```text
no local changes pending
```

A successful repository commit clears the pending state and persists that state locally.

## Admin API client

Implementation:

`site/admin/admin-api.js`

Configuration:

`site/admin/admin-config.json`

The API base is blank by default.

A query override may be used for testing:

```text
/admin/?apiBase=https://example-worker/api/admin
```

The browser API client supports:

- `GET /status`
- `POST /commit`

It uses cookies / server-managed auth state with `credentials: include`.

It does not accept or store a GitHub token.

## Repository write boundary

Contract:

`factory/ADMIN_PERSISTENCE_API_CONTRACT_v0.1.md`

The browser sends one logical bundle.

The backend must:

- authenticate;
- authorize one configured Site Repo;
- validate schema;
- reject unknown module types;
- map bundle sections to allow-listed files;
- reject stale base revision;
- create the repository commit;
- return exact commit SHA.

The browser cannot provide arbitrary repository paths.

## Proven mock commit mapping

```text
bundle.site
→ site/config/site.json

bundle.content.projects
→ site/config/content/projects.json

bundle.pages.home
→ site/config/pages/home.json

bundle.pages.start
→ site/config/pages/start.json

bundle.pages.archive
→ site/config/pages/archive.json
```

## Security boundary

Static Pages must never contain:

- GitHub personal access token;
- OAuth client secret;
- GitHub App private key;
- server signing secret.

Those belong only in the trusted persistence service.

## QA

Workflow:

`Persistent Admin QA`

Final run:

`37318728940`

Artifact:

`11349546661`

Result:

`PASS`

Verified:

- modular-site regression PASS;
- IndexedDB autosave;
- snapshot creation;
- snapshot restore;
- persistence across browser restart;
- local pending-sync restoration;
- authenticated API status;
- mock repository commit;
- exact commit-head update;
- post-commit synchronized local state;
- allow-listed file mapping;
- stale HEAD conflict → HTTP 409;
- invalid module/path attempt → HTTP 422;
- browser page errors = 0.

## Not yet complete

The following are deliberately not claimed:

- real GitHub login;
- real GitHub App installation;
- real repository commit;
- serverless deployment;
- GitHub Pages deployment;
- production media upload.

Those require the real persistence adapter and account-side credentials/configuration.
