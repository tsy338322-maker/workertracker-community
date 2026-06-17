# Production Storage Audit

Date: 2026-06-17

## Summary

- No business data is persisted through browser `localStorage`.
- No business data is persisted through browser `sessionStorage`.
- No JSON file is used as the application database or as a writable production datastore.
- CRUD state writes go through `server.js` and `database.js`, with durable storage in SQLite.
- `auth_users` authentication uses SQLite user records, bcrypt password hashes, and JWT cookies/tokens.
- No production data migration was required.

## Scope

Searched the repository, excluding `.git`, `node_modules`, and generated Android build output directories that are not application source:

- `localStorage`
- `sessionStorage`
- `JSON.parse`
- `JSON.stringify`
- `fs.writeFile`
- `fs.writeFileSync`
- `*.json` files

Android source assets under `android/app/src/main/assets` were included.

## Findings By Requirement

1. Browser `localStorage`: no literal `localStorage` occurrences found.
2. Browser `sessionStorage`: only `removeItem` calls are present, used to clear selected superadmin context.
3. JSON files as datastore: no JSON file is read or written as a database. JSON files present are package and Capacitor configuration manifests.
4. CRUD operations: `/api/state` in `server.js` reads with `db.getState()` and writes with `db.saveState(newState)`. SQLite writes are implemented in `database.js`.
5. Authentication: login and registration use `auth_users` via `database.js`, bcrypt password hashing, and JWT issuance/verification in `server.js`.

## Occurrence Classification

### Browser Storage

| Occurrence | Classification | Notes |
| --- | --- | --- |
| `app.js:524` `sessionStorage.removeItem(SUPERADMIN_SELECTED_USER_CONTEXT_KEY)` | UI cache only | Clears selected-user UI context; does not persist business data. |
| `app.js:543` `sessionStorage.removeItem(SUPERADMIN_SELECTED_USER_CONTEXT_KEY)` | UI cache only | Clears selected-user UI context; does not persist business data. |
| `www/app.js:524` `sessionStorage.removeItem(SUPERADMIN_SELECTED_USER_CONTEXT_KEY)` | UI cache only | Built web asset copy of the same UI cleanup behavior. |
| `www/app.js:543` `sessionStorage.removeItem(SUPERADMIN_SELECTED_USER_CONTEXT_KEY)` | UI cache only | Built web asset copy of the same UI cleanup behavior. |

### Client JSON Helpers And API Payloads

| Occurrence | Classification | Notes |
| --- | --- | --- |
| `app.js:477` `JSON.parse(raw)` | UI cache only | Generic stored-UI-context helper; no `localStorage` or `sessionStorage` write call found. |
| `app.js:486` `storage?.setItem(key, JSON.stringify(value))` | UI cache only | Generic UI-context helper; no business-data caller found. |
| `app.js:493` `JSON.parse(JSON.stringify(value))` | UI cache only | Deep clone helper, not persistence. |
| `app.js:1934` `JSON.stringify(normalizeComparableState(input))` | UI cache only | Comparison/hash helper, not persistence. |
| `app.js:1980` request `body: JSON.stringify(...)` | UI cache only | API transport to `/api/state`; persistence occurs server-side in SQLite. |
| `app.js:2055` `JSON.stringify(getEffectivePermissions())` | UI cache only | Permission comparison, not persistence. |
| `app.js:2060` `JSON.stringify(getEffectivePermissions())` | UI cache only | Permission comparison, not persistence. |
| `app.js:5841` `JSON.parse(JSON.stringify(templates || {}))` | UI cache only | Deep clone helper, not persistence. |
| `www/app.js:477` `JSON.parse(raw)` | UI cache only | Built web asset copy of UI-context helper. |
| `www/app.js:486` `storage?.setItem(key, JSON.stringify(value))` | UI cache only | Built web asset copy of UI-context helper. |
| `www/app.js:493` `JSON.parse(JSON.stringify(value))` | UI cache only | Built web asset copy of clone helper. |
| `www/app.js:1934` `JSON.stringify(normalizeComparableState(input))` | UI cache only | Built web asset copy of comparison helper. |
| `www/app.js:1980` request `body: JSON.stringify(...)` | UI cache only | Built web asset copy of API transport. |
| `www/app.js:2055` `JSON.stringify(getEffectivePermissions())` | UI cache only | Built web asset copy of permission comparison. |
| `www/app.js:2060` `JSON.stringify(getEffectivePermissions())` | UI cache only | Built web asset copy of permission comparison. |
| `www/app.js:5841` `JSON.parse(JSON.stringify(templates || {}))` | UI cache only | Built web asset copy of clone helper. |
| `android/app/src/main/assets/public/app.js:1506` request `body: JSON.stringify(...)` | UI cache only | Android web asset API transport; persistence occurs server-side in SQLite. |
| `android/app/src/main/assets/public/app.js:1572` `JSON.stringify(getEffectivePermissions())` | UI cache only | Android web asset permission comparison. |
| `android/app/src/main/assets/public/app.js:1577` `JSON.stringify(getEffectivePermissions())` | UI cache only | Android web asset permission comparison. |
| `android/app/src/main/assets/public/app.js:5150` `new Blob([JSON.stringify(payload, null, 2)])` | UI cache only | User-initiated JSON export/download; not an application datastore. |

