require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database');
const workspaceConfig = require('./workspace-config');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'workertracker-dev-secret-2026');

const SUPERADMIN_ID = 'tsy3383@gmail.com';
const PER_MODULE_ACTIONS = ['read', 'create', 'update', 'delete'];
const OWNER_FIELD_CANDIDATES = [
    'registeredId',
    'registered_id',
    'trackingId',
    'tracking_id',
    'ownerId',
    'owner_id',
    'userId',
    'user_id',
    'createdBy',
    'created_by',
    'email',
    'username',
    'owner'
];
const PASSWORD_SALT_ROUNDS = 12;
const DEFAULT_PERMISSION_TEMPLATES = {
    super: {
        create: true,
        read: true,
        edit: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        settings: true,
        database: true,
        monthlyClosing: true,
        ownerAdmin: true,
        add: true,
        approve: true,
        modules: workspaceConfig.ALL_WORKSPACE_MODULES
    },
    admin: {
        create: true,
        read: true,
        edit: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        settings: true,
        database: true,
        monthlyClosing: true,
        ownerAdmin: true,
        add: true,
        approve: true,
        modules: []
    },
    user: {
        create: true,
        read: true,
        edit: true,
        update: true,
        delete: true,
        export: false,
        import: false,
        settings: true,
        database: false,
        monthlyClosing: false,
        ownerAdmin: false,
        add: true,
        approve: false,
        modules: workspaceConfig.USER_WORKSPACE_MODULES
    }
};
const PERMISSION_BOOLEAN_KEYS = ['add', 'create', 'read', 'edit', 'update', 'delete', 'export', 'approve', 'import', 'settings', 'database', 'monthlyClosing', 'ownerAdmin'];
const SYSTEM_MODULE_REGISTRY = workspaceConfig.SYSTEM_MODULE_REGISTRY;
const FIXED_MODULE_IDS = new Set(SYSTEM_MODULE_REGISTRY.map((module) => module.id || module.module_key));
const PROTECTED_MODULE_KEYS = new Set(['dashboard', 'settings', 'userManagement', 'staffAccess']);
const SUPERADMIN_ONLY_MODULE_KEYS = new Set(['userManagement', 'staffAccess', 'loginAudit']);
const STATE_COLLECTION_MODULES = {
    employees: 'employees',
    schedules: 'schedules',
    debts: 'debts',
    claims: 'reimbursementClaims',
    expenses: 'expenses',
    reimbursementClaims: 'reimbursementClaims',
    payments: 'payments',
    fundAccounts: 'funds',
    atmCashRecords: 'atmCash',
    announcements: 'announcements',
    calendarEvents: 'calendar',
    bankRental: 'bankRental',
    dynamicModuleRecords: '__dynamic__'
};
const BLOCKED_REGISTERED_IDS = new Set([
    String.fromCharCode(52, 100, 103, 97, 110, 103, 64, 56, 56, 56)
]);

if (!JWT_SECRET) {
    console.error('JWT_SECRET is required in production.');
    process.exit(1);
}

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

function sendForbidden(res) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
}

function sendAccountUnavailable(res) {
    res.clearCookie('token');
    return res.status(401).json({
        success: false,
        code: 'ACCOUNT_REMOVED',
        error: 'Account unavailable. This account has been removed by administrator.'
    });
}

// Authentication Middleware
async function authenticateToken(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    try {
        const tokenUser = jwt.verify(token, JWT_SECRET);
        const user = await db.getUserByEmail(tokenUser.email);
        if (!user || user.status === 'disabled') {
            return sendAccountUnavailable(res);
        }
        req.user = sanitizeUser(user);
        next();
    } catch (error) {
        return sendForbidden(res);
    }
}

// Admin authorization middleware
function requireAdmin(req, res, next) {
    if (!isSuperAdminUser(req.user)) {
        return sendForbidden(res);
    }
    next();
}

function requireSuperAdmin(req, res, next) {
    if (!isSuperAdminUser(req.user)) {
        return sendForbidden(res);
    }
    next();
}

function requireAdminOrSuperAdmin(req, res, next) {
    if (!isSuperAdminUser(req.user)) {
        return sendForbidden(res);
    }
    next();
}

function isSuperAdminUser(user) {
    return normalizeRegisteredId(user?.registeredId || user?.registered_id || user?.email) === SUPERADMIN_ID;
}

function parseUserPermissions(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function normalizeRole(role) {
    const value = String(role || '').trim().toLowerCase();
    if (value === 'superadmin') return 'superadmin';
    if (value === 'admin') return 'admin';
    return 'user';
}

function getDefaultPermissionsForUser(user = {}) {
    const role = normalizeRole(user.role || user.accountRole);
    const template = isSuperAdminUser(user) || role === 'superadmin'
        ? DEFAULT_PERMISSION_TEMPLATES.super
        : role === 'admin'
        ? DEFAULT_PERMISSION_TEMPLATES.admin
        : DEFAULT_PERMISSION_TEMPLATES.user;
    return {
        ...template,
        modules: []
    };
}

function buildRootPermissions(moduleIds = workspaceConfig.ALL_WORKSPACE_MODULES) {
    const modules = [...new Set((moduleIds || []).map((moduleId) => String(moduleId || '').trim()).filter(Boolean))];
    return {
        ...DEFAULT_PERMISSION_TEMPLATES.super,
        modules,
        moduleActions: Object.fromEntries(modules.map((moduleId) => [moduleId, {
            read: true,
            create: true,
            update: true,
            delete: true
        }]))
    };
}

function normalizeUserPermissions(permissions, user = {}) {
    if (isSuperAdminUser(user)) return buildRootPermissions();
    const source = parseUserPermissions(permissions) || {};
    const fallback = getDefaultPermissionsForUser(user);
    const next = { ...fallback, modules: [] };
    PERMISSION_BOOLEAN_KEYS.forEach((key) => {
        if (typeof source[key] === 'boolean') next[key] = source[key];
    });
    next.modules = Array.isArray(source.modules)
        ? source.modules.map((moduleId) => String(moduleId || '').trim()).filter(Boolean)
        : [];
    next.moduleActions = {};
    const sourceActions = source.moduleActions && typeof source.moduleActions === 'object' ? source.moduleActions : {};
    next.modules.forEach((moduleId) => {
        const actions = sourceActions[moduleId] && typeof sourceActions[moduleId] === 'object' ? sourceActions[moduleId] : {};
        next.moduleActions[moduleId] = {
            read: actions.read !== false,
            create: actions.create !== false && actions.add !== false,
            update: actions.update !== false && actions.edit !== false,
            delete: actions.delete === true
        };
    });
    return next;
}

function getEnabledPermissionModules(registry = [], user = {}) {
    const isSuper = isSuperAdminUser(user);
    const allowed = new Set();
    (registry || [])
        .filter((module) => module.enabled !== false)
        .filter((module) => isSuper || module.access !== 'management')
        .forEach((module) => {
            [module.module_key, module.moduleKey, module.id, module.key]
                .map((key) => String(key || '').trim())
                .filter(Boolean)
                .forEach((key) => {
                    allowed.add(key);
                    allowed.add(normalizeModuleId(key));
                });
        });
    return allowed;
}

function filterPermissionsForRegistry(permissions, registry = [], user = {}) {
    const allowed = getEnabledPermissionModules(registry, user);
    if (isSuperAdminUser(user)) return buildRootPermissions(Array.from(allowed));
    return {
        ...(permissions || {}),
        modules: (permissions?.modules || []).filter((moduleKey) => allowed.has(moduleKey) || allowed.has(normalizeModuleId(moduleKey))),
        moduleActions: Object.fromEntries(Object.entries(permissions?.moduleActions || {}).filter(([moduleKey]) => allowed.has(moduleKey) || allowed.has(normalizeModuleId(moduleKey))))
    };
}

function normalizePermissionAction(action) {
    if (action === 'add') return 'create';
    if (action === 'edit') return 'update';
    if (action === 'view') return 'read';
    return action;
}

function hasActionPermission(user, action, moduleKey = '') {
    if (isSuperAdminUser(user)) return true;
    const permissions = user.permissions || getDefaultPermissionsForUser(user);
    const normalizedAction = normalizePermissionAction(action);
    const normalizedModule = normalizeModuleId(moduleKey || '');
    if (normalizedModule && permissions.moduleActions && typeof permissions.moduleActions === 'object') {
        const moduleActions = permissions.moduleActions[moduleKey] || permissions.moduleActions[normalizedModule];
        if (moduleActions && Object.prototype.hasOwnProperty.call(moduleActions, normalizedAction)) {
            return moduleActions[normalizedAction] === true;
        }
    }
    if (normalizedAction === 'create') return permissions.create === true && permissions.add !== false;
    if (normalizedAction === 'update') return permissions.update === true && permissions.edit !== false;
    return permissions[normalizedAction] === true;
}

function requireActionPermission(action) {
    return (req, res, next) => {
        if (!hasActionPermission(req.user, action)) return sendForbidden(res);
        next();
    };
}

function requireModulePermission(moduleKey, action = 'read') {
    return async (req, res, next) => {
        const registry = await getCentralModuleRegistry();
        const user = {
            ...req.user,
            permissions: filterPermissionsForRegistry(req.user.permissions, registry, req.user)
        };
        if (!canUserAccessModule(moduleKey, user, registry) || !hasActionPermission(user, action, moduleKey)) {
            return sendForbidden(res);
        }
        req.user = user;
        next();
    };
}

function sanitizeUser(user) {
    if (!user) return null;
    const registeredId = user.registered_id || user.registeredId || user.email;
    const normalizedUser = { ...user, registeredId };
    return {
        id: user.id,
        email: user.email,
        registeredId,
        displayName: user.display_name || '',
        isSuperadmin: normalizeRegisteredId(registeredId) === SUPERADMIN_ID,
        accountRole: normalizeRole(user.role),
        role: normalizeRegisteredId(registeredId) === SUPERADMIN_ID ? 'superadmin' : normalizeRole(user.role),
        status: user.status || 'active',
        permissions: normalizeUserPermissions(user.permissions || user.permissions_json, normalizedUser),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login || user.lastLogin || ''
    };
}

function createAuthToken(user) {
    return jwt.sign({ email: user.email, registeredId: user.registered_id || user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

async function hashPassword(password) {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

async function ensureSuperAdminUser() {
    const existing = await db.getUserByEmail(SUPERADMIN_ID);
    await db.demoteOtherSuperAdmins(SUPERADMIN_ID);
    if (existing) {
        await db.updateUserProfile(existing.id, 'Super Admin', 'active');
        await db.updateUserRoleAndPermissions(existing.id, 'superadmin', null);
        return db.getUserById(existing.id);
    }
    console.warn(`Super Admin account ${SUPERADMIN_ID} does not exist. Registration is preserved; create this account through the normal registration flow.`);
    return null;
}

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'WorkerTracker API is running',
        databasePath: process.env.DATABASE_PATH || 'default'
    });
});

// Auth API endpoints
app.post('/api/auth/register-viewer', async (req, res) => {
    const email = normalizeRegisteredId(req.body.registeredId || req.body.email);
    const displayName = String(req.body.displayName || req.body.name || '').trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Registered ID and password are required.' });
    }
    if (isBlockedRegisteredId(email)) {
        return res.status(400).json({ success: false, error: 'This Registered ID is not available.' });
    }
    const existing = await db.getUserByEmail(email);
    if (existing) {
        return res.status(400).json({ success: false, error: 'Registered ID is already registered.' });
    }
    const passwordHash = await hashPassword(password);
    const initialRole = email === SUPERADMIN_ID ? 'superadmin' : 'viewer';
    const user = await db.createUser(email, passwordHash, initialRole, displayName || (email === SUPERADMIN_ID ? 'Super Admin' : ''), null);
    await db.addAuditLog(email, 'viewer', 'Register ID', 'Registered ID account created.');
    const token = createAuthToken(user);
    setAuthCookie(res, token);
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
    const normalizedEmail = normalizeRegisteredId(req.body.registeredId || req.body.email);
    const password = String(req.body.password || '');
    const ip = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '').split(',')[0].trim();
    const user = await db.getUserByEmail(normalizedEmail);
    const passwordMatched = user ? await bcrypt.compare(password, user.password_hash) : false;

    console.log('[auth/login]', {
        receivedEmail: normalizedEmail || '(empty)',
        passwordMatched,
        accountMatched: Boolean(user),
        authSource: 'sqlite'
    });

    if (!user || !passwordMatched) {
        await db.addAuthLog(normalizedEmail, ip, false);
        return res.status(400).json({ success: false, error: 'Incorrect ID or password.' });
    }
    if (user.status === 'disabled') {
        await db.addAuthLog(normalizedEmail, ip, false);
        return res.status(403).json({ success: false, error: 'Account is disabled.' });
    }

    const token = createAuthToken(user);
    setAuthCookie(res, token);
    await db.addAuthLog(normalizedEmail, ip, true);
    await db.addAuditLog(normalizedEmail, user.role, 'Login', 'Logged in.');
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/auth/logout', async (req, res) => {
    if (req.cookies.token) {
        try {
            const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
            await db.addAuditLog(decoded.registeredId || decoded.email, isSuperAdminUser(decoded) ? 'owner' : 'user', 'Logout', 'Logged out of the session.');
        } catch (e) {}
    }
    res.clearCookie('token');
    return res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    return res.json({ success: true, user: req.user });
});

