# WEB Current Work Order

ROLE = WEB Factory / WR
PROGRAM = WEB-Design-Lab
STATUS = PERSISTENT_ADMIN_v0.2_PASS
USER_FIDELITY_GATE_REQUIRED = NO

## Completed chain

```text
Case 001 reproduction
→ editorial starter
→ modular architecture
→ Modular Editor v0.1
→ Persistent Admin v0.2
```

## Persistent Admin v0.2

Implementation:

`factory/templates/modular-editorial-v0.1/site/admin/`

Specification:

`factory/PERSISTENT_ADMIN_v0.2.md`

API contract:

`factory/ADMIN_PERSISTENCE_API_CONTRACT_v0.1.md`

QA:

`factory/PERSISTENT_ADMIN_QA_v0.2.md`

Final automated evidence:

```text
RUN_ID = 37318728940
ARTIFACT_ID = 11349546661
RESULT = PASS
```

## Proven

### Browser persistence

- IndexedDB autosave;
- draft survives browser restart;
- manual revision snapshots;
- revision restore;
- repository-sync state persisted;
- post-commit state clears pending flag.

### Editor

- Site Settings;
- page width inheritance/override;
- 500 / 540 / custom width;
- module add/delete;
- drag reorder;
- content editing;
- true 1440 / 1024 / 390 preview;
- JSON import/export.

### Admin API boundary

- authenticated status contract;
- commit request contract;
- fixed bundle → file allow-list;
- exact HEAD / baseRevision behavior;
- stale revision conflict;
- invalid module/path rejection.

Mock backend validation:

```text
commit flow = PASS
allow-list mapping = PASS
409 stale HEAD = PASS
422 invalid module/path = PASS
```

## Important boundary

The mock backend proves the production contract but does not write GitHub.

Not yet configured:

- real GitHub sign-in;
- GitHub App / OAuth credentials;
- serverless persistence deployment;
- real repository commit;
- public GitHub Pages deployment.

No GitHub secret is stored in browser code.

## Next

Next Factory task:

```text
REAL GITHUB ADAPTER
→ GitHub App / OAuth configuration
→ server-side commit implementation
→ real private test commit
→ deployment pipeline
```

The next step reaches an account/security boundary: a GitHub App or equivalent authenticated backend must be configured before a real repository write can be proven.

Public deployment remains a USER checkpoint and is not authorized by this work order.
