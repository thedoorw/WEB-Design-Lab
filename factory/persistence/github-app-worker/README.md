# GitHub App Admin Adapter v0.1

STATUS = IMPLEMENTED / NOT DEPLOYED

This directory contains the real server-side adapter intended to sit between the static Modular Editor and a formal Site Repo.

## Architecture

```text
GitHub Pages Editor
→ /api/admin/login
→ GitHub App authorization + PKCE
→ /api/admin/callback
→ encrypted short-lived admin session
→ /api/admin/status
→ /api/admin/commit
→ GitHub Git Data API
→ one atomic multi-file commit
```

## Why the browser does not receive the GitHub token

The GitHub user access token is sealed inside a server-encrypted session value.

The browser only receives the encrypted admin-session token. It cannot extract the GitHub credential without the server-side `SESSION_SECRET`.

## Required GitHub App permissions

Repository:
- Contents: Read and write

The App should be installed only on the intended Site Repo.

The token exchange can additionally use `GITHUB_REPOSITORY_ID` to constrain the user access token to that repository.

## Required environment

Public configuration:
- `ADMIN_ORIGIN`
- `PUBLIC_BASE_URL`
- `GITHUB_CALLBACK_URL`
- `GITHUB_REPOSITORY`
- `GITHUB_REPOSITORY_ID`
- `GITHUB_BRANCH`
- `GITHUB_APP_CLIENT_ID`
- `ADMIN_GITHUB_LOGIN`
- `SITE_ID`

Secrets:
- `GITHUB_APP_CLIENT_SECRET`
- `SESSION_SECRET`

Never commit the two secret values.

## Session model

- OAuth state + PKCE verifier are stored in a sealed HttpOnly short-lived flow cookie.
- Callback exchanges the GitHub code server-side.
- A sealed admin session is returned in the URL fragment.
- The Pages Editor stores only that sealed session and sends it as a Bearer token to the Admin API.
- The GitHub user token remains encrypted inside the session.

## Commit model

The adapter:
1. reads current branch HEAD;
2. rejects stale `baseRevision`;
3. reads the current commit/tree;
4. creates one new tree containing all allowed JSON updates;
5. creates one commit;
6. fast-forwards the branch ref without force.

The browser cannot choose arbitrary file paths. `bundle.js` owns the mapping.

## Current boundary

The adapter code and offline tests can be completed in WEB-Design-Lab.

A real end-to-end commit requires:
1. register the GitHub App;
2. install it on a test Site Repo;
3. configure callback/origin;
4. set the two server-side secrets;
5. deploy the serverless adapter.

Those are account-side actions and are not performed automatically.
