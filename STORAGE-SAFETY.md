# Storage safety and release checklist

This is a storage-only change. Most implementation is in `src/App.jsx`; `src/firebase.js` additionally exposes Firebase Auth. The existing page styling, club login, editing screens, music and game remain. No production database operations, Firebase configuration changes or rules deployments were performed during development.

## Fixed behavior

- Previously, `fbGet` returned `null` both on failure and on missing data. Initialization then wrote dummy seed arrays. The seed data and all automatic initialization writes are removed.
- Initialization now has one source: server-confirmed listeners, with cleanup for remounts. Cache/pending-write snapshots cannot unlock editing. A missing document displays an empty array, never dummy content; the first intentional save may create it. Deleted documents clear the display. Failed/malformed reads surface an error and block database edits; retry resubscribes.
- Every cloud save/delete awaits a transaction commit before success messages or closing a form. Failed drafts remain open. Writes are not performed in React state updater callbacks. A synchronous lock blocks double submission and overlap with backup operations.
- Each form/delete confirmation captures its opening array. Transactions compare that baseline against the latest server array and abort on conflict, including on transaction retry. This deliberately rejects even unrelated changes in the same dataset rather than silently merging potentially stale data. Copy the draft, cancel, then reopen after a conflict. Other document fields are preserved with merge writes.
- A long network wait stays pending: it must not be reported as a failed write if a commit could still succeed. Transactions do not queue offline writes like ordinary `setDoc`. Keep the tab open until confirmation.

## Manual backup and restore

In the existing `admin` portal, expand **Sikkerhetskopi (administrator)**. Sign in separately with a Firebase Email/Password account whose trusted custom claim is `admin: true`. The ordinary shared club password is not enough. Each operation refreshes and checks this claim.

Export performs a read-only transaction over the nine `data` documents, producing a consistent JSON snapshot. Store the downloaded file in at least two safe locations. These are **manual backups**, not an automatic backup service or a guarantee of permanent retention.

Import requires the same project ID, format version, all nine document descriptors, valid field types, unique positive numeric IDs, safe photo/map URL schemes and bounded sizes. It previews record counts, warns about replacement, requires downloading the pre-import snapshot and typing `GJENOPPRETT`. Verify the safety file actually arrived; browsers cannot confirm that it was saved to disk. One transaction checks the entire preview baseline again before writing any documents. Any intervening change aborts the whole import. Explicitly empty arrays replace content; missing documents in a backup are skipped, never deleted. Unknown fields/types are rejected, not silently discarded.

Scope: nine club datasets plus inline image data. External image URLs are included but their remote files are not copied. Existing music (`tf_tracks`) and game scores remain local to the browser and are **not included**. This PR does not migrate media to Cloud Storage. Existing documents above the new conservative 800 kB write limit can still be read/exported; reduce inline images before restoring or saving them. Backup import limit is 8 MB. Do not edit a backup casually; keep an untouched original.

## Security and manual Firebase steps — do not deploy rules yet

The hardcoded club credentials are public client code, **not authorization**. The new Firebase claim check restricts the backup UI, but only Firestore rules can prevent bypassing the UI. This PR preserves current normal editing access. It does not claim to secure an openly writable database, inspect current rules, or validate existing production access. Old deployed clients can still make unsafe writes until retired.

Before enabling backup in the production UI, the project owner must:

1. Verify project `fiskeklubb-588ed`, the `(default)` Firestore database, edition/location, current rules, and all member/admin access requirements in the Firebase console. The current code uses Firestore's existing Core Web API; no database/edition migration is proposed.
2. In Authentication, enable Email/Password if needed, create a named administrator account, and confirm the deployed domain is authorized. Do not use the shared client password as this account's password.
3. Use a trusted Admin SDK environment to assign that user's `admin: true` custom claim, preserving any existing claims. Custom claims cannot be safely set by the browser or by editing a user profile document. Never commit a service-account key. Sign in again/refresh the token and verify backup access in a staging environment.
4. Confirm an independently stored backup and test restoration into a separate disposable staging project with fixtures, never real production data for testing.

Separate, reviewed security migration (requires access confirmation first): replace the shared member login with Firebase Auth for every member; define member/editor/admin permissions; test unauthenticated denial, member reads, intended editor writes, admin restore, revoked accounts and expired sessions in the Firestore emulator. Rules should allow only the nine known document IDs, validate `items` and allowed changed fields, and deny client deletion/unknown paths. Decide whether member data is private before choosing public vs authenticated reads. Because normal edits and restore currently write the same documents, rules cannot distinguish a restore button from arbitrary authorized whole-array edits; stronger per-record permissions need a later data-model/backend change. Do not simply deploy admin-only rules while ordinary users still rely on the old login: that would lock them out. No rule file or deploy configuration is added by this PR.

## Costs and retention

Firestore charges depend on location/edition and operation/storage/network usage. Listeners consume reads; edits add transaction reads plus writes, with additional reads on retries. Export reads nine documents, preview reads nine, and restore reads nine plus writes the present documents. Empty/missing-document reads can still be billed. Large inline images amplify transfers. There is no external automatic backup service configured here.

Firebase managed scheduled backups and point-in-time recovery require billing and have storage/restore charges; they are not included in the free usage allowance. Ask the owner to choose a retention schedule and budget alerts before enabling them. No finite backup retention policy means "saved forever". Keep independent exports and periodically test recovery.

References: [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [listener metadata](https://firebase.google.com/docs/firestore/query-data/listen), [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [Firestore pricing](https://firebase.google.com/docs/firestore/pricing).

## Validation and release

Run `npm ci`, `npm test`, and `npm run build`. Regression tests execute the actual storage helpers with a deterministic, network-free transaction mock and exercise the actual news save handler. They cover missing/error reads, cache/pending snapshots, deletion, permission/offline failure, concurrent edit/retry, atomic import, malformed backups and admin claims. They are not emulator or live production integration tests.

Before merging, perform staging browser checks on desktop/mobile: all existing pages and dialogs, failed save with visible error, two-tab conflicts (including a dialog left open), empty initial database with zero automatic writes, reload persistence, double-click save, logout, export/preview/cancel/restore and Firebase admin revocation. Confirm deployed rules permit intended transactions. No production writes should be used for this test.

Build currently emits Vite's CJS and bundle-size warnings; dependency installation reports 14 existing dependency advisories (7 moderate, 7 high). Dependency upgrades are outside this storage-only change and should be handled separately.

**Merging into `main` triggers the repository's existing GitHub Pages deploy workflow.** Keep this PR unmerged until storage behavior, access and the deployment itself are reviewed and authorized. No deploy workflow was triggered by this branch.
