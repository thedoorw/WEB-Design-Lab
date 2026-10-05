# WEB Current Work Order

ROLE = WEB Factory / WR
PROGRAM = WEB-Design-Lab
STATUS = GITHUB_APP_ADAPTER_v0.1_READY_FOR_ACCOUNT_SETUP
USER_FIDELITY_GATE_REQUIRED = NO

## Completed chain

```text
Case 001 reproduction
→ editorial starter
→ modular architecture
→ Modular Editor v0.1
→ Persistent Admin v0.2
→ GitHub App Adapter v0.1
```

## Persistent Admin

Browser persistence is proven:
- IndexedDB autosave;
- browser restart restore;
- revision snapshots;
- revision restore;
- pending/synchronized state.

## GitHub App Adapter v0.1

Implementation:

`factory/persistence/github-app-worker/`

Specification:

`factory/GITHUB_APP_ADAPTER_v0.1.md`

Setup checklist:

`factory/GITHUB_APP_REAL_WRITE_SETUP_v0.1.md`

QA:

`factory/GITHUB_APP_ADAPTER_QA_v0.1.md`

Final automated run:

```text
RUN_ID = 37320470570
UNIT_ARTIFACT = 11348779979
BROWSER_ARTIFACT = 11350695612
RESULT = PASS
```

## Proven adapter behavior

- GitHub App authorization URL;
- state validation architecture;
- PKCE;
- sealed short-lived admin session;
- Browser receives no raw GitHub token;
- exact Admin origin guard;
- login/session capture in Editor;
- Bearer Admin API calls;
- logout;
- fixed bundle → file mapping;
- single atomic Git tree commit;
- stale HEAD conflict;
- invalid module/path rejection;
- no force branch update.

## Not yet claimed

```text
REAL_GITHUB_APP_REGISTERED = NO
REAL_GITHUB_SECRET_CONFIGURED = NO
SERVERLESS_ADAPTER_DEPLOYED = NO
REAL_SITE_REPO_COMMIT = NO
GITHUB_PAGES_PUBLIC_DEPLOYMENT = NO
```

## Current checkpoint

The next step crosses from Factory code into external account/security configuration.

Required USER-side choices/actions:

1. choose/create a dedicated test Site Repo;
2. register the GitHub App;
3. install it only on that Repo;
4. provide/configure the resulting Client ID / Client Secret on the serverless host;
5. authorize deployment of the Admin API backend.

Do not use `WEB-Design-Lab` as the first real-write target.

Public site deployment remains a separate USER checkpoint.
