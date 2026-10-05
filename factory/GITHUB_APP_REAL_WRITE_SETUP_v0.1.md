# GitHub App Real-Write Setup Checklist v0.1

This checklist is intentionally separate from code implementation because it changes external account/security configuration.

## 1. Test Site Repo

Use a dedicated Site Repo for the first real commit.

Do not point the first write test at:
- `WEB-Design-Lab`;
- INK repositories;
- an existing production site.

The test Repo can later become the formal Site Repo only if the user chooses that explicitly.

## 2. Register GitHub App

Recommended purpose:
`WEB Design Lab Site Admin`

Repository permission required:
- Contents: Read and write

Install scope:
- Only select repositories
- select only the dedicated Site Repo

## 3. Callback

The deployed adapter callback must be registered as a GitHub App callback URL:

```text
https://<adapter-host>/api/admin/callback
```

The adapter uses the GitHub App web authorization flow and PKCE.

## 4. Server environment

Public values:

```text
ADMIN_ORIGIN
PUBLIC_BASE_URL
GITHUB_CALLBACK_URL
GITHUB_REPOSITORY
GITHUB_REPOSITORY_ID
GITHUB_BRANCH
GITHUB_APP_CLIENT_ID
ADMIN_GITHUB_LOGIN
SITE_ID
```

Secrets:

```text
GITHUB_APP_CLIENT_SECRET
SESSION_SECRET
```

Generate `SESSION_SECRET` as a high-entropy random secret.

Never commit either secret.

## 5. Editor public config

After the adapter exists, set:

`site/admin/admin-config.json`

```json
{
  "siteId": "modular-editorial-v0.1",
  "persistence": {
    "apiBase": "https://<adapter-host>/api/admin",
    "repository": "OWNER/SITE-REPO",
    "branch": "main"
  }
}
```

These values are public configuration, not credentials.

## 6. Real proof

Perform a bounded edit such as:

```text
site name
FIELD NOTES
→ FIELD NOTES QA
```

Expected:

1. Login with GitHub.
2. Admin API reports authenticated user.
3. Editor reads exact current HEAD.
4. Save produces one commit.
5. Only five allow-listed JSON files can change.
6. GitHub returns exact commit SHA.
7. Reload reads the committed state.
8. Reusing the old base revision returns conflict.

After proof, revert the QA text through the same Editor.

## Stop condition

Do not enable public GitHub Pages deployment as part of the write proof unless USER separately authorizes public deployment.