### Auth/API JSON Payloads

| Occurrence | Classification | Notes |
| --- | --- | --- |
| `auth.js:25` request `JSON.stringify({ registeredId: email, password })` | UI cache only | Login API transport only. |
| `auth.js:38` request `JSON.stringify({ registeredId: email, password })` | UI cache only | Registration API transport only. |
| `auth.js:50` request `JSON.stringify({ displayName })` | UI cache only | Profile API transport only. |
| `auth.js:125` request `JSON.stringify(payload || {})` | UI cache only | API transport only. |
| `auth.js:162` request `JSON.stringify(user)` | UI cache only | Admin user API transport only. |
| `auth.js:170` request `JSON.stringify(user)` | UI cache only | Admin user API transport only. |
| `auth.js:178` request `JSON.stringify({ status })` | UI cache only | Admin status API transport only. |
| `auth.js:186` request `JSON.stringify({ password })` | UI cache only | Admin password reset API transport only. |
| `auth.js:194` request `JSON.stringify({ permissions, role })` | UI cache only | Admin permission API transport only; server persists through SQLite. |
| `auth.js:207` request `JSON.stringify({ moduleActions: moduleActions || {} })` | UI cache only | Role-template API transport only; server persists through SQLite. |
| `auth.js:250` request `JSON.stringify(patch || {})` | UI cache only | Module API transport only. |
| `auth.js:263` request `JSON.stringify(module || {})` | UI cache only | Module API transport only. |
| `auth.js:271` request `JSON.stringify(module || {})` | UI cache only | Module API transport only. |
| `www/auth.js:25` through `www/auth.js:271` | UI cache only | Built web asset copy of the same API transport calls. |
| `android/app/src/main/assets/public/auth.js:23` through `android/app/src/main/assets/public/auth.js:249` | UI cache only | Android web asset copy of API transport calls. |

### SQLite Persistence And Server Serialization

