const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/data/database.sqlite' : path.join(__dirname, 'database.sqlite'));
const BUSINESS_ARRAY_COLLECTIONS = [
    'employees',
    'schedules',
    'debts',
    'claims',
    'expenses',
    'reimbursementClaims',
    'payments',
    'fundAccounts',
    'atmCashRecords',
    'announcements',
    'calendarEvents'
];
const SETTINGS_KEYS = [
    'currency',
    'categories',
    'paymentTypes',
    'displayModules',
    'moduleRegistry',
    'summary',
    'bankRentalCleanupVersion',
    'bankRentalDeletedSignatures'
];
const INTERNAL_SETTING_KEYS = ['sqliteBusinessMigrationVersion'];
const OWNER_FIELD_CANDIDATES = ['owner_id', 'registeredId', 'registered_id', 'trackingId', 'tracking_id', 'ownerId', 'userId', 'user_id', 'createdBy', 'created_by', 'email', 'username', 'owner', 'updatedBy', 'updated_by'];
const LEGACY_OWNER_FIELDS = ['registeredId', 'registered_id', 'trackingId', 'tracking_id', 'ownerId', 'userId', 'user_id', 'createdBy', 'created_by', 'email', 'username', 'owner'];
const WORKFORCE_MODULE_KEYS = ['workforce', 'employees', 'schedules'];
const BUSINESS_RECORDS_SCHEMA_VERSION = '2026-06-17-owner-not-null-v2';
const USER_DATA_SCHEMA_VERSION = '2026-06-17-user-data-owner-v1';

// Ensure parent directories exist (crucial for Zeabur mounted volume path like /data/database.sqlite)
const dbDir = path.dirname(dbPath);
const MIGRATION_BACKUP_MARKER = path.join(dbDir, '.registered-id-migration-backup-done');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