app.post('/api/auth/display-name', authenticateToken, requireActionPermission('update'), async (req, res) => {
    const displayName = String(req.body.displayName || req.body.name || '').trim();
    if (displayName.length < 2 || displayName.length > 50) {
        return res.status(400).json({ success: false, error: 'Display Name must be 2 to 50 characters.' });
    }
    const user = await db.updateUserDisplayName(req.user.id, displayName);
    await db.addAuditLog(req.user.registeredId || req.user.email, req.user.role, 'Update Display Name', 'Updated profile display name.');
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.get('/api/superadmin/users', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'read'), async (req, res) => {
    const users = await db.listRegisteredUsers();
    return res.json({ success: true, users: users.map(sanitizeUser) });
});

app.post('/api/superadmin/users', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'create'), async (req, res) => {
    const email = normalizeRegisteredId(req.body.email || req.body.registeredId || req.body.username);
    const displayName = String(req.body.name || req.body.displayName || '').trim();
    const password = String(req.body.password || '');
    const status = String(req.body.status || 'active').trim().toLowerCase() === 'disabled' ? 'disabled' : 'active';
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (isBlockedRegisteredId(email)) {
        return res.status(400).json({ success: false, error: 'This Registered ID is not available.' });
    }
    const existing = await db.getUserByEmail(email);
    if (existing) {
        return res.status(409).json({ success: false, error: 'User already exists.' });
    }
    const passwordHash = await hashPassword(password);
    let user = await db.createUser(email, passwordHash, 'viewer', displayName, null);
    if (status !== 'active') {
        user = await db.updateUserStatus(user.id, status);
    }
    await db.addAuditLog(req.user.email, req.user.role, 'Create User', `Created user account ${email}.`);
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.put('/api/superadmin/users/:id', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'update'), async (req, res) => {
    const existing = await db.getUserById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }
    if (isSuperAdminUser(existing)) {
        return res.status(400).json({ success: false, error: 'Super Admin profile is managed by the system reset.' });
    }
    const displayName = String(req.body.name || req.body.displayName || '').trim();
    const status = String(req.body.status || existing.status || 'active').trim().toLowerCase() === 'disabled' ? 'disabled' : 'active';
    const user = await db.updateUserProfile(existing.id, displayName, status);
    await db.addAuditLog(req.user.email, req.user.role, 'Edit User', `Updated user account ${existing.registered_id || existing.email}.`);
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/superadmin/users/:id/status', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'update'), async (req, res) => {
    const existing = await db.getUserById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }
    if (isSuperAdminUser(existing)) {
        return res.status(400).json({ success: false, error: 'Super Admin cannot be disabled.' });
    }
    const status = String(req.body.status || '').trim().toLowerCase() === 'disabled' ? 'disabled' : 'active';
    const user = await db.updateUserStatus(existing.id, status);
    await db.addAuditLog(req.user.email, req.user.role, 'Update User Status', `${status === 'disabled' ? 'Disabled' : 'Enabled'} user account ${existing.registered_id || existing.email}.`);
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/superadmin/users/:id/password', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'update'), async (req, res) => {
    const existing = await db.getUserById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }
    if (isSuperAdminUser(existing)) {
        return res.status(400).json({ success: false, error: 'Super Admin password is managed through the normal account flow.' });
    }
    const password = String(req.body.password || '');
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    const passwordHash = await hashPassword(password);
    const user = await db.updateUserPassword(existing.id, passwordHash);
    await db.addAuditLog(req.user.email, req.user.role, 'Reset User Password', `Reset password for user account ${existing.registered_id || existing.email}.`);
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/superadmin/users/:id/permissions', authenticateToken, requireSuperAdmin, requireModulePermission('staffAccess', 'update'), async (req, res) => {
    const existing = await db.getUserById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }
    if (isSuperAdminUser(existing)) {
        return res.status(400).json({ success: false, error: 'Super Admin access is fixed full access.' });
    }
    const requestedRole = normalizeRole(req.body.role || existing.role);
    const storageRole = requestedRole === 'admin' ? 'admin' : 'viewer';
    const user = await db.updateUserRoleAndPermissions(existing.id, storageRole, null);
    return res.json({ success: true, user: sanitizeUser(user) });
});

app.get('/api/superadmin/role-templates', authenticateToken, requireSuperAdmin, requireModulePermission('staffAccess', 'read'), async (req, res) => {
    const templates = await db.getRoleTemplates();
    return res.json({ success: true, templates });
});

app.put('/api/superadmin/role-templates/:role', authenticateToken, requireSuperAdmin, requireModulePermission('staffAccess', 'update'), async (req, res) => {
    const role = normalizeRole(req.params.role);
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Only admin and user role templates can be modified.' });
    }
    const templates = await db.updateRoleTemplate(role, req.body.moduleActions || {});
    return res.json({ success: true, templates });
});

app.delete('/api/superadmin/users/:id', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'delete'), async (req, res) => {
    const existing = await db.getUserById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }
    if (isSuperAdminUser(existing)) {
        return res.status(400).json({ success: false, error: 'Super Admin cannot be deleted.' });
    }
    const result = await db.hardDeleteUserAccount(existing.id);
    await db.addAuditLog(req.user.email, req.user.role, 'Delete User', `Deleted user account ${existing.registered_id || existing.email}.`);
    return res.json({ success: true, orphanCount: result?.orphanCount || 0, deletedOwnerIds: result?.deletedOwnerIds || [] });
});

function summarizeOwnedRecords(module, records = []) {
    return {
        module,
        count: records.length,
        totalAmount: records.reduce((sum, record) => sum + (Number(record.amount ?? record.currentBalance ?? record.netAmount ?? record.fundIn ?? record.initialBalance ?? 0) || 0), 0)
    };
}

function getBankRentalSummaryRecords(state, ownerId = '') {
    const ownerMatches = ownerId ? getOwnerMatchSet(ownerId) : null;
    return (Array.isArray(state.bankRental?.bankRental) ? state.bankRental.bankRental : [])
        .map((record) => ({ ...record, sourceTab: 'bankRental' }))
        .filter((record) => !ownerMatches || ownerMatches.has(getRecordOwner(record)));
}

function getOwnedRecordSummary(state, ownerId) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const ownerMatches = getOwnerMatchSet(normalizedOwner);
    const belongsToOwner = (record) => ownerMatches.has(getRecordOwner(record));
    const ownedKeys = [
        'employees',
        'schedules',
        'debts',
        'claims',
        'expenses',
        'reimbursementClaims',
        'payments',
        'fundAccounts',
        'atmCashRecords',
        'calendarEvents'
    ];
    const summaries = ownedKeys.map((key) => {
        const records = key === 'employees'
            ? (Array.isArray(state[key]) ? state[key] : [])
            : (Array.isArray(state[key]) ? state[key] : []).filter(belongsToOwner);
        return summarizeOwnedRecords(key, records);
    });
    summaries.push(summarizeOwnedRecords('bankRental', getBankRentalSummaryRecords(state, normalizedOwner)));
    Object.entries(state.dynamicModuleRecords || {}).forEach(([moduleId, records]) => {
        summaries.push(summarizeOwnedRecords(
            moduleId,
            (Array.isArray(records) ? records : []).filter(belongsToOwner)
        ));
    });
    return summaries;
}

app.get('/api/superadmin/users/:id/profile', authenticateToken, requireSuperAdmin, requireModulePermission('userManagement', 'read'), async (req, res) => {
    let user = await db.getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }
    user = await db.ensureUserAuxiliaryRecords(user.id);
    const users = await db.listRegisteredUsers();
    const listed = users.find((item) => Number(item.id) === Number(user.id)) || user;
    const safeUser = sanitizeUser(listed);
    const state = migrateStateOwnership((await db.getState()) || getDefaultState());
    const ownerId = normalizeRegisteredId(safeUser.registeredId || safeUser.email);
    return res.json({
        success: true,
        user: safeUser,
        systemModules: safeUser.permissions?.modules || [],
        moduleData: getOwnedRecordSummary(state, ownerId)
    });
});

app.get('/api/superadmin/custom-modules', authenticateToken, requireSuperAdmin, requireModulePermission('displayModules', 'read'), async (req, res) => {
    const modules = await getCentralModuleRegistry();
    return res.json({
        success: true,
        modules: modules.map((module) => ({
            id: module.module_key,
            moduleKey: module.module_key,
            moduleName: module.module_name,
            status: module.enabled ? 'active' : 'disabled',
            enabled: Boolean(module.enabled),
            sidebarVisible: Boolean(module.sidebar_visible),
            sortOrder: Number(module.sort_order) || 0,
            systemModule: Boolean(module.system_module),
            createdAt: module.updated_at
        })),
        access: []
    });
});