| Occurrence | Classification | Notes |
| --- | --- | --- |
| `database.js:305` `JSON.parse(row.data)` | Production data persistence | Reads legacy `state.data` from SQLite only. |
| `database.js:349` `JSON.parse(value)` | Production data persistence | Parses JSON values already read from SQLite-backed state/settings. |
| `database.js:447` `JSON.stringify(report, null, 2)` | Production data persistence | Stores migration report JSON in SQLite `migration_reports`. |
| `database.js:471` `JSON.stringify(stateObj[key])` | Production data persistence | Stores app settings in SQLite `app_settings.value_json`. |
| `database.js:487` `JSON.stringify(row.data)` | Production data persistence | Stores business records in SQLite `business_records.data_json`. |
| `database.js:540` `JSON.stringify('2026-06-16-business-records-v1')` | Production data persistence | Stores internal migration marker in SQLite `app_settings`. |
| `database.js:548` `JSON.stringify('2026-06-16-business-records-v1')` | Production data persistence | Stores internal migration marker in SQLite `app_settings`. |
| `database.js:636` `JSON.stringify(BUSINESS_RECORDS_SCHEMA_VERSION)` | Production data persistence | Stores internal schema marker in SQLite `app_settings`. |
| `database.js:691` `JSON.stringify(USER_DATA_SCHEMA_VERSION)` | Production data persistence | Stores internal schema marker in SQLite `app_settings`. |
| `database.js:1053` `config_json: JSON.stringify(config)` | Production data persistence | Stores module configuration in SQLite. |
| `database.js:1139` `JSON.parse(value || '{}')` | Production data persistence | Parses module configuration read from SQLite. |
| `server.js:178` `JSON.parse(value)` | Production data persistence | Parses SQLite-backed user permissions JSON during auth/permission normalization. |
| `server.js:783` `JSON.parse(value || '')` | Production data persistence | Parses role/module permissions sourced from SQLite. |
| `server.js:975` `JSON.stringify(...)` | Production data persistence | Serializes audit-log details stored through `db.addAuditLog()` in SQLite. |
| `server.js:1012` `JSON.parse(log.details || '{}')` | Production data persistence | Parses audit-log details read from SQLite. |
| `server.js:1203` `JSON.parse(JSON.stringify(...))` | UI cache only | Deep clone/default-state helper, not storage. |
| `server.js:1368` `JSON.stringify(...)` | UI cache only | State comparison helper, not storage. |
| `server.js:1383` `JSON.stringify(...)` | UI cache only | Dynamic-module comparison helper, not storage. |
| `server.js:1771` `JSON.stringify(...)` | UI cache only | Object comparison helper, not storage. |
| `server.js:2094` `JSON.stringify(...)` | Production data persistence | Builds structured audit details later stored through SQLite audit logs. |
| `server.js:2128` `JSON.stringify(...)` | UI cache only | Diff comparison helper before SQLite save. |

### Filesystem Writes

| Occurrence | Classification | Notes |
| --- | --- | --- |
| `database.js:284` `fs.writeFileSync(MIGRATION_BACKUP_MARKER, stamp)` | Configuration only | Writes a one-line migration marker, not business data. |
| `database.js:450` `fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))` | Configuration only | Writes a migration report artifact; the authoritative report is also stored in SQLite and this file is not used as a datastore. |

### JSON Files

| File | Classification | Notes |
| --- | --- | --- |
| `package.json` | Configuration only | Node package manifest. |
| `package-lock.json` | Configuration only | Dependency lockfile. |
| `capacitor.config.json` | Configuration only | Capacitor app configuration. |
| `android/app/src/main/assets/capacitor.config.json` | Configuration only | Android Capacitor asset configuration. |
| `android/app/src/main/assets/capacitor.plugins.json` | Configuration only | Android Capacitor plugin manifest. |

## CRUD And Authentication Verification

- `server.js` registers `/api/state` `GET`, `POST`, and `PUT` routes.
- `GET /api/state` calls `db.getState()`.
- `POST /api/state` and `PUT /api/state` call `handleStateSave()`, which validates the request, merges permitted state changes, then calls `db.saveState(newState)`.
- `database.js` implements `saveState()` through `saveStateToBusinessTables()`, writing to SQLite `app_settings` and `business_records`.
- Auth registration and login call `db.createUser()`, `db.getUserByEmail()`, `db.addAuthLog()`, and `db.addAuditLog()`.
- JWTs are created with `jwt.sign()` and verified with `jwt.verify()` in `server.js`.
- No browser storage, JSON file, or non-SQLite datastore participates in CRUD or authentication persistence.

## Conclusion

SQLite is the sole production datastore for business records, settings, users, auth logs, audit logs, access codes, module registry/configuration, and migration reports. No production data was found persisted through browser storage or writable JSON datastore files.
