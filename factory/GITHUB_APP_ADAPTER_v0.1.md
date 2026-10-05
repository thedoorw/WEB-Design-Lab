# GitHub App Adapter v0.1

STATUS = OFFLINE_AND_BROWSER_INTEGRATION_PASS
DEPLOYMENT = NOT CONFIGURED
REAL_GITHUB_WRITE = NOT YET PROVEN

## Purpose

Provide the real trusted persistence adapter between a static Modular Editor and one formal Site Repo.

Implementation:

`factory/persistence/github-app-worker/`

## Authentication architecture

```text
Pages Editor
→ Admin API /login
→ GitHub App user authorization
→ PKCE-protected callback
→ server-side GitHub token exchange
→ sealed short-lived admin session
→ Pages Editor
→ Bearer sealed session
→ Admin API
```

The browser never receives the raw GitHub user access token.

The returned admin session is encrypted with the server-side `SESSION_SECRET`.

## GitHub App authorization

The adapter implements:

- OAuth web application flow for a GitHub App;
- `state` verification;
- PKCE `code_verifier / code_challenge`;
- optional `repository_id` restriction during token exchange;
- exact allowed admin GitHub login;
- repository-access verification before issuing an admin session.

## Repository commit architecture

```text
validated bundle
→ fixed allow-listed files
→ read branch HEAD
→ verify baseRevision
→ read base tree
→ create new tree
→ create one commit
→ fast-forward branch ref
```

One Editor Save operation therefore produces one multi-file Git commit.

No force update is used.

## Allow-listed files

Current modular starter mapping:

- `site/config/site.json`
- `site/config/content/projects.json`
- `site/config/pages/home.json`
- `site/config/pages/start.json`
- `site/config/pages/archive.json`

Browser-provided arbitrary repository paths are not supported.

## Security controls

- exact `ADMIN_ORIGIN` CORS;
- encrypted admin session;
- one-hour maximum adapter session;
- GitHub token remains inside encrypted session payload;
- server-side client secret only;
- server-side session secret only;
- optional exact `ADMIN_GITHUB_LOGIN`;
- optional single `GITHUB_REPOSITORY_ID`;
- fixed `GITHUB_REPOSITORY`;
- stale HEAD conflict;
- module/schema validation;
- no force push.

## Editor integration

The Editor now supports:

- `Login with GitHub`;
- callback fragment capture;
- encrypted admin session in `sessionStorage`;
- Bearer session on Admin API calls;
- `Save to GitHub` only when authenticated;
- `Logout` by clearing the local sealed session.

## QA

Workflow:

`GitHub App Adapter QA`

Final run:

`37320470570`

Unit artifact:

`11348779979`

Browser artifact:

`11350695612`

Result:

`PASS`

### Offline adapter proof

- allow-listed bundle mapping PASS;
- illegal module/path rejection PASS;
- sealed session PASS;
- PKCE challenge PASS;
- one atomic Git Data commit PASS;
- stale HEAD conflict PASS;
- login URL state + PKCE PASS;
- anonymous status PASS;
- origin guard PASS;
- authenticated Worker commit PASS.

### Browser integration proof

- initial unauthenticated state PASS;
- Login callback session capture PASS;
- URL fragment removed after capture PASS;
- Bearer-authenticated Save PASS;
- Logout clears session PASS;
- page errors = 0;
- modular runtime regression PASS.

## What remains

A real GitHub write requires account-side configuration:

1. register a GitHub App;
2. create/select a dedicated test Site Repo;
3. install the App only on that Repo;
4. grant repository Contents read/write;
5. deploy the serverless adapter;
6. set `GITHUB_APP_CLIENT_SECRET`;
7. set `SESSION_SECRET`;
8. configure callback URL and Admin origin;
9. put the public API base into `admin-config.json`;
10. perform one bounded real commit test.

Do not target `WEB-Design-Lab` for the first write test.