function getReportDateRange(query = {}) {
    const month = String(query.month || '').trim();
    if (/^\d{4}-\d{2}$/.test(month)) {
        return { start: `${month}-01`, end: `${month}-31`, label: month };
    }
    const start = String(query.start || query.from || '').slice(0, 10);
    const end = String(query.end || query.to || '').slice(0, 10);
    return { start, end, label: [start, end].filter(Boolean).join(' to ') || 'All dates' };
}

function isRecordInReportRange(record, range) {
    const date = String(record?.date || record?.startDate || record?.createdAt || record?.updatedAt || '').slice(0, 10);
    if (!date) return !range.start && !range.end;
    if (range.start && date < range.start) return false;
    if (range.end && date > range.end) return false;
    return true;
}

function getReportRecordId(moduleKey, record = {}, index = 0, subcollection = '') {
    const key = String(record.id || record.recordId || record.record_id || `index_${index}`).trim();
    return [moduleKey, subcollection, key].filter(Boolean).join(':');
}

function getReportRecordDate(record = {}) {
    return String(record.date || record.startDate || record.createdAt || record.updatedAt || '').slice(0, 10) || '-';
}

function recordAmount(record = {}) {
    return Number(record.amount ?? record.currentBalance ?? record.netAmount ?? record.fundIn ?? record.initialBalance ?? 0) || 0;
}

function getReportCell(record, accessor) {
    if (typeof accessor === 'function') return accessor(record);
    const value = record?.[accessor];
    return value === undefined || value === null || value === '' ? '-' : value;
}

function getReportModuleDefinitions(state) {
    const modules = [
        { key: 'employees', label: 'Employees', records: state.employees || [], columns: [['Name', 'name'], ['Role', 'role'], ['Department', 'department'], ['Category', 'category']] },
        { key: 'schedules', label: 'Schedules', records: state.schedules || [], columns: [['Date', (record) => record.startDate || record.date], ['Employee', (record) => record.employeeName || record.employeeId], ['Type', (record) => record.leaveType || record.shift], ['Reason', (record) => record.reason || record.remark]] },
        { key: 'debts', label: 'Debt Tracking', records: state.debts || [], columns: [['Date', 'date'], ['Employee', 'employeeId'], ['Amount', (record) => `MYR ${recordAmount(record).toFixed(2)}`], ['Status', 'status'], ['Reason', 'reason']] },
        { key: 'expenses', label: 'Expenses', records: state.expenses || [], columns: [['Date', 'date'], ['Type', 'type'], ['Category', 'category'], ['Amount', (record) => `MYR ${recordAmount(record).toFixed(2)}`], ['Description', 'description']] },
        { key: 'reimbursementClaims', label: 'Reimbursement Claims', records: state.reimbursementClaims || [], columns: [['Date', 'date'], ['Worker', (record) => record.workerId || record.employeeId], ['Amount', (record) => `MYR ${recordAmount(record).toFixed(2)}`], ['Status', 'status'], ['Description', 'description']] },
        { key: 'payments', label: 'Company Payments', records: state.payments || [], columns: [['Date', 'date'], ['Recipient', 'recipient'], ['Amount', (record) => `MYR ${recordAmount(record).toFixed(2)}`], ['Status', 'status'], ['Description', (record) => record.description || record.describe]] },
        { key: 'funds', label: 'Funds', records: state.fundAccounts || [], columns: [['Date', 'date'], ['Fund', 'name'], ['Fund In', (record) => `MYR ${Number(record.fundIn ?? record.initialBalance ?? 0).toFixed(2)}`], ['Fund Out', (record) => `MYR ${Number(record.fundOut ?? 0).toFixed(2)}`], ['Balance', (record) => `MYR ${recordAmount(record).toFixed(2)}`]] },
        { key: 'atmCash', label: 'ATM Cash', records: state.atmCashRecords || [], columns: [['Date', 'date'], ['Fund In', (record) => `MYR ${Number(record.fundIn || 0).toFixed(2)}`], ['Fund Out', (record) => `MYR ${Number(record.fundOut || 0).toFixed(2)}`], ['Remark', 'remark']] },
        { key: 'calendar', label: 'Calendar', records: state.calendarEvents || [], columns: [['Date', 'date'], ['Title', 'title'], ['Time', (record) => [record.startTime, record.endTime].filter(Boolean).join(' - ')], ['Description', 'description']] }
    ];

    const bankRentalRecords = [];
    Object.entries(state.bankRental || {}).forEach(([tabId, records]) => {
        (Array.isArray(records) ? records : []).forEach((record, index) => {
            bankRentalRecords.push({ ...record, reportSubcollection: tabId, reportSourceIndex: index });
        });
    });
    modules.push({
        key: 'bankRental',
        label: 'Bank Rental',
        records: bankRentalRecords,
        columns: [['Tab', (record) => record.reportSubcollection || '-'], ['Agent', (record) => record.agentName || record.name], ['Bank', 'bankName'], ['Amount', (record) => `MYR ${recordAmount(record).toFixed(2)}`], ['Status', (record) => record.bankStatus || record.settlementStatus || record.status]]
    });

    Object.entries(state.dynamicModuleRecords || {}).forEach(([moduleId, records]) => {
        const registryModule = findRegistryModule(state.moduleRegistry || [], moduleId) || {};
        const fields = Array.isArray(registryModule.fields) ? registryModule.fields : [];
        modules.push({
            key: moduleId,
            label: registryModule.module_name || registryModule.moduleName || registryModule.label || moduleId,
            records: Array.isArray(records) ? records : [],
            columns: (fields.length ? fields : [{ key: 'date', label: 'Date' }, { key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }])
                .slice(0, 5)
                .map((field) => [field.label || field.key, field.key])
        });
    });
    return modules;
}

function getReportRecords(state, ownerId, range, selectedIds, registry, user) {
    const ownerMatches = getOwnerMatchSet(ownerId);
    const selected = new Set(Array.isArray(selectedIds) ? selectedIds.map((id) => String(id || '').trim()).filter(Boolean) : []);
    return getReportModuleDefinitions(state)
        .filter((module) => canUserAccessModule(module.key, user, registry))
        .map((module) => {
            const records = module.records
                .map((record, index) => ({
                    id: getReportRecordId(module.key, record, record.reportSourceIndex ?? index, record.reportSubcollection || ''),
                    data: record
                }))
                .filter((record) => selected.has(record.id))
                .filter((record) => ownerMatches.has(getRecordOwner(record.data)))
                .filter((record) => isRecordInReportRange(record.data, range));
            return { ...module, records };
        })
        .filter((module) => module.records.length);
}

function buildReportDocument({ modules, ownerId, user, range }) {
    const generatedAt = new Date().toISOString();
    const totalRecords = modules.reduce((sum, module) => sum + module.records.length, 0);
    const totalAmount = modules.reduce((sum, module) => sum + module.records.reduce((itemSum, record) => itemSum + recordAmount(record.data), 0), 0);
    const approved = modules.flatMap((module) => module.records).filter((record) => String(record.data.status || '').toLowerCase() === 'approved').length;
    const pending = modules.flatMap((module) => module.records).filter((record) => String(record.data.status || '').toLowerCase() === 'pending').length;
    return {
        systemName: 'WorkerTracker',
        title: 'WorkerTracker Report',
        userName: user?.display_name || user?.displayName || ownerId,
        generatedAt,
        dateRange: range.label,
        summary: [
            ['Total Records', totalRecords],
            ['Total Amount', `MYR ${totalAmount.toFixed(2)}`],
            ['Approved Records', approved],
            ['Pending Records', pending],
            ['Module Names', modules.map((module) => module.label).join(', ') || '-']
        ],
        sections: modules.map((module) => ({
            title: module.label,
            headers: ['Date', ...module.columns.map(([label]) => label)],
            rows: module.records.map((record) => [
                getReportRecordDate(record.data),
                ...module.columns.map(([, accessor]) => getReportCell(record.data, accessor))
            ].map((value) => String(value ?? '-').replace(/\s+/g, ' ').trim() || '-'))
        }))
    };
}

function parseJsonSafe(value, fallback) {
    try {
        return JSON.parse(value || '');
    } catch (error) {
        return fallback;
    }
}

function escapePdfText(value) {
    return String(value ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n\t]+/g, ' ');
}

function wrapPdfLine(line, maxChars = 96) {
    const words = String(line ?? '').split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach((word) => {
        if (!word) return;
        if ((current + ' ' + word).trim().length > maxChars) {
            if (current) lines.push(current);
            current = word;
            return;
        }
        current = (current ? `${current} ` : '') + word;
    });
    if (current) lines.push(current);
    return lines.length ? lines : [''];
}

function wrapPdfCell(value, maxChars) {
    const text = String(value ?? '-').replace(/\s+/g, ' ').trim() || '-';
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach((word) => {
        if (word.length > maxChars) {
            if (current) lines.push(current);
            for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
            current = '';
            return;
        }
        if ((current ? `${current} ${word}` : word).length > maxChars) {
            if (current) lines.push(current);
            current = word;
        } else {
            current = current ? `${current} ${word}` : word;
        }
    });
    if (current) lines.push(current);
    return lines.length ? lines : ['-'];
}

function fitPdfCell(value, width) {
    const text = String(value ?? '-');
    return text.length > width ? text.slice(0, Math.max(0, width - 3)) + '...' : text.padEnd(width, ' ');
}

function getPdfColumnWidths(columnCount) {
    const total = 94;
    const dateWidth = 12;
    const remaining = total - dateWidth - Math.max(0, columnCount - 1) * 3;
    const cellWidth = Math.max(10, Math.floor(remaining / Math.max(1, columnCount - 1)));
    return [dateWidth, ...Array(Math.max(0, columnCount - 1)).fill(cellWidth)];
}

function appendPdfTable(lines, headers, rows) {
    const widths = getPdfColumnWidths(headers.length);
    const separator = widths.map((width) => '-'.repeat(width)).join(' | ');
    lines.push(widths.map((width, index) => fitPdfCell(headers[index], width)).join(' | '));
    lines.push(separator);
    rows.forEach((row) => {
        const wrapped = row.map((cell, index) => wrapPdfCell(cell, widths[index]));
        const rowHeight = Math.max(...wrapped.map((cellLines) => cellLines.length));
        for (let lineIndex = 0; lineIndex < rowHeight; lineIndex += 1) {
            lines.push(widths.map((width, index) => fitPdfCell(wrapped[index][lineIndex] || '', width)).join(' | '));
        }
        lines.push(separator);
    });
}

function buildPdfBodyLines(document) {
    const lines = [
        'Summary',
        ...document.summary.map(([label, value]) => `${label}: ${value}`),
        '',
        'Content'
    ];
    document.sections.forEach((section) => {
        lines.push('', section.title);
        appendPdfTable(lines, section.headers, section.rows);
    });
    return lines;
}