async function initDb() {
    if (db) return db;

    console.log(`Initializing SQLite database at: ${dbPath}`);
    backupSqliteBeforeRegisteredIdMigration();
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Enable WAL (Write-Ahead Logging) mode and optimize performance
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    await db.exec('PRAGMA temp_store = MEMORY');

    // Create state table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // Create audit logs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            user_email TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS auth_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('viewer', 'admin', 'superadmin')),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);
    await ensureColumnExists('auth_users', 'registered_id', 'TEXT');
    await ensureColumnExists('auth_users', 'display_name', 'TEXT');
    await ensureColumnExists('auth_users', 'status', "TEXT NOT NULL DEFAULT 'active'");
    await ensureColumnExists('auth_users', 'permissions_json', 'TEXT');
    await db.run("UPDATE auth_users SET status = 'active' WHERE status IS NULL OR status = ''");
    await db.run("UPDATE auth_users SET registered_id = email WHERE registered_id IS NULL OR registered_id = ''");

    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_permission_flags (
            user_id INTEGER NOT NULL,
            permission_key TEXT NOT NULL,
            enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, permission_key),
            FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_permission_modules (
            user_id INTEGER NOT NULL,
            module_key TEXT NOT NULL,
            can_view INTEGER,
            can_add INTEGER,
            can_edit INTEGER,
            can_delete INTEGER,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, module_key),
            FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
        )
    `);
    await ensureColumnExists('user_permission_modules', 'can_view', 'INTEGER');
    await ensureColumnExists('user_permission_modules', 'can_add', 'INTEGER');
    await ensureColumnExists('user_permission_modules', 'can_edit', 'INTEGER');
    await ensureColumnExists('user_permission_modules', 'can_delete', 'INTEGER');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS role_permissions (
            role TEXT NOT NULL,
            module_key TEXT NOT NULL,
            can_view INTEGER,
            can_add INTEGER,
            can_edit INTEGER,
            can_delete INTEGER,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (role, module_key)
        )
    `);
    await ensureColumnExists('role_permissions', 'can_view', 'INTEGER');
    await ensureColumnExists('role_permissions', 'can_add', 'INTEGER');
    await ensureColumnExists('role_permissions', 'can_edit', 'INTEGER');
    await ensureColumnExists('role_permissions', 'can_delete', 'INTEGER');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_permissions (
            user_id INTEGER NOT NULL,
            module_key TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, module_key),
            FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_profile (
            user_id INTEGER PRIMARY KEY,
            display_name TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            owner_id TEXT NOT NULL DEFAULT '',
            data_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
        )
    `);
    await ensureColumnExists('user_data', 'owner_id', "TEXT NOT NULL DEFAULT ''");
    await migratePermissionsJsonToTables();
    await ensureAllUserAuxiliaryRecords();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS auth_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            login_time TEXT NOT NULL,
            ip TEXT,
            success INTEGER NOT NULL CHECK (success IN (0, 1))
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS access_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS module_registry (
            module_key TEXT PRIMARY KEY,
            module_name TEXT NOT NULL,
            icon TEXT,
            sidebar_visible INTEGER NOT NULL DEFAULT 1 CHECK (sidebar_visible IN (0, 1)),
            sort_order INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
            system_module INTEGER NOT NULL DEFAULT 1 CHECK (system_module IN (0, 1)),
            category TEXT,
            access TEXT,
            config_json TEXT,
            updated_at TEXT NOT NULL
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS modules (
            id TEXT PRIMARY KEY,
            module_key TEXT UNIQUE,
            label TEXT,
            icon TEXT,
            category TEXT,
            access TEXT,
            description TEXT,
            enabled INTEGER,
            sidebar_visible INTEGER,
            sort_order INTEGER,
            system_module INTEGER NOT NULL DEFAULT 0,
            created_at TEXT,
            updated_at TEXT
        )
    `);
    await ensureColumnExists('module_registry', 'system_module', 'INTEGER NOT NULL DEFAULT 1');
    await ensureColumnExists('modules', 'system_module', 'INTEGER NOT NULL DEFAULT 0');
    await seedModuleRegistry();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS business_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection TEXT NOT NULL,
            subcollection TEXT NOT NULL DEFAULT '',
            record_id TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(collection, subcollection, record_id)
        )
    `);
    await ensureColumnExists('business_records', 'user_id', 'TEXT');
    await db.run('UPDATE business_records SET user_id = owner_id WHERE (user_id IS NULL OR user_id = "") AND owner_id IS NOT NULL AND owner_id <> ""');
    await ensureUserDataOwnershipSchema();
    await ensureBusinessRecordsOwnershipSchema();
    await db.exec('CREATE INDEX IF NOT EXISTS idx_business_records_owner ON business_records(owner_id)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_business_records_user ON business_records(user_id)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_business_records_collection ON business_records(collection, subcollection)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_user_data_owner ON user_data(owner_id)');

    await db.exec(`
        CREATE TABLE IF NOT EXISTS migration_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            report_json TEXT NOT NULL
        )
    `);

    await migrateLegacyStateToBusinessTables();

    console.log('Database tables verified/created successfully.');
    return db;
}

function backupSqliteBeforeRegisteredIdMigration() {
    if (!fs.existsSync(dbPath) || fs.existsSync(MIGRATION_BACKUP_MARKER)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const files = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
    files.forEach((filePath) => {
        if (!fs.existsSync(filePath)) return;
        const backupPath = `${filePath}.backup-before-registered-id-${stamp}`;
        fs.copyFileSync(filePath, backupPath);
    });
    fs.writeFileSync(MIGRATION_BACKUP_MARKER, stamp);
    console.log(`SQLite backup created before registered ID migration: ${stamp}`);
}

async function getState() {
    await initDb();
    const businessCount = await db.get('SELECT COUNT(*) AS count FROM business_records');
    const settingsCount = await db.get('SELECT COUNT(*) AS count FROM app_settings');
    if (!businessCount?.count && !settingsCount?.count) return getLegacyStateDocument();
    return readStateFromBusinessTables();
}

async function saveState(stateObj) {
    await initDb();
    await saveStateToBusinessTables(stateObj || {});
}

async function getLegacyStateDocument() {
    const row = await db.get('SELECT data FROM state WHERE id = 1');
    if (!row) return null;
    try {
        return JSON.parse(row.data);
    } catch (error) {
        console.error('Error parsing JSON state from database:', error);
        return null;
    }
}

function normalizeRegisteredId(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeOwnerValue(value) {
    return normalizeRegisteredId(value);
}

function getRecordOwner(record = {}) {
    for (const field of OWNER_FIELD_CANDIDATES) {
        const value = normalizeRegisteredId(record[field]);
        if (value) return value;
    }
    return '';
}

function applyConsolidatedOwner(record = {}) {
    const owner = normalizeOwnerValue(getRecordOwner(record));
    LEGACY_OWNER_FIELDS.forEach((field) => {
        delete record[field];
    });
    if (owner) {
        record.owner_id = owner;
        record.user_id = owner;
    }
    return record;
}

function stripOwnershipFields(record = {}) {
    OWNER_FIELD_CANDIDATES.forEach((field) => {
        delete record[field];
    });
    return record;
}

function parseJson(value, fallback) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function getRecordId(collection, subcollection, record, index) {
    return String(record?.id || record?.recordId || record?.record_id || `${collection}_${subcollection || 'root'}_${index + 1}`);
}

function collectBusinessRecords(stateObj = {}) {
    const rows = [];
    BUSINESS_ARRAY_COLLECTIONS.forEach((collection) => {
        (Array.isArray(stateObj[collection]) ? stateObj[collection] : []).forEach((record, index) => {
            const next = applyConsolidatedOwner({ ...record });
            rows.push({
                collection,
                subcollection: '',
                recordId: getRecordId(collection, '', next, index),
                ownerId: normalizeOwnerValue(getRecordOwner(next)),
                originalOwnerId: getRecordOwner(record),
                data: next
            });
        });
    });
    Object.entries(stateObj.bankRental || {}).forEach(([subcollection, records]) => {
        (Array.isArray(records) ? records : []).forEach((record, index) => {
            const next = applyConsolidatedOwner({ ...record });
            rows.push({
                collection: 'bankRental',
                subcollection,
                recordId: getRecordId('bankRental', subcollection, next, index),
                ownerId: normalizeOwnerValue(getRecordOwner(next)),
                originalOwnerId: getRecordOwner(record),
                data: next
            });
        });
    });
    Object.entries(stateObj.dynamicModuleRecords || {}).forEach(([subcollection, records]) => {
        (Array.isArray(records) ? records : []).forEach((record, index) => {
            const next = applyConsolidatedOwner({ ...record });
            rows.push({
                collection: 'dynamicModuleRecords',
                subcollection,
                recordId: getRecordId('dynamicModuleRecords', subcollection, next, index),
                ownerId: normalizeOwnerValue(getRecordOwner(next)),
                originalOwnerId: getRecordOwner(record),
                data: next
            });
        });
    });
    return rows;
}

function buildMigrationReport(stateObj = {}, rows = []) {
    const ownershipFields = new Set();
    const recordsReassigned = [];
    const recordCounts = {};
    rows.forEach((row) => {
        recordCounts[row.collection] = (recordCounts[row.collection] || 0) + 1;
        OWNER_FIELD_CANDIDATES.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(row.data, field)) ownershipFields.add(field);
        });
        const originalOwner = normalizeRegisteredId(row.originalOwnerId || getRecordOwner(row.data));
        if (originalOwner && row.ownerId && originalOwner !== row.ownerId) {
            recordsReassigned.push({
                collection: row.collection,
                subcollection: row.subcollection,
                recordId: row.recordId,
                originalOwnerId: originalOwner,
                ownerId: row.ownerId
            });
        }
    });
    return {
        generatedAt: new Date().toISOString(),
        ownerAliases: [],
        storageSourcesDiscovered: [
            'SQLite database.sqlite',
            'SQLite state.data JSON document',
            'JWT cookie authentication backed by SQLite auth_users',
            'Hardcoded empty default state factories in server.js/app.js',
            'SQLite backup/WAL/SHM files in project root'
        ],
        sqliteTablesDiscovered: ['state', 'audit_logs', 'auth_users', 'auth_logs', 'access_codes', 'app_settings', 'business_records', 'migration_reports'],
        ownershipFieldsDiscovered: Array.from(ownershipFields).sort(),
        stateKeysDiscovered: Object.keys(stateObj || {}),
        businessRecordCounts: recordCounts,
        recordsReassigned,
        sqliteSchemaCreated: ['app_settings', 'business_records', 'migration_reports'],
        destructiveActionRequired: false
    };
}

async function saveMigrationReport(report) {
    const now = report.generatedAt || new Date().toISOString();
    await db.run(
        'INSERT INTO migration_reports (created_at, report_json) VALUES (?, ?)',
        [now, JSON.stringify(report, null, 2)]
    );
    const reportPath = path.join(dbDir, `MIGRATION_REPORT_${now.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

async function saveStateToBusinessTables(stateObj = {}, options = {}) {
    const now = new Date().toISOString();
    const rows = collectBusinessRecords(stateObj);
    const internalSettings = await db.all(
        `SELECT key, value_json, updated_at FROM app_settings WHERE key IN (${INTERNAL_SETTING_KEYS.map(() => '?').join(',')})`,
        INTERNAL_SETTING_KEYS
    );
    if (options.reportBeforeWrite) {
        await saveMigrationReport(buildMigrationReport(stateObj, rows));
    }
    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
        await db.run('DELETE FROM business_records');
        await db.run('DELETE FROM app_settings');
        for (const key of SETTINGS_KEYS) {
            if (Object.prototype.hasOwnProperty.call(stateObj, key)) {
                await db.run(
                    'INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
                    [key, JSON.stringify(stateObj[key]), now]
                );
            }
        }
        for (const setting of internalSettings) {
            await db.run(
                'INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
                [setting.key, setting.value_json, setting.updated_at || now]
            );
        }
        for (const row of rows) {
            if (!row.ownerId) {
                throw new Error(`Cannot save ${row.collection} record ${row.recordId} without owner_id.`);
            }
            await db.run(
                'INSERT OR REPLACE INTO business_records (collection, subcollection, record_id, owner_id, user_id, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [row.collection, row.subcollection, row.recordId, row.ownerId, row.ownerId, JSON.stringify(row.data), now, now]
            );
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

async function readStateFromBusinessTables() {
    const settings = await db.all('SELECT key, value_json FROM app_settings');
    const rows = await db.all('SELECT collection, subcollection, owner_id, user_id, data_json FROM business_records ORDER BY id ASC');
    const stateObj = {};
    settings.forEach((setting) => {
        if (INTERNAL_SETTING_KEYS.includes(setting.key)) return;
        stateObj[setting.key] = parseJson(setting.value_json, null);
    });
    BUSINESS_ARRAY_COLLECTIONS.forEach((collection) => {
        stateObj[collection] = [];
    });
    stateObj.bankRental = {};
    stateObj.dynamicModuleRecords = {};
    rows.forEach((row) => {
        const record = parseJson(row.data_json, {});
        if (!getRecordOwner(record) && (row.user_id || row.owner_id)) {
            record.owner_id = row.owner_id || row.user_id;
            record.user_id = row.user_id || row.owner_id;
        }
        if (BUSINESS_ARRAY_COLLECTIONS.includes(row.collection)) {
            stateObj[row.collection].push(record);
            return;
        }
        if (row.collection === 'bankRental') {
            if (!Array.isArray(stateObj.bankRental[row.subcollection])) stateObj.bankRental[row.subcollection] = [];
            stateObj.bankRental[row.subcollection].push(record);
            return;
        }
        if (row.collection === 'dynamicModuleRecords') {
            if (!Array.isArray(stateObj.dynamicModuleRecords[row.subcollection])) stateObj.dynamicModuleRecords[row.subcollection] = [];
            stateObj.dynamicModuleRecords[row.subcollection].push(record);
        }
    });
    return stateObj;
}

async function migrateLegacyStateToBusinessTables() {
    const migrated = await db.get("SELECT value_json FROM app_settings WHERE key = 'sqliteBusinessMigrationVersion'");
    if (migrated) return;
    const legacyState = await getLegacyStateDocument();
    if (!legacyState) {
        await db.run(
            'INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
            ['sqliteBusinessMigrationVersion', JSON.stringify('2026-06-16-business-records-v1'), new Date().toISOString()]
        );
        return;
    }
    await saveStateToBusinessTables(legacyState, { reportBeforeWrite: true });
    await db.run('DELETE FROM state WHERE id = 1');
    await db.run(
        'INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
        ['sqliteBusinessMigrationVersion', JSON.stringify('2026-06-16-business-records-v1'), new Date().toISOString()]
    );
}

async function getAuditLogs() {
    await initDb();
    return db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500');
}

async function addAuditLog(userEmail, role, action, details = '') {
    await initDb();
    const now = new Date().toISOString();
    await db.run(
        'INSERT INTO audit_logs (timestamp, user_email, role, action, details) VALUES (?, ?, ?, ?, ?)',
        [now, userEmail, role, action, details]
    );
}

async function getUserByEmail(email) {
    await initDb();
    const id = normalizeRegisteredId(email);
    return attachPermissions(await db.get('SELECT * FROM auth_users WHERE email = ? OR registered_id = ?', [id, id]));
}

async function getUserById(id) {
    await initDb();
    return attachPermissions(await db.get('SELECT * FROM auth_users WHERE id = ?', [id]));
}

async function ensureColumnExists(tableName, columnName, columnDefinition) {
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    const exists = columns.some((column) => column.name === columnName);
    if (!exists) {
        await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
}

async function tableColumnInfo(tableName) {
    return db.all(`PRAGMA table_info(${tableName})`);
}

function columnIsRequired(columns, columnName) {
    const column = columns.find((item) => item.name === columnName);
    return Boolean(column && (column.notnull === 1 || column.pk === 1));
}

async function ensureBusinessRecordsOwnershipSchema() {
    const columns = await tableColumnInfo('business_records');
    if (columnIsRequired(columns, 'owner_id') && columnIsRequired(columns, 'user_id')) return;
    const now = new Date().toISOString();
    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS business_records_hardened (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collection TEXT NOT NULL,
                subcollection TEXT NOT NULL DEFAULT '',
                record_id TEXT NOT NULL,
                owner_id TEXT NOT NULL CHECK(owner_id <> ''),
                user_id TEXT NOT NULL CHECK(user_id <> ''),
                data_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(collection, subcollection, record_id)
            )
        `);
        await db.run('DELETE FROM business_records_hardened');
        await db.run(`
            INSERT OR REPLACE INTO business_records_hardened
                (id, collection, subcollection, record_id, owner_id, user_id, data_json, created_at, updated_at)
            SELECT
                id,
                collection,
                COALESCE(subcollection, ''),
                record_id,
                LOWER(TRIM(COALESCE(NULLIF(owner_id, ''), NULLIF(user_id, '')))),
                LOWER(TRIM(COALESCE(NULLIF(user_id, ''), NULLIF(owner_id, '')))),
                data_json,
                created_at,
                updated_at
            FROM business_records
            WHERE COALESCE(NULLIF(owner_id, ''), NULLIF(user_id, '')) IS NOT NULL
              AND TRIM(COALESCE(NULLIF(owner_id, ''), NULLIF(user_id, ''))) <> ''
        `);
        await db.run('DROP TABLE business_records');
        await db.run('ALTER TABLE business_records_hardened RENAME TO business_records');
        await db.run(
            'INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
            ['businessRecordsOwnershipSchemaVersion', JSON.stringify(BUSINESS_RECORDS_SCHEMA_VERSION), now]
        );
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

async function ensureUserDataOwnershipSchema() {
    const columns = await tableColumnInfo('user_data');
    if (columnIsRequired(columns, 'owner_id')) {
        await db.run(`
            UPDATE user_data
            SET owner_id = (
                SELECT LOWER(TRIM(COALESCE(NULLIF(auth_users.registered_id, ''), auth_users.email)))
                FROM auth_users
                WHERE auth_users.id = user_data.user_id
            )
            WHERE owner_id IS NULL OR owner_id = ''
        `);
        return;
    }
    const now = new Date().toISOString();
    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_data_hardened (
                user_id INTEGER PRIMARY KEY,
                owner_id TEXT NOT NULL CHECK(owner_id <> ''),
                data_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
            )
        `);
        await db.run('DELETE FROM user_data_hardened');
        await db.run(`
            INSERT OR REPLACE INTO user_data_hardened
                (user_id, owner_id, data_json, created_at, updated_at)
            SELECT
                user_data.user_id,
                LOWER(TRIM(COALESCE(NULLIF(auth_users.registered_id, ''), auth_users.email))),
                user_data.data_json,
                user_data.created_at,
                user_data.updated_at
            FROM user_data
            JOIN auth_users ON auth_users.id = user_data.user_id
            WHERE COALESCE(NULLIF(auth_users.registered_id, ''), auth_users.email) IS NOT NULL
              AND TRIM(COALESCE(NULLIF(auth_users.registered_id, ''), auth_users.email)) <> ''
        `);
        await db.run('DROP TABLE user_data');
        await db.run('ALTER TABLE user_data_hardened RENAME TO user_data');
        await db.run(
            'INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
            ['userDataOwnershipSchemaVersion', JSON.stringify(USER_DATA_SCHEMA_VERSION), now]
        );
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

async function readUserPermissions(userId) {
    if (!userId) return null;
    await seedRolePermissions();
    const user = await db.get('SELECT role FROM auth_users WHERE id = ?', [userId]);
    if (!user) return null;
    const storageRole = String(user.role || '').trim().toLowerCase();
    const templateRole = storageRole === 'admin' || storageRole === 'superadmin' ? storageRole : 'viewer';
    const modules = await db.all(`
        SELECT module_key, can_view, can_add, can_edit, can_delete FROM role_permissions WHERE role = ?
        ORDER BY module_key ASC
    `, [templateRole]);
    if (!modules.length) return null;
    const permissions = {};
    permissions.modules = modules.filter((row) => row.can_view !== 0).map((row) => row.module_key);
    permissions.moduleActions = {};
    modules.forEach((row) => {
        permissions.moduleActions[row.module_key] = {
            read: row.can_view === null || row.can_view === undefined ? true : Boolean(row.can_view),
            create: row.can_add === null || row.can_add === undefined ? true : Boolean(row.can_add),
            update: row.can_edit === null || row.can_edit === undefined ? true : Boolean(row.can_edit),
            delete: Boolean(row.can_delete)
        };
    });
    return permissions;
}

async function replaceUserPermissions(userId, permissions = null) {
    if (!userId) return;
    await db.run('DELETE FROM user_permission_flags WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM user_permission_modules WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM user_permissions WHERE user_id = ?', [userId]);
}

async function replaceAllUserPermissionOverrides() {
    await db.run('DELETE FROM user_permission_flags');
    await db.run('DELETE FROM user_permission_modules');
    await db.run('DELETE FROM user_permissions');
}

async function attachPermissions(user) {
    if (!user) return null;
    const permissions = await readUserPermissions(user.id);
    if (!permissions) return user;
    return {
        ...user,
        permissions,
        permissions_json: null
    };
}

async function attachPermissionsToRows(rows = []) {
    const attached = [];
    for (const row of rows || []) {
        attached.push(await attachPermissions(row));
    }
    return attached;
}

async function migratePermissionsJsonToTables() {
    await db.run('UPDATE auth_users SET permissions_json = NULL WHERE permissions_json IS NOT NULL AND permissions_json <> ""');
    await replaceAllUserPermissionOverrides();
}

async function createUser(email, passwordHash, role, displayName = '', permissions = null) {
    await initDb();
    const now = new Date().toISOString();
    const registeredId = normalizeRegisteredId(email);
    const result = await db.run(
        'INSERT INTO auth_users (email, registered_id, password_hash, role, created_at, updated_at, display_name, status, permissions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [registeredId, registeredId, passwordHash, role, now, now, String(displayName || '').trim(), 'active', null]
    );
    await replaceUserPermissions(result.lastID, permissions);
    await ensureUserAuxiliaryRecords(result.lastID);
    return getUserById(result.lastID);
}

async function ensureUserAuxiliaryRecords(userId) {
    await initDb();
    const user = await db.get('SELECT id, email, registered_id, display_name, status, created_at, updated_at FROM auth_users WHERE id = ?', [userId]);
    if (!user) return null;
    const now = new Date().toISOString();
    const ownerId = normalizeRegisteredId(user.registered_id || user.email);
    await db.run(
        `INSERT INTO user_profile (user_id, display_name, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
            display_name = COALESCE(NULLIF(user_profile.display_name, ''), excluded.display_name),
            status = COALESCE(NULLIF(user_profile.status, ''), excluded.status),
            updated_at = excluded.updated_at`,
        [user.id, user.display_name || '', user.status || 'active', user.created_at || now, now]
    );
    await db.run(
        `INSERT INTO user_data (user_id, owner_id, data_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO NOTHING`,
        [user.id, ownerId, '{}', user.created_at || now, now]
    );
    return getUserById(user.id);
}

async function ensureAllUserAuxiliaryRecords() {
    await initDb();
    const users = await db.all('SELECT id FROM auth_users');
    for (const user of users) {
        await ensureUserAuxiliaryRecords(user.id);
    }
}

async function listAdminUsers() {
    await initDb();
    await backfillUserModulePermissionRows();
    return attachPermissionsToRows(await db.all(
        "SELECT id, email, display_name, role, status, created_at, updated_at FROM auth_users WHERE role IN ('admin', 'superadmin') ORDER BY role DESC, email ASC"
    ));
}

async function listViewerUsers() {
    await initDb();
    await backfillUserModulePermissionRows();
    return attachPermissionsToRows(await db.all(
        "SELECT id, email, registered_id, display_name, role, status, permissions_json, created_at, updated_at FROM auth_users WHERE role = 'viewer' ORDER BY created_at DESC, registered_id ASC"
    ));
}

async function listRegisteredUsers() {
    await initDb();
    await backfillUserModulePermissionRows();
    return attachPermissionsToRows(await db.all(
        `SELECT
            u.id,
            u.email,
            u.registered_id,
            u.display_name,
            u.role,
            u.status,
            u.permissions_json,
            u.created_at,
            u.updated_at,
            (
                SELECT MAX(login_time)
                FROM auth_logs
                WHERE email = u.email OR email = u.registered_id
            ) AS last_login
        FROM auth_users u
        WHERE u.role IN ('viewer', 'admin', 'superadmin')
        ORDER BY u.role DESC, u.registered_id ASC`
    ));
}

async function updateUserPassword(id, passwordHash) {
    await initDb();
    const now = new Date().toISOString();
    await db.run('UPDATE auth_users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, now, id]);
    return getUserById(id);
}

async function updateUserStatus(id, status) {
    await initDb();
    const now = new Date().toISOString();
    await db.run('UPDATE auth_users SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
    await ensureUserAuxiliaryRecords(id);
    await db.run('UPDATE user_profile SET status = ?, updated_at = ? WHERE user_id = ?', [status, now, id]);
    return getUserById(id);
}

async function updateUserProfile(id, displayName, status) {
    await initDb();
    const now = new Date().toISOString();
    const normalizedStatus = String(status || 'active').trim().toLowerCase() === 'disabled' ? 'disabled' : 'active';
    await db.run(
        'UPDATE auth_users SET display_name = ?, status = ?, updated_at = ? WHERE id = ?',
        [String(displayName || '').trim(), normalizedStatus, now, id]
    );
    await ensureUserAuxiliaryRecords(id);
    await db.run(
        'UPDATE user_profile SET display_name = ?, status = ?, updated_at = ? WHERE user_id = ?',
        [String(displayName || '').trim(), normalizedStatus, now, id]
    );
    return getUserById(id);
}

async function updateUserRoleAndPermissions(id, role, permissions = null) {
    await initDb();
    const now = new Date().toISOString();
    await db.run(
        'UPDATE auth_users SET role = ?, permissions_json = NULL, updated_at = ? WHERE id = ?',
        [role, now, id]
    );
    await replaceUserPermissions(id, permissions);
    return getUserById(id);
}

async function demoteOtherSuperAdmins(registeredId) {
    await initDb();
    const now = new Date().toISOString();
    const normalized = normalizeRegisteredId(registeredId);
    await db.run(
        "UPDATE auth_users SET role = 'viewer', updated_at = ? WHERE role = 'superadmin' AND LOWER(COALESCE(registered_id, email)) <> ? AND LOWER(email) <> ?",
        [now, normalized, normalized]
    );
}

async function deleteUser(id) {
    await initDb();
    await db.run('DELETE FROM auth_users WHERE id = ?', [id]);
}

async function tableExists(tableName) {
    const row = await db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [tableName]);
    return Boolean(row);
}

async function tableColumnNames(tableName) {
    if (!(await tableExists(tableName))) return [];
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    return columns.map((column) => column.name);
}

async function deleteFromTableByColumns(tableName, columnValues = {}) {
    const columns = await tableColumnNames(tableName);
    if (!columns.length) return;
    for (const [column, values] of Object.entries(columnValues)) {
        if (!columns.includes(column)) continue;
        const safeValues = [...new Set((Array.isArray(values) ? values : [values]).map(normalizeRegisteredId).filter(Boolean))];
        for (const value of safeValues) {
            await db.run(`DELETE FROM ${tableName} WHERE LOWER(${column}) = ?`, [value]);
        }
    }
}

async function countOwnedBusinessRecords(ownerId) {
    await initDb();
    const owner = normalizeRegisteredId(ownerId);
    const row = await db.get('SELECT COUNT(*) AS count FROM business_records WHERE LOWER(COALESCE(owner_id, "")) = ?', [owner]);
    return Number(row?.count) || 0;
}

async function hardDeleteUserAccount(id) {
    await initDb();
    const user = await getUserById(id);
    if (!user) return null;
    const registeredId = normalizeRegisteredId(user.registered_id || user.email);
    const email = normalizeRegisteredId(user.email);
    const ownerValues = [...new Set([registeredId, email].filter(Boolean))];

    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
        for (const owner of ownerValues) {
            await db.run('DELETE FROM business_records WHERE LOWER(COALESCE(owner_id, "")) = ?', [owner]);
        }
        await deleteFromTableByColumns('auth_logs', { email: ownerValues });
        await deleteFromTableByColumns('audit_logs', { user_email: ownerValues });
        await deleteFromTableByColumns('access_codes', { created_by: ownerValues });
        await deleteFromTableByColumns('sessions', { owner_id: ownerValues, user_id: ownerValues, email: ownerValues, registered_id: ownerValues });
        await deleteFromTableByColumns('monthly_closings', { owner_id: ownerValues, user_id: ownerValues, email: ownerValues, registered_id: ownerValues });
        await deleteFromTableByColumns('summaries', { owner_id: ownerValues, user_id: ownerValues, email: ownerValues, registered_id: ownerValues });
        await db.run('DELETE FROM user_permission_flags WHERE user_id = ?', [id]);
        await db.run('DELETE FROM user_permission_modules WHERE user_id = ?', [id]);
        await db.run('DELETE FROM user_permissions WHERE user_id = ?', [id]);
        await db.run('DELETE FROM user_profile WHERE user_id = ?', [id]);
        await db.run('DELETE FROM user_data WHERE user_id = ?', [id]);
        await db.run('DELETE FROM auth_users WHERE id = ?', [id]);
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }

    let orphanCount = 0;
    for (const owner of ownerValues) {
        orphanCount += await countOwnedBusinessRecords(owner);
    }
    return {
        user,
        deletedOwnerIds: ownerValues,
        orphanCount
    };
}

async function updateUserDisplayName(id, displayName) {
    await initDb();
    const now = new Date().toISOString();
    await db.run('UPDATE auth_users SET display_name = ?, updated_at = ? WHERE id = ?', [String(displayName || '').trim(), now, id]);
    return getUserById(id);
}

async function addAuthLog(email, ip, success) {
    await initDb();
    const now = new Date().toISOString();
    await db.run(
        'INSERT INTO auth_logs (email, login_time, ip, success) VALUES (?, ?, ?, ?)',
        [String(email || '').trim().toLowerCase() || '(empty)', now, ip || '', success ? 1 : 0]
    );
}

async function listAuthLogs() {
    await initDb();
    return db.all('SELECT id, email, login_time, ip, success FROM auth_logs ORDER BY login_time DESC, id DESC LIMIT 100');
}

async function clearAuthLogs() {
    await initDb();
    await db.run('DELETE FROM auth_logs');
}

async function clearAuditLogs() {
    await initDb();
    await db.run('DELETE FROM audit_logs');
}

async function createAccessCode(code, createdBy) {
    await initDb();
    const now = new Date().toISOString();
    const result = await db.run(
        'INSERT INTO access_codes (code, created_by, created_at) VALUES (?, ?, ?)',
        [code, createdBy, now]
    );
    return db.get('SELECT * FROM access_codes WHERE id = ?', [result.lastID]);
}

async function getLatestAccessCode() {
    await initDb();
    return db.get('SELECT * FROM access_codes ORDER BY id DESC LIMIT 1');
}

function normalizeModuleRegistryRow(module = {}) {
    const moduleKey = String(module.module_key || module.moduleKey || module.id || module.key || '').trim();
    if (!moduleKey) return null;
    const moduleName = String(module.module_name || module.moduleName || module.label || module.name || moduleKey).trim() || moduleKey;
    const sidebarVisible = module.sidebar_visible ?? module.sidebarVisible ?? module.visibilityEnabled ?? true;
    const systemModule = module.system_module ?? module.systemModule ?? module.builtIn ?? true;
    const config = {
        fields: Array.isArray(module.fields) ? module.fields : [],
        description: module.description || '',
        visibilityMode: module.visibilityMode || 'personal',
        permissionMode: module.permissionMode || (module.access === 'management' ? 'management' : 'all'),
        accessMappings: module.accessMappings || {},
        accessConfig: module.accessConfig || {},
        formulaDefinitions: module.formulaDefinitions || [],
        workflowDefinitions: module.workflowDefinitions || [],
        automationRules: module.automationRules || [],
        settings: module.settings || {}
    };
    return {
        module_key: moduleKey,
        module_name: moduleName,
        icon: String(module.icon || '').trim(),
        sidebar_visible: sidebarVisible === false || sidebarVisible === 0 ? 0 : 1,
        sort_order: Number.isFinite(Number(module.sort_order ?? module.sortOrder ?? module.displayOrder)) ? Number(module.sort_order ?? module.sortOrder ?? module.displayOrder) : 0,
        enabled: module.enabled === false || module.enabled === 0 ? 0 : 1,
        system_module: systemModule === false || systemModule === 0 ? 0 : 1,
        category: String(module.category || 'system').trim() || 'system',
        access: module.access === 'management' ? 'management' : 'all',
        config_json: JSON.stringify(config)
    };
}

function normalizeModuleRow(module = {}) {
    const normalized = normalizeModuleRegistryRow(module);
    if (!normalized) return null;
    const now = new Date().toISOString();
    return {
        id: normalized.module_key,
        module_key: normalized.module_key,
        label: normalized.module_name,
        icon: normalized.icon,
        category: normalized.category,
        access: normalized.access,
        description: String(module.description || module.module_description || '').trim(),
        enabled: normalized.enabled,
        sidebar_visible: normalized.sidebar_visible,
        sort_order: normalized.sort_order,
        created_at: module.created_at || module.createdAt || now,
        updated_at: module.updated_at || module.updatedAt || now,
        system_module: normalized.system_module,
        fields: parseRegistryConfig(normalized.config_json).fields || []
    };
}

async function seedModuleRegistry() {
    const workspaceConfig = require('./workspace-config');
    const now = new Date().toISOString();
    const defaults = (workspaceConfig.SYSTEM_MODULE_REGISTRY || []).map(normalizeModuleRegistryRow).filter(Boolean);
    for (const module of defaults) {
        await db.run(
            `INSERT INTO module_registry (module_key, module_name, icon, sidebar_visible, sort_order, enabled, system_module, category, access, config_json, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(module_key) DO UPDATE SET
                module_name = excluded.module_name,
                icon = COALESCE(NULLIF(module_registry.icon, ''), excluded.icon),
                system_module = excluded.system_module,
                category = excluded.category,
                access = excluded.access,
                config_json = CASE WHEN module_registry.config_json IS NULL OR module_registry.config_json = '' THEN excluded.config_json ELSE module_registry.config_json END,
                updated_at = excluded.updated_at`,
            [module.module_key, module.module_name, module.icon, module.sidebar_visible, module.sort_order, module.enabled, module.system_module, module.category, module.access, module.config_json, now]
        );
        await db.run(
            `UPDATE modules
             SET label = ?, category = ?, access = ?, system_module = ?, updated_at = ?
             WHERE module_key = ?`,
            [module.module_name, module.category, module.access, module.system_module, now, module.module_key]
        );
    }
    const existingModules = await db.get('SELECT COUNT(*) AS count FROM modules');
    if (!existingModules?.count) {
        const legacyRows = await db.all('SELECT * FROM module_registry ORDER BY sort_order ASC, module_name ASC');
        for (const legacy of legacyRows) {
            const config = parseRegistryConfig(legacy.config_json);
            await db.run(
                `INSERT OR IGNORE INTO modules (id, module_key, label, icon, category, access, description, enabled, sidebar_visible, sort_order, system_module, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    legacy.module_key,
                    legacy.module_key,
                    legacy.module_name,
                    legacy.icon || '',
                    legacy.category || 'system',
                    legacy.access === 'management' ? 'management' : 'all',
                    config.description || '',
                    legacy.enabled === 0 ? 0 : 1,
                    legacy.sidebar_visible === 0 ? 0 : 1,
                    Number(legacy.sort_order) || 0,
                    legacy.system_module === 0 ? 0 : 1,
                    legacy.updated_at || now,
                    legacy.updated_at || now
                ]
            );
        }
    }
    await db.run('UPDATE modules SET access = ?, updated_at = ? WHERE module_key = ?', ['all', now, 'reports']);
    await migrateWorkforceModulePermissions();
    await migrateReportModulePermissions();
    await seedRolePermissions();
    await backfillUserModulePermissionRows();
}

function parseRegistryConfig(value) {
    try {
        return JSON.parse(value || '{}');
    } catch (error) {
        return {};
    }
}

async function listModuleRegistry() {
    await initDb();
    const rows = await db.all('SELECT * FROM modules ORDER BY sort_order ASC, label ASC');
    const workspaceConfig = require('./workspace-config');
    const systemKeys = new Set((workspaceConfig.SYSTEM_MODULE_REGISTRY || []).map((module) => String(module.module_key || module.id || '').trim()).filter(Boolean));
    return rows.map((row) => {
        const systemModule = systemKeys.has(row.module_key);
        return {
            module_key: row.module_key,
            moduleKey: row.module_key,
            id: row.module_key,
            key: row.module_key,
            module_name: row.label,
            moduleName: row.label,
            label: row.label,
            name: row.label,
            icon: row.icon || '',
            sidebar_visible: Boolean(row.sidebar_visible),
            sidebarVisible: Boolean(row.sidebar_visible),
            sort_order: Number(row.sort_order) || 0,
            sortOrder: Number(row.sort_order) || 0,
            displayOrder: Number(row.sort_order) || 0,
            enabled: Boolean(row.enabled),
            system_module: systemModule,
            systemModule: systemModule,
            builtIn: systemModule,
            category: row.category || 'system',
            access: row.access === 'management' ? 'management' : 'all',
            visibilityEnabled: Boolean(row.sidebar_visible),
            description: row.description || '',
            created_at: row.created_at,
            createdAt: row.created_at,
            updated_at: row.updated_at,
            updatedAt: row.updated_at,
            fields: []
        };
    });
}

async function getModuleRegistryItem(moduleKey) {
    await initDb();
    const key = String(moduleKey || '').trim();
    if (!key) return null;
    const row = await db.get('SELECT * FROM modules WHERE module_key = ?', [key]);
    return row ? (await listModuleRegistry()).find((module) => module.module_key === key) || null : null;
}

async function updateModuleRegistryItem(moduleKey, patch = {}) {
    await initDb();
    const existing = await db.get('SELECT * FROM modules WHERE module_key = ?', [String(moduleKey || '').trim()]);
    if (!existing) return null;
    const now = new Date().toISOString();
    await db.run(
        `UPDATE modules
         SET label = ?, icon = ?, category = ?, access = ?, description = ?, sidebar_visible = ?, sort_order = ?, enabled = ?, updated_at = ?
         WHERE module_key = ?`,
        [
            String((patch.label ?? patch.module_name ?? existing.label) || '').trim() || existing.label,
            patch.icon === undefined ? existing.icon : String(patch.icon || '').trim(),
            String(patch.category || existing.category || 'system').trim() || 'system',
            patch.access === 'management' ? 'management' : (patch.access === 'all' ? 'all' : existing.access),
            patch.description === undefined ? existing.description : String(patch.description || '').trim(),
            patch.sidebar_visible === undefined ? existing.sidebar_visible : (patch.sidebar_visible ? 1 : 0),
            Number.isFinite(Number(patch.sort_order)) ? Number(patch.sort_order) : existing.sort_order,
            patch.enabled === undefined ? existing.enabled : (patch.enabled ? 1 : 0),
            now,
            existing.module_key
        ]
    );
    return getModuleRegistryItem(existing.module_key);
}

async function createModule(module = {}) {
    await initDb();
    const normalized = normalizeModuleRow(module);
    if (!normalized) throw new Error('Module key is required.');
    const now = new Date().toISOString();
    await db.run(
        `INSERT INTO modules (id, module_key, label, icon, category, access, description, enabled, sidebar_visible, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            normalized.id,
            normalized.module_key,
            normalized.label,
            normalized.icon,
            normalized.category,
            normalized.access,
            normalized.description,
            normalized.enabled,
            normalized.sidebar_visible,
            normalized.sort_order,
            now,
            now
        ]
    );
    await seedRolePermissions();
    await seedUserPermissionsForModule(normalized.module_key);
    return getModuleRegistryItem(normalized.module_key);
}

async function updateModule(moduleKey, patch = {}) {
    const module = await updateModuleRegistryItem(moduleKey, patch);
    await seedRolePermissions();
    return module;
}

async function deleteModule(moduleKey) {
    await initDb();
    const key = String(moduleKey || '').trim();
    if (!key) return false;
    const result = await db.run('DELETE FROM modules WHERE module_key = ?', [key]);
    await db.run('DELETE FROM role_permissions WHERE module_key = ?', [key]);
    await db.run('DELETE FROM user_permissions WHERE module_key = ?', [key]);
    await db.run('DELETE FROM user_permission_modules WHERE module_key = ?', [key]);
    return Boolean(result.changes);
}

async function seedRolePermissions() {
    const now = new Date().toISOString();
    const rows = await db.all('SELECT module_key, access, enabled FROM modules WHERE enabled != 0');
    for (const row of rows) {
        await db.run(
            `INSERT OR IGNORE INTO role_permissions
             (role, module_key, can_view, can_add, can_edit, can_delete, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['superadmin', row.module_key, 1, 1, 1, 1, now]
        );
        if (row.access !== 'management') {
            for (const role of ['viewer', 'admin']) {
                await db.run(
                    `INSERT OR IGNORE INTO role_permissions
                     (role, module_key, can_view, can_add, can_edit, can_delete, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [role, row.module_key, 1, 1, 1, 1, now]
                );
            }
        }
    }
    await db.run(
        `UPDATE role_permissions
         SET can_delete = 1, updated_at = ?
         WHERE role IN ('viewer', 'admin')
           AND module_key IN (SELECT module_key FROM modules WHERE access != 'management')`,
        [now]
    );
}

async function seedUserPermissionsForModule(moduleKey) {
    await initDb();
    await replaceAllUserPermissionOverrides();
}

async function seedUserPermissionsForUser(userId) {
    await initDb();
    await replaceUserPermissions(userId, null);
}

async function getRoleTemplates() {
    await initDb();
    await seedRolePermissions();
    const rows = await db.all('SELECT role, module_key, can_view, can_add, can_edit, can_delete FROM role_permissions ORDER BY role, module_key');
    const templates = { admin: {}, user: {} };
    rows.forEach((row) => {
        const role = row.role === 'viewer' ? 'user' : row.role;
        if (!templates[role]) return;
        templates[role][row.module_key] = {
            read: row.can_view === null || row.can_view === undefined ? true : Boolean(row.can_view),
            create: row.can_add === null || row.can_add === undefined ? true : Boolean(row.can_add),
            update: row.can_edit === null || row.can_edit === undefined ? true : Boolean(row.can_edit),
            delete: Boolean(row.can_delete)
        };
    });
    return templates;
}

async function updateRoleTemplate(role, moduleActions = {}) {
    await initDb();
    await seedRolePermissions();
    const storageRole = role === 'admin' ? 'admin' : 'viewer';
    const now = new Date().toISOString();
    for (const [moduleKey, actions] of Object.entries(moduleActions || {})) {
        const key = String(moduleKey || '').trim();
        if (!key) continue;
        await db.run(
            `INSERT OR REPLACE INTO role_permissions
             (role, module_key, can_view, can_add, can_edit, can_delete, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                storageRole,
                key,
                actions?.read === false ? 0 : 1,
                actions?.create === false || actions?.add === false ? 0 : 1,
                actions?.update === false || actions?.edit === false ? 0 : 1,
                actions?.delete === true ? 1 : 0,
                now
            ]
        );
    }
    await replaceAllUserPermissionOverrides();
    return getRoleTemplates();
}

async function backfillUserModulePermissionRows() {
    await replaceAllUserPermissionOverrides();
}

async function migrateWorkforceModulePermissions() {
    const now = new Date().toISOString();
    await db.run(
        `UPDATE module_registry
         SET access = 'all', updated_at = ?
         WHERE module_key IN ('workforce', 'employees', 'schedules')`,
        [now]
    );
    await db.run(
        `UPDATE modules
         SET access = 'all', updated_at = ?
         WHERE module_key IN ('workforce', 'employees', 'schedules')`,
        [now]
    );

    await replaceAllUserPermissionOverrides();
}

async function migrateReportModulePermissions() {
    const now = new Date().toISOString();
    await db.run(
        `UPDATE module_registry
         SET access = 'all', updated_at = ?
         WHERE module_key = 'reports'`,
        [now]
    );
    await db.run(
        `UPDATE modules
         SET access = 'all', updated_at = ?
         WHERE module_key = 'reports'`,
        [now]
    );
    await replaceAllUserPermissionOverrides();
}

async function pruneDisabledModulesFromUserPermissions(enabledModuleKeys = []) {
    await initDb();
    await replaceAllUserPermissionOverrides();
}

module.exports = {
    initDb,
    getState,
    saveState,
    getAuditLogs,
    addAuditLog,
    getUserByEmail,
    getUserById,
    createUser,
    listAdminUsers,
    listViewerUsers,
    listRegisteredUsers,
    updateUserPassword,
    updateUserStatus,
    updateUserProfile,
    updateUserRoleAndPermissions,
    ensureUserAuxiliaryRecords,
    demoteOtherSuperAdmins,
    deleteUser,
    hardDeleteUserAccount,
    countOwnedBusinessRecords,
    updateUserDisplayName,
    addAuthLog,
    listAuthLogs,
    clearAuthLogs,
    clearAuditLogs,
    createAccessCode,
    getLatestAccessCode,
    getRoleTemplates,
    updateRoleTemplate,
    seedUserPermissionsForUser,
    listModuleRegistry,
    getModuleRegistryItem,
    updateModuleRegistryItem,
    createModule,
    updateModule,
    deleteModule,
    pruneDisabledModulesFromUserPermissions
};
