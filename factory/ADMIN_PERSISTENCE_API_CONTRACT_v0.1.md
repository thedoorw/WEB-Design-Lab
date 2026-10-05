# Admin Persistence API Contract v0.1

## Purpose

Keep GitHub credentials and repository mutation out of static GitHub Pages JavaScript.

The browser Editor sends a validated site bundle to a trusted backend. The backend owns authentication, authorization, file-path mapping and the GitHub commit.

## Browser responsibilities

The Editor may send:

```json
{
  "siteId": "modular-editorial-v0.1",
  "message": "Update site content",
  "baseRevision": "optional-source-commit",
  "bundle": {
    "site": {},
    "pages": {},
    "content": {}
  }
}
```

The Editor must not send:
- a GitHub token;
- a GitHub App private key;
- arbitrary repository file paths;
- arbitrary repository names;
- workflow/deployment credentials.

## Backend responsibilities

The backend must:
1. authenticate the user;
2. authorize access to one configured Site Repo;
3. validate the bundle schema;
4. reject unknown module types;
5. convert the bundle to an allow-listed set of repository files;
6. reject path traversal / arbitrary paths;
7. detect stale `baseRevision` when supported;
8. commit with server-held credentials;
9. return the exact commit SHA and changed-file list.

## Endpoints

### GET /status

Example response:

```json
{
  "ok": true,
  "authenticated": true,
  "user": {"login": "example"},
  "repository": "owner/site-repo",
  "branch": "main",
  "head": "abc123"
}
```

### POST /commit

Request:

```json
{
  "siteId": "my-site",
  "message": "Update home page",
  "baseRevision": "abc123",
  "bundle": {}
}
```

Success:

```json
{
  "ok": true,
  "commitSha": "def456",
  "branch": "main",
  "changedFiles": [
    "site/config/site.json",
    "site/config/pages/home.json"
  ]
}
```

Conflict:

HTTP `409`

```json
{
  "ok": false,
  "error": "BASE_REVISION_CONFLICT",
  "currentHead": "xyz999"
}
```

Unauthenticated:

HTTP `401`

## Canonical bundle → file mapping

The server decides the mapping.

For this starter:

```text
bundle.site
→ site/config/site.json

bundle.pages.home
→ site/config/pages/home.json

bundle.pages.start
→ site/config/pages/start.json

bundle.pages.archive
→ site/config/pages/archive.json

bundle.content.projects
→ site/config/content/projects.json
```

The browser cannot replace this mapping with arbitrary paths.

## Security rule

Never embed GitHub PATs, OAuth secrets or GitHub App private keys in GitHub Pages, client-side JavaScript, JSON config files or committed source.