function createReportPdf(document) {
    const width = 595.28;
    const height = 841.89;
    const margin = 40;
    const lineHeight = 12;
    const bodyLinesPerPage = 54;
    const wrapped = buildPdfBodyLines(document).flatMap((line) => wrapPdfLine(line, 96));
    const pages = [];
    for (let i = 0; i < wrapped.length; i += bodyLinesPerPage) {
        pages.push(wrapped.slice(i, i + bodyLinesPerPage));
    }
    if (!pages.length) pages.push(['No report data.']);

    const objects = [];
    const addObject = (content) => {
        objects.push(content);
        return objects.length;
    };
    addObject('<< /Type /Catalog /Pages 2 0 R >>');
    const pagesObjectIndex = addObject('');
    const fontIndex = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
    const pageIndexes = [];

    pages.forEach((pageLines, pageIndex) => {
        const numberedLines = [
            document.systemName,
            `Report Title: ${document.title}`,
            `User Name: ${document.userName}`,
            `Generated Date: ${document.generatedAt}`,
            `Page Number: ${pageIndex + 1} / ${pages.length}`,
            `Date Range: ${document.dateRange}`,
            '--------------------------------------------------------------------------------',
            ...pageLines,
        ];
        const text = [
            'BT',
            '/F1 8 Tf',
            `${margin} ${height - margin} Td`,
            `${lineHeight} TL`,
            ...numberedLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
            'ET'
        ].join('\n');
        const streamIndex = addObject(`<< /Length ${Buffer.byteLength(text, 'binary')} >>\nstream\n${text}\nendstream`);
        const pageObject = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontIndex} 0 R >> >> /Contents ${streamIndex} 0 R >>`);
        pageIndexes.push(pageObject);
    });

    objects[pagesObjectIndex - 1] = `<< /Type /Pages /Kids [${pageIndexes.map((index) => `${index} 0 R`).join(' ')}] /Count ${pageIndexes.length} >>`;
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'binary'));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'binary');
}

app.post('/api/reports/pdf', authenticateToken, requireModulePermission('reports', 'read'), async (req, res) => {
    const selectedRecordIds = Array.isArray(req.body?.selectedRecordIds)
        ? req.body.selectedRecordIds.map((id) => String(id || '').trim()).filter(Boolean)
        : [];
    if (!selectedRecordIds.length) {
        return res.status(400).json({ success: false, error: 'Select at least one report row to export.' });
    }

    const users = await db.listRegisteredUsers();
    let reportUser = req.user;
    if (isSuperAdminUser(req.user)) {
        const targetUserId = Number(req.body?.targetUserId || 0);
        if (!targetUserId) {
            return res.status(400).json({ success: false, error: 'Select one user before exporting.' });
        }
        const selected = users.find((user) => Number(user.id) === targetUserId);
        if (!selected) {
            return res.status(404).json({ success: false, error: 'Selected user was not found.' });
        }
        reportUser = selected;
    }

    const ownerId = normalizeRegisteredId(reportUser.registeredId || reportUser.registered_id || reportUser.email);
    const range = getReportDateRange(req.body || {});
    const state = migrateStateOwnership((await db.getState()) || getDefaultState());
    const registry = await getCentralModuleRegistry();
    const modules = getReportRecords(state, ownerId, range, selectedRecordIds, registry, req.user);
    const selected = new Set(selectedRecordIds);
    const approvedIds = new Set(modules.flatMap((module) => module.records.map((record) => record.id)));
    const rejected = [...selected].filter((id) => !approvedIds.has(id));
    if (rejected.length) {
        return res.status(403).json({ success: false, error: 'One or more selected records are not available for this user.' });
    }

    const document = buildReportDocument({ modules, ownerId, user: reportUser, range });
    const pdf = createReportPdf(document);
    const filename = `workertracker_report_${ownerId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    await db.addAuditLog(req.user.registeredId || req.user.email, req.user.role, 'Export Report PDF', JSON.stringify({
        targetOwnerId: ownerId,
        recordCount: selectedRecordIds.length,
        selectedRecordIds
    }));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    return res.end(pdf);
});

app.get('/api/reports/history', authenticateToken, requireModulePermission('reports', 'read'), async (req, res) => {
    const ownerId = normalizeRegisteredId(req.user.registeredId || req.user.email);
    const logs = (await db.getAuditLogs())
        .filter((log) => log.action === 'Export Report PDF')
        .map((log) => {
            const details = parseJsonSafe(log.details, {});
            return {
                id: log.id,
                timestamp: log.timestamp,
                generatedBy: normalizeRegisteredId(log.user_email),
                targetOwnerId: normalizeRegisteredId(details.targetOwnerId),
                recordCount: Number(details.recordCount) || 0
            };
        })
        .filter((log) => isSuperAdminUser(req.user) || log.targetOwnerId === ownerId || log.generatedBy === ownerId);
    return res.json({ success: true, reports: logs });
});

app.get('/api/superadmin/auth-logs', authenticateToken, requireSuperAdmin, requireModulePermission('loginAudit', 'read'), async (req, res) => {
    const users = await db.listRegisteredUsers();
    const names = new Map(users.map((user) => [normalizeRegisteredId(user.registered_id || user.email), user.display_name || '']));
    const logs = await db.listAuthLogs();
    const auditLogs = await db.getAuditLogs();
    const activityLogs = auditLogs.map((log) => {
        let details = {};
        try {
            details = JSON.parse(log.details || '{}');
        } catch (error) {
            details = { summary: log.details || '' };
        }
        const actorRegisteredId = normalizeRegisteredId(details.actorRegisteredId || log.user_email);
        const targetOwnerId = normalizeRegisteredId(details.targetOwnerId || details.ownerId || '');
        return {
            id: log.id,
            timestamp: log.timestamp,
            actorRegisteredId,
            actorName: details.actorName || names.get(actorRegisteredId) || actorRegisteredId,
            targetOwnerId,
            targetOwnerName: details.targetOwnerName || names.get(targetOwnerId) || targetOwnerId || '-',
            action: details.action || log.action || '',
            module: details.module || '',
            summary: details.summary || log.details || '',
            recordId: details.recordId || ''
        };
    });
    return res.json({
        success: true,
        logs: logs.map((log) => ({
            id: log.id,
            email: log.email,
            displayName: names.get(normalizeRegisteredId(log.email)) || '',
            loginTime: log.login_time,
            ip: log.ip || '',
            success: Boolean(log.success)
        })),
        activityLogs
    });
});

app.delete('/api/superadmin/auth-logs', authenticateToken, requireSuperAdmin, requireModulePermission('loginAudit', 'delete'), async (req, res) => {
    await db.clearAuthLogs();
    await db.clearAuditLogs();
    return res.json({ success: true });
});

app.get('/api/superadmin/display-modules', authenticateToken, requireSuperAdmin, requireModulePermission('displayModules', 'read'), async (req, res) => {
    const modules = await getCentralModuleRegistry();
    const displayModules = Object.fromEntries(modules.map((module) => [module.module_key, module.enabled !== false && module.sidebar_visible !== false]));
    return res.json({ success: true, displayModules, modules });
});

app.get('/api/modules', authenticateToken, async (req, res) => {
    const registry = await getCentralModuleRegistry();
    const user = {
        ...req.user,
        permissions: filterPermissionsForRegistry(req.user.permissions, registry, req.user)
    };
    const modules = isSuperAdminUser(user)
        ? registry
        : registry.filter((module) => canUserAccessModule(module.module_key || module.id, user, registry));
    return res.json({ success: true, modules });
});

app.post('/api/modules', authenticateToken, requireSuperAdmin, requireModulePermission('displayModules', 'create'), async (req, res) => {
    try {
        const module = await db.createModule({
            module_key: req.body.moduleKey || req.body.module_key || req.body.id,
            label: req.body.label || req.body.moduleName || req.body.module_name,
            icon: req.body.icon,
            category: req.body.category,
            access: req.body.access,
            description: req.body.description,
            enabled: req.body.enabled,
            sidebarVisible: req.body.sidebarVisible ?? req.body.sidebar_visible,
            sortOrder: req.body.sortOrder ?? req.body.sort_order
        });
        const registry = await getCentralModuleRegistry();
        await db.addAuditLog(req.user.email, req.user.role, 'Create Module', `Created module ${module.module_key}.`);
        return res.json({ success: true, module, modules: registry });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message || 'Unable to create module.' });
    }
});

app.put('/api/modules/:id', authenticateToken, requireSuperAdmin, requireModulePermission('displayModules', 'update'), async (req, res) => {
    const moduleKey = String(req.params.id || '').trim();
    const existing = await db.getModuleRegistryItem(moduleKey);
    if (!existing) return res.status(404).json({ success: false, error: 'Module not found.' });
    if (PROTECTED_MODULE_KEYS.has(moduleKey) && req.body.enabled === false) {
        return res.status(400).json({ success: false, error: 'Protected module cannot be disabled.' });
    }
    const module = await db.updateModule(moduleKey, {
        label: req.body.label || req.body.moduleName || req.body.module_name,
        icon: req.body.icon,
        category: req.body.category,
        access: req.body.access,
        description: req.body.description,
        enabled: req.body.enabled,
        sidebar_visible: req.body.sidebarVisible ?? req.body.sidebar_visible,
        sort_order: req.body.sortOrder ?? req.body.sort_order
    });
    const registry = await getCentralModuleRegistry();
    await db.pruneDisabledModulesFromUserPermissions(registry.filter((item) => item.enabled !== false).map((item) => item.module_key));
    await db.addAuditLog(req.user.email, req.user.role, 'Update Module', `Updated module ${moduleKey}.`);
    return res.json({ success: true, module, modules: registry });
});

app.delete('/api/modules/:id', authenticateToken, requireSuperAdmin, requireModulePermission('displayModules', 'delete'), async (req, res) => {
    const moduleKey = String(req.params.id || '').trim();
    if (PROTECTED_MODULE_KEYS.has(moduleKey)) {
        return res.status(400).json({ success: false, error: 'Protected module cannot be deleted.' });
    }
    const deleted = await db.deleteModule(moduleKey);
    if (!deleted) return res.status(404).json({ success: false, error: 'Module not found.' });
    const registry = await getCentralModuleRegistry();
    await db.addAuditLog(req.user.email, req.user.role, 'Delete Module', `Deleted module ${moduleKey}.`);
    return res.json({ success: true, modules: registry });
});

app.patch('/api/superadmin/display-modules/:moduleKey', authenticateToken, requireSuperAdmin, requireModulePermission('displayModules', 'update'), async (req, res) => {
    const moduleKey = String(req.params.moduleKey || '').trim();
    const existing = await db.getModuleRegistryItem(moduleKey);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'Module not found.' });
    }
    if (PROTECTED_MODULE_KEYS.has(moduleKey) && req.body.enabled === false) {
        return res.status(400).json({ success: false, error: 'Protected module cannot be disabled.' });
    }
    if (SUPERADMIN_ONLY_MODULE_KEYS.has(moduleKey) && !isSuperAdminUser(req.user)) {
        return sendForbidden(res);
    }
    const module = await db.updateModule(moduleKey, {
        enabled: req.body.enabled,
        sidebar_visible: req.body.sidebarVisible ?? req.body.sidebar_visible,
        sort_order: req.body.sortOrder ?? req.body.sort_order
    });
    const registry = await getCentralModuleRegistry();
    await db.pruneDisabledModulesFromUserPermissions(registry.filter((item) => item.enabled !== false).map((item) => item.module_key));
    return res.json({ success: true, module, modules: registry });
});

// Default State Creator
const SUPPORTED_CURRENCY = 'MYR';
function getDefaultState() {
    return {
        currency: SUPPORTED_CURRENCY,
        employees: [],
        schedules: [],
        debts: [],
        claims: [],
        expenses: [],
        reimbursementClaims: [],
        payments: [],
        categories: [],
        paymentTypes: [],
        fundAccounts: [],
        atmCashRecords: [],
        bankRental: {
            bankRental: [],
            totalRental: [],
            bbj: [],
            jes: [],
            kj: [],
            judy: [],
            candy: [],
            block: []
        },
        announcements: [],
        calendarEvents: [],
        displayModules: { expenses: true, bankRental: true },
        moduleRegistry: [],
        dynamicModuleRecords: {},
        summary: {
            totalEmployees: 0,
            totalSchedules: 0,
            totalDebts: 0,
            totalExpenses: 0,
            totalClaims: 0,
            approvedClaims: 0,
            totalPayments: 0,
            totalFundIn: 0,
            totalFundOut: 0,
            totalFundBalance: 0,
            netFunds: 0
        }
    };
}

function normalizeRegisteredId(value) {
    return String(value || '').trim().toLowerCase();
}

function isBlockedRegisteredId(value) {
    return BLOCKED_REGISTERED_IDS.has(normalizeRegisteredId(value));
}

function cloneState(value) {
    return JSON.parse(JSON.stringify(value || getDefaultState()));
}

function getRecordOwner(record) {
    if (!record || typeof record !== 'object') return '';
    for (const field of OWNER_FIELD_CANDIDATES) {
        const value = normalizeRegisteredId(record[field]);
        if (value) return value;
    }
    return '';
}

function getOwnerMatchSet(ownerId) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    return new Set(normalizedOwner ? [normalizedOwner] : []);
}

function applyRecordOwner(record, ownerId) {
    const normalized = normalizeRegisteredId(ownerId);
    if (normalized) {
        record.owner_id = normalized;
        record.user_id = normalized;
    } else {
        delete record.owner_id;
        delete record.user_id;
    }
    return record;
}

function stripRecordOwnership(record = {}) {
    OWNER_FIELD_CANDIDATES.forEach((field) => {
        delete record[field];
    });
    return record;
}

function normalizeModuleId(value) {
    return String(value || '')
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-([a-z0-9])/g, (_, chr) => chr.toUpperCase());
}

function normalizeModuleField(field = {}) {
    const key = normalizeModuleId(field.key || field.name || field.label);
    if (!key) return null;
    const rawType = String(field.type || '').trim().toLowerCase();
    const typeAliases = {
        dropdown: 'select',
        formula: 'calculated',
        calculation: 'calculated',
        percent: 'percentage',
        money: 'currency'
    };
    const type = typeAliases[rawType] || rawType;
    return {
        key,
        label: String(field.label || field.name || key).trim() || key,
        type: ['text', 'number', 'currency', 'percentage', 'date', 'textarea', 'select', 'checkbox', 'calculated'].includes(type) ? type : 'text',
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options.map((item) => String(item).trim()).filter(Boolean) : [],
        formula: String(field.formula || field.expression || '').trim()
    };
}

function normalizeModuleConfigList(value, fallback = []) {
    if (Array.isArray(value)) return value.map((item) => ({ ...item })).filter((item) => Object.keys(item).length);
    if (Array.isArray(fallback)) return fallback.map((item) => ({ ...item })).filter((item) => Object.keys(item).length);
    return [];
}

function normalizeModuleAccessMappings(value = {}, fallback = {}) {
    const source = value && typeof value === 'object' ? value : {};
    const fallbackSource = fallback && typeof fallback === 'object' ? fallback : {};
    const normalizeList = (items, shouldLowercase = false) => {
        if (!Array.isArray(items)) return [];
        return [...new Set(items
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .map((item) => shouldLowercase ? item.toLowerCase() : item)
        )];
    };
    return {
        enabled: source.enabled === true || fallbackSource.enabled === true,
        roles: normalizeList(source.roles || fallbackSource.roles),
        users: normalizeList(source.users || fallbackSource.users, true)
    };
}

function normalizeModuleRegistry(registry = []) {
    const modules = new Map();
    (Array.isArray(registry) ? registry : []).forEach((module) => {
        const id = normalizeModuleId(module.id || module.key);
        if (!id || FIXED_MODULE_IDS.has(id)) return;
        const fallback = modules.get(id) || {};
        modules.set(id, {
            id,
            label: String(module.label || module.name || fallback.label || id).trim() || id,
            description: String(module.description || fallback.description || '').trim(),
            category: module.category || fallback.category || 'system',
            access: module.access === 'management' ? 'management' : 'all',
            permissionMode: ['management', 'all', 'assigned', 'custom'].includes(module.permissionMode) ? module.permissionMode : (module.access === 'management' ? 'management' : 'all'),
            customPermission: String(module.customPermission || fallback.customPermission || '').trim(),
            visibilityMode: module.visibilityMode === 'shared' || fallback.visibilityMode === 'shared' ? 'shared' : 'personal',
            menuGroup: String(module.menuGroup || fallback.menuGroup || '').trim(),
            icon: String(module.icon || fallback.icon || '').trim(),
            displayOrder: Number.isFinite(Number(module.displayOrder ?? fallback.displayOrder)) ? Number(module.displayOrder ?? fallback.displayOrder) : 0,
            visibilityEnabled: module.visibilityEnabled === false ? false : fallback.visibilityEnabled === false ? false : true,
            accessConfig: module.accessConfig && typeof module.accessConfig === 'object' ? { ...module.accessConfig } : (fallback.accessConfig && typeof fallback.accessConfig === 'object' ? { ...fallback.accessConfig } : {}),
            accessMappings: normalizeModuleAccessMappings(module.accessMappings, fallback.accessMappings),
            formulaDefinitions: normalizeModuleConfigList(module.formulaDefinitions, fallback.formulaDefinitions),
            workflowDefinitions: normalizeModuleConfigList(module.workflowDefinitions, fallback.workflowDefinitions),
            automationRules: normalizeModuleConfigList(module.automationRules, fallback.automationRules),
            settings: module.settings && typeof module.settings === 'object' ? { ...module.settings } : (fallback.settings && typeof fallback.settings === 'object' ? { ...fallback.settings } : {}),
            builtIn: Boolean(fallback.builtIn || module.builtIn),
            enabled: module.enabled !== false,
            fields: (Array.isArray(module.fields) ? module.fields : (fallback.fields || [])).map(normalizeModuleField).filter(Boolean)
        });
    });
    return Array.from(modules.values());
}

async function getCentralModuleRegistry() {
    return db.listModuleRegistry();
}

function findRegistryModule(registry, moduleKey) {
    const key = normalizeModuleId(moduleKey);
    return (registry || []).find((module) => normalizeModuleId(module.module_key || module.id) === key) || null;
}

function canUserAccessModule(moduleKey, user, registry = []) {
    if (isSuperAdminUser(user)) return true;
    const module = findRegistryModule(registry, moduleKey);
    if (!module || module.enabled === false) return false;
    if (!isSuperAdminUser(user) && module.access === 'management') return false;
    const permissions = filterPermissionsForRegistry(user.permissions, registry, user);
    const assigned = new Set((permissions.modules || []).flatMap((key) => [key, normalizeModuleId(key)]));
    return [module.module_key, module.moduleKey, module.id, module.key]
        .map((key) => String(key || '').trim())
        .filter(Boolean)
        .some((key) => assigned.has(key) || assigned.has(normalizeModuleId(key)));
}

function filterDisabledModuleData(state, registry = []) {
    const next = cloneState(state);
    const enabled = new Set((registry || []).filter((module) => module.enabled !== false).map((module) => module.module_key || module.id));
    Object.entries(STATE_COLLECTION_MODULES).forEach(([collection, moduleKey]) => {
        if (moduleKey === '__dynamic__') return;
        if (enabled.has(moduleKey)) return;
        if (collection === 'bankRental') next.bankRental = getDefaultState().bankRental;
        else next[collection] = [];
    });
    next.moduleRegistry = registry;
    next.dynamicModuleRecords = { ...(next.dynamicModuleRecords || {}) };
    Object.keys(next.dynamicModuleRecords).forEach((moduleKey) => {
        if (!enabled.has(moduleKey)) next.dynamicModuleRecords[moduleKey] = [];
    });
    return next;
}

function moduleDataChanged(oldState, newState, collection) {
    return JSON.stringify(oldState?.[collection] || null) !== JSON.stringify(newState?.[collection] || null);
}

function assertEnabledModuleWrites(oldState, newState, registry = []) {
    const enabled = new Set((registry || []).filter((module) => module.enabled !== false).map((module) => module.module_key || module.id));
    Object.entries(STATE_COLLECTION_MODULES).forEach(([collection, moduleKey]) => {
        if (moduleKey === '__dynamic__' || enabled.has(moduleKey)) return;
        if (moduleDataChanged(oldState, newState, collection)) {
            throw new Error(`${moduleKey} is disabled.`);
        }
    });
    const oldDynamic = oldState.dynamicModuleRecords || {};
    const newDynamic = newState.dynamicModuleRecords || {};
    Object.keys({ ...oldDynamic, ...newDynamic }).forEach((moduleKey) => {
        if (enabled.has(moduleKey)) return;
        if (JSON.stringify(oldDynamic[moduleKey] || []) !== JSON.stringify(newDynamic[moduleKey] || [])) {
            throw new Error(`${moduleKey} is disabled.`);
        }
    });
}

function getModuleKeyForStateCollection(collection, subcollection = '') {
    if (collection === 'fundAccounts') return 'funds';
    if (collection === 'atmCashRecords') return 'atmCash';
    if (collection === 'calendarEvents') return 'calendar';
    if (collection === 'announcements') return 'announcements';
    if (collection === 'bankRental') return 'bankRental';
    if (collection === 'dynamicModuleRecords') return subcollection;
    return STATE_COLLECTION_MODULES[collection] || collection;
}

function getRecordKey(record, index) {
    return String(record?.id || record?.recordId || record?.record_id || `index_${index}`);
}

function summarizeArrayChanges(oldRecords = [], newRecords = [], moduleKey, registry, user) {
    const changes = [];
    const oldMap = new Map((Array.isArray(oldRecords) ? oldRecords : []).map((record, index) => [getRecordKey(record, index), record]));
    const newMap = new Map((Array.isArray(newRecords) ? newRecords : []).map((record, index) => [getRecordKey(record, index), record]));

    for (const [id, record] of newMap.entries()) {
        if (!oldMap.has(id)) {
            changes.push({ moduleKey, action: 'create', record });
            continue;
        }
        const previous = oldMap.get(id);
        if (!recordsEqual(previous, record)) {
            changes.push({ moduleKey, action: 'update', record, previous });
            const previousStatus = String(previous?.status || '').trim().toLowerCase();
            const nextStatus = String(record?.status || '').trim().toLowerCase();
            if (nextStatus === 'approved' && previousStatus !== 'approved') {
                changes.push({ moduleKey, action: 'approve', record });
            }
        }
    }

    for (const [id, record] of oldMap.entries()) {
        if (!newMap.has(id)) changes.push({ moduleKey, action: 'delete', record });
    }

    return changes.filter((change) => change.moduleKey && change.moduleKey !== '__dynamic__');
}

function collectStateWriteChanges(oldState, newState, registry, user) {
    const changes = [];
    [...BUSINESS_STATE_ARRAY_KEYS, ...GLOBAL_STATE_ARRAY_KEYS].forEach((collection) => {
        changes.push(...summarizeArrayChanges(
            oldState[collection],
            newState[collection],
            getModuleKeyForStateCollection(collection),
            registry,
            user
        ));
    });

    const bankKeys = new Set([...Object.keys(oldState.bankRental || {}), ...Object.keys(newState.bankRental || {})]);
    bankKeys.forEach((key) => {
        changes.push(...summarizeArrayChanges(oldState.bankRental?.[key], newState.bankRental?.[key], 'bankRental', registry, user));
    });

    const dynamicKeys = new Set([...Object.keys(oldState.dynamicModuleRecords || {}), ...Object.keys(newState.dynamicModuleRecords || {})]);
    dynamicKeys.forEach((key) => {
        changes.push(...summarizeArrayChanges(oldState.dynamicModuleRecords?.[key], newState.dynamicModuleRecords?.[key], key, registry, user));
    });

    if (!recordsEqual(oldState.categories, newState.categories) || !recordsEqual(oldState.paymentTypes, newState.paymentTypes)) {
        changes.push({ moduleKey: 'settings', action: 'update', record: {} });
    }
    return changes;
}

function collectIncomingBusinessRecords(payload = {}) {
    const records = [];
    OWNED_STATE_ARRAY_KEYS.forEach((collection) => {
        (Array.isArray(payload[collection]) ? payload[collection] : []).forEach((record) => {
            records.push({ moduleKey: getModuleKeyForStateCollection(collection), record });
        });
    });
    Object.entries(payload.bankRental || {}).forEach(([, value]) => {
        (Array.isArray(value) ? value : []).forEach((record) => {
            records.push({ moduleKey: 'bankRental', record });
        });
    });
    Object.entries(payload.dynamicModuleRecords || {}).forEach(([moduleKey, value]) => {
        (Array.isArray(value) ? value : []).forEach((record) => {
            records.push({ moduleKey, record });
        });
    });
    return records;
}

function isOwnershipEnforcedModule(moduleKey) {
    return moduleKey !== 'settings';
}

function assertIncomingOwnershipClaims(payload, user) {
    const explicitOwnerFields = ['owner_id', 'ownerId', 'user_id', 'userId', 'registeredId', 'registered_id', 'trackingId', 'tracking_id', 'createdBy', 'created_by'];
    for (const { moduleKey, record } of collectIncomingBusinessRecords(payload)) {
        if (!record || typeof record !== 'object') continue;
        const claims = explicitOwnerFields
            .map((field) => normalizeRegisteredId(record[field]))
            .filter(Boolean);
        if (claims.length) {
            throw new Error(`${moduleKey} ownership must be assigned from the authenticated JWT user.`);
        }
    }
}

function assertStateWritePermissions(oldState, newState, registry, user) {
    const changes = collectStateWriteChanges(oldState, newState, registry, user);
    for (const change of changes) {
        if (!canUserAccessModule(change.moduleKey, user, registry)) {
            throw new Error(`${change.moduleKey} access denied.`);
        }
        if (!hasActionPermission(user, change.action, change.moduleKey)) {
            throw new Error(`${change.action} denied.`);
        }
        if (isOwnershipEnforcedModule(change.moduleKey) && change.action === 'update') {
            const previousOwner = getRecordOwner(change.previous);
            const nextOwner = getRecordOwner(change.record);
            if (previousOwner && nextOwner && previousOwner !== nextOwner) {
                throw new Error(`${change.moduleKey} ownership cannot be transferred.`);
            }
        }
        if (isOwnershipEnforcedModule(change.moduleKey) && change.action !== 'delete') {
            const owner = getRecordOwner(change.record);
            const payloadUserId = normalizeRegisteredId(change.record?.user_id);
            const actorId = normalizeRegisteredId(user?.registeredId || user?.email);
            if (!isSuperAdminUser(user) && owner === SUPERADMIN_ID) {
                throw new Error(`${change.moduleKey} records cannot be owned by SuperAdmin.`);
            }
            if (change.action === 'create' && !isSuperAdminUser(user) && owner !== actorId) {
                throw new Error(`${change.moduleKey} new record ownership must match the authenticated user.`);
            }
            if (isSuperAdminUser(user) && !owner) {
                continue;
            }
            if (!payloadUserId || payloadUserId !== owner) {
                throw new Error(`${change.moduleKey} records must include matching user_id ownership.`);
            }
            if (!owner) {
                throw new Error(`${change.moduleKey} records must keep the original user owner.`);
            }
        }
    }
}

function getDynamicModuleDefinitions(state) {
    return normalizeModuleRegistry(state.moduleRegistry).filter((module) => !module.builtIn);
}

function isSharedDynamicModule(module) {
    return Boolean(module && !module.builtIn && module.visibilityMode === 'shared');
}

function canUserAccessDynamicModule(module, user) {
    if (isSuperAdminUser(user)) return true;
    if (!module || module.access === 'management') return false;
    const moduleId = module.id || module.module_key || module.moduleKey;
    return Boolean(moduleId && (user?.permissions?.modules || []).includes(moduleId));
}

const BUSINESS_STATE_ARRAY_KEYS = [
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
const GLOBAL_STATE_ARRAY_KEYS = [];
const OWNED_STATE_ARRAY_KEYS = BUSINESS_STATE_ARRAY_KEYS;
const USER_WRITABLE_STATE_ARRAY_KEYS = [
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
const SHARED_COMPANY_STATE_ARRAY_KEYS = new Set([]);
const SHARED_VIEW_ALL_STATE_ARRAY_KEYS = new Set([]);
const USER_HIDDEN_STATE_ARRAY_KEYS = OWNED_STATE_ARRAY_KEYS.filter((key) => !USER_WRITABLE_STATE_ARRAY_KEYS.includes(key));
const EMPLOYEE_SENSITIVE_FIELDS = [
    'wages',
    'salary',
    'paymentRecord',
    'payroll',
    'cost',
    'rate',
    'hourlyRate',
    'monthlySalary',
    'bankAccount',
    'icNumber',
    'passportNumber'
];
const EMPLOYEE_PHOTO_FIELDS = [
    'photo',
    'photoData',
    'photoUrl',
    'image',
    'imageData',
    'avatar',
    'avatarUrl'
];
const BANK_RENTAL_PRIVATE_FIELDS = [
    'amount',
    'price',
    'cost',
    'total',
    'internalTotal',
    'remainingBalance',
    'settledAmount',
    'outstanding',
    'issueNotes',
    'settlementStatus'
];

function sanitizeBankRentalForUser(record) {
    const safe = { ...record };
    BANK_RENTAL_PRIVATE_FIELDS.forEach((key) => {
        delete safe[key];
    });
    return safe;
}

function sanitizeEmployeeForUser(record = {}) {
    const safe = { ...record };
    EMPLOYEE_SENSITIVE_FIELDS.forEach((key) => {
        delete safe[key];
    });
    return safe;
}

function canViewEmployeeSensitiveFields(user) {
    if (isSuperAdminUser(user)) return true;
    return normalizeRole(user?.role || user?.accountRole) === 'admin';
}

function preserveEmployeeSensitiveFields(existingRecord, incomingRecord) {
    const next = { ...incomingRecord };
    [...EMPLOYEE_SENSITIVE_FIELDS, ...EMPLOYEE_PHOTO_FIELDS].forEach((key) => {
        if (existingRecord && Object.prototype.hasOwnProperty.call(existingRecord, key)) {
            next[key] = existingRecord[key];
        } else {
            delete next[key];
        }
    });
    return next;
}

function filterBankRentalCollectionForUser(tabId, records = []) {
    const safeRecords = Array.isArray(records) ? records : [];
    return tabId === 'block' ? safeRecords.map((record) => ({ ...record })) : safeRecords.map(sanitizeBankRentalForUser);
}

function publicBankRentalRecordsEqual(oldRecord, incomingRecord) {
    const safeOld = sanitizeBankRentalForUser(oldRecord || {});
    const safeIncoming = sanitizeBankRentalForUser(incomingRecord || {});
    return Object.entries(safeOld).every(([key, value]) => {
        if (!Object.prototype.hasOwnProperty.call(safeIncoming, key)) return true;
        return recordsEqual(value, safeIncoming[key]);
    });
}

function preserveBankRentalPrivateFields(existingRecord, incomingRecord) {
    const next = { ...incomingRecord };
    BANK_RENTAL_PRIVATE_FIELDS.forEach((key) => {
        if (existingRecord && Object.prototype.hasOwnProperty.call(existingRecord, key) && !Object.prototype.hasOwnProperty.call(next, key)) {
            next[key] = existingRecord[key];
        }
    });
    if (!Object.prototype.hasOwnProperty.call(next, 'amount')) next.amount = 0;
    if (!Object.prototype.hasOwnProperty.call(next, 'remainingBalance')) next.remainingBalance = 0;
    if (!Object.prototype.hasOwnProperty.call(next, 'settledAmount')) next.settledAmount = 0;
    if (!Object.prototype.hasOwnProperty.call(next, 'outstanding')) next.outstanding = 0;
    return next;
}

function preserveRecordOwner(record) {
    const owner = getRecordOwner(record);
    if (owner) applyRecordOwner(record, owner);
    return record;
}

function ensureOwnedArray(records) {
    return (Array.isArray(records) ? records : []).map((record) => {
        preserveRecordOwner(record);
        return record;
    });
}

function migrateStateOwnership(state) {
    const next = cloneState(state);
    OWNED_STATE_ARRAY_KEYS.forEach((key) => {
        next[key] = (Array.isArray(next[key]) ? next[key] : []).map((record) => {
            return preserveRecordOwner(record);
        });
    });
    next.bankRental = next.bankRental || getDefaultState().bankRental;
    Object.keys(next.bankRental).forEach((key) => {
        next.bankRental[key] = (Array.isArray(next.bankRental[key]) ? next.bankRental[key] : []).map((record) => {
            return preserveRecordOwner(record);
        });
    });
    next.displayModules = {
        expenses: true,
        bankRental: true,
        ...(next.displayModules || {})
    };
    next.moduleRegistry = normalizeModuleRegistry(next.moduleRegistry);
    next.dynamicModuleRecords = next.dynamicModuleRecords && typeof next.dynamicModuleRecords === 'object'
        ? next.dynamicModuleRecords
        : {};
    getDynamicModuleDefinitions(next).forEach((module) => {
        next.dynamicModuleRecords[module.id] = (Array.isArray(next.dynamicModuleRecords[module.id]) ? next.dynamicModuleRecords[module.id] : []).map((record) => {
            return preserveRecordOwner(record);
        });
    });
    delete next.ownershipMigrationVersion;
    return next;
}

function filterStateForUser(state, user, registry = []) {
    const fullState = migrateStateOwnership(state);
    if (isSuperAdminUser(user)) return fullState;

    const ownerId = normalizeRegisteredId(user.registeredId || user.email);
    const visible = cloneState(fullState);
    USER_WRITABLE_STATE_ARRAY_KEYS.forEach((key) => {
        const moduleKey = getModuleKeyForStateCollection(key);
        const canRead = canUserAccessModule(moduleKey, user, registry) && hasActionPermission(user, 'read', moduleKey);
        if (key === 'employees') {
            visible[key] = canRead
                ? (fullState[key] || []).map((record) => canViewEmployeeSensitiveFields(user) ? { ...record } : sanitizeEmployeeForUser(record))
                : [];
            return;
        }
        if (key === 'schedules') {
            visible[key] = canRead ? (fullState[key] || []).map((record) => ({ ...record })) : [];
            return;
        }
        visible[key] = canRead
            ? (fullState[key] || []).filter((record) => getRecordOwner(record) === ownerId)
            : [];
    });
    USER_HIDDEN_STATE_ARRAY_KEYS.forEach((key) => {
        visible[key] = [];
    });
    const canViewBankRental = canUserAccessModule('bankRental', user, registry) && hasActionPermission(user, 'read', 'bankRental');
    visible.bankRental = canViewBankRental
        ? {
            ...fullState.bankRental,
            ...Object.fromEntries(Object.entries(fullState.bankRental || {}).map(([key, records]) => [
                key,
                filterBankRentalCollectionForUser(key, records)
            ])),
            bankRental: filterBankRentalCollectionForUser('bankRental', fullState.bankRental.bankRental || [])
        }
        : getDefaultState().bankRental;
    visible.dynamicModuleRecords = {};
    getDynamicModuleDefinitions(fullState).forEach((module) => {
        const records = fullState.dynamicModuleRecords?.[module.id] || [];
        visible.dynamicModuleRecords[module.id] = !canUserAccessDynamicModule(module, user) || !hasActionPermission(user, 'read', module.id)
            ? []
            : isSharedDynamicModule(module)
            ? records.map((record) => ({ ...record }))
            : records.filter((record) => getRecordOwner(record) === ownerId);
    });
    return visible;
}

function recordsEqual(a, b) {
    return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

function mergeOwnedCollection(oldRecords = [], incomingRecords = [], ownerId, collectionName) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const oldById = new Map(oldList.map((record) => [record.id, record]));
    const next = oldList.filter((record) => getRecordOwner(record) !== normalizedOwner);

    for (const record of incomingList) {
        const existing = record.id ? oldById.get(record.id) : null;
        if (existing && getRecordOwner(existing) !== normalizedOwner) {
            throw new Error(`Cannot modify another user's ${collectionName} record.`);
        }
        const nextRecord = collectionName === 'employees'
            ? preserveEmployeeSensitiveFields(existing, record)
            : { ...record };
        next.push(applyRecordOwner(nextRecord, normalizedOwner));
    }
    return next;
}

function mergeGloballyVisibleOwnedCollection(oldRecords = [], incomingRecords = [], ownerId, collectionName) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const oldById = new Map(oldList.map((record) => [record.id, record]).filter(([id]) => id));
    const next = oldList.filter((record) => getRecordOwner(record) !== normalizedOwner);

    for (const record of incomingList) {
        const existing = record.id ? oldById.get(record.id) : null;
        if (existing && getRecordOwner(existing) !== normalizedOwner) {
            continue;
        }
        const nextRecord = collectionName === 'employees'
            ? preserveEmployeeSensitiveFields(existing, record)
            : { ...record };
        next.push(applyRecordOwner(nextRecord, normalizedOwner));
    }
    return next;
}

function mergeSharedEditableOwnedCollection(oldRecords = [], incomingRecords = [], ownerId, collectionName) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const incomingById = new Map(incomingList.map((record) => [record.id, record]).filter(([id]) => id));
    const next = [];

    for (const oldRecord of oldList) {
        const owner = getRecordOwner(oldRecord);
        const incoming = oldRecord.id ? incomingById.get(oldRecord.id) : null;
        if (!incoming) {
            if (owner !== normalizedOwner) next.push(oldRecord);
            continue;
        }
        const merged = collectionName === 'employees'
            ? preserveEmployeeSensitiveFields(oldRecord, { ...oldRecord, ...incoming })
            : { ...oldRecord, ...incoming };
        next.push(applyRecordOwner(merged, owner || normalizedOwner));
        incomingById.delete(oldRecord.id);
    }

    for (const record of incomingById.values()) {
        const nextRecord = collectionName === 'employees'
            ? preserveEmployeeSensitiveFields(null, record)
            : { ...record };
        next.push(applyRecordOwner(nextRecord, normalizedOwner));
    }
    return next;
}

function mergeSharedCompanyCollection(oldRecords = [], incomingRecords = []) {
    const oldList = Array.isArray(oldRecords) ? oldRecords : [];
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const oldById = new Map(oldList.map((record) => [record.id, record]).filter(([id]) => id));
    return incomingList.map((record, index) => {
        const existing = record.id ? oldById.get(record.id) : null;
        return stripRecordOwnership({
            ...(existing || {}),
            ...record,
            id: record.id || existing?.id || `emp_${Date.now()}_${index}`
        });
    });
}

function mergeSharedOwnedCollection(oldRecords = [], incomingRecords = [], ownerId, collectionName) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const incomingById = new Map(incomingList.map((record) => [record.id, record]).filter(([id]) => id));
    const next = [];

    for (const oldRecord of oldList) {
        const owner = getRecordOwner(oldRecord);
        const incoming = oldRecord.id ? incomingById.get(oldRecord.id) : null;
        if (!incoming) {
            next.push(oldRecord);
            continue;
        }
        const nextOwner = owner || getRecordOwner(incoming) || normalizedOwner;
        next.push(applyRecordOwner({ ...oldRecord, ...incoming }, nextOwner));
        incomingById.delete(oldRecord.id);
    }

    for (const record of incomingById.values()) {
        next.push(applyRecordOwner({ ...record }, normalizedOwner));
    }
    return next;
}

function mergeSharedBankRental(oldRecords = [], incomingRecords = [], ownerId) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const incomingById = new Map(incomingList.map((record) => [record.id, record]).filter(([id]) => id));
    const next = [];

    for (const oldRecord of oldList) {
        const incoming = oldRecord.id ? incomingById.get(oldRecord.id) : null;
        const originalOwner = getRecordOwner(oldRecord);
        if (!incoming) {
            if (originalOwner !== normalizedOwner) next.push(oldRecord);
            continue;
        }
        if (originalOwner !== normalizedOwner) {
            const nextRecord = preserveBankRentalPrivateFields(oldRecord, { ...oldRecord, ...incoming });
            next.push(applyRecordOwner(nextRecord, originalOwner));
            incomingById.delete(oldRecord.id);
            continue;
        }
        const nextRecord = preserveBankRentalPrivateFields(oldRecord, { ...oldRecord, ...incoming });
        next.push(applyRecordOwner(nextRecord, originalOwner));
        incomingById.delete(oldRecord.id);
    }

    for (const record of incomingById.values()) {
        next.push(applyRecordOwner(preserveBankRentalPrivateFields(null, record), normalizedOwner));
    }
    return next;
}

function mergeSharedBankRentalBlock(oldRecords = [], incomingRecords = [], ownerId) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const incomingById = new Map(incomingList.map((record) => [record.id, record]).filter(([id]) => id));
    const next = [];

    for (const oldRecord of oldList) {
        const owner = getRecordOwner(oldRecord);
        const incoming = oldRecord.id ? incomingById.get(oldRecord.id) : null;
        if (!incoming) {
            if (owner !== normalizedOwner) next.push(oldRecord);
            continue;
        }
        const nextOwner = owner || getRecordOwner(incoming) || (normalizedOwner !== SUPERADMIN_ID ? normalizedOwner : '');
        next.push(applyRecordOwner({ ...oldRecord, ...incoming }, nextOwner));
        incomingById.delete(oldRecord.id);
    }

    for (const record of incomingById.values()) {
        let owner = getRecordOwner(record);
        if (!owner && normalizedOwner !== SUPERADMIN_ID) owner = normalizedOwner;
        next.push(applyRecordOwner({ ...record }, owner));
    }
    return next;
}

function mergeSharedDynamicCollection(oldRecords = [], incomingRecords = [], ownerId) {
    const normalizedOwner = normalizeRegisteredId(ownerId);
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const incomingById = new Map(incomingList.map((record) => [record.id, record]).filter(([id]) => id));
    const next = [];

    for (const oldRecord of oldList) {
        const owner = getRecordOwner(oldRecord);
        const incoming = oldRecord.id ? incomingById.get(oldRecord.id) : null;
        if (incoming) {
            next.push(applyRecordOwner({ ...oldRecord, ...incoming }, owner));
            incomingById.delete(oldRecord.id);
            continue;
        }
        if (owner !== normalizedOwner) {
            next.push(oldRecord);
        }
    }

    for (const record of incomingById.values()) {
        next.push(applyRecordOwner({ ...record }, normalizedOwner));
    }
    return next;
}

function mergeSuperAdminOwnedCollection(oldRecords = [], incomingRecords = [], createOwnerId = '') {
    const oldList = ensureOwnedArray(oldRecords);
    const incomingList = Array.isArray(incomingRecords) ? incomingRecords : [];
    const oldById = new Map(oldList.map((record) => [record.id, record]).filter(([id]) => id));
    const createOwner = normalizeRegisteredId(createOwnerId);
    return incomingList.map((record) => {
        const existing = record.id ? oldById.get(record.id) : null;
        const owner = getRecordOwner(existing) || createOwner;
        if (!owner) {
            throw new Error('SuperAdmin cannot create ownerless records. Select a user context before creating records.');
        }
        const nextRecord = { ...(existing || {}), ...record };
        return applyRecordOwner(nextRecord, owner);
    });
}

function mergeSuperAdminDynamicRecords(oldFull, incomingState, createOwnerId = '') {
    const next = { ...(oldFull.dynamicModuleRecords || {}) };
    const incoming = incomingState.dynamicModuleRecords || {};
    const moduleIds = new Set([
        ...Object.keys(next),
        ...Object.keys(incoming),
        ...getDynamicModuleDefinitions(oldFull).map((module) => module.id)
    ]);
    moduleIds.forEach((moduleId) => {
        next[moduleId] = mergeSuperAdminOwnedCollection(next[moduleId], incoming[moduleId], createOwnerId);
    });
    return next;
}

function mergeSuperAdminBankRental(oldBankRental = {}, incomingBankRental = {}, createOwnerId = '') {
    const next = { ...(oldBankRental || {}) };
    const tabIds = new Set([...Object.keys(next), ...Object.keys(incomingBankRental || {})]);
    tabIds.forEach((tabId) => {
        next[tabId] = mergeSuperAdminOwnedCollection(oldBankRental?.[tabId], incomingBankRental?.[tabId], createOwnerId);
    });
    return next;
}

function mergeUserState(oldState, incomingState, user) {
    const oldFull = migrateStateOwnership(oldState);
    const ownerId = normalizeRegisteredId(user.registeredId || user.email);
    const sharedBankRentalMutations = new Set(Array.isArray(incomingState.__sharedBankRentalMutations)
        ? incomingState.__sharedBankRentalMutations.map((item) => String(item || '').trim()).filter(Boolean)
        : []);

    if (isSuperAdminUser(user)) {
        const superAdminCreateOwner = normalizeRegisteredId(user.selectedUserContext);
        const next = migrateStateOwnership({
            ...incomingState,
            dynamicModuleRecords: mergeSuperAdminDynamicRecords(oldFull, incomingState, superAdminCreateOwner)
        });
        delete next.__sharedBankRentalMutations;
        delete next.__selectedUserContext;
        BUSINESS_STATE_ARRAY_KEYS.forEach((key) => {
            next[key] = mergeSuperAdminOwnedCollection(oldFull[key], incomingState[key], superAdminCreateOwner);
        });
        GLOBAL_STATE_ARRAY_KEYS.forEach((key) => {
            next[key] = mergeSharedCompanyCollection(oldFull[key], incomingState[key]);
        });
        next.bankRental = mergeSuperAdminBankRental(oldFull.bankRental, incomingState.bankRental, superAdminCreateOwner);
        if (!sharedBankRentalMutations.has('block')) {
            next.bankRental = { ...next.bankRental, block: oldFull.bankRental?.block || [] };
        } else {
            next.bankRental = {
                ...next.bankRental,
                block: mergeSharedBankRentalBlock(oldFull.bankRental?.block, incomingState.bankRental?.block, ownerId)
            };
        }
        return migrateStateOwnership(next);
    }

    const next = cloneState(oldFull);
    delete next.__sharedBankRentalMutations;
    delete next.__selectedUserContext;
    USER_WRITABLE_STATE_ARRAY_KEYS.forEach((key) => {
        next[key] = key === 'employees' || key === 'schedules'
            ? mergeSharedEditableOwnedCollection(oldFull[key], incomingState[key], ownerId, key)
            : SHARED_COMPANY_STATE_ARRAY_KEYS.has(key)
            ? mergeSharedCompanyCollection(oldFull[key], incomingState[key])
            : SHARED_VIEW_ALL_STATE_ARRAY_KEYS.has(key)
            ? mergeSharedOwnedCollection(oldFull[key], incomingState[key], ownerId, key)
            : mergeOwnedCollection(oldFull[key], incomingState[key], ownerId, key);
    });
    next.bankRental = { ...oldFull.bankRental };
    Object.keys(next.bankRental).forEach((key) => {
        next.bankRental[key] = key === 'block'
            ? (sharedBankRentalMutations.has('block')
                ? mergeSharedBankRentalBlock(oldFull.bankRental?.block, incomingState.bankRental?.block, ownerId)
                : oldFull.bankRental?.block || [])
            : mergeSharedBankRental(oldFull.bankRental?.[key], incomingState.bankRental?.[key], ownerId);
    });
    next.moduleRegistry = normalizeModuleRegistry(oldFull.moduleRegistry);
    next.dynamicModuleRecords = { ...(oldFull.dynamicModuleRecords || {}) };
    getDynamicModuleDefinitions(oldFull).forEach((module) => {
        if (!canUserAccessDynamicModule(module, user)) return;
        next.dynamicModuleRecords[module.id] = isSharedDynamicModule(module)
            ? mergeSharedEditableOwnedCollection(oldFull.dynamicModuleRecords?.[module.id], incomingState.dynamicModuleRecords?.[module.id], ownerId, module.label || module.id)
            : mergeOwnedCollection(oldFull.dynamicModuleRecords?.[module.id], incomingState.dynamicModuleRecords?.[module.id], ownerId, module.label || module.id);
    });
    return migrateStateOwnership(next);
}

// State retrieval API
app.get('/api/state', authenticateToken, async (req, res) => {
    let state = await db.getState();
    if (!state) {
        state = getDefaultState();
    }
    const migrated = migrateStateOwnership(state);

    const registry = await getCentralModuleRegistry();
    const user = {
        ...req.user,
        permissions: filterPermissionsForRegistry(req.user.permissions, registry, req.user)
    };
    return res.json({ success: true, state: filterDisabledModuleData(filterStateForUser(migrated, user, registry), registry) });
});

// Diffing helper to automatically generate audit logs
function diffStates(oldState, newState, actor = {}) {
    const logs = [];
    const actorRegisteredId = normalizeRegisteredId(actor.registeredId || actor.email);
    const actorName = actor.displayName || actor.display_name || actorRegisteredId;

    function makeDetails(module, action, record, summary) {
        const targetOwnerId = getRecordOwner(record);
        return JSON.stringify({
            actorRegisteredId,
            actorName,
            targetOwnerId,
            action,
            module,
            summary,
            recordId: record?.id || ''
        });
    }
    
    function getEmployeeName(id) {
        const emp = (newState.employees || []).find(e => e.id === id) || (oldState.employees || []).find(e => e.id === id);
        return emp ? emp.name : 'Unknown Employee';
    }

    function diffCollection(name, oldArr = [], newArr = [], getNameFn, options = {}) {
        const oldMap = new Map((oldArr || []).map(x => [x.id, x]));
        const newMap = new Map((newArr || []).map(x => [x.id, x]));
        
        // Added
        for (const [id, item] of newMap) {
            if (!oldMap.has(id)) {
                const summary = `Added: ${getNameFn(item)}`;
                logs.push({
                    action: `Added ${name}`,
                    details: options.structured ? makeDetails(name, 'add', item, summary) : summary
                });
            } else {
                // Updated
                const oldItem = oldMap.get(id);
                const changes = [];
                for (const key of Object.keys(item)) {
                    if (['createdAt', 'updatedAt', 'balance', 'fundIn', 'fundOut', 'currentBalance', 'netAmount'].includes(key)) continue;
                    if (JSON.stringify(oldItem[key]) !== JSON.stringify(item[key])) {
                        changes.push(options.fieldNamesOnly ? key : `${key}: "${oldItem[key]}" -> "${item[key]}"`);
                    }
                }
                if (changes.length > 0) {
                    const summary = `Modified ${getNameFn(item)}: ${changes.join(', ')}`;
                    logs.push({
                        action: `Updated ${name}`,
                        details: options.structured ? makeDetails(name, 'edit', item, summary) : summary
                    });
                }
            }
        }
        
        // Deleted
        for (const [id, item] of oldMap) {
            if (!newMap.has(id)) {
                const summary = `Deleted: ${getNameFn(item)}`;
                logs.push({
                    action: `Deleted ${name}`,
                    details: options.structured ? makeDetails(name, 'delete', item, summary) : summary
                });
            }
        }
    }

    diffCollection('Employee', oldState.employees, newState.employees, x => x.name || x.id);
    diffCollection('Schedule', oldState.schedules, newState.schedules, x => `${getEmployeeName(x.employeeId)} on ${x.startDate || x.date || 'unknown'}`);
    diffCollection('Debt', oldState.debts, newState.debts, x => `Debt for ${getEmployeeName(x.employeeId)}: MYR ${x.amount || 0}`);
    diffCollection('Claim', oldState.reimbursementClaims, newState.reimbursementClaims, x => `Claim: MYR ${x.amount || 0} (${x.status || 'Pending'})`, { structured: true, fieldNamesOnly: true });
    diffCollection('Expense', oldState.expenses, newState.expenses, x => `${x.category || 'General'} expense: MYR ${x.amount || 0} - "${x.description}"`);
    diffCollection('Calendar Event', oldState.calendarEvents, newState.calendarEvents, x => `${x.title || 'Event'} on ${x.date || 'unknown'}`);
    diffCollection('Company Payments', oldState.payments, newState.payments, x => `Payment to ${x.recipient}: MYR ${x.amount || 0} (${x.status})`, { structured: true });
    diffCollection('Fund Account', oldState.fundAccounts, newState.fundAccounts, x => `${x.name} (Initial: MYR ${x.initialBalance})`);
    diffCollection('ATM Cash Record', oldState.atmCashRecords, newState.atmCashRecords, x => `${x.date} - ${x.fundIn ? 'Fund In: MYR ' + x.fundIn : 'Fund Out: MYR ' + x.fundOut}`);
    diffCollection('Module Configuration', oldState.moduleRegistry, newState.moduleRegistry, x => `${x.label || x.id || 'Module'} configuration`, { structured: true, fieldNamesOnly: true });
    
    // Diff Bank Rental
    const oldRental = oldState.bankRental?.bankRental || [];
    const newRental = newState.bankRental?.bankRental || [];
    diffCollection('Bank Rental', oldRental, newRental, x => `${x.name} (${x.bankName} - ${x.bankType})`, { structured: true });

    return logs;
}

async function resolveSelectedUserContext(selectedUserContext, actor) {
    const selected = normalizeRegisteredId(selectedUserContext);
    if (!selected || !isSuperAdminUser(actor)) return '';
    const contextUser = await db.getUserByEmail(selected);
    if (!contextUser || contextUser.status === 'disabled' || isSuperAdminUser(contextUser)) {
        throw new Error('Invalid selected user context.');
    }
    return normalizeRegisteredId(contextUser.registered_id || contextUser.email);
}

// State write API. Server-side ownership rules decide which records can be changed.
async function handleStateSave(req, res) {
    let oldState = await db.getState();
    if (!oldState) {
        oldState = getDefaultState();
    }
    oldState = migrateStateOwnership(oldState);
    let newState;
    const registry = await getCentralModuleRegistry();
    let user;
    try {
        const selectedUserContext = await resolveSelectedUserContext(req.body?.__selectedUserContext, req.user);
        user = {
            ...req.user,
            selectedUserContext,
            permissions: filterPermissionsForRegistry(req.user.permissions, registry, req.user)
        };
        assertIncomingOwnershipClaims(req.body || {}, user);
        newState = mergeUserState(oldState, req.body || {}, user);
        assertEnabledModuleWrites(oldState, newState, registry);
        assertStateWritePermissions(oldState, newState, registry, user);
    } catch (error) {
        return sendForbidden(res);
    }

    // Run automatic state diffing
    const changes = diffStates(oldState, newState, req.user);

    // Save state to database
    await db.saveState(newState);

    // Insert audit logs
    for (const change of changes) {
        await db.addAuditLog(req.user.registeredId || req.user.email, req.user.role, change.action, change.details);
    }

    return res.json({ success: true, state: filterDisabledModuleData(filterStateForUser(newState, user, registry), registry) });
}

app.post('/api/state', authenticateToken, handleStateSave);
app.put('/api/state', authenticateToken, handleStateSave);

// Audit Log retrieval API (Admin + Viewer)
app.get('/api/audit-logs', authenticateToken, requireModulePermission('loginAudit', 'read'), async (req, res) => {
    const logs = await db.getAuditLogs();
    return res.json({ success: true, logs });
});

app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API route not found'
    });
});

// Serve static frontend files
app.use(express.static(__dirname));

// Custom fallback routing for direct HTML access
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/viewer.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'viewer.html'));
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize and start server
db.initDb().then(async () => {
    await ensureSuperAdminUser();
    app.listen(PORT, () => {
        console.log(`WorkerTracker backend server running on port: ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database before launching Express:', err);
    process.exit(1);
});
