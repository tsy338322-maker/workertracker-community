// ============================================
// ROLE-BASED ACCESS CONTROL SYSTEM
import "./workspace-config.js";
import {
    clearAuthLogs,
    createModule,
    createManagementUser,
    deleteModule,
    deleteManagementUser,
    downloadReportPdf,
    getCustomModuleAccess,
    getCurrentUser,
    getDisplayModules,
    getRoleTemplates,
    getUserProfile,
    listReportHistory,
    listAuthLogs,
    listUsers,
    logoutAdmin,
    requireAdmin,
    resetManagementUserPassword,
    updateModule,
    updateDisplayModule,
    updateManagementUser,
    updateManagementUserPermissions,
    updateManagementUserStatus,
    updateRoleTemplate
} from "./auth.js";

// ============================================

const ROLE_KEY = "workertracker_role";
const LANGUAGE_KEY = "workertracker_language";
const SUPPORTED_CURRENCY = "MYR";
const WORKSPACE_CONFIG = globalThis.WorkerTrackerWorkspaceConfig;
const EXPENSE_CATEGORIES = [
    "Fuel",
    "Transport",
    "Parking",
    "Meal",
    "Delivery",
    "Materials",
    "Office Supplies",
    "Staff Welfare",
    "Reimbursement",
    "Other"
];
const LEAVE_TYPES = [
    "Holiday",
    "Sick",
    "On Leave",
    "Emergency Leave",
    "Unpaid Leave",
    "Other"
];
const pageAccess = document.body.dataset.access || (location.pathname.toLowerCase().includes("viewer") ? "user" : "super");
let currentLanguage = "en";

const translations = {
    zh: {
        "Mode": "模式",
        "Admin": "管理员",
        "Viewer": "查看者",
        "Dashboard": "仪表板",
        "Employees": "员工",
        "Employee": "员工",
        "Employee Count": "员工总数",
        "Photo": "照片",
        "Employee Photo": "员工照片",
        "Wages": "工钱",
        "Salary / wages / payment record": "薪资 / 工钱 / 付款记录",
        "Payment Record": "付款记录",
        "Schedules": "排班",
        "Schedule": "排班",
        "Schedule Count": "排班总数",
        "Schedule Records": "排班记录",
        "Debt Tracking": "债务追踪",
        "Expenses": "费用",
        "Expenses Detail": "费用详情",
        "Reimbursement Claims": "报销申请",
        "Reimbursement Claims Detail": "报销申请详情",
        "Reimbursements": "报销",
        "Company Payments": "公司付款",
        "Company Payments Detail": "公司付款详情",
        "Company Payments Total": "公司付款总额",
        "Bank Rental": "银行租赁",
        "Add Rental": "新增租赁",
        "Edit Rental": "编辑租赁",
        "Bank Type": "银行类型",
        "Bank Name": "银行名称",
        "Bank Status": "银行状态",
        "Agent Name": "代理名称",
        "Bank Detail": "银行资料",
        "Start Date": "开始日期",
        "End Date": "结束日期",
        "Amount (MYR)": "金额 (MYR)",
        "Remaining Balance": "剩余余额",
        "Settled Amount": "已结金额",
        "Outstanding": "未结余额",
        "Issue Notes": "问题备注",
        "Settlement Status": "结算状态",
        "None": "无",
        "Normal": "正常",
        "Issue": "问题",
        "Settled": "已结",
        "Partial": "部分结算",
        "Unsettled": "未结",
        "Total Rental Amount": "租赁总金额",
        "Total Rental": "总租赁",
        "This Month Rental": "本月租赁",
        "Active Records": "活跃记录",
        "Latest Transaction": "最新交易",
        "Total Remaining Balance": "剩余余额总额",
        "Total Settled Amount": "已结金额总额",
        "Total Outstanding": "未结余额总额",
        "Created Date": "创建日期",
        "TOTAL RENTAL": "总租赁",
        "Search": "搜索",
        "Sort By": "排序",
        "Direction": "方向",
        "Ascending": "升序",
        "Descending": "降序",
        "Print": "打印",
        "ATM Cash": "ATM 现金",
        "ATM Total Fund In": "ATM 资金收入总额",
        "ATM Total Fund Out": "ATM 资金支出总额",
        "ATM Current Balance": "ATM 当前余额",
        "Current Balance": "当前余额",
        "Funds": "资金",
        "Funds Detail": "资金详情",
        "Reports": "报表",
        "Monthly Summary": "每月汇总",
        "Monthly Claims": "每月报销",
        "Monthly Closing": "每月结算",
        "Database Archive": "数据库归档",
        "Database Detail": "数据库详情",
        "Settings": "设置",
        "Supported Currency": "支持货币",
        "Global Categories": "全局类别",
        "Payment Types": "付款类型",
        "Manual Clear Data": "手动清除资料",
        "Logout": "登出",
        "Dark / Light": "深色 / 浅色",
        "Export PDF": "导出 PDF",
        "Download PDF": "下载 PDF",
        "Total Records": "记录总数",
        "Total Amount": "总金额",
        "Record Count": "记录数量",
        "Latest Date": "最新日期",
        "This Month Total": "本月总额",
        "Summary / Totals": "汇总 / 总计",
        "Summary & Totals": "汇总 / 总计",
        "Total Employees": "员工总数",
        "Total Schedule Records": "排班记录总数",
        "Pending Reimbursements": "待处理报销",
        "Recent Activities": "最近活动",
        "Outstanding Debts": "未结债务",
        "Pending": "待处理",
        "Approved": "已批准",
        "Approve": "批准",
        "Rejected": "已拒绝",
        "Pending Payments": "待处理付款",
        "Approved Payments": "已批准付款",
        "Paid Payments": "已付款",
        "Approved Reimbursements": "已批准报销",
        "Funds Used": "已用资金",
        "Pending Company Payments": "待处理公司付款",
        "Approved Company Payments": "已批准公司付款",
        "Paid Company Payments": "已付款公司付款",
        "Fund In": "资金收入",
        "Fund Out": "资金支出",
        "Total Fund In": "资金收入总额",
        "Total Fund Out": "资金支出总额",
        "Net Funds": "净资金",
        "Balance": "余额",
        "Fund Snapshot": "资金快照",
        "Fund": "资金",
        "Net Balance": "净余额",
        "Date": "日期",
        "Date Range": "日期范围",
        "Name": "姓名",
        "Role": "职位",
        "Department": "部门",
        "Category": "类别",
        "Remark": "备注",
        "Reason": "原因",
        "Leave Type": "假期类型",
        "Status": "状态",
        "Worker": "员工",
        "Amount": "金额",
        "Description": "描述",
        "Source of Funds / Remark": "资金来源 / 备注",
        "Type": "类型",
        "Payment Method": "付款方式",
        "Notes": "备注",
        "Recipient": "收款人",
        "Detail": "详情",
        "Title": "标题",
        "Message": "信息",
        "Page": "页面",
        "Generated": "生成时间",
        "Filters": "筛选",
        "Any": "任何",
        "Report": "报表",
        "Payment": "付款",
        "Payments": "付款",
        "Fund Balance": "资金余额",
        "Total": "总计",
        "Count": "数量",
        "From": "开始",
        "To": "结束",
        "Reset": "重置",
        "No records to display": "没有记录可显示",
        "Please select a date or date range before downloading the Database PDF.": "下载数据库 PDF 前，请先选择日期或日期范围。",
        "Failed to generate PDF. Please check the browser console for details.": "无法生成 PDF。请检查浏览器控制台获取详情。",
        "Actions": "操作",
        "View": "查看",
        "View Detail": "查看详情",
        "Add Employee": "新增员工",
        "Add Shift": "新增排班",
        "Record Debt": "记录债务",
        "Add Expense": "新增费用",
        "Add Claim": "新增申请",
        "Add Payment": "新增付款",
        "Add Fund": "新增资金",
        "Add ATM Cash Record": "新增 ATM 现金记录",
        "Edit ATM Cash Record": "编辑 ATM 现金记录",
        "Add Category": "新增类别",
        "Add Type": "新增类型",
        "Edit": "编辑",
        "Delete": "删除",
        "Delete User": "删除用户",
        "Confirm Delete User": "确认删除用户？",
        "deleteUser": "删除用户",
        "employeePhoto": "员工照片",
        "wages": "工钱",
        "totalAmount": "总金额",
        "recordCount": "记录数量",
        "latestDate": "最新日期",
        "thisMonthTotal": "本月总额",
        "Enable": "启用",
        "Disable": "停用",
        "Refresh": "刷新",
        "Resolve": "解决",
        "Confirm": "确认",
        "Cancel": "取消",
        "Close": "关闭"
    }
};

function t(label) {
    return currentLanguage === "zh" ? translations.zh[label] || label : label;
}

const moduleLabels = {
    dashboard: "Dashboard",
    employees: "Employees",
    schedules: "Schedules",
    debts: "Debt Tracking",
    expenses: "Expenses",
    reimbursementClaims: "Reimbursement Claims",
    payments: "Company Payments",
    funds: "Funds",
    atmCash: "ATM Cash",
    bankRental: "Bank Rental",
    reports: "Reports",
    monthlySummary: "Monthly Summary",
    database: "Database",
    settings: "Settings",
    userManagement: "User Management",
    workforce: "Workforce",
    finance: "Finance",
    assets: "Assets",
    operations: "Operations",
    calendar: "Calendar",
    staffAccess: "User Access",
    displayModules: "Module Management",
    loginAudit: "Login Audit"
};

const SYSTEM_MODULE_REGISTRY = WORKSPACE_CONFIG.SYSTEM_MODULE_REGISTRY;
const MODULE_CATEGORIES = Array.from(new Map([
    ...WORKSPACE_CONFIG.WORKSPACE_NAVIGATION.map((module) => [module.id, module.label]),
    ...SYSTEM_MODULE_REGISTRY.map((module) => [module.category, WORKSPACE_CONFIG.WORKSPACE_NAVIGATION.find((item) => item.id === module.category)?.label || module.category])
]).entries());
const FIXED_MODULE_IDS = new Set(SYSTEM_MODULE_REGISTRY.map((module) => module.id || module.module_key));
const PROTECTED_MODULE_IDS = new Set(["dashboard", "settings", "userManagement", "staffAccess"]);
const SUPERADMIN_ONLY_MODULE_IDS = new Set(["userManagement", "staffAccess", "loginAudit"]);

// Role definitions with permissions
const roles = {
    super: {
        name: "Account",
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
        name: "Account",
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
        add: true,
        approve: false,
        modules: []
    },
    admin: {
        name: "Admin",
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
    }
};
const STAFF_ACCESS_ACTIONS = [
    ["read", "View"],
    ["create", "Add"],
    ["update", "Edit"],
    ["delete", "Delete"]
];
const PERMISSION_BOOLEAN_KEYS = ["add", "create", "read", "edit", "update", "delete", "export", "approve", "import", "settings", "database", "monthlyClosing", "ownerAdmin"];
const PERMISSION_LABELS = {
    add: "Add",
    create: "Create",
    read: "Read",
    edit: "Edit",
    update: "Update",
    delete: "Delete",
    export: "Export",
    approve: "Approve",
    import: "Import",
    settings: "Settings",
    database: "Database",
    monthlyClosing: "Monthly Closing",
    ownerAdmin: "Owner Administration"
};

let currentRole = "user";
let currentView = "dashboard";
let currentRegisteredId = "";
let isSuperadmin = false;
let currentUserPermissions = null;
let authLogRefreshTimer = null;
let activeWorkspaceTab = {
    workforce: "employees",
    finance: "expenses",
    assets: "payments"
};

const state = {
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
    bankRental: {},
    announcements: [],
    calendarEvents: [],
    displayModules: { expenses: true, bankRental: true },
    moduleRegistry: [],
    dynamicModuleRecords: {},
    summary: {}
};

let dbFilterStart = "";
let dbFilterEnd = "";
const DEFAULT_MODULE_PAGE_SIZE = 25;
const ROWS_PER_PAGE_OPTIONS = [15, 25, 50, 100];
const moduleFilters = {};
const BANK_RENTAL_TABS = [
    { id: "bankRental", label: "BANK RENTAL" },
    { id: "totalRental", label: "TOTAL RENTAL" },
    { id: "bbj", label: "BBJ" },
    { id: "jes", label: "JES" },
    { id: "kj", label: "KJ" },
    { id: "judy", label: "JUDY" },
    { id: "candy", label: "CANDY" },
    { id: "block", label: "BLOCK" }
];
const BANK_RENTAL_SOURCE_TAB_IDS = ["bankRental"];
const BANK_RENTAL_SELECTION_TAB_IDS = ["bbj", "jes", "kj", "judy", "candy"];
const BANK_RENTAL_CLEANUP_VERSION = "2026-06-13-bank-rental-source-only";
const BANK_RENTAL_SORT_FIELDS = ["date", "name", "amount", "bank", "status", "bankType", "bankName", "startDate", "endDate", "createdDate"];
let activeBankRentalTab = "bankRental";
const bankRentalUiState = {};
let detailViewerStore = {};
let actionMenuStore = {};
let activeModalCallback = null;
let activeModalReadOnly = false;
const pendingSharedBankRentalMutations = new Set();
let superAdminStore = {
    users: [],
    authLogs: [],
    displayModules: {},
    customModules: [],
    userAccess: [],
    selectedUserProfile: null,
    selectedAccessUserId: "",
    selectedRoleTemplate: "user",
    roleTemplates: {},
    roleTemplateDrafts: {},
    roleTemplateDirty: {},
    userManagementSection: "users",
    viewerSearch: "",
    viewerSort: "createdDate",
    userScope: "all",
    userStatusFilter: "all",
    userRoleFilter: "all",
    selectedRegisteredId: "",
    selectedUserContext: "",
    dashboardScope: "superadmin",
    eventFilter: "",
    userContextSearch: "",
    reportScope: "current",
    reportModuleId: "",
    reportMonth: "",
    reportStart: "",
    reportEnd: "",
    reportHistory: [],
    moduleManagementSearch: "",
    moduleManagementStatus: "all",
    moduleManagementSidebar: "all",
    moduleManagementType: "all",
    moduleManagementSelected: [],
    loaded: false
};
const moduleSortState = {};
const reportSelectionState = {
    selectedIds: new Set()
};
let renderDebounceTimer = null;
const OWNED_STATE_ARRAY_KEYS = ["employees", "schedules", "debts", "claims", "expenses", "reimbursementClaims", "payments", "fundAccounts", "atmCashRecords"];
const UI_CONTEXT_STORAGE_KEY = `workertracker_ui_context_${pageAccess}`;
const UI_SCROLL_STORAGE_KEY = `workertracker_ui_scroll_${pageAccess}`;
const SUPERADMIN_SELECTED_USER_CONTEXT_KEY = "workertracker_selected_user_context";
let hasRestoredUiContext = false;
let skipNextRenderScrollCapture = false;

function readStoredJson(storage, key, fallback = null) {
    try {
        const raw = storage?.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.warn("Unable to read stored UI context.", error);
        return fallback;
    }
}

function writeStoredJson(storage, key, value) {
    try {
        storage?.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("Unable to store UI context.", error);
    }
}

function clonePlainObject(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : {};
}

function getUiContextUserKey() {
    return String(currentRegisteredId || "anonymous").trim().toLowerCase();
}

function getUserOwnerId(user = {}) {
    return String(user.registeredId || user.email || "").trim().toLowerCase();
}

function getActiveContextUsers() {
    return (superAdminStore.users || [])
        .filter((user) => !user.isSuperadmin && user.role !== "superadmin" && user.accountRole !== "superadmin")
        .filter((user) => (user.status || "active") !== "disabled")
        .filter((user) => getUserOwnerId(user));
}

function getSelectedUserContext() {
    if (!isSuperadmin) return "";
    const selected = String(superAdminStore.selectedUserContext || "").trim().toLowerCase();
    return getActiveContextUsers().some((user) => getUserOwnerId(user) === selected) ? selected : "";
}

function getEffectiveRecordOwner() {
    if (isSuperadmin) return getSelectedUserContext();
    return String(currentRegisteredId || "").trim().toLowerCase();
}

function persistSelectedUserContext() {
    try {
        sessionStorage.removeItem(SUPERADMIN_SELECTED_USER_CONTEXT_KEY);
    } catch (error) {
        console.warn("Unable to store selected user context.", error);
    }
}

function restoreSelectedUserContext() {
    clearSelectedUserContext();
}

function validateSelectedUserContext() {
    if (!isSuperadmin || !superAdminStore.selectedUserContext) return;
    if (!getSelectedUserContext()) clearSelectedUserContext();
}

function clearSelectedUserContext() {
    superAdminStore.selectedUserContext = "";
    superAdminStore.eventFilter = "";
    try {
        sessionStorage.removeItem(SUPERADMIN_SELECTED_USER_CONTEXT_KEY);
    } catch (error) {
        console.warn("Unable to clear selected user context.", error);
    }
}

function getViewContextKey(view = currentView) {
    return `${getUiContextUserKey()}:${view || "dashboard"}`;
}

function getElementPath(element, root) {
    if (!element || !root || !root.contains(element) || element === root) return "";
    const path = [];
    let current = element;
    while (current && current !== root) {
        const parent = current.parentElement;
        if (!parent) break;
        path.unshift(Array.from(parent.children).indexOf(current));
        current = parent;
    }
    return path.join(".");
}

function findElementByPath(root, path) {
    if (!root || !path) return null;
    return path.split(".").reduce((node, index) => node?.children?.[Number(index)] || null, root);
}

function captureFocusContext(root = document.getElementById("appRoot")) {
    const element = document.activeElement;
    if (!element || !root?.contains(element) || !["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(element.tagName)) return null;
    return {
        id: element.id || "",
        name: element.getAttribute("name") || "",
        path: getElementPath(element, root),
        selectionStart: typeof element.selectionStart === "number" ? element.selectionStart : null,
        selectionEnd: typeof element.selectionEnd === "number" ? element.selectionEnd : null
    };
}

function restoreFocusContext(context, root = document.getElementById("appRoot")) {
    if (!context || !root) return;
    const element = (context.id && document.getElementById(context.id))
        || (context.name && root.querySelector(`[name="${CSS.escape(context.name)}"]`))
        || findElementByPath(root, context.path);
    if (!element || !root.contains(element) || typeof element.focus !== "function") return;
    element.focus({ preventScroll: true });
    if (typeof element.setSelectionRange === "function" && context.selectionStart !== null) {
        element.setSelectionRange(context.selectionStart, context.selectionEnd ?? context.selectionStart);
    }
}

function getScrollContainers(root = document.getElementById("appRoot")) {
    if (!root) return [];
    return Array.from(root.querySelectorAll(".table-wrapper, .login-audit-panel, .dashboard-user-strip")).filter((element) => {
        return element.scrollTop || element.scrollLeft || element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    });
}

function captureScrollContext(view = currentView) {
    return;
}

function restoreScrollContext(view = currentView) {
    return;
}

function persistUiContext() {
    return;
}

function restoreUiContext() {
    if (hasRestoredUiContext) return;
    hasRestoredUiContext = true;
}

async function restoreSuperAdminSelectionContext() {
    if (!isSuperadmin || currentView !== "userManagement") return;
    const selectedId = superAdminStore.selectedUserProfileId;
    if (!selectedId || superAdminStore.selectedUserProfile) return;
    if (!["profile", "data"].includes(superAdminStore.userManagementSection)) return;
    try {
        const data = await getUserProfile(selectedId);
        superAdminStore.selectedUserProfile = {
            user: data.user,
            systemModules: data.systemModules || [],
            moduleData: data.moduleData || []
        };
        if (!superAdminStore.selectedRegisteredId) {
            superAdminStore.selectedRegisteredId = String(data.user?.registeredId || data.user?.email || "").trim().toLowerCase();
        }
    } catch (error) {
        console.warn("Unable to restore selected user context.", error);
    }
}

function slugifyModuleId(value) {
    return String(value || "")
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-([a-z0-9])/g, (_, chr) => chr.toUpperCase());
}

function isSameModuleKey(left, right) {
    return slugifyModuleId(left) === slugifyModuleId(right);
}

function permissionModulesInclude(modules = [], moduleKey = "") {
    return (modules || []).some((key) => isSameModuleKey(key, moduleKey));
}

function normalizeModuleField(field = {}) {
    const key = slugifyModuleId(field.key || field.name || field.label);
    if (!key) return null;
    const rawType = String(field.type || "").trim().toLowerCase();
    const typeAliases = {
        dropdown: "select",
        formula: "calculated",
        calculation: "calculated",
        percent: "percentage",
        money: "currency"
    };
    const type = typeAliases[rawType] || rawType;
    return {
        key,
        label: String(field.label || field.name || key).trim() || key,
        type: ["text", "number", "currency", "percentage", "date", "textarea", "select", "checkbox", "calculated"].includes(type) ? type : "text",
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options.map((item) => String(item).trim()).filter(Boolean) : [],
        formula: String(field.formula || field.expression || "").trim()
    };
}

function normalizeModuleConfigList(value, fallback = []) {
    if (Array.isArray(value)) return value.map((item) => ({ ...item })).filter((item) => Object.keys(item).length);
    if (Array.isArray(fallback)) return fallback.map((item) => ({ ...item })).filter((item) => Object.keys(item).length);
    return [];
}

function normalizeModuleAccessMappings(value = {}, fallback = {}) {
    const source = value && typeof value === "object" ? value : {};
    const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
    const normalizeList = (items, shouldLowercase = false) => {
        if (!Array.isArray(items)) return [];
        return [...new Set(items
            .map((item) => String(item || "").trim())
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

function normalizeModuleDefinition(module = {}, fallback = {}) {
    const id = slugifyModuleId(module.id || module.key || module.module_key || module.moduleKey || fallback.id || fallback.module_key);
    if (!id) return null;
    const moduleName = module.label || module.name || module.module_name || module.moduleName || fallback.label || fallback.module_name || id;
    const sidebarVisible = module.sidebar_visible ?? module.sidebarVisible ?? module.visibilityEnabled ?? fallback.sidebar_visible ?? fallback.sidebarVisible ?? fallback.visibilityEnabled;
    const sortOrder = module.sort_order ?? module.sortOrder ?? module.displayOrder ?? fallback.sort_order ?? fallback.sortOrder ?? fallback.displayOrder;
    const systemModule = module.system_module ?? module.systemModule ?? module.builtIn ?? fallback.system_module ?? fallback.systemModule ?? fallback.builtIn;
    const fields = (Array.isArray(module.fields) ? module.fields : fallback.fields || [])
        .map(normalizeModuleField)
        .filter(Boolean);
    return {
        id,
        module_key: id,
        moduleKey: id,
        label: String(moduleName).trim() || id,
        module_name: String(moduleName).trim() || id,
        moduleName: String(moduleName).trim() || id,
        description: String(module.description || fallback.description || "").trim(),
        category: MODULE_CATEGORIES.some(([categoryId]) => categoryId === module.category) ? module.category : (fallback.category || "system"),
        access: module.access === "management" ? "management" : "all",
        permissionMode: ["management", "all", "assigned", "custom"].includes(module.permissionMode) ? module.permissionMode : (module.access === "management" ? "management" : "all"),
        customPermission: String(module.customPermission || fallback.customPermission || "").trim(),
        visibilityMode: module.visibilityMode === "shared" || fallback.visibilityMode === "shared" ? "shared" : "personal",
        menuGroup: String(module.menuGroup || fallback.menuGroup || "").trim(),
        icon: String(module.icon || fallback.icon || "").trim(),
        displayOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        visibilityEnabled: sidebarVisible === false ? false : sidebarVisible === undefined ? true : Boolean(sidebarVisible),
        sidebar_visible: sidebarVisible === false ? false : sidebarVisible === undefined ? true : Boolean(sidebarVisible),
        sidebarVisible: sidebarVisible === false ? false : sidebarVisible === undefined ? true : Boolean(sidebarVisible),
        accessConfig: module.accessConfig && typeof module.accessConfig === "object" ? { ...module.accessConfig } : (fallback.accessConfig && typeof fallback.accessConfig === "object" ? { ...fallback.accessConfig } : {}),
        accessMappings: normalizeModuleAccessMappings(module.accessMappings, fallback.accessMappings),
        formulaDefinitions: normalizeModuleConfigList(module.formulaDefinitions, fallback.formulaDefinitions),
        workflowDefinitions: normalizeModuleConfigList(module.workflowDefinitions, fallback.workflowDefinitions),
        automationRules: normalizeModuleConfigList(module.automationRules, fallback.automationRules),
        settings: module.settings && typeof module.settings === "object" ? { ...module.settings } : (fallback.settings && typeof fallback.settings === "object" ? { ...fallback.settings } : {}),
        builtIn: Boolean(systemModule),
        system_module: Boolean(systemModule),
        systemModule: Boolean(systemModule),
        enabled: module.enabled !== false,
        fields
    };
}

function getDefaultModuleRegistry() {
    return SYSTEM_MODULE_REGISTRY.map((module) => normalizeModuleDefinition(module)).filter(Boolean);
}

function getModuleRegistry() {
    const modules = Array.isArray(state.moduleRegistry) ? state.moduleRegistry : [];
    const registry = new Map(getDefaultModuleRegistry().map((module) => [module.id, module]));
    modules.map((module) => normalizeModuleDefinition(module)).filter(Boolean).forEach((module) => {
        registry.set(module.id, normalizeModuleDefinition(module, registry.get(module.id) || {}));
    });
    return Array.from(registry.values());
}

function getModuleDefinition(moduleId) {
    const normalized = slugifyModuleId(moduleId);
    return getModuleRegistry().find((module) => module.id === normalized) || null;
}

function getWorkspaceModuleGroups() {
    const groups = {};
    getModuleRegistry().forEach((module) => {
        if (!module.category || module.category === module.id) return;
        const parent = getModuleDefinition(module.category);
        if (!parent) return;
        if (!groups[module.category]) groups[module.category] = [];
        groups[module.category].push([module.id, module.label]);
    });
    Object.values(groups).forEach((modules) => modules.sort((a, b) => {
        const left = getModuleDefinition(a[0]);
        const right = getModuleDefinition(b[0]);
        return (Number(left?.sortOrder) || 0) - (Number(right?.sortOrder) || 0) || a[1].localeCompare(b[1]);
    }));
    return groups;
}

function isDynamicModule(moduleId) {
    const module = getModuleDefinition(moduleId);
    return Boolean(module && !module.builtIn);
}

function canAccessModuleDefinition(module) {
    if (!module || module.enabled === false || module.visibilityEnabled === false) return false;
    if (!isSuperadmin && module.access === "management") return false;
    if (!isSuperadmin && module.permissionMode === "assigned") {
        const users = normalizeModuleAccessMappings(module.accessMappings || {}).users;
        const current = String(currentRegisteredId || "").trim().toLowerCase();
        if (!current || !users.includes(current)) return false;
    }
    if (!isSuperadmin && state.displayModules?.[module.id] === false) return false;
    return true;
}

function isSharedDynamicModule(module) {
    return Boolean(module && !module.builtIn && module.visibilityMode === "shared");
}

function canViewDynamicRecord(module, record) {
    if (isSuperadmin) return true;
    if (isSharedDynamicModule(module)) return hasModulePermission(module?.id, "read");
    return hasModulePermission(module?.id, "read") && canManageRecord(record);
}

function canEditDynamicRecord(module, record) {
    if (isSuperadmin) return true;
    if (isSharedDynamicModule(module)) return hasModulePermission(module?.id, "update");
    return hasModulePermission(module?.id, "update") && canManageRecord(record);
}

function canDeleteDynamicRecord(module, record) {
    if (isSuperadmin) return true;
    if (isSharedDynamicModule(module)) return hasModulePermission(module?.id, "delete") && canDeleteSharedRecord(record);
    return hasModulePermission(module?.id, "delete") && canManageRecord(record);
}

function debouncedRenderApp(delay = 160) {
    clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(() => renderApp(), delay);
}

function renderAppPreservingScroll() {
    renderApp();
}

let unsubscribeState = null;
let isApplyingRemoteState = false;
let apiReady = false;
let hasLoadedRemoteState = false;
let remoteDocumentMissingConfirmed = false;
const modal = document.getElementById("globalModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function getModuleFilter(moduleName) {
    if (!moduleFilters[moduleName]) {
        moduleFilters[moduleName] = { preset: "last30", start: "", end: "", page: 1, pageSize: DEFAULT_MODULE_PAGE_SIZE };
    }
    if (!moduleFilters[moduleName].pageSize) moduleFilters[moduleName].pageSize = DEFAULT_MODULE_PAGE_SIZE;
    return moduleFilters[moduleName];
}

function getDateRangeFromPreset(preset) {
    const today = new Date();
    const end = toLocalDateKey(today);
    const start = new Date(today);

    if (preset === "today") {
        return [end, end];
    }
    if (preset === "week") {
        start.setDate(today.getDate() - today.getDay());
        return [toLocalDateKey(start), end];
    }
    if (preset === "month") {
        start.setDate(1);
        return [toLocalDateKey(start), end];
    }
    if (preset === "last30") {
        start.setDate(today.getDate() - 30);
        return [toLocalDateKey(start), end];
    }
    return [null, null];
}

function toLocalDateKey(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function normalizeDateValue(value) {
    if (!value) return "";
    if (typeof value.toDate === "function") {
        return toLocalDateKey(value.toDate());
    }
    if (typeof value.seconds === "number" || typeof value._seconds === "number") {
        const seconds = value.seconds ?? value._seconds;
        const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;
        return toLocalDateKey(new Date((seconds * 1000) + Math.floor(nanoseconds / 1000000)));
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? "" : toLocalDateKey(value);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        const slashDate = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (slashDate) return `${slashDate[3]}-${slashDate[2]}-${slashDate[1]}`;
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) return toLocalDateKey(parsed);
        const dateOnly = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
        return dateOnly ? dateOnly[1] : "";
    }
    return "";
}

function normalizeRecordDate(record) {
    if (!record || typeof record !== "object") return normalizeDateValue(record);
    const fields = ["date", "scheduleDate", "workDate", "startDate", "createdAt", "updatedAt"];
    for (const field of fields) {
        const normalized = normalizeDateValue(record[field]);
        if (normalized) return normalized;
    }
    return "";
}

function compareNormalizedDates(a, b, direction = "desc") {
    const dateA = normalizeDateValue(a);
    const dateB = normalizeDateValue(b);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA.localeCompare(dateB) * (direction === "asc" ? 1 : -1);
}

function sortRecordsByNormalizedDate(records, dateGetter = normalizeRecordDate, direction = "desc") {
    return records.slice().sort((a, b) => {
        const dateCompare = compareNormalizedDates(dateGetter(a), dateGetter(b), direction);
        if (dateCompare !== 0) return dateCompare;
        return String(a.id || "").localeCompare(String(b.id || ""));
    });
}

function isRecordInModuleRange(record, filter) {
    if (filter.preset === "all") return true;
    const recordDate = normalizeRecordDate(record);
    if (!recordDate) return false;
    let start = null;
    let end = null;

    if (filter.preset === "custom") {
        start = normalizeDateValue(filter.start);
        end = normalizeDateValue(filter.end);
        if (start && !end) end = start;
        if (end && !start) start = end;
    } else {
        [start, end] = getDateRangeFromPreset(filter.preset);
    }

    if (start && recordDate < start) return false;
    if (end && recordDate > end) return false;
    return true;
}

function getModuleRecords(moduleName, records, dateGetter) {
    const filter = getModuleFilter(moduleName);
    const pageSize = Number(filter.pageSize) || DEFAULT_MODULE_PAGE_SIZE;
    const scopedRecords = scopeRecordsForSelectedUser(records);
    const filtered = sortRecordsByNormalizedDate(scopedRecords.filter((record) => {
        const dateValue = typeof dateGetter === "function" ? dateGetter(record) : null;
        return isRecordInModuleRange(dateValue ? { ...record, date: dateValue } : record, filter);
    }), (record) => (typeof dateGetter === "function" ? dateGetter(record) : normalizeRecordDate(record)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    filter.page = Math.min(filter.page, totalPages);
    const startIndex = (filter.page - 1) * pageSize;
    return {
        filter,
        filtered,
        pageRows: filtered.slice(startIndex, startIndex + pageSize),
        totalPages
    };
}

function getPaginatedModuleRecords(moduleName, records, options = {}) {
    const filter = getModuleFilter(moduleName);
    const pageSize = Number(filter.pageSize) || DEFAULT_MODULE_PAGE_SIZE;
    const scopedRecords = options.skipSelectedUserScope ? (Array.isArray(records) ? records : []) : scopeRecordsForSelectedUser(records);
    const sortedRecords = options.preserveOrder ? scopedRecords : sortRecordsByNormalizedDate(scopedRecords);
    const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
    filter.page = Math.min(filter.page, totalPages);
    const startIndex = (filter.page - 1) * pageSize;
    return {
        filter,
        filtered: sortedRecords,
        pageRows: sortedRecords.slice(startIndex, startIndex + pageSize),
        totalPages
    };
}

function sortRecords(records, field, direction = "asc") {
    const dir = direction === "desc" ? -1 : 1;
    return [...records].sort((a, b) => {
        const valueA = a?.[field] ?? "";
        const valueB = b?.[field] ?? "";
        const numberA = Number(valueA);
        const numberB = Number(valueB);
        if (!Number.isNaN(numberA) && !Number.isNaN(numberB) && valueA !== "" && valueB !== "") {
            return (numberA - numberB) * dir;
        }
        return String(valueA || "").localeCompare(String(valueB || ""), undefined, { sensitivity: "base" }) * dir;
    });
}

function renderModuleFilter(moduleName) {
    const filter = getModuleFilter(moduleName);
    return `
        <div class="database-filters">
            <label>${t("Date Range")}
                <select onchange="updateModuleFilter('${moduleName}', 'preset', this.value)">
                    <option value="today" ${filter.preset === "today" ? "selected" : ""}>Today</option>
                    <option value="week" ${filter.preset === "week" ? "selected" : ""}>This Week</option>
                    <option value="month" ${filter.preset === "month" ? "selected" : ""}>This Month</option>
                    <option value="last30" ${filter.preset === "last30" ? "selected" : ""}>Last 30 Days</option>
                    <option value="custom" ${filter.preset === "custom" ? "selected" : ""}>Custom Date Range</option>
                    <option value="all" ${filter.preset === "all" ? "selected" : ""}>Preview All</option>
                </select>
            </label>
            <label>${t("From")} <input type="date" value="${escapeHtml(filter.start)}" onchange="updateModuleFilter('${moduleName}', 'start', this.value)" /></label>
            <label>${t("To")} <input type="date" value="${escapeHtml(filter.end)}" onchange="updateModuleFilter('${moduleName}', 'end', this.value)" /></label>
        </div>
    `;
}

function renderPagination(moduleName, totalRecords, totalPages) {
    const filter = getModuleFilter(moduleName);
    return `
        <div class="database-filters pagination-bar">
            <span class="pagination-total">Total <strong>${totalRecords}</strong> Records</span>
            <span class="pagination-separator">|</span>
            <label class="pagination-page-size">Rows per page
                <select onchange="updateModuleFilter('${moduleName}', 'pageSize', this.value)">
                    ${ROWS_PER_PAGE_OPTIONS.map((size) => `<option value="${size}" ${Number(filter.pageSize) === size ? "selected" : ""}>${size}</option>`).join("")}
                </select>
            </label>
            <span class="pagination-separator">|</span>
            <button class="btn btn-secondary btn-sm" ${filter.page <= 1 ? "disabled" : ""} onclick="updateModuleFilter('${moduleName}', 'page', ${filter.page - 1})">Previous</button>
            <span class="pagination-page-indicator">Page ${filter.page} of ${totalPages}</span>
            <button class="btn btn-secondary btn-sm" ${filter.page >= totalPages ? "disabled" : ""} onclick="updateModuleFilter('${moduleName}', 'page', ${filter.page + 1})">Next</button>
        </div>
    `;
}

function updateModuleFilter(moduleName, field, value) {
    const filter = getModuleFilter(moduleName);
    filter[field] = field === "page" ? Number(value) : value;
    if (field === "pageSize") filter[field] = Number(value) || DEFAULT_MODULE_PAGE_SIZE;
    if (field !== "page") filter.page = 1;
    renderApp();
}

function updateModuleSort(moduleName, field, value) {
    moduleSortState[moduleName] = {
        ...(moduleSortState[moduleName] || {}),
        [field]: value
    };
    getModuleFilter(moduleName).page = 1;
    renderApp();
}

// ============================================
// ROLE AND PERMISSION MANAGEMENT
// ============================================

function setRole(role) {
    if (roles[role]) {
        currentRole = role;
        updateRoleIndicator();
        renderNavigation();
        renderApp();
        return true;
    }
    return false;
}

function getRole() {
    return currentRole;
}

function cloneRolePermissions(roleKey = currentRole) {
    const template = roles[roleKey] || roles.user;
    if (roleKey === "super") {
        const modules = getModuleRegistry().filter((module) => module.enabled !== false).map((module) => module.id);
        return {
            ...template,
            modules,
            moduleActions: Object.fromEntries(modules.map((moduleId) => [moduleId, {
                read: true,
                create: true,
                update: true,
                delete: true
            }]))
        };
    }
    return {
        ...template,
        modules: []
    };
}

function normalizeUserPermissionSet(permissions, roleKey = currentRole) {
    const fallback = cloneRolePermissions(roleKey);
    if (roleKey === "super" || isSuperadmin) return fallback;
    const source = permissions && typeof permissions === "object" ? permissions : {};
    const next = { ...fallback, modules: [] };
    PERMISSION_BOOLEAN_KEYS.forEach((key) => {
        if (typeof source[key] === "boolean") next[key] = source[key];
    });
    next.modules = Array.isArray(source.modules)
        ? source.modules.map((moduleId) => String(moduleId || "").trim()).filter(Boolean)
        : [];
    next.moduleActions = {};
    const sourceActions = source.moduleActions && typeof source.moduleActions === "object" ? source.moduleActions : {};
    next.modules.forEach((moduleId) => {
        const actions = sourceActions[moduleId] && typeof sourceActions[moduleId] === "object" ? sourceActions[moduleId] : {};
        next.moduleActions[moduleId] = {
            read: actions.read !== false,
            create: actions.create !== false && actions.add !== false,
            update: actions.update !== false && actions.edit !== false,
            delete: actions.delete === true
        };
    });
    return next;
}

function getEffectivePermissions() {
    const permissions = normalizeUserPermissionSet(currentUserPermissions, currentRole);
    const registry = getModuleRegistry();
    const enabled = new Set(registry
        .filter((module) => module.enabled !== false)
        .filter((module) => isSuperadmin || module.access !== "management")
        .map((module) => module.id));
    return {
        ...permissions,
        modules: (permissions.modules || []).filter((moduleId) => enabled.has(moduleId)),
        moduleActions: Object.fromEntries(Object.entries(permissions.moduleActions || {}).filter(([moduleId]) => enabled.has(moduleId)))
    };
}

function hasPermission(action) {
    if (isSuperadmin) return true;
    const permissions = getEffectivePermissions();
    if (action === "create" || action === "add") return permissions.create === true && permissions.add !== false;
    if (action === "update" || action === "edit") return permissions.update === true && permissions.edit !== false;
    return permissions[action] === true;
}

function canAccess(action) {
    return hasPermission(action);
}

function hasModulePermission(moduleId, action) {
    if (isSuperadmin) return true;
    const permissions = getEffectivePermissions();
    if (!permissionModulesInclude(permissions.modules, moduleId)) return false;
    const moduleActions = permissions.moduleActions?.[moduleId];
    const normalizedAction = action === "add" ? "create" : action === "edit" ? "update" : action === "view" ? "read" : action;
    if (moduleActions && Object.prototype.hasOwnProperty.call(moduleActions, normalizedAction)) {
        return moduleActions[normalizedAction] === true;
    }
    return hasPermission(normalizedAction);
}

function getCurrentPermissionModuleId() {
    if (isDynamicModule(currentView)) return currentView;
    const activeGroupTab = activeWorkspaceTab[currentView];
    if (activeGroupTab && (getWorkspaceModuleGroups()[currentView] || []).some(([moduleId]) => moduleId === activeGroupTab)) {
        return activeGroupTab;
    }
    const moduleDefinition = getModuleDefinition(currentView);
    return moduleDefinition?.id || currentView;
}

function canCreateData() {
    return hasModulePermission(getCurrentPermissionModuleId(), "create");
}

function canEditData() {
    return hasModulePermission(getCurrentPermissionModuleId(), "update");
}

function canDeleteData() {
    return hasModulePermission(getCurrentPermissionModuleId(), "delete");
}

function canManageData() {
    return canEditData() || canDeleteData();
}

function canExportData() {
    return hasPermission("export");
}

function canUseMonthlyClosing() {
    return isSuperadmin || hasPermission("ownerAdmin");
}

function canAccessModule(moduleName) {
    const moduleDefinition = getModuleDefinition(moduleName);
    if (!moduleDefinition || moduleDefinition.enabled === false) return false;
    if (isSuperadmin) return true;
    if (!isSuperadmin && moduleDefinition.access === "management") return false;
    const permissions = getEffectivePermissions();
    return permissionModulesInclude(permissions.modules, moduleDefinition.id);
}

function canAccessDatabase() {
    return hasPermission("database");
}

function canAccessSettings() {
    return hasPermission("settings");
}

function getRecordOwner(record) {
    if (!record || typeof record !== "object") return "";
    const fields = ["registeredId", "registered_id", "trackingId", "tracking_id", "ownerId", "owner_id", "userId", "user_id", "createdBy", "created_by", "email", "username", "owner"];
    for (const field of fields) {
        const value = String(record[field] || "").trim().toLowerCase();
        if (value) return value;
    }
    return "";
}

const CLIENT_OWNERSHIP_FIELDS = ["registeredId", "registered_id", "trackingId", "tracking_id", "ownerId", "owner_id", "userId", "user_id", "createdBy", "created_by", "owner"];

function stripClientOwnershipFields(record = {}) {
    const next = { ...record };
    CLIENT_OWNERSHIP_FIELDS.forEach((field) => {
        delete next[field];
    });
    return next;
}

function sanitizeOwnedRecordsForSave(records) {
    return (Array.isArray(records) ? records : []).map(stripClientOwnershipFields);
}

function sanitizeStateForSave(inputState) {
    const payload = normalizeState(inputState);
    ["employees", "schedules", "debts", "claims", "expenses", "reimbursementClaims", "payments", "fundAccounts", "atmCashRecords", "announcements", "calendarEvents"].forEach((key) => {
        payload[key] = sanitizeOwnedRecordsForSave(payload[key]);
    });
    payload.bankRental = Object.fromEntries(Object.entries(payload.bankRental || {}).map(([key, records]) => [key, sanitizeOwnedRecordsForSave(records)]));
    payload.dynamicModuleRecords = Object.fromEntries(Object.entries(payload.dynamicModuleRecords || {}).map(([key, records]) => [key, sanitizeOwnedRecordsForSave(records)]));
    return payload;
}

function applyCurrentOwner(record) {
    if (!record) return record;
    const owner = getEffectiveRecordOwner();
    return applyOwnerToRecord(record, owner);
}

function applyOwnerToRecord(record, ownerId) {
    if (!record) return record;
    const owner = String(ownerId || "").trim().toLowerCase();
    if (owner) {
        record.owner_id = owner;
        record.user_id = owner;
    }
    return record;
}

function canManageRecord(record) {
    if (isSuperadmin) return true;
    const owner = getRecordOwner(record);
    const current = String(currentRegisteredId || "").trim().toLowerCase();
    return !owner || owner === current;
}

function canDeleteSharedRecord(record) {
    if (isSuperadmin) return true;
    const owner = getRecordOwner(record);
    const current = String(currentRegisteredId || "").trim().toLowerCase();
    return Boolean(owner && current && owner === current);
}

function isRecordInSelectedUserContext(record) {
    const selected = getSelectedUserContext();
    if (!selected) return true;
    return getRecordOwner(record) === selected;
}

function scopeRecordsForSelectedUser(records = []) {
    const list = Array.isArray(records) ? records : [];
    return isSuperadmin ? list.filter(isRecordInSelectedUserContext) : list;
}

// Guard: Prevent unauthorized operations
function guardOperation(operationType, operationName = "") {
    if (operationType === "monthlyClosing") {
        if (canUseMonthlyClosing()) return true;
        console.warn(`Access denied: ${operationType} ${operationName}`);
        alert(`You don't have permission to ${operationType} data.`);
        return false;
    }
    if (!hasPermission(operationType)) {
        console.warn(`Access denied: ${operationType} ${operationName}`);
        alert(`You don't have permission to ${operationType} data.`);
        return false;
    }
    return true;
}

function updateRoleIndicator() {
    const indicator = document.getElementById("roleIndicator");
    if (indicator) {
        indicator.textContent = "";
        indicator.hidden = true;
    }
}

function applyLanguageChrome() {
    const title = document.querySelector(".topbar-brand");
    if (title) {
        const roleLabel = "WorkerTracker";
        const logo = title.querySelector("img");
        title.textContent = "";
        if (logo) title.appendChild(logo);
        title.append(roleLabel);
    }

    const labels = {
        manualClearDataBtn: t("Manual Clear Data"),
        logoutBtn: t("Logout"),
        darkModeToggle: t("Dark / Light"),
        exportJsonBtn: t("Export PDF"),
        modalCancelBtn: t("Cancel")
    };

    Object.entries(labels).forEach(([id, label]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = label;
    });

    const englishButton = document.getElementById("langEnglishBtn");
    const chineseButton = document.getElementById("langChineseBtn");
    if (englishButton) englishButton.textContent = "English";
    if (chineseButton) chineseButton.textContent = "中文";
    document.getElementById("langEnglishBtn")?.classList.toggle("active", currentLanguage === "en");
    document.getElementById("langChineseBtn")?.classList.toggle("active", currentLanguage === "zh");
    document.querySelectorAll(".nav-link").forEach((button) => {
        const label = moduleLabels[button.dataset.view];
        if (label) button.textContent = t(label);
    });
    updateRoleIndicator();
}

function setLanguage(language) {
    const nextLanguage = language === "zh" ? "zh" : "en";
    if (nextLanguage === currentLanguage) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const activeElement = document.activeElement;
    currentLanguage = nextLanguage;
    renderNavigation();
    renderApp();
    applyLanguageChrome();
    if (modal.classList.contains("show")) translateVisibleSystemLabels();

    if (activeElement && typeof activeElement.focus === "function") {
        try {
            activeElement.focus({ preventScroll: true });
        } catch (error) {}
    }
    window.scrollTo(scrollX, scrollY);
}

function toggleThemeMode() {
    document.body.classList.toggle("dark");
}

function setAppFontSize(size) {
    document.body.style.fontSize = size;
}

async function logoutCurrentUser() {
    clearSelectedUserContext();
    await logoutAdmin();
    location.href = "index.html";
}

function getTranslationPairs() {
    return Object.entries(translations.zh).flatMap(([english, chinese]) => [
        [english, currentLanguage === "zh" ? chinese : english],
        [chinese, currentLanguage === "zh" ? chinese : english]
    ]).sort((a, b) => b[0].length - a[0].length);
}

function translateSystemValue(value) {
    if (!value) return value;
    const leading = value.match(/^\s*/)?.[0] || "";
    const trailing = value.match(/\s*$/)?.[0] || "";
    let inner = value.trim();
    getTranslationPairs().forEach(([source, target]) => {
        inner = inner.replaceAll(source, target);
    });
    return `${leading}${inner}${trailing}`;
}

function translateVisibleSystemLabels() {
    const selectors = [
        ".module-header h2",
        ".module-header button",
        ".card h4",
        "thead th",
        ".topbar-actions button",
        ".modal-header h3",
        ".modal-actions button",
        "#modalBody label",
        ".detail-row strong"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((element) => {
        element.textContent = translateSystemValue(element.textContent);
    });

    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((element) => {
        element.placeholder = translateSystemValue(element.placeholder);
    });
}

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
    if (!value && value !== 0) return "";
    return String(value).replace(/[&<>]/g, (chr) => {
        if (chr === "&") return "&amp;";
        if (chr === "<") return "&lt;";
        return "&gt;";
    });
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getLongValueClass(label, value) {
    const text = String(value ?? "");
    const key = String(label || "").toLowerCase();
    if (/\b(jwt|token|authorization|bearer)\b/.test(key) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text)) return "long-token";
    if (/\b(url|link|website)\b/.test(key) || /^https?:\/\//i.test(text)) return "long-url";
    if (/\b(id|email|account number|key)\b/.test(key) || /@/.test(text)) return "long-id";
    if (text.length > 80) return "long-text";
    return "";
}

function isFreeTextDetailLabel(label) {
    return /\b(remark|description|notes?|comment|issue notes?|bank detail|reason|detail)\b/i.test(String(label || ""));
}

const DETAIL_KEY_LABELS = [
    "Account Number",
    "Account No",
    "Account Name",
    "Bank Detail",
    "Financial Detail",
    "Issue Notes",
    "Source of Funds / Remark",
    "Remaining Balance",
    "Settled Amount",
    "Settlement Status",
    "Payment Method",
    "Created Date",
    "Updated Date",
    "Start Date",
    "End Date",
    "Bank Status",
    "Bank Name",
    "Bank Type",
    "Agent Name",
    "Category / Bank Type",
    "Description",
    "Remarks",
    "Remark",
    "Notes",
    "Detail",
    "Amount",
    "Status",
    "Type",
    "Date",
    "Bank"
];

function normalizeDetailKey(label) {
    return String(label || "").replace(/\s+/g, " ").trim();
}

function renderDetailPairRow(label, value, fallback = "-") {
    const displayValue = value || value === 0 ? value : fallback;
    const valueClass = getLongValueClass(label, displayValue);
    return `
        <div class="detail-row">
            <strong class="detail-label">${escapeHtml(normalizeDetailKey(label))}</strong>
            <div class="detail-separator">:</div>
            <div class="detail-value ${valueClass}">${escapeHtml(displayValue)}</div>
        </div>
    `;
}

function parseKnownInlineDetailFields(text) {
    const source = String(text || "").replace(/\r\n?/g, "\n");
    const escapedLabels = DETAIL_KEY_LABELS
        .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .sort((a, b) => b.length - a.length)
        .join("|");
    const labelPattern = new RegExp(`(^|[\\s,;|])(${escapedLabels})\\s*:\\s*`, "gi");
    const matches = [];
    let match;
    while ((match = labelPattern.exec(source)) !== null) {
        matches.push({
            label: normalizeDetailKey(match[2]),
            labelStart: match.index + match[1].length,
            valueStart: labelPattern.lastIndex
        });
    }
    if (matches.length < 2) return [];
    return matches.map((item, index) => {
        const next = matches[index + 1];
        return {
            label: item.label,
            value: source.slice(item.valueStart, next ? next.labelStart : source.length).trim()
        };
    }).filter((field) => field.value);
}

function parseLineDetailField(line) {
    const match = String(line || "").match(/^\s*([^:]{1,60}?)\s*:\s*(.*)$/);
    if (!match) return null;
    const label = normalizeDetailKey(match[1]);
    if (!label || /^https?$/i.test(label)) return null;
    return { label, value: match[2].trim() };
}

function parseDetailTextFields(text) {
    const source = String(text || "").replace(/\r\n?/g, "\n").trim();
    if (!source) return [];
    const inlineFields = parseKnownInlineDetailFields(source);
    if (inlineFields.length) return inlineFields;
    const lines = source.split("\n");
    const fields = [];
    let current = null;
    lines.forEach((line) => {
        const parsed = parseLineDetailField(line);
        if (parsed) {
            if (current) fields.push(current);
            current = parsed;
            return;
        }
        if (current) {
            current.value = `${current.value}${current.value ? "\n" : ""}${line}`;
        }
    });
    if (current) fields.push(current);
    return fields.filter((field) => String(field.value || "").trim());
}

function renderDetailValue(label, value, fallback = "-") {
    const displayValue = value || value === 0 ? value : fallback;
    const valueClass = getLongValueClass(label, displayValue);
    return `<div class="detail-value ${valueClass}">${escapeHtml(displayValue)}</div>`;
}

function renderDetailRow(label, value, fallback = "-") {
    const displayValue = value || value === 0 ? value : fallback;
    const parsedFields = parseDetailTextFields(displayValue);
    if (parsedFields.length) {
        return parsedFields.map((field) => renderDetailPairRow(field.label, field.value, fallback)).join("");
    }
    return renderDetailPairRow(label, displayValue, fallback);
}

function renderTableDetailButton(moduleName, fieldName, value, title = fieldName) {
    const structuredFields = value && typeof value === "object" && Array.isArray(value.fields) ? value.fields : null;
    const displayValue = structuredFields ? structuredFields.map((field) => field.value || "").join("").trim() : (value || value === 0 ? String(value) : "");
    if (!displayValue.trim()) return `<span class="table-detail-empty">-</span>`;
    const detailId = generateId("detail");
    detailViewerStore[detailId] = {
        title,
        content: structuredFields ? "" : displayValue,
        fields: structuredFields
    };
    return `<button class="btn btn-secondary btn-sm table-detail-btn" onclick="viewTableDetail('${detailId}')">${t("View Detail")}</button>`;
}

function renderActionMenu(label, items = []) {
    const actions = items.filter((item) => item && item.action);
    if (!actions.length) return `<span class="table-detail-empty">-</span>`;
    const menuId = generateId("action");
    actionMenuStore[menuId] = actions;
    return `
        <select class="row-action-menu" aria-label="${escapeAttribute(label || t("Actions"))}" onchange="handleRowActionMenu('${menuId}', this.value); this.value = '';">
            <option value="">${t("Actions")}</option>
            ${actions.map((item, index) => `<option value="${index}">${escapeHtml(item.label)}</option>`).join("")}
        </select>
    `;
}

function handleRowActionMenu(menuId, index) {
    const action = actionMenuStore[menuId]?.[Number(index)];
    if (!action || !action.action) return;
    Function(`"use strict"; window.${action.action}`)();
}

function combineDetailFields(fields = []) {
    return {
        type: "detail-fields",
        fields: fields
            .map(({ label, value }) => ({
                label,
                value: value || value === 0 ? String(value).trim() : "",
                freeText: isFreeTextDetailLabel(label)
            }))
            .filter((field) => field.value)
    };
}

function hasDetailContent(value) {
    if (value && typeof value === "object" && Array.isArray(value.fields)) {
        return value.fields.some((field) => String(field.value || "").trim());
    }
    return Boolean(String(value || "").trim());
}

function renderStructuredDetailFields(fields = []) {
    const rows = fields.map((field) => {
        return renderDetailRow(field.label, field.value);
    }).join("");
    return rows || renderDetailRow("Detail", "-");
}

function viewTableDetail(detailId) {
    const detail = detailViewerStore[detailId];
    if (!detail) return;
    const content = detail.content && detail.content.trim() ? detail.content : "-";
    const body = Array.isArray(detail.fields) && detail.fields.length
        ? `<div class="detail-grid table-detail-grid">${renderStructuredDetailFields(detail.fields)}</div>`
        : `<div class="detail-grid table-detail-grid">${renderDetailRow(detail.title || "Detail", content)}</div>`;
    openReadOnlyModal(
        detail.title || "Detail",
        body
    );
}

function renderMoneyCell(value) {
    return `<span class="table-money">${escapeHtml(formatMoney(value))}</span>`;
}

function readImageFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("Unable to read image."));
        reader.readAsDataURL(file);
    });
}

function updateEmployeePhotoPreview(input) {
    const preview = document.getElementById("employeePhotoPreview");
    const file = input.files?.[0];
    if (!preview || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
        preview.src = String(reader.result || "");
        preview.hidden = false;
    };
    reader.readAsDataURL(file);
}

function renderEmployeePhotoPlaceholder(id = "", interactive = true) {
    interactive = Boolean(interactive && isSuperadmin);
    const input = id && interactive
        ? `<input class="employee-photo-input" type="file" accept="image/*" onchange="uploadEmployeePhotoFromCard('${id}', this)" />`
        : "";
    const tag = interactive ? "label" : "span";
    return `
        <${tag} class="employee-photo-upload employee-photo-button-large" title="Upload Photo">
            ${input}
            <span class="employee-photo-avatar-icon" aria-hidden="true"></span>
            <span class="employee-photo-upload-icon" aria-hidden="true"></span>
            <span>Upload Photo</span>
        </${tag}>
    `;
}

function getEmployeePhoto(employee) {
    return employee?.photo || "";
}

function clearEmployeePhotoData(employee) {
    if (!employee) return;
    ["photo", "photoData", "photoUrl", "image", "imageData", "avatar", "avatarUrl"].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(employee, field)) {
            employee[field] = "";
        }
    });
}

function renderEmployeePhoto(employee) {
    const photo = getEmployeePhoto(employee);
    if (!photo) return renderEmployeePhotoPlaceholder(employee?.id || "", isSuperadmin);
    return `
        <button class="employee-photo-button employee-photo-button-large" onclick="previewEmployeePhoto('${employee.id}')" title="${t("Employee Photo")}">
            <img class="employee-photo-card-img" src="${escapeAttribute(photo)}" alt="${escapeAttribute(employee.name || "Employee photo")}" loading="lazy" decoding="async" onerror="handleEmployeePhotoError('${employee.id}')" />
        </button>
    `;
}

function handleEmployeePhotoError(id) {
    const employee = state.employees.find((item) => item.id === id);
    if (!employee) return;
    clearEmployeePhotoData(employee);
    renderApp();
    persistStateChange();
}

async function uploadEmployeePhotoFromCard(id, input) {
    if (!isSuperadmin) return;
    if (!guardOperation("update", "employee photo")) return;
    const employee = state.employees.find((item) => item.id === id);
    const file = input?.files?.[0];
    if (!employee || !file) return;
    const photo = await readImageFileAsDataUrl(file);
    if (!photo) return;
    employee.photo = photo;
    renderApp();
    persistStateChange();
}

function removeEmployeePhoto(id) {
    if (!isSuperadmin) return;
    if (!guardOperation("update", "employee photo")) return;
    const employee = state.employees.find((item) => item.id === id);
    if (!employee || !getEmployeePhoto(employee)) return;
    clearEmployeePhotoData(employee);
    renderApp();
    persistStateChange();
}

function previewEmployeePhoto(id) {
    const employee = state.employees.find((item) => item.id === id);
    const photo = getEmployeePhoto(employee);
    if (!photo) return;
    openReadOnlyModal(
        employee.name || t("Employee Photo"),
        `<div class="employee-photo-preview-stage"><img class="employee-photo-modal" src="${escapeAttribute(photo)}" alt="${escapeAttribute(employee.name || "Employee photo")}" decoding="async" /></div>`
    );
    modal.classList.add("employee-photo-preview-modal");
}

function viewEmployeeDetail(id) {
    const employee = state.employees.find((item) => item.id === id);
    if (!employee) return;
    openReadOnlyModal(
        employee.name || t("Employee"),
        `
            <div class="detail-grid">
                ${getEmployeePhoto(employee) ? `<img class="employee-photo-modal" src="${escapeAttribute(getEmployeePhoto(employee))}" alt="${escapeAttribute(employee.name || "Employee photo")}" loading="lazy" decoding="async" />` : ""}
                ${renderDetailRow(t("Name"), employee.name)}
                ${renderDetailRow(t("Role"), employee.role)}
                ${renderDetailRow(t("Department"), employee.department)}
                ${renderDetailRow("Worker Type", employee.worker_type)}
                ${renderDetailRow("Employee Status", getEmployeeStatus(employee))}
                ${renderDetailRow("Join Date", formatExportDate(employee.join_date))}
                ${renderDetailRow("Exit Date", formatExportDate(employee.exit_date))}
                ${renderDetailRow("Passport Expiry", formatExportDate(employee.passport_expiry))}
                ${renderDetailRow("Visa Expiry", formatExportDate(employee.visa_expiry))}
                ${renderDetailRow("Permit Expiry", formatExportDate(employee.permit_expiry))}
                ${isSuperadmin ? renderDetailRow(t("Wages"), employee.wages || employee.salary || employee.paymentRecord) : ""}
                ${renderDetailRow(t("Category"), employee.category)}
                ${renderDetailRow(t("Remark"), employee.remark)}
            </div>
        `
    );
}

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
        bankRental: createDefaultBankRentalState(),
        bankRentalCleanupVersion: "",
        bankRentalDeletedSignatures: [],
        announcements: [],
        calendarEvents: [],
        displayModules: { expenses: true, bankRental: true },
        moduleRegistry: getDefaultModuleRegistry(),
        dynamicModuleRecords: {},
        summary: {}
    };
}

function createDefaultBankRentalState() {
    return BANK_RENTAL_TABS.reduce((tabs, tab) => {
        tabs[tab.id] = [];
        return tabs;
    }, {});
}

function normalizeBankRentalState(input = {}) {
    const defaults = createDefaultBankRentalState();
    BANK_RENTAL_TABS.forEach((tab) => {
        defaults[tab.id] = Array.isArray(input?.[tab.id]) ? input[tab.id] : [];
    });
    return defaults;
}

function normalizeState(input = {}) {
    const defaults = getDefaultState();
    const legacyClaims = Array.isArray(input.claims) ? input.claims : [];
    const registryMap = new Map();
    const inputRegistry = Array.isArray(input.moduleRegistry) && input.moduleRegistry.length ? input.moduleRegistry : getDefaultModuleRegistry();
    inputRegistry.forEach((module) => {
        const normalized = normalizeModuleDefinition(module);
        if (normalized) registryMap.set(normalized.id, normalized);
    });
    const moduleRegistry = Array.from(registryMap.values());
    const dynamicModuleRecords = { ...(input.dynamicModuleRecords || {}) };
    moduleRegistry.forEach((module) => {
        if (!module.builtIn && !Array.isArray(dynamicModuleRecords[module.id])) dynamicModuleRecords[module.id] = [];
        moduleLabels[module.id] = module.label;
    });
    const expenses = Array.isArray(input.expenses) ? input.expenses : legacyClaims.map((claim) => ({
        id: claim.id || generateId("exp"),
        date: claim.date || "",
        type: claim.type || "General",
        category: claim.category || claim.categoryRef || "General",
        amount: claim.amount || 0,
        description: claim.description || "",
        paymentMethod: claim.paymentMethod || "",
        notes: claim.notes || claim.remark || ""
    }));
    const reimbursementClaims = (Array.isArray(input.reimbursementClaims) ? input.reimbursementClaims : legacyClaims).map((claim) => {
        const workerId = claim.workerId || claim.employeeId || "";
        const workerOwner = String(workerId || "").trim().toLowerCase().startsWith("emp_") ? "" : workerId;
        const owner = claim.registeredId || claim.registered_id || claim.trackingId || claim.tracking_id || claim.ownerId || claim.owner_id || workerOwner || "";
        return {
            id: claim.id || generateId("rclm"),
            date: claim.date || "",
            workerId,
            amount: claim.amount || 0,
            description: claim.description || "",
            remark: claim.remark || "",
            status: ["Pending", "Approved", "Rejected", "Paid"].includes(claim.status) ? claim.status : "Pending",
            owner_id: owner
        };
    });

    return {
        ...defaults,
        ...input,
        currency: SUPPORTED_CURRENCY,
        employees: Array.isArray(input.employees) ? input.employees : defaults.employees,
        schedules: Array.isArray(input.schedules) ? input.schedules : defaults.schedules,
        debts: Array.isArray(input.debts) ? input.debts : defaults.debts,
        claims: legacyClaims,
        expenses,
        reimbursementClaims,
        payments: Array.isArray(input.payments) ? input.payments : defaults.payments,
        categories: Array.isArray(input.categories) ? input.categories : defaults.categories,
        paymentTypes: Array.isArray(input.paymentTypes) ? input.paymentTypes : defaults.paymentTypes,
        fundAccounts: Array.isArray(input.fundAccounts) ? input.fundAccounts : defaults.fundAccounts,
        atmCashRecords: Array.isArray(input.atmCashRecords) ? input.atmCashRecords : defaults.atmCashRecords,
        bankRental: normalizeBankRentalState(input.bankRental),
        bankRentalCleanupVersion: typeof input.bankRentalCleanupVersion === "string" ? input.bankRentalCleanupVersion : defaults.bankRentalCleanupVersion,
        bankRentalDeletedSignatures: Array.isArray(input.bankRentalDeletedSignatures) ? input.bankRentalDeletedSignatures : defaults.bankRentalDeletedSignatures,
        displayModules: { ...defaults.displayModules, ...(input.displayModules || {}) },
        moduleRegistry,
        dynamicModuleRecords,
        announcements: Array.isArray(input.announcements) ? input.announcements : defaults.announcements,
        calendarEvents: Array.isArray(input.calendarEvents) ? input.calendarEvents : defaults.calendarEvents,
        summary: input.summary && typeof input.summary === "object" ? input.summary : defaults.summary
    };
}

function applyBankRentalCleanupMigration() {
    if (state.bankRentalCleanupVersion === BANK_RENTAL_CLEANUP_VERSION) return false;
    state.bankRentalCleanupVersion = BANK_RENTAL_CLEANUP_VERSION;
    return true;
}

function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function recalculateStateSnapshot(snapshot) {
    snapshot.fundAccounts.forEach((fund) => {
        const fundIn = roundMoney(fund.initialBalance);
        const fundOut = roundMoney(snapshot.expenses
            .filter((expense) => expense.fundSourceId === fund.id)
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0));

        fund.initialBalance = fundIn;
        fund.fundIn = fundIn;
        fund.fundOut = fundOut;
        fund.currentBalance = roundMoney(fundIn - fundOut);
        fund.netAmount = fund.currentBalance;
    });
}

function normalizeComparableState(input = {}) {
    const comparable = normalizeState(input);
    comparable.bankRental = normalizeBankRentalState(comparable.bankRental);
    const deletedSignatures = new Set(Array.isArray(comparable.bankRentalDeletedSignatures) ? comparable.bankRentalDeletedSignatures : []);
    if (deletedSignatures.size) {
        BANK_RENTAL_TABS.forEach((tab) => {
            comparable.bankRental[tab.id] = (comparable.bankRental[tab.id] || [])
                .filter((record) => !deletedSignatures.has(getBankRentalRecordSignature(record)));
        });
    }
    recalculateStateSnapshot(comparable);
    return comparable;
}

function getStateSignature(input = state) {
    return JSON.stringify(normalizeComparableState(input));
}

function isStateUnchanged(nextState) {
    return getStateSignature(state) === getStateSignature(nextState);
}

function isDevelopmentMode() {
    return ["", "localhost", "127.0.0.1"].includes(location.hostname) || location.protocol === "file:";
}

function logSyncSkipStateUnchanged() {
    if (isDevelopmentMode()) console.log("[SYNC-SKIP] state unchanged");
}

function applyState(nextState) {
    Object.assign(state, normalizeState(nextState));
    purgeDeletedBankRentalRecordsFromState();
    recalculateState();
}

function handleAccountUnavailable(message = "Account unavailable.") {
    const url = new URL("index.html", location.href);
    url.searchParams.set("auth", "account_removed");
    url.searchParams.set("message", message || "Account unavailable. This account has been removed by administrator.");
    location.href = url.toString();
}

async function saveState() {
    if (!currentRegisteredId || isApplyingRemoteState) return;
    if (!hasLoadedRemoteState && !remoteDocumentMissingConfirmed) {
        console.warn("Skipped API save because remote state has not loaded yet. This prevents local fallback data from overwriting live module data.");
        return;
    }

    recalculateState();
    purgeDeletedBankRentalRecordsFromState();
    const nextState = normalizeState(state);
    applyState(nextState);
    const payloadState = sanitizeStateForSave(nextState);
    const sharedBankRentalMutations = Array.from(pendingSharedBankRentalMutations);

    try {
        const response = await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payloadState,
                __selectedUserContext: getSelectedUserContext(),
                __sharedBankRentalMutations: sharedBankRentalMutations
            })
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || data.code === "ACCOUNT_UNAVAILABLE" || data.error === "Account unavailable.") {
            handleAccountUnavailable(data.error || "Account unavailable.");
            return;
        }
        if (!response.ok || !data.success) {
            throw new Error(data.error || "State save failed.");
        }
        if (data.state && isStateUnchanged(data.state)) {
            logSyncSkipStateUnchanged();
        } else if (data.state) {
            applyState(data.state);
            if (!modal.classList.contains("show")) renderApp();
        }
        persistUiContext();
        sharedBankRentalMutations.forEach((tabId) => pendingSharedBankRentalMutations.delete(tabId));
        apiReady = true;
    } catch (error) {
        apiReady = false;
        console.warn("API save failed.", error);
        alert(`Save failed: ${error.message || "Unable to save changes to the server."}`);
        throw error;
    }
}

function persistStateChange() {
    saveState().catch((error) => {
        console.warn("Unable to persist state change.", error);
    });
}

async function loadState() {
    try {
        const response = await fetch("/api/state");
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || data.code === "ACCOUNT_UNAVAILABLE" || data.error === "Account unavailable.") {
            handleAccountUnavailable(data.error || "Account unavailable.");
            return;
        }
        if (response.ok && data.success && data.state) {
            applyState(data.state);
            apiReady = true;
            hasLoadedRemoteState = true;
            remoteDocumentMissingConfirmed = false;
            return;
        }

        applyState(getDefaultState());
        apiReady = true;
        hasLoadedRemoteState = true;
        remoteDocumentMissingConfirmed = true;
        console.warn("API state does not exist. Loaded an empty local state without writing it back automatically.");
    } catch (error) {
        apiReady = false;
        hasLoadedRemoteState = false;
        remoteDocumentMissingConfirmed = false;
        console.warn("API load failed. SQLite state is unavailable.", error);
        applyState(getDefaultState());
    }
}

window.addEventListener("pagehide", () => {
});
document.addEventListener("visibilitychange", () => {
});

async function refreshCurrentSessionPermissions() {
    const session = await getCurrentUser();
    if (!session?.user) return false;
    const previousPermissions = JSON.stringify(getEffectivePermissions());
    isSuperadmin = Boolean(session.isSuperadmin);
    currentRole = isSuperadmin ? "super" : (session.user?.accountRole === "admin" || session.user?.role === "admin" ? "admin" : "user");
    currentRegisteredId = String(session.user?.email || session.user?.registeredId || "").trim().toLowerCase();
    currentUserPermissions = normalizeUserPermissionSet(session.user?.permissions, currentRole);
    const permissionChanged = previousPermissions !== JSON.stringify(getEffectivePermissions());
    if (!canAccessModule(currentView)) {
        currentView = getEffectivePermissions().modules.find((moduleId) => canAccessModule(moduleId)) || "dashboard";
    }
    updateRoleIndicator();
    renderNavigation();
    return permissionChanged;
}

function subscribeToState() {
    if (unsubscribeState) clearInterval(unsubscribeState);

    unsubscribeState = setInterval(async () => {
        if (!hasLoadedRemoteState || isApplyingRemoteState) return;
        try {
            const response = await fetch("/api/state");
            const data = await response.json().catch(() => ({}));
            if (response.status === 401 || data.code === "ACCOUNT_UNAVAILABLE" || data.error === "Account unavailable.") {
                handleAccountUnavailable(data.error || "Account unavailable.");
                return;
            }
            if (!response.ok || !data.success || !data.state) return;
            await refreshCurrentSessionPermissions();
            if (isStateUnchanged(data.state)) {
                hasLoadedRemoteState = true;
                remoteDocumentMissingConfirmed = false;
                logSyncSkipStateUnchanged();
                return;
            }
            isApplyingRemoteState = true;
            applyState(data.state);
            recalcFundBalances();
            hasLoadedRemoteState = true;
            remoteDocumentMissingConfirmed = false;
            isApplyingRemoteState = false;
        } catch (error) {
            apiReady = false;
            console.warn("API state refresh failed. Continuing with cached state.", error);
        } finally {
            isApplyingRemoteState = false;
        }
    }, 2000);
}

function recalculateState() {
    state.fundAccounts.forEach((fund) => {
        const fundIn = roundMoney(fund.initialBalance);
        const fundOut = roundMoney(state.expenses
            .filter((expense) => expense.fundSourceId === fund.id)
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0));

        fund.initialBalance = fundIn;
        fund.fundIn = fundIn;
        fund.fundOut = fundOut;
        fund.currentBalance = roundMoney(fundIn - fundOut);
        fund.netAmount = fund.currentBalance;
    });

    const totalFundIn = roundMoney(state.fundAccounts.reduce((sum, fund) => sum + (Number(fund.fundIn ?? fund.initialBalance) || 0), 0));
    const totalExpenses = roundMoney(state.expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0));
    const totalFundOut = totalExpenses;
    const totalFundBalance = roundMoney(totalFundIn - totalFundOut);
    const totalClaims = roundMoney(state.reimbursementClaims.reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0));
    const approvedClaims = roundMoney(state.reimbursementClaims.filter((claim) => claim.status === "Approved").reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0));
    const totalPayments = roundMoney(state.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));

    state.summary = {
        totalEmployees: state.employees.length,
        totalSchedules: state.schedules.length,
        totalDebts: state.debts.length,
        totalExpenses,
        totalClaims,
        approvedClaims,
        totalPayments,
        totalFundIn,
        totalFundOut,
        totalFundBalance,
        netFunds: roundMoney(totalFundIn - totalFundOut)
    };
}

function recalcFundBalances() {
    recalculateState();
}

function getEmployeeName(id) {
    return state.employees.find((emp) => emp.id === id)?.name || "Unknown";
}

function isWithinDateRange(value, start, end) {
    const dateValue = normalizeDateValue(value);
    if (!dateValue) return false;
    const startValue = normalizeDateValue(start);
    const endValue = normalizeDateValue(end);
    if (startValue && dateValue < startValue) return false;
    if (endValue && dateValue > endValue) return false;
    return true;
}

function formatExportDate(value) {
    const normalized = normalizeDateValue(value);
    if (!normalized) return "-";
    const [year, month, day] = normalized.split("-");
    return `${day}/${month}/${year}`;
}

function formatMoney(value) {
    const amount = Number(value) || 0;
    return `${SUPPORTED_CURRENCY} ${amount.toFixed(2)}`;
}

function getCurrentMonthKey() {
    return toLocalDateKey(new Date()).slice(0, 7);
}

function isCurrentMonth(value) {
    return Boolean(normalizeDateValue(value).startsWith(getCurrentMonthKey()));
}

function getMonthlyExpenses() {
    return state.expenses.filter((expense) => isCurrentMonth(expense.date));
}

function getMonthlyClaims() {
    return state.reimbursementClaims.filter((claim) => isCurrentMonth(claim.date));
}

function getMonthlyClaimTotal() {
    return getMonthlyClaims().reduce((sum, claim) => sum + claim.amount, 0);
}

function getMonthlyFundsUsed() {
    return getMonthlyExpenses().reduce((sum, expense) => sum + expense.amount, 0);
}

function getCompanyPaymentSummary(records = state.payments) {
    const safeRecords = Array.isArray(records) ? records : [];
    return {
        totalAmount: roundMoney(safeRecords.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)),
        monthlyTotal: roundMoney(safeRecords.filter((payment) => isCurrentMonth(payment.date || payment.createdAt)).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)),
        pendingCount: safeRecords.filter((payment) => payment.status === "Pending").length,
        approvedCount: safeRecords.filter((payment) => payment.status === "Approved").length,
        paidCount: safeRecords.filter((payment) => payment.status === "Paid").length,
        recordCount: safeRecords.length
    };
}

function getAtmCashLedger(records = state.atmCashRecords) {
    const sorted = [...records].sort((a, b) => {
        const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
        if (dateCompare !== 0) return dateCompare;
        return String(a.createdAt || a.id || "").localeCompare(String(b.createdAt || b.id || ""));
    });

    let balance = 0;
    let totalFundIn = 0;
    let totalFundOut = 0;
    const rows = sorted.map((record) => {
        const fundIn = roundMoney(record.fundIn);
        const fundOut = roundMoney(record.fundOut);
        totalFundIn = roundMoney(totalFundIn + fundIn);
        totalFundOut = roundMoney(totalFundOut + fundOut);
        balance = roundMoney(balance + fundIn - fundOut);
        return { ...record, fundIn, fundOut, balance };
    });

    return {
        rows,
        totalRecords: rows.length,
        totalFundIn,
        totalFundOut,
        currentBalance: balance
    };
}

function getRecentActivities(limit = 6) {
    const activities = [
        ...state.employees.map((item) => ({ date: item.createdAt || "", text: `Employee: ${item.name || "Unnamed"}` })),
        ...state.schedules.map((item) => ({ date: item.startDate || item.date || "", text: `Schedule: ${getEmployeeName(item.employeeId)} - ${item.leaveType || item.shift || "-"}` })),
        ...state.expenses.map((item) => ({ date: item.date || "", text: `Expense: ${item.category || item.type || "General"} - ${formatMoney(item.amount)}` })),
        ...state.reimbursementClaims.map((item) => ({ date: item.date || "", text: `Reimbursement: ${getEmployeeName(item.workerId || item.employeeId)} - ${formatMoney(item.amount)} ${item.status || ""}` })),
        ...state.payments.map((item) => ({ date: item.date || "", text: `Payment: ${item.recipient || "Unknown"} - ${formatMoney(item.amount)} ${item.status || ""}` }))
    ];

    return activities
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, limit);
}

function getLatestRecordDate(records, dateGetter) {
    return records.reduce((latest, record) => {
        const dateValue = normalizeDateValue(dateGetter(record));
        if (!dateValue) return latest;
        return !latest || dateValue > latest ? dateValue : latest;
    }, "");
}

function getSnapshotDate(record, dateGetter) {
    const preferred = typeof dateGetter === "function" ? dateGetter(record) : "";
    return preferred || record.date || record.createdAt || record.updatedAt || record.createdDate || "";
}

function calculateModuleSnapshot(moduleId, label, records, amountGetter, dateGetter) {
    const safeRecords = Array.isArray(records) ? records : [];
    const getAmount = typeof amountGetter === "function" ? amountGetter : () => 0;
    const getDate = (record) => getSnapshotDate(record, dateGetter || normalizeRecordDate);
    const totalAmount = safeRecords.reduce((sum, record) => {
        const amount = Number(getAmount(record));
        return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    const thisMonthTotal = safeRecords
        .filter((record) => isCurrentMonth(getDate(record)))
        .reduce((sum, record) => {
            const amount = Number(getAmount(record));
            return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0);
    return {
        moduleId,
        label,
        totalAmount: roundMoney(totalAmount),
        recordCount: safeRecords.length,
        latestDate: getLatestRecordDate(safeRecords, getDate) || "",
        thisMonthTotal: roundMoney(thisMonthTotal)
    };
}

function getRecordsForDashboardScope(records, owner = "") {
    const normalizedOwner = String(owner || "").trim().toLowerCase();
    const safeRecords = Array.isArray(records) ? records : [];
    return normalizedOwner ? safeRecords.filter((record) => getRecordOwner(record) === normalizedOwner) : safeRecords;
}

function getBankRentalSummaryRecords(owner = "") {
    const normalizedOwner = String(owner || "").trim().toLowerCase();
    const records = getPrimaryBankRentalRecords();
    return normalizedOwner ? records.filter((record) => getRecordOwner(record) === normalizedOwner) : records;
}

function getBankRentalAmountRecords(owner = "") {
    return getBankRentalSummaryRecords(owner);
}

function getBankRentalAmountTotal(records = getBankRentalAmountRecords()) {
    return roundMoney((Array.isArray(records) ? records : []).reduce((sum, record) => sum + (Number(record.amount) || 0), 0));
}

function markSharedBankRentalMutation(tabId) {
    if (tabId === "block") pendingSharedBankRentalMutations.add(tabId);
}

function getDashboardFundSnapshots(owner = "") {
    const scopedDebts = getRecordsForDashboardScope(state.debts, owner);
    const scopedExpenses = getRecordsForDashboardScope(state.expenses, owner);
    const scopedClaims = getRecordsForDashboardScope(state.reimbursementClaims, owner);
    const scopedFunds = getRecordsForDashboardScope(state.fundAccounts, owner);
    const scopedAtmCash = getRecordsForDashboardScope(state.atmCashRecords, owner);
    const bankRentalRecords = getBankRentalAmountRecords(owner);
    return [
        calculateModuleSnapshot("debts", "Debt Tracking", scopedDebts, (record) => record.amount, (record) => record.date),
        calculateModuleSnapshot("expenses", "Expenses", scopedExpenses, (record) => record.amount, (record) => record.date),
        calculateModuleSnapshot("reimbursementClaims", "Reimbursement Claims", scopedClaims, (record) => record.amount, (record) => record.date),
        calculateModuleSnapshot("funds", "Funds", scopedFunds, (record) => record.netAmount ?? record.currentBalance ?? record.initialBalance, (record) => record.date),
        calculateModuleSnapshot("atmCash", "ATM Cash", scopedAtmCash, (record) => (Number(record.fundIn) || 0) - (Number(record.fundOut) || 0), (record) => record.date),
        calculateModuleSnapshot("bankRental", "Bank Rental", bankRentalRecords, (record) => record.amount, (record) => record.startDate || record.createdDate || record.createdAt)
    ];
}

function updateDashboardNumbers() {
    const employeesCount = state.employees.length;
    const schedulesCount = state.schedules.length;
    const unresolvedDebts = state.debts.filter((item) => item.status !== "Resolved").length;
    const pendingClaims = state.reimbursementClaims.filter((item) => item.status === "Pending").length;
    const pendingPayments = state.payments.filter((item) => item.status === "Pending").length;
    const totalFundOut = state.summary.totalFundOut || state.fundAccounts.reduce((sum, fund) => sum + (fund.fundOut || fund.initialBalance - fund.currentBalance), 0);
    const totalBalance = state.summary.totalFundBalance || state.fundAccounts.reduce((sum, fund) => sum + fund.currentBalance, 0);

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    };
    setText("statEmployees", employeesCount);
    setText("statSchedules", schedulesCount);
    setText("statDebts", unresolvedDebts);
    setText("statClaims", pendingClaims);
    setText("statPayments", pendingPayments);
    setText("statFundOut", formatMoney(totalFundOut));
    setText("statTotalBalance", formatMoney(totalBalance));
}

function setActiveNav() {
    document.querySelectorAll(".nav-link").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.view === currentView);
    });
}

function closeMobileDrawer() {
    document.body.classList.remove("sidebar-open");
    document.getElementById("mobileMenuBtn")?.setAttribute("aria-expanded", "false");
}

function initMobileDrawer() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");

    mobileMenuBtn?.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("sidebar-open");
        mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    sidebarBackdrop?.addEventListener("click", closeMobileDrawer);

    window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 781px)").matches) {
            closeMobileDrawer();
        }
    });
}

function renderNavigation() {
    const navigation = document.getElementById("navigation");
    const navigationModules = getModuleRegistry()
        .filter((module) => module.sidebarVisible !== false && module.visibilityEnabled !== false)
        .map((module, index) => ({
            id: module.id,
            label: module.label,
            displayOrder: Number(module.displayOrder) || Number(module.sortOrder) || index,
            index
        }))
        .sort((a, b) => {
            const orderCompare = (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
            return orderCompare || a.index - b.index;
        });
    
    const accessibleModules = navigationModules.filter((module) => {
        return canAccessModule(module.id);
    });
    
    // Clear existing navigation
    navigation.innerHTML = "";
    
    // Add module buttons
    accessibleModules.forEach(module => {
        const targetView = module.id;
        const btn = document.createElement("button");
        btn.className = "nav-link";
        btn.dataset.view = targetView;
        btn.textContent = t(module.label);
        btn.addEventListener("click", () => {
            if (!canAccessModule(module.id)) {
                guardOperation("read", module.id);
                return;
            }
            captureScrollContext();
            currentView = targetView;
            skipNextRenderScrollCapture = true;
            setActiveNav();
            renderApp();
            closeMobileDrawer();
        });
        if (module.id === currentView || targetView === currentView) {
            btn.classList.add("active");
        }
        navigation.appendChild(btn);
    });
}

function renderDashboard() {
    if (!isSuperadmin) return renderUserDashboard();
    return renderSuperDashboard();
}

function getVisibleCalendarEvents() {
    const events = Array.isArray(state.calendarEvents) ? state.calendarEvents : [];
    if (isSuperadmin) return events;
    const current = String(currentRegisteredId || "").trim().toLowerCase();
    return events.filter((event) => getRecordOwner(event) === current);
}

function getUpcomingEvents(limit = 5, events = getVisibleCalendarEvents()) {
    const today = normalizeDateValue(new Date());
    return [...events]
        .filter((event) => normalizeDateValue(event.date) >= today)
        .sort((a, b) => `${normalizeDateValue(a.date)} ${a.startTime || ""}`.localeCompare(`${normalizeDateValue(b.date)} ${b.startTime || ""}`))
        .slice(0, limit);
}

function renderEventRows(events, compact = false) {
    const canEditCalendar = hasModulePermission("calendar", "update");
    const canDeleteCalendar = hasModulePermission("calendar", "delete");
    return events.map((event) => `
        <div class="event-row">
            <div>
                <strong>${escapeHtml(event.title || "-")}</strong>
                <span>${formatExportDate(event.date)} ${escapeHtml([event.startTime, event.endTime].filter(Boolean).join(" - "))}</span>
                ${compact ? "" : `<p>${escapeHtml(event.description || "-")}</p>`}
            </div>
            <div class="btn-group">
                ${canEditCalendar ? `<button class="btn btn-secondary btn-sm" onclick="editCalendarEvent('${event.id}')">${t("Edit")}</button>` : ""}
                ${canDeleteCalendar ? `<button class="btn btn-danger btn-sm" onclick="confirmDeleteCalendarEvent('${event.id}')">${t("Delete")}</button>` : ""}
            </div>
        </div>
    `).join("");
}

function renderUserDashboard() {
    const myExpenses = state.expenses || [];
    const myFunds = state.fundAccounts || [];
    const myAtmCash = state.atmCashRecords || [];
    const bankRentalRecords = getBankRentalAmountRecords();
    const events = getVisibleCalendarEvents();
    const upcoming = getUpcomingEvents(5, events);
    const cards = [
        `
            <section class="dashboard-card dashboard-card-primary">
                <span>My Summary</span>
                <strong>${myExpenses.length + myFunds.length + myAtmCash.length}</strong>
                <small>total owned records</small>
            </section>
        `,
        canAccessModule("expenses") ? `
            <section class="dashboard-card dashboard-card-primary">
                <span>My Expenses Summary</span>
                <strong>${formatMoney(myExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))}</strong>
                <small>${myExpenses.length} records</small>
            </section>
        ` : "",
        canAccessModule("funds") ? `
            <section class="dashboard-card">
                <span>My Funds Summary</span>
                <strong>${formatMoney(myFunds.reduce((sum, item) => sum + (Number(item.currentBalance ?? item.netAmount ?? item.initialBalance) || 0), 0))}</strong>
                <small>${myFunds.length} records</small>
            </section>
        ` : "",
        canAccessModule("atmCash") ? `
            <section class="dashboard-card">
                <span>My ATM Cash Summary</span>
                <strong>${formatMoney(myAtmCash.reduce((sum, item) => sum + ((Number(item.fundIn) || 0) - (Number(item.fundOut) || 0)), 0))}</strong>
                <small>${myAtmCash.length} records</small>
            </section>
        ` : "",
        canAccessModule("bankRental") ? `
            <section class="dashboard-card">
                <span>My Bank Rental Summary</span>
                <strong>${formatMoney(getBankRentalAmountTotal(bankRentalRecords))}</strong>
                <small>${bankRentalRecords.length} shared records</small>
            </section>
        ` : "",
        canAccessModule("calendar") ? `
            <section class="dashboard-card dashboard-calendar-card">
                <div class="module-header">
                    <h2>Calendar</h2>
                    <button class="btn" onclick="showAddCalendarEventModal()">+ Add Event</button>
                </div>
                ${renderCalendarMonth(events)}
            </section>
            <section class="dashboard-card dashboard-events-card">
                <div class="module-header"><h2>Upcoming Events</h2></div>
                ${renderEventRows(upcoming, true) || `<div class="empty-state">No upcoming events.</div>`}
            </section>
        ` : ""
    ].join("");
    return `
        <div class="dashboard-workspace">
            ${cards}
        </div>
    `;
}

function renderCalendar() {
    const events = getVisibleCalendarEvents();
    const upcoming = getUpcomingEvents(5, events);
    return `
        <div class="dashboard-workspace">
            <section class="dashboard-card dashboard-calendar-card">
                <div class="module-header">
                    <h2>Calendar</h2>
                    <button class="btn" onclick="showAddCalendarEventModal()">+ Add Event</button>
                </div>
                ${renderCalendarMonth(events)}
            </section>
            <section class="dashboard-card dashboard-events-card">
                <div class="module-header"><h2>Upcoming Events</h2></div>
                ${renderEventRows(upcoming, true) || `<div class="empty-state">No upcoming events.</div>`}
            </section>
        </div>
    `;
}

function renderSuperDashboard() {
    const selectedContext = getSelectedUserContext();
    const selectedUser = selectedContext ? getActiveContextUsers().find((user) => getUserOwnerId(user) === selectedContext) : null;
    const ownerLabel = selectedUser ? `${selectedUser.displayName || selectedContext} (${selectedContext})` : "SuperAdmin";
    const bannerLabel = selectedUser ? `Viewing User Dashboard: ${ownerLabel}` : "SuperAdmin Dashboard";
    const scopedEmployees = getDashboardScopeRecords(state.employees);
    const scopedFunds = getDashboardScopeRecords(state.fundAccounts);
    const scopedAtmCash = getDashboardScopeRecords(state.atmCashRecords);
    const scopedDebts = getDashboardScopeRecords(state.debts);
    const scopedExpenses = getDashboardScopeRecords(state.expenses);
    const scopedClaims = getDashboardScopeRecords(state.reimbursementClaims);
    const scopedBankRental = getDashboardScopeBankRentalRecords();
    const snapshots = [
        calculateModuleSnapshot("debts", "Debt Tracking", scopedDebts, (record) => record.amount, (record) => record.date),
        calculateModuleSnapshot("expenses", "Expenses", scopedExpenses, (record) => record.amount, (record) => record.date),
        calculateModuleSnapshot("reimbursementClaims", "Reimbursement Claims", scopedClaims, (record) => record.amount, (record) => record.date),
        calculateModuleSnapshot("funds", "Funds", scopedFunds, (record) => record.netAmount ?? record.currentBalance ?? record.initialBalance, (record) => record.date),
        calculateModuleSnapshot("atmCash", "ATM Cash", scopedAtmCash, (record) => (Number(record.fundIn) || 0) - (Number(record.fundOut) || 0), (record) => record.date),
        calculateModuleSnapshot("bankRental", "Bank Rental", scopedBankRental, (record) => record.amount, (record) => record.startDate || record.createdDate || record.createdAt)
    ];
    const scopedFundBalance = roundMoney(scopedFunds.reduce((sum, fund) => sum + (Number(fund.currentBalance ?? fund.netAmount ?? fund.initialBalance) || 0), 0));
    const scopedAtmBalance = roundMoney(scopedAtmCash.reduce((sum, record) => sum + ((Number(record.fundIn) || 0) - (Number(record.fundOut) || 0)), 0));
    const eventSource = selectedContext ? getRecordsForDashboardScope(state.calendarEvents, selectedContext) : getDashboardScopeRecords(state.calendarEvents);
    const events = getUpcomingEvents(8, eventSource);
    return `
        <div class="module dashboard-summary-module">
            <div class="module-header"><h2>${t("Dashboard")}</h2></div>
            <div class="dashboard-owner-banner ${selectedUser ? "user-context" : "superadmin-context"}">
                <strong>${escapeHtml(bannerLabel)}</strong>
                <span>Current dashboard owner: ${escapeHtml(ownerLabel)}</span>
            </div>
            ${renderDashboardScopeSelector()}
            ${renderSuperAdminUserContextSelector()}
            <div class="dashboard-summary-grid">
                <div class="dashboard-summary-card"><h3>Total Employees</h3><strong class="dashboard-summary-total">${scopedEmployees.length}</strong></div>
                <div class="dashboard-summary-card"><h3>Current Funds</h3><strong class="dashboard-summary-total">${formatMoney(scopedFundBalance)}</strong></div>
                <div class="dashboard-summary-card"><h3>ATM Cash</h3><strong class="dashboard-summary-total">${formatMoney(scopedAtmBalance)}</strong></div>
                ${snapshots.map((snapshot) => `
                    <div class="dashboard-summary-card dashboard-summary-card-${snapshot.moduleId}">
                        <div class="dashboard-summary-card-header">
                            <span class="dashboard-summary-accent"></span>
                            <h3>${t(snapshot.label)}</h3>
                        </div>
                        <strong class="dashboard-summary-total">${formatMoney(snapshot.totalAmount)}</strong>
                        <div class="dashboard-summary-metrics">
                            <div>
                                <span>${t("Total Amount")}</span>
                                <strong>${formatMoney(snapshot.totalAmount)}</strong>
                            </div>
                            <div>
                                <span>${t("Record Count")}</span>
                                <strong>${snapshot.recordCount}</strong>
                            </div>
                            <div>
                                <span>${t("Latest Date")}</span>
                                <strong>${formatExportDate(snapshot.latestDate)}</strong>
                            </div>
                            ${snapshot.moduleId === "bankRental" ? "" : `
                            <div>
                                <span>${t("This Month Total")}</span>
                                <strong>${formatMoney(snapshot.thisMonthTotal)}</strong>
                            </div>
                            `}
                        </div>
                    </div>
                `).join("") || `<div class="empty-state">No dashboard data available</div>`}
            </div>
            <div class="dashboard-card dashboard-events-card">
                <div class="module-header">
                    <h2>Global Upcoming Events</h2>
                </div>
                ${renderEventRows(events, true) || `<div class="empty-state">No upcoming events.</div>`}
            </div>
        </div>
    `;
}

function renderCalendarMonth(events) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const eventDates = new Set(events.map((event) => normalizeDateValue(event.date)));
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(`<span></span>`);
    for (let day = 1; day <= days; day++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        cells.push(`<button class="calendar-day ${eventDates.has(date) ? "has-event" : ""}" onclick="showAddCalendarEventModal('${date}')">${day}</button>`);
    }
    return `
        <div class="calendar-grid">
            ${["S", "M", "T", "W", "T", "F", "S"].map((day) => `<strong>${day}</strong>`).join("")}
            ${cells.join("")}
        </div>
        <div class="event-list">${renderEventRows(events, false) || `<div class="empty-state">No events yet.</div>`}</div>
    `;
}

function getUserDisplayName(registeredId) {
    const normalized = String(registeredId || "").trim().toLowerCase();
    const user = (superAdminStore.users || []).find((item) => String(item.registeredId || item.email || "").trim().toLowerCase() === normalized);
    return user?.displayName || user?.registeredId || user?.email || registeredId || "-";
}

function getUserDisplayNameOnly(registeredId) {
    const normalized = String(registeredId || "").trim().toLowerCase();
    const user = (superAdminStore.users || []).find((item) => String(item.registeredId || item.email || "").trim().toLowerCase() === normalized);
    return user?.displayName || "-";
}

function setSelectedUserContext(ownerId) {
    if (!isSuperadmin) return;
    const owner = String(ownerId || "").trim().toLowerCase();
    if (owner && !getActiveContextUsers().some((user) => getUserOwnerId(user) === owner)) return;
    superAdminStore.selectedUserContext = owner;
    superAdminStore.eventFilter = owner;
    superAdminStore.selectedRegisteredId = owner;
    superAdminStore.reportScope = owner ? "current" : "global";
    superAdminStore.reportModuleId = "";
    reportSelectionState.selectedIds.clear();
    getModuleFilter("reports").page = 1;
    getModuleFilter("reports_modules").page = 1;
    persistSelectedUserContext();
    Object.values(moduleFilters).forEach((filter) => {
        filter.page = 1;
    });
    renderApp();
}

function updateSuperAdminUserContextSearch(value) {
    superAdminStore.userContextSearch = value;
    debouncedRenderApp();
}

function renderSuperAdminUserContextSelector() {
    const users = getActiveContextUsers();
    const selected = getSelectedUserContext();
    const query = String(superAdminStore.userContextSearch || "").trim().toLowerCase();
    const rows = users
        .filter((user) => {
            const owner = getUserOwnerId(user);
            const label = `${user.displayName || ""} ${owner} ${getManagementUserRoleLabel(user)}`.toLowerCase();
            return !query || label.includes(query);
        })
        .slice(0, 8)
        .map((user) => {
            const owner = getUserOwnerId(user);
            const recordCount = getOwnerModuleRecords(owner).reduce((sum, module) => sum + module.records.length, 0);
            return `
                <button class="dashboard-context-row ${selected === owner ? "active" : ""}" onclick="setSelectedUserContext('${escapeAttribute(owner)}')">
                    <span>
                        <strong>${escapeHtml(user.displayName || owner)}</strong>
                        <small>${escapeHtml(owner)}</small>
                    </span>
                    <span class="badge">${escapeHtml(getManagementUserRoleLabel(user))}</span>
                    <span>${recordCount}</span>
                </button>
            `;
        }).join("");
    const selectedUser = users.find((user) => getUserOwnerId(user) === selected);
    return `
        <section class="dashboard-context-selector" aria-label="Superadmin user context">
            <div class="dashboard-context-header">
                <div>
                    <span>Viewing Context</span>
                    <strong>${selectedUser ? escapeHtml(selectedUser.displayName || getUserOwnerId(selectedUser)) : "SuperAdmin Dashboard"}</strong>
                </div>
                ${selected ? `<button class="btn btn-secondary btn-sm" onclick="setSelectedUserContext('')">SuperAdmin</button>` : ""}
            </div>
            <input class="dashboard-context-search" value="${escapeAttribute(superAdminStore.userContextSearch || "")}" placeholder="Search active users" oninput="updateSuperAdminUserContextSearch(this.value)" />
            <div class="dashboard-context-table">
                ${rows || `<div class="empty-state">No active users found.</div>`}
            </div>
        </section>
    `;
}

function setDashboardScope(scope) {
    if (!isSuperadmin) return;
    superAdminStore.dashboardScope = ["superadmin", "admin", "user"].includes(scope) ? scope : "superadmin";
    renderApp();
}

function getDashboardScopeOwners() {
    const scope = ["superadmin", "admin", "user"].includes(superAdminStore.dashboardScope) ? superAdminStore.dashboardScope : "superadmin";
    if (scope === "superadmin") return null;
    return new Set((superAdminStore.users || [])
        .filter((user) => {
            const role = user.isSuperadmin || user.role === "superadmin" || user.accountRole === "superadmin"
                ? "superadmin"
                : user.role === "admin" || user.accountRole === "admin"
                ? "admin"
                : "user";
            return role === scope;
        })
        .map(getUserOwnerId)
        .filter(Boolean));
}

function getDashboardScopeRecords(records = []) {
    const selectedOwner = getSelectedUserContext();
    if (selectedOwner) return getRecordsForDashboardScope(records, selectedOwner);
    const owners = getDashboardScopeOwners();
    const list = Array.isArray(records) ? records : [];
    if (!owners) return list;
    return list.filter((record) => owners.has(getRecordOwner(record)));
}

function getDashboardScopeBankRentalRecords() {
    const selectedOwner = getSelectedUserContext();
    if (selectedOwner) return getBankRentalAmountRecords(selectedOwner);
    const owners = getDashboardScopeOwners();
    const records = getBankRentalAmountRecords();
    if (!owners) return records;
    return records.filter((record) => owners.has(getRecordOwner(record)));
}

function renderDashboardScopeSelector() {
    const scope = ["superadmin", "admin", "user"].includes(superAdminStore.dashboardScope) ? superAdminStore.dashboardScope : "superadmin";
    return `
        <div class="database-filters">
            <label>Dashboard Scope
                <select onchange="setDashboardScope(this.value)">
                    <option value="superadmin" ${scope === "superadmin" ? "selected" : ""}>SuperAdmin</option>
                    <option value="admin" ${scope === "admin" ? "selected" : ""}>Admin</option>
                    <option value="user" ${scope === "user" ? "selected" : ""}>User</option>
                </select>
            </label>
        </div>
    `;
}


function getOwnerOptions(selectedOwner = currentRegisteredId) {
    const owners = new Map();
    if (currentRegisteredId) owners.set(currentRegisteredId, getUserDisplayName(currentRegisteredId));
    (superAdminStore.users || []).forEach((user) => {
        const id = String(user.registeredId || user.email || "").trim().toLowerCase();
        if (id) owners.set(id, user.displayName ? `${user.displayName} (${id})` : id);
    });
    const selected = String(selectedOwner ?? currentRegisteredId ?? "").trim().toLowerCase();
    return [...owners.entries()].map(([id, label]) => `<option value="${escapeAttribute(id)}" ${id === selected ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function getContextEmployeeOptions(selectedEmployeeId = "") {
    const employees = Array.isArray(state.employees) ? state.employees : [];
    return employees.map((emp) => `<option value="${escapeAttribute(emp.id)}" ${emp.id === selectedEmployeeId ? "selected" : ""}>${escapeHtml(emp.name)}</option>`).join("");
}

function renderCalendarEventForm(event = {}) {
    return `
        <label>Title <input id="calendarTitle" value="${escapeAttribute(event.title || "")}" placeholder="Event title" /></label>
        <label>Date <input id="calendarDate" type="date" value="${escapeAttribute(normalizeDateValue(event.date))}" /></label>
        <label>Start Time <input id="calendarStartTime" type="time" value="${escapeAttribute(event.startTime || "")}" /></label>
        <label>End Time <input id="calendarEndTime" type="time" value="${escapeAttribute(event.endTime || "")}" /></label>
        <label>Description <textarea id="calendarDescription" placeholder="Description">${escapeHtml(event.description || "")}</textarea></label>
    `;
}

function readCalendarEventForm(existing = {}) {
    const title = document.getElementById("calendarTitle").value.trim();
    const date = document.getElementById("calendarDate").value;
    if (!title || !date) {
        alert("Please enter event title and date.");
        return null;
    }
    const now = new Date().toISOString();
    return {
        ...existing,
        title,
        date,
        startTime: document.getElementById("calendarStartTime").value,
        endTime: document.getElementById("calendarEndTime").value,
        description: document.getElementById("calendarDescription").value.trim(),
        updatedAt: now,
        createdAt: existing.createdAt || now
    };
}

function showAddCalendarEventModal(date = "") {
    if (!guardOperation("create", "calendar event")) return;
    openModal(
        "Add Event",
        renderCalendarEventForm({ date }),
        async () => {
            const values = readCalendarEventForm();
            if (!values) return;
            state.calendarEvents.push(applyCurrentOwner({ id: generateId("evt"), ...values }));
            renderApp();
            await saveState();
            closeModal();
        },
        "Save"
    );
}

function editCalendarEvent(id) {
    if (!guardOperation("update", "calendar event")) return;
    const event = (state.calendarEvents || []).find((item) => item.id === id);
    if (!event || !canManageRecord(event)) {
        alert("You can only edit your own calendar events.");
        return;
    }
    openModal(
        "Edit Event",
        renderCalendarEventForm(event),
        async () => {
            const values = readCalendarEventForm(event);
            if (!values) return;
            Object.assign(event, values);
            renderApp();
            await saveState();
            closeModal();
        },
        "Update"
    );
}

function confirmDeleteCalendarEvent(id) {
    if (!guardOperation("delete", "calendar event")) return;
    const event = (state.calendarEvents || []).find((item) => item.id === id);
    if (!event || !canManageRecord(event)) {
        alert("You can only delete your own calendar events.");
        return;
    }
    openModal(
        "Delete Event",
        `<p>Delete event <strong>${escapeHtml(event.title || "-")}</strong>?</p>`,
        async () => {
            state.calendarEvents = (state.calendarEvents || []).filter((item) => item.id !== id);
            renderApp();
            await saveState();
            closeModal();
        },
        "Delete"
    );
}

function getEmployeeStatus(employee = {}) {
    return String(employee.employee_status || employee.status || "Active").trim() || "Active";
}

function getExpiryStatus(dateValue) {
    if (!dateValue) return "";
    const expiry = new Date(dateValue);
    if (Number.isNaN(expiry.getTime())) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    if (days < 0) return "expired";
    if (days <= 30) return "warning";
    return "ok";
}

function renderEmployeeLifecycleBadges(employee = {}) {
    const status = getEmployeeStatus(employee);
    const expiryFields = [
        ["Passport", employee.passport_expiry],
        ["Visa", employee.visa_expiry],
        ["Permit", employee.permit_expiry]
    ];
    const expiryBadges = expiryFields.map(([label, value]) => {
        const expiryStatus = getExpiryStatus(value);
        if (!expiryStatus) return "";
        const text = expiryStatus === "expired" ? `${label} expired` : expiryStatus === "warning" ? `${label} expiring` : `${label} ok`;
        return `<span class="badge employee-expiry-${expiryStatus}">${escapeHtml(text)}</span>`;
    }).join("");
    return `
        <div class="employee-lifecycle-badges">
            <span class="badge employee-status-${escapeAttribute(status.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">${escapeHtml(status)}</span>
            ${employee.worker_type ? `<span class="badge">${escapeHtml(employee.worker_type)}</span>` : ""}
            ${expiryBadges}
        </div>
    `;
}

function renderEmployees() {
    const sort = moduleSortState.employees || { field: "createdAt", direction: "desc" };
    const sortedEmployees = ["wages", "paymentRecord"].includes(sort.field)
        ? sortRecords(state.employees, sort.field, sort.direction)
        : state.employees;
    const moduleData = getPaginatedModuleRecords("employees", sortedEmployees, { preserveOrder: ["wages", "paymentRecord"].includes(sort.field), skipSelectedUserScope: true });
    const canCreateEmployee = hasModulePermission("employees", "create");
    const canEditEmployee = hasModulePermission("employees", "update");
    const canDeleteEmployee = hasModulePermission("employees", "delete");
    const actionColumn = canEditEmployee || canDeleteEmployee;
    const cards = moduleData.pageRows.map((emp) => {
        const canDeleteEmployeeRecord = canDeleteSharedRecord(emp);
        return `
        <article class="employee-card">
            <div class="employee-card-photo">
                ${renderEmployeePhoto(emp)}
            </div>
            <div class="employee-card-body">
                <div class="employee-card-title">
                    <h3>${escapeHtml(emp.name || "-")}</h3>
                    <span class="badge">${escapeHtml(emp.category || "-")}</span>
                </div>
                ${renderEmployeeLifecycleBadges(emp)}
                <div class="employee-card-grid">
                    <div><span>${t("Role")}</span><strong>${escapeHtml(emp.role || "-")}</strong></div>
                    <div><span>${t("Department")}</span><strong>${escapeHtml(emp.department || "-")}</strong></div>
                    ${isSuperadmin ? `<div><span>${t("Wages")}</span><strong>${escapeHtml(emp.wages || emp.salary || emp.paymentRecord || "-")}</strong></div>` : ""}
                    <div><span>Join Date</span><strong>${escapeHtml(formatExportDate(emp.join_date) || "-")}</strong></div>
                    <div><span>Exit Date</span><strong>${escapeHtml(formatExportDate(emp.exit_date) || "-")}</strong></div>
                    <div><span>${t("Remark")}</span><strong>${escapeHtml(emp.remark || "-")}</strong></div>
                </div>
                <div class="btn-group employee-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewEmployeeDetail('${emp.id}')">${t("View Detail")}</button>
                    ${canEditEmployee ? `<button class="btn btn-secondary btn-sm" onclick="addRemark('employees','${emp.id}')">${t("Remark")}</button>` : ""}
                    ${canEditEmployee ? `<button class="btn btn-secondary btn-sm" onclick="editEmployee('${emp.id}')">${t("Edit")}</button>` : ""}
                    ${isSuperadmin && canEditEmployee && getEmployeePhoto(emp) ? `<button class="btn btn-secondary btn-sm" onclick="removeEmployeePhoto('${emp.id}')">Remove Photo</button>` : ""}
                    ${canDeleteEmployee && canDeleteEmployeeRecord ? `<button class="btn btn-danger btn-sm" onclick="confirmDelete('employee','${emp.id}')">${t("Delete")}</button>` : ""}
                </div>
            </div>
        </article>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Employees")}</h2>${canCreateEmployee ? `<button class="btn" onclick="showAddEmployeeModal()">+ ${t("Add Employee")}</button>` : ""}</div>
            <div class="database-filters">
                <label>${t("Sort By")}
                    <select onchange="updateModuleSort('employees', 'field', this.value)">
                        <option value="createdAt" ${sort.field === "createdAt" ? "selected" : ""}>${t("Created Date")}</option>
                        <option value="wages" ${sort.field === "wages" ? "selected" : ""}>${t("Wages")}</option>
                        <option value="paymentRecord" ${sort.field === "paymentRecord" ? "selected" : ""}>${t("Payment Record")}</option>
                    </select>
                </label>
                <label>${t("Direction")}
                    <select onchange="updateModuleSort('employees', 'direction', this.value)">
                        <option value="asc" ${sort.direction === "asc" ? "selected" : ""}>${t("Ascending")}</option>
                        <option value="desc" ${sort.direction === "desc" ? "selected" : ""}>${t("Descending")}</option>
                    </select>
                </label>
            </div>
            <div class="employee-card-list">${cards || `<div class="empty-state">No employees added yet</div>`}</div>
            ${renderPagination("employees", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function renderSchedules() {
    const moduleData = getPaginatedModuleRecords("schedules", state.schedules, { skipSelectedUserScope: true });
    const actionColumn = canManageData();
    const rows = moduleData.pageRows.map((schedule) => {
        const canDeleteSchedule = canDeleteSharedRecord(schedule);
        return `
        <tr>
            <td class="table-name-cell">${escapeHtml(getEmployeeName(schedule.employeeId))}</td>
            <td>${formatExportDate(schedule.startDate || schedule.date)} - ${formatExportDate(schedule.endDate || schedule.date)}</td>
            <td><span class="badge">${escapeHtml(schedule.leaveType || schedule.shift || "-")}</span></td>
            <td class="table-detail-cell">${renderTableDetailButton("schedules", "reason", schedule.reason || schedule.remark, "Reason")}</td>
            ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${getEmployeeName(schedule.employeeId)}`, [
                canEditData() ? { label: t("Edit"), action: `editSchedule('${schedule.id}')` } : null,
                canDeleteData() && canDeleteSchedule ? { label: t("Delete"), action: `confirmDelete('schedule','${schedule.id}')` } : null
            ])}</td>` : ""}
        </tr>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Schedules")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddScheduleModal()">+ ${t("Add Shift")}</button>` : ""}</div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Employee")}</th><th>${t("Date Range")}</th><th>${t("Leave Type")}</th><th>${t("Reason")}</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${actionColumn ? "5" : "4"}" class="empty-state">No schedules available</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("schedules", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function renderDebts() {
    const moduleData = getModuleRecords("debts", state.debts, (debt) => debt.date);
    const actionColumn = canManageData();
    const rows = moduleData.pageRows.map((debt) => {
        const canManageDebt = canManageRecord(debt);
        const details = combineDetailFields([
            { label: t("Reason"), value: debt.reason },
            { label: t("Remark"), value: debt.remark }
        ]);
        return `
        <tr>
            <td>${formatExportDate(debt.date)}</td>
            <td class="table-name-cell">${escapeHtml(getEmployeeName(debt.employeeId))}</td>
            <td class="table-money-cell">${renderMoneyCell(debt.amount)}</td>
            <td><span class="badge">${escapeHtml(debt.status)}</span></td>
            <td class="table-detail-cell">${renderTableDetailButton("debts", "details", details, "Details")}</td>
            ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${getEmployeeName(debt.employeeId)}`, [
                canEditData() && canManageDebt ? { label: t("Edit"), action: `editDebt('${debt.id}')` } : null,
                canEditData() && canManageDebt ? { label: t("Remark"), action: `addRemark('debts','${debt.id}')` } : null,
                canEditData() && canManageDebt && debt.status !== "Resolved" ? { label: t("Resolve"), action: `markDebtResolved('${debt.id}')` } : null,
                canDeleteData() && canManageDebt ? { label: t("Delete"), action: `confirmDelete('debt','${debt.id}')` } : null
            ])}</td>` : ""}
        </tr>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Debt Tracking")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddDebtModal()">+ ${t("Record Debt")}</button>` : ""}</div>
            ${renderModuleFilter("debts")}
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Employee")}</th><th>${t("Amount")}</th><th>${t("Status")}</th><th>Details</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${actionColumn ? "6" : "5"}" class="empty-state">No debts recorded</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("debts", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function renderExpenses() {
    const moduleData = getModuleRecords("expenses", state.expenses, (expense) => expense.date);
    const actionColumn = canManageData();
    const rows = moduleData.pageRows.map((expense) => {
        const canManageExpense = canManageRecord(expense);
        const details = combineDetailFields([
            { label: t("Description"), value: expense.description },
            { label: "Notes", value: expense.notes || expense.remark }
        ]);
        return `
        <tr>
            <td>${formatExportDate(expense.date)}</td>
            <td>
                <strong>${escapeHtml(expense.type || "-")}</strong><br />
                <span class="badge">${escapeHtml(expense.category || "-")}</span>
            </td>
            <td class="table-money-cell">${renderMoneyCell(expense.amount)}</td>
            <td>${escapeHtml(expense.paymentMethod || "-")}</td>
            <td class="table-detail-cell">${renderTableDetailButton("expenses", "details", details, "Details")}</td>
            ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${expense.type || expense.category || ""}`, [
                canEditData() && canManageExpense ? { label: t("Edit"), action: `editExpense('${expense.id}')` } : null,
                canDeleteData() && canManageExpense ? { label: t("Delete"), action: `confirmDelete('expense','${expense.id}')` } : null
            ])}</td>` : ""}
        </tr>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Expenses")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddExpenseModal()">+ ${t("Add Expense")}</button>` : ""}</div>
            ${renderModuleFilter("expenses")}
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Date")}</th><th>Category</th><th>${t("Amount")}</th><th>${t("Payment Method")}</th><th>Details</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${actionColumn ? "6" : "5"}" class="empty-state">No expenses recorded</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("expenses", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function renderReimbursementClaims() {
    const visibleClaims = getVisibleReimbursementClaims();
    const moduleData = getModuleRecords("reimbursementClaims", visibleClaims, (claim) => claim.date);
    const actionColumn = canManageData();
    const showSubmittedBy = isSuperadmin;
    const baseColumnCount = 3;
    const emptyColspan = baseColumnCount + (actionColumn ? 1 : 0);
    const rows = moduleData.pageRows.map((claim) => {
        const canManageClaim = canManageRecord(claim);
        return `
        <tr>
            <td class="reimbursement-date-cell">
                ${formatExportDate(claim.date)}
                ${showSubmittedBy ? `<small>${escapeHtml(getUserDisplayName(getRecordOwner(claim) || claim.workerId || claim.employeeId))}</small>` : ""}
            </td>
            <td class="table-money-cell reimbursement-amount-cell">${renderMoneyCell(claim.amount)}</td>
            <td class="reimbursement-description-cell">${renderReimbursementClaimDescriptionCell(claim)}</td>
            ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${formatExportDate(claim.date)}`, [
                canEditData() && canManageClaim ? { label: t("Edit"), action: `editReimbursementClaim('${claim.id}')` } : null,
                canDeleteData() && canManageClaim ? { label: t("Delete"), action: `confirmDelete('reimbursementClaim','${claim.id}')` } : null
            ])}</td>` : ""}
        </tr>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Reimbursement Claims")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddReimbursementClaimModal()">+ ${t("Add Claim")}</button>` : ""}</div>
            ${renderModuleFilter("reimbursementClaims")}
            <div class="table-wrapper">
                <table class="reimbursement-claims-table">
                    <colgroup>
                        <col class="reimbursement-col-date" />
                        <col class="reimbursement-col-amount" />
                        <col class="reimbursement-col-description" />
                        ${actionColumn ? `<col class="reimbursement-col-actions" />` : ""}
                    </colgroup>
                    <thead><tr><th>${t("Date")}</th><th>${t("Amount")}</th><th>${t("Description")}</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${emptyColspan}" class="empty-state">No reimbursement claims recorded</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("reimbursementClaims", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function getVisibleReimbursementClaims() {
    const claims = Array.isArray(state.reimbursementClaims) ? state.reimbursementClaims : [];
    if (isSuperadmin) return claims;
    const current = String(currentRegisteredId || "").trim().toLowerCase();
    return claims.filter((claim) => getReimbursementClaimOwner(claim) === current);
}

function getReimbursementClaimOwner(claim) {
    return getRecordOwner(claim) || String(claim?.workerId || claim?.employeeId || "").trim().toLowerCase();
}

function renderReimbursementClaimDescriptionCell(claim) {
    const description = String(claim.description || "").trim();
    const remark = String(claim.remark || "").trim();
    const isLong = description.length > 80;
    const displayText = description ? (isLong ? `${description.slice(0, 80)}...` : description) : "-";
    const shouldShowDetail = isLong || Boolean(remark);
    return `
        <div class="reimbursement-description-preview">
            <span>${escapeHtml(displayText)}</span>
            <span class="badge">${escapeHtml(claim.status || "Pending")}</span>
            ${shouldShowDetail ? `<button class="btn btn-secondary btn-sm table-detail-btn" onclick="viewReimbursementClaimDetail('${claim.id}')">${t("View Detail")}</button>` : ""}
        </div>
    `;
}

function viewReimbursementClaimDetail(id) {
    const claim = state.reimbursementClaims.find((item) => item.id === id);
    if (!claim) return;
    openReadOnlyModal(
        "Reimbursement Claim Detail",
        `
            <div class="detail-grid">
                ${renderDetailRow(t("Date"), formatExportDate(claim.date))}
                ${renderDetailRow(t("Amount"), formatMoney(claim.amount))}
                ${renderDetailRow(t("Description"), claim.description)}
                ${renderDetailRow(t("Source of Funds / Remark"), claim.remark)}
            </div>
        `
    );
}

function renderPayments() {
    const useOriginalCompanyPaymentsRenderer = true;
    if (useOriginalCompanyPaymentsRenderer) {
        const moduleData = getPaginatedModuleRecords("payments", state.payments);
        const paymentSummary = getCompanyPaymentSummary(moduleData.filtered);
        const actionColumn = true;
        const rows = moduleData.pageRows.map((payment) => {
            const details = combineDetailFields([
                { label: "Detail", value: payment.detail || payment.details },
                { label: t("Remark"), value: payment.remark },
                { label: t("Description"), value: payment.description || payment.describe }
            ]);
            const canManagePayment = canManageRecord(payment);
            const nextStatusLabel = payment.status === "Pending" ? t("Approve") : t("Status");
            return `
            <tr>
                <td>${formatExportDate(payment.date)}</td>
                <td class="table-name-cell">${escapeHtml(payment.recipient)}</td>
                <td class="table-money-cell">${renderMoneyCell(payment.amount)}</td>
                <td><span class="badge">${escapeHtml(payment.type || "-")}</span></td>
                <td><span class="badge">${escapeHtml(payment.status || "-")}</span></td>
                <td class="table-detail-cell">${renderTableDetailButton("payments", "details", details, "Details")}</td>
                ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${payment.recipient || ""}`, [
                    { label: t("View Detail"), action: `viewPaymentDetail('${payment.id}')` },
                    canEditData() && canManagePayment ? { label: t("Edit"), action: `editPayment('${payment.id}')` } : null,
                    canEditData() && canManagePayment ? { label: t("Remark"), action: `addRemark('payments','${payment.id}')` } : null,
                    canEditData() && canManagePayment ? { label: nextStatusLabel, action: `updatePaymentStatus('${payment.id}')` } : null,
                    canDeleteData() && canManagePayment ? { label: t("Delete"), action: `confirmDelete('payment','${payment.id}')` } : null
                ])}</td>` : ""}
            </tr>
        `;
        }).join("");

        return `
            <div class="module">
                <div class="module-header"><h2>${t("Company Payments")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddPaymentModal()">+ ${t("Add Payment")}</button>` : ""}</div>
                <div class="cards">
                    <div class="card"><h4>Overall Total</h4><h2>${formatMoney(paymentSummary.totalAmount)}</h2></div>
                    <div class="card"><h4>Monthly Total</h4><h2>${formatMoney(paymentSummary.monthlyTotal)}</h2></div>
                    <div class="card"><h4>${t("Record Count")}</h4><h2>${paymentSummary.recordCount}</h2></div>
                    <div class="card"><h4>${t("Pending Company Payments")}</h4><h2>${paymentSummary.pendingCount}</h2></div>
                    <div class="card"><h4>${t("Approved Company Payments")}</h4><h2>${paymentSummary.approvedCount}</h2></div>
                    <div class="card"><h4>${t("Paid Company Payments")}</h4><h2>${paymentSummary.paidCount}</h2></div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>${t("Date")}</th><th>${t("Recipient")}</th><th>${t("Amount")}</th><th>${t("Type")}</th><th>${t("Status")}</th><th>Details</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                        <tbody>${rows || `<tr><td colspan="${actionColumn ? "7" : "6"}" class="empty-state">No payments recorded</td></tr>`}</tbody>
                    </table>
                </div>
                ${renderPagination("payments", moduleData.filtered.length, moduleData.totalPages)}
            </div>
        `;
    }

    const moduleData = getModuleRecords("payments", state.payments, (payment) => payment.date);
    const rows = moduleData.pageRows.map((payment) => `
        <tr>
            <td>${formatExportDate(payment.date)}</td>
            <td class="table-name-cell">${escapeHtml(payment.recipient)}</td>
            <td class="table-money-cell">${renderMoneyCell(payment.amount)}</td>
            <td class="table-detail-cell">${renderTableDetailButton("payments", "description", payment.description, "Description")}</td>
            <td><span class="badge">${escapeHtml(payment.type)}</span></td>
            <td><span class="badge">${escapeHtml(payment.status)}</span></td>
            <td class="table-detail-cell">${renderTableDetailButton("payments", "remark", payment.remark, "Remark")}</td>
            <td class="btn-group">${renderActionMenu(`${t("Actions")} ${payment.recipient || ""}`, [
                { label: t("View Detail"), action: `viewPaymentDetail('${payment.id}')` },
                canEditData() ? { label: t("Edit"), action: `editPayment('${payment.id}')` } : null,
                canEditData() ? { label: t("Remark"), action: `addRemark('payments','${payment.id}')` } : null,
                canEditData() ? { label: t("Status"), action: `updatePaymentStatus('${payment.id}')` } : null,
                canDeleteData() ? { label: t("Delete"), action: `confirmDelete('payment','${payment.id}')` } : null
            ])}</td>
        </tr>
    `).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Company Payments")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddPaymentModal()">+ ${t("Add Payment")}</button>` : ""}</div>
            ${renderModuleFilter("payments")}
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Recipient")}</th><th>${t("Amount")}</th><th>${t("Description")}</th><th>${t("Type")}</th><th>${t("Status")}</th><th>${t("Remark")}</th><th>${t("Actions")}</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="8" class="empty-state">No payments recorded</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("payments", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function viewPaymentDetail(id) {
    const payment = state.payments.find((item) => item.id === id);
    if (!payment) return;

    openReadOnlyModal(
        "Payment Detail",
        `
            <div class="detail-grid">
                ${renderDetailRow("Date", formatExportDate(payment.date))}
                ${renderDetailRow("Recipient", payment.recipient)}
                ${renderDetailRow("Amount", formatMoney(payment.amount))}
                ${renderDetailRow("Detail", payment.detail || payment.details)}
                ${renderDetailRow("Description", payment.description || payment.describe)}
                ${renderDetailRow("Type", payment.type)}
                ${renderDetailRow("Status", payment.status)}
                ${renderDetailRow("Remark", payment.remark, "No remark")}
            </div>
        `
    );
}

function renderFunds() {
    const moduleData = getModuleRecords("funds", state.fundAccounts, (fund) => fund.date);
    const actionColumn = canManageData();
    const rows = moduleData.pageRows.map((fund) => {
        const canManageFund = canManageRecord(fund);
        return `
        <tr>
            <td>${formatExportDate(fund.date)}</td>
            <td class="table-name-cell">${escapeHtml(fund.name)}</td>
            <td class="table-money-cell">${renderMoneyCell(fund.fundIn ?? fund.initialBalance)}</td>
            <td class="table-money-cell">${renderMoneyCell(fund.fundOut ?? (fund.initialBalance - fund.currentBalance))}</td>
            <td class="table-money-cell">${renderMoneyCell(fund.netAmount ?? fund.currentBalance)}</td>
            ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${fund.name || ""}`, [
                canEditData() && canManageFund ? { label: t("Edit"), action: `editFund('${fund.id}')` } : null,
                canDeleteData() && canManageFund ? { label: t("Delete"), action: `confirmDelete('fund','${fund.id}')` } : null
            ])}</td>` : ""}
        </tr>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Funds")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddFundModal()">+ ${t("Add Fund")}</button>` : ""}</div>
            ${renderModuleFilter("funds")}
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Name")}</th><th>${t("Fund In")}</th><th>${t("Fund Out")}</th><th>${t("Net Balance")}</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${actionColumn ? "6" : "5"}" class="empty-state">No fund accounts created</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("funds", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function renderAtmCash() {
    const atmCashRecords = Array.isArray(state.atmCashRecords) ? state.atmCashRecords : [];
    const current = String(currentRegisteredId || "").trim().toLowerCase();
    const visibleAtmCashRecords = isSuperadmin
        ? atmCashRecords
        : atmCashRecords.filter((record) => getRecordOwner(record) === current);
    const moduleData = getModuleRecords("atmCash", visibleAtmCashRecords, (record) => record.date);
    const actionColumn = canManageData();
    const ledger = getAtmCashLedger(moduleData.filtered);
    const pageSize = Number(moduleData.filter.pageSize) || DEFAULT_MODULE_PAGE_SIZE;
    const pageStart = (moduleData.filter.page - 1) * pageSize;
    const rows = ledger.rows.slice(pageStart, pageStart + pageSize).map((record) => {
        const canManageAtmCash = canManageRecord(record);
        return `
        <tr>
            <td>${formatExportDate(record.date)}</td>
            <td class="table-money-cell">${record.fundIn ? renderMoneyCell(record.fundIn) : "-"}</td>
            <td class="table-money-cell">${record.fundOut ? renderMoneyCell(record.fundOut) : "-"}</td>
            <td class="table-detail-cell">${renderTableDetailButton("atm-cash", "remark", record.remark, "Remark")}</td>
            <td class="table-money-cell">${renderMoneyCell(record.balance)}</td>
            ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${formatExportDate(record.date)}`, [
                canEditData() && canManageAtmCash ? { label: t("Edit"), action: `editAtmCashRecord('${record.id}')` } : null,
                canDeleteData() && canManageAtmCash ? { label: t("Delete"), action: `confirmDelete('atmCash','${record.id}')` } : null
            ])}</td>` : ""}
        </tr>
    `;
    }).join("");

    return `
        <div class="module">
            <div class="module-header">
                <h2>${t("ATM Cash")}</h2>
                ${canCreateData() ? `<button class="btn" onclick="showAddAtmCashModal()">+ ${t("Add ATM Cash Record")}</button>` : ""}
            </div>
            ${renderModuleFilter("atmCash")}
            <div class="fund-card">
                <div class="fund-stats">
                    <strong>${t("Current Balance")}</strong>
                    <span class="badge">${formatMoney(ledger.currentBalance)}</span>
                </div>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Fund In")}</th><th>${t("Fund Out")}</th><th>${t("Remark")}</th><th>${t("Balance")}</th>${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${actionColumn ? "6" : "5"}" class="empty-state">No ATM cash records yet.</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination("atmCash", moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function getBankRentalTab(tabId = activeBankRentalTab) {
    return BANK_RENTAL_TABS.find((tab) => tab.id === tabId) || BANK_RENTAL_TABS[0];
}

function getBankRentalRecords(tabId = activeBankRentalTab) {
    const tab = getBankRentalTab(tabId);
    state.bankRental = normalizeBankRentalState(state.bankRental);
    return state.bankRental[tab.id];
}

function isBankRentalSourceTab(tabId) {
    return BANK_RENTAL_SOURCE_TAB_IDS.includes(tabId);
}

function getAllBankRentalRecords() {
    return getDedupedBankRentalRecords(getAllBankRentalRecordsWithSource());
}

function getPrimaryBankRentalRecords() {
    return getDedupedBankRentalRecords(getBankRentalRecords("bankRental").map((record) => ({
        ...record,
        sourceTabId: "bankRental",
        sourceTabLabel: getBankRentalTab("bankRental").label
    })));
}

function getAllBankRentalRecordsWithSource() {
    return BANK_RENTAL_TABS.filter((tab) => isBankRentalSourceTab(tab.id)).flatMap((tab) => getBankRentalRecords(tab.id).map((record) => ({
        ...record,
        sourceTabId: tab.id,
        sourceTabLabel: tab.label
    })));
}

function getBankRentalSourceRecords(tabId = activeBankRentalTab) {
    if (tabId === "totalRental" || tabId === "bankRental") return getPrimaryBankRentalRecords();
    if (tabId === "block") return getDedupedBankRentalRecords(getBankRentalRecords("block").map((record) => ({
        ...record,
        sourceTabId: "block",
        sourceTabLabel: getBankRentalTab("block").label
    })));
    if (BANK_RENTAL_SELECTION_TAB_IDS.includes(tabId)) {
        return getDedupedBankRentalRecords(getBankRentalRecords(tabId).map((record) => ({
            ...record,
            sourceTabId: tabId,
            sourceTabLabel: getBankRentalTab(tabId).label
        })));
    }
    return getDedupedBankRentalRecords(getBankRentalRecords(tabId).map((record) => ({
        ...record,
        sourceTabId: getBankRentalTab(tabId).id,
        sourceTabLabel: getBankRentalTab(tabId).label
    })));
}

function getBankRentalAgentName(record = {}) {
    return (record.agentName || record.name || "").trim() || "Unknown Agent";
}

function getBankRentalRecordSignature(record = {}) {
    return [
        getBankRentalAgentName(record),
        record.bankType,
        record.bankName,
        record.accountName,
        record.accountNumber,
        normalizeDateValue(record.startDate),
        normalizeDateValue(record.endDate),
        roundMoney(record.amount),
        record.bankStatus,
        roundMoney(record.remainingBalance),
        roundMoney(record.settledAmount),
        record.settlementStatus,
        record.bankDetail
    ].map((value) => String(value || "").trim().toLowerCase()).join("|");
}

function getBankRentalSourcePriority(record = {}) {
    return isBankRentalSourceTab(record.sourceTabId) ? 0 : 1;
}

function getDedupedBankRentalRecords(records = []) {
    const deduped = new Map();
    records
        .slice()
        .sort((a, b) => getBankRentalSourcePriority(a) - getBankRentalSourcePriority(b))
        .forEach((record) => {
            const signature = getBankRentalRecordSignature(record);
            if (!signature.replaceAll("|", "")) return;
            if (!deduped.has(signature)) deduped.set(signature, record);
        });
    return Array.from(deduped.values());
}

function getBankRentalDeletedSignatureSet() {
    return new Set(Array.isArray(state.bankRentalDeletedSignatures) ? state.bankRentalDeletedSignatures : []);
}

function rememberDeletedBankRentalRecord(record = {}) {
    const signature = getBankRentalRecordSignature(record);
    if (!signature.replaceAll("|", "")) return "";
    const signatures = getBankRentalDeletedSignatureSet();
    signatures.add(signature);
    state.bankRentalDeletedSignatures = Array.from(signatures);
    return signature;
}

function forgetDeletedBankRentalSignature(record = {}) {
    const signature = getBankRentalRecordSignature(record);
    if (!signature.replaceAll("|", "")) return;
    state.bankRentalDeletedSignatures = (state.bankRentalDeletedSignatures || []).filter((item) => item !== signature);
}

function purgeDeletedBankRentalRecordsFromState() {
    state.bankRental = normalizeBankRentalState(state.bankRental);
    const signatures = getBankRentalDeletedSignatureSet();
    if (!signatures.size) return 0;
    let removedCount = 0;
    BANK_RENTAL_TABS.forEach((tab) => {
        const records = getBankRentalRecords(tab.id);
        const nextRecords = records.filter((record) => !signatures.has(getBankRentalRecordSignature(record)));
        removedCount += records.length - nextRecords.length;
        state.bankRental[tab.id] = nextRecords;
    });
    return removedCount;
}

function removeBankRentalRecordPermanently(tabId, id) {
    const tab = getBankRentalTab(tabId);
    const records = getBankRentalRecords(tab.id);
    const record = records.find((item) => item.id === id);
    if (!record) return false;
    const deletedSignature = rememberDeletedBankRentalRecord(record);
    BANK_RENTAL_TABS.forEach((item) => {
        state.bankRental[item.id] = getBankRentalRecords(item.id).filter((current) => {
            if (current.id === id) return false;
            return !deletedSignature || getBankRentalRecordSignature(current) !== deletedSignature;
        });
    });
    state.bankRentalCleanupVersion = BANK_RENTAL_CLEANUP_VERSION;
    return true;
}

function getBankRentalOptionValue(record = {}) {
    return [
        getBankRentalAgentName(record),
        record.bankName,
        record.accountName,
        record.accountNumber
    ].filter(Boolean).join(" / ");
}

function getBankRentalSelectionOptions(query = "") {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    return getAllBankRentalRecords().filter((record) => {
        if (!normalizedQuery) return true;
        return [
            getBankRentalOptionValue(record),
            record.bankType,
            record.bankName,
            record.accountName,
            record.accountNumber,
            record.bankDetail,
            record.remark
        ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    }).sort((a, b) => {
        const agentCompare = getBankRentalAgentName(a).localeCompare(getBankRentalAgentName(b), undefined, { sensitivity: "base" });
        if (agentCompare) return agentCompare;
        return String(a.bankName || "").localeCompare(String(b.bankName || ""), undefined, { sensitivity: "base" });
    });
}

function getBankRentalRecordBySignature(signature) {
    if (!signature) return null;
    return getAllBankRentalRecords().find((record) => getBankRentalRecordSignature(record) === signature) || null;
}

function getSelectedBankRentalSignature(tabId) {
    return getBankRentalUi(tabId).selectedSignature || "";
}

function getBankRentalUi(tabId = activeBankRentalTab) {
    const tab = getBankRentalTab(tabId);
    if (!bankRentalUiState[tab.id]) {
        bankRentalUiState[tab.id] = { search: "", sortBy: "createdDate", sortDir: "desc", selectedSignature: "", savedBankSearch: "" };
    }
    return bankRentalUiState[tab.id];
}

function getBankRentalFinancials(record = {}) {
    const bankStatus = ["Normal", "Issue", "Settled"].includes(record.bankStatus) ? record.bankStatus : "Normal";
    const remainingBalance = roundMoney(record.remainingBalance ?? 0);
    const settledAmount = roundMoney(record.settledAmount ?? 0);
    const outstanding = roundMoney(remainingBalance - settledAmount);
    const settlementStatus = ["None", "Pending", "Partial", "Settled", "Unsettled"].includes(record.settlementStatus) ? record.settlementStatus : "None";
    let badgeClass = "bank-rental-status-none";

    if (settlementStatus === "Settled") {
        badgeClass = "bank-rental-status-settled";
    } else if (settlementStatus === "Partial") {
        badgeClass = "bank-rental-status-partial";
    } else if (settlementStatus === "Pending" || settlementStatus === "Unsettled") {
        badgeClass = "bank-rental-status-pending";
    }

    return {
        bankStatus,
        remainingBalance,
        settledAmount,
        outstanding,
        issueNotes: record.issueNotes || "",
        settlementStatus,
        badgeClass
    };
}

function renderBankRentalMoney(value) {
    return `<span class="bank-rental-money">${escapeHtml(formatMoney(value))}</span>`;
}

function canViewBankRentalFinancials() {
    return isSuperadmin;
}

function canViewBankRentalAmount(tabId = activeBankRentalTab) {
    return canViewBankRentalFinancials() || getBankRentalTab(tabId).id === "block";
}

function bankDetailContainsValue(bankDetail, value) {
    const normalizedDetail = String(bankDetail || "").toLowerCase();
    const normalizedValue = String(value || "").trim().toLowerCase();
    return Boolean(normalizedValue && normalizedDetail.includes(normalizedValue));
}

function getBankRentalDetailValue(record, field, financials = getBankRentalFinancials(record)) {
    if (field === "issueNotes") return financials.issueNotes || "";
    if (field === "bankDetail") {
        const rawBankDetail = record.bankDetail || "";
        return [
            record.accountName && !bankDetailContainsValue(rawBankDetail, record.accountName) ? `Account Name: ${record.accountName}` : "",
            record.accountNumber && !bankDetailContainsValue(rawBankDetail, record.accountNumber) ? `Account Number: ${record.accountNumber}` : "",
            rawBankDetail
        ].filter(Boolean).join("\n");
    }
    return record.remark || "";
}

function renderBankRentalDetailCell(tabId, record, field, label, financials) {
    const value = field === "bankDetail"
        ? combineDetailFields([
            { label: "Account Name", value: record.accountName },
            { label: "Account Number", value: record.accountNumber },
            { label: "Bank Detail", value: record.bankDetail }
        ])
        : getBankRentalDetailValue(record, field, financials).trim();
    if (!hasDetailContent(value)) return `<span class="bank-rental-detail-empty">-</span>`;

    return renderTableDetailButton(`bank-rental-${tabId}`, label, value, label).replace("table-detail-btn", "table-detail-btn bank-rental-detail-btn");
}

function viewBankRentalDetail(tabId, id, field) {
    const record = getBankRentalRecords(tabId).find((item) => item.id === id);
    if (!record) return;
    const labels = {
        remark: "Remark",
        bankDetail: "Bank Detail",
        issueNotes: "Issue Notes"
    };
    const value = field === "bankDetail"
        ? combineDetailFields([
            { label: "Account Name", value: record.accountName },
            { label: "Account Number", value: record.accountNumber },
            { label: "Bank Detail", value: record.bankDetail }
        ])
        : getBankRentalDetailValue(record, field);
    const detailHtml = renderTableDetailButton(`bank-rental-${tabId}`, labels[field] || field, value, labels[field] || "Detail");
    const detailId = detailHtml.match(/viewTableDetail\('([^']+)'\)/)?.[1];
    if (detailId) viewTableDetail(detailId);
}

function getBankRentalSummary(records) {
    return records.reduce((summary, record) => {
        const financials = getBankRentalFinancials(record);
        summary.amount = roundMoney(summary.amount + (Number(record.amount) || 0));
        summary.remainingBalance = roundMoney(summary.remainingBalance + financials.remainingBalance);
        summary.settledAmount = roundMoney(summary.settledAmount + financials.settledAmount);
        summary.outstanding = roundMoney(summary.outstanding + financials.outstanding);
        return summary;
    }, { amount: 0, remainingBalance: 0, settledAmount: 0, outstanding: 0 });
}

function groupBankRentalRecordsByAgent(records) {
    const groups = new Map();
    records.forEach((record) => {
        const agentName = getBankRentalAgentName(record);
        if (!groups.has(agentName)) {
            groups.set(agentName, { agentName, records: [], summary: { amount: 0, remainingBalance: 0, settledAmount: 0, outstanding: 0 }, recordCount: 0 });
        }
        const group = groups.get(agentName);
        group.records.push(record);
        group.recordCount += 1;
        group.summary = getBankRentalSummary(group.records);
    });
    return Array.from(groups.values()).sort((a, b) => a.agentName.localeCompare(b.agentName, undefined, { sensitivity: "base" }));
}

function getBankRentalSortValue(record = {}, field) {
    const financials = getBankRentalFinancials(record);
    const values = {
        date: normalizeDateValue(record.startDate) || normalizeDateValue(record.endDate) || normalizeDateValue(record.createdDate || record.createdAt),
        name: getBankRentalAgentName(record),
        amount: record.amount,
        bank: [record.bankName, record.bankType].filter(Boolean).join(" "),
        status: [financials.bankStatus, financials.settlementStatus].filter(Boolean).join(" "),
        bankType: record.bankType,
        bankName: record.bankName,
        startDate: record.startDate,
        endDate: record.endDate,
        createdDate: record.createdDate || record.createdAt
    };
    return values[field] ?? record[field];
}

function compareBankRentalRecords(a, b, field, direction = "asc") {
    const dir = direction === "desc" ? -1 : 1;
    if (field === "amount") {
        const amountA = Number(getBankRentalSortValue(a, field));
        const amountB = Number(getBankRentalSortValue(b, field));
        if (Number.isNaN(amountA) && Number.isNaN(amountB)) return 0;
        if (Number.isNaN(amountA)) return 1;
        if (Number.isNaN(amountB)) return -1;
        return (amountA - amountB) * dir;
    }
    if (["date", "startDate", "endDate", "createdDate"].includes(field)) {
        return compareNormalizedDates(getBankRentalSortValue(a, field), getBankRentalSortValue(b, field), direction);
    }
    const valueA = String(getBankRentalSortValue(a, field) || "").trim();
    const valueB = String(getBankRentalSortValue(b, field) || "").trim();
    if (!valueA && !valueB) return 0;
    if (!valueA) return 1;
    if (!valueB) return -1;
    return valueA.localeCompare(valueB, undefined, { sensitivity: "base" }) * dir;
}

function getFilteredBankRentalRecords(tabId = activeBankRentalTab) {
    const ui = getBankRentalUi(tabId);
    const query = ui.search.trim().toLowerCase();
    const hiddenFinancials = !canViewBankRentalAmount(tabId);
    const sortBy = hiddenFinancials && ui.sortBy === "amount"
        ? "createdDate"
        : (BANK_RENTAL_SORT_FIELDS.includes(ui.sortBy) ? ui.sortBy : "createdDate");
    const records = getBankRentalSourceRecords(tabId).filter((record) => {
        if (!query) return true;
        const searchableValues = [
            getBankRentalAgentName(record),
            record.bankType,
            record.bankName,
            record.accountName,
            record.accountNumber,
            formatExportDate(record.startDate),
            formatExportDate(record.endDate),
            formatExportDate(record.createdDate || record.createdAt)
        ];
        if (!hiddenFinancials) {
            searchableValues.push(record.bankDetail, formatMoney(record.amount), record.remark);
        }
        return searchableValues.some((value) => String(value || "").toLowerCase().includes(query));
    });

    return records.sort((a, b) => {
        const primary = compareBankRentalRecords(a, b, sortBy, ui.sortDir);
        if (primary !== 0) return primary;
        return compareBankRentalRecords(a, b, "name");
    });
}

function setBankRentalTab(tabId) {
    activeBankRentalTab = getBankRentalTab(tabId).id;
    renderApp();
}

function updateBankRentalSearch(tabId, value) {
    getBankRentalUi(tabId).search = value;
    getModuleFilter(`bankRental_${tabId}`).page = 1;
    debouncedRenderApp();
}

function updateBankRentalSavedBankSearch(tabId, value) {
    getBankRentalUi(tabId).savedBankSearch = value;
    renderApp();
}

function updateBankRentalSort(tabId, field, value) {
    const ui = getBankRentalUi(tabId);
    ui[field] = value;
    getModuleFilter(`bankRental_${tabId}`).page = 1;
    renderApp();
}

function selectBankRentalExistingRecord(tabId, signature) {
    if (!BANK_RENTAL_SELECTION_TAB_IDS.includes(tabId)) return;
    getBankRentalUi(tabId).selectedSignature = signature || "";
    getModuleFilter(`bankRental_${tabId}`).page = 1;
    renderApp();
}

function applySavedBankToBankRentalForm(signature) {
    const record = getBankRentalRecordBySignature(signature);
    if (!record) return;
    const financials = getBankRentalFinancials(record);
    const fieldValues = {
        bankRentalName: record.name || record.agentName || "",
        bankRentalBankType: record.bankType || "",
        bankRentalBankName: record.bankName || "",
        bankRentalAccountName: record.accountName || "",
        bankRentalAccountNumber: record.accountNumber || "",
        bankRentalStartDate: normalizeDateValue(record.startDate),
        bankRentalEndDate: normalizeDateValue(record.endDate),
        bankRentalAmount: record.amount || "",
        bankRentalBankStatus: financials.bankStatus,
        bankRentalRemainingBalance: financials.remainingBalance || "",
        bankRentalSettledAmount: financials.settledAmount || "",
        bankRentalRemark: record.remark || "",
        bankRentalIssueNotes: financials.issueNotes || "",
        bankRentalBankDetail: record.bankDetail || ""
    };
    Object.entries(fieldValues).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field) field.value = value;
    });
}

function filterBankRentalSavedBankSelect(value) {
    const query = String(value || "").trim().toLowerCase();
    const select = document.getElementById("bankRentalSavedBankSelect");
    if (!select) return;
    Array.from(select.options).forEach((option) => {
        option.hidden = Boolean(option.value && query && !option.textContent.toLowerCase().includes(query));
    });
}

function renderBankRentalSavedBankField() {
    const options = getBankRentalSelectionOptions().map((record) => {
        const signature = getBankRentalRecordSignature(record);
        return `<option value="${escapeAttribute(signature)}">${escapeHtml(getBankRentalOptionValue(record))}</option>`;
    }).join("");
    return `
        <input placeholder="${t("Search Saved Bank")}" oninput="filterBankRentalSavedBankSelect(this.value)" />
        <label>${t("Saved Bank")}
            <select id="bankRentalSavedBankSelect" onchange="applySavedBankToBankRentalForm(this.value)">
                <option value="">${t("Manual New Record")}</option>
                ${options}
            </select>
        </label>
    `;
}

function renderBankRentalExistingRecordSelect() {
    const options = getBankRentalSelectionOptions().map((record) => {
        const signature = getBankRentalRecordSignature(record);
        return `<option value="${escapeAttribute(signature)}">${escapeHtml(getBankRentalOptionValue(record))}</option>`;
    }).join("");
    return `
        <input placeholder="${t("Search")} ${t("Bank Rental")}" oninput="filterBankRentalSavedBankSelect(this.value)" />
        <label>${t("Bank Rental")}
            <select id="bankRentalSavedBankSelect">
                <option value="">${t("Select")} ${t("Bank Rental")}</option>
                ${options}
            </select>
        </label>
    `;
}

function readBankRentalForm() {
    const name = document.getElementById("bankRentalName").value.trim();
    const bankType = document.getElementById("bankRentalBankType").value.trim();
    const bankName = document.getElementById("bankRentalBankName").value.trim();
    const accountName = document.getElementById("bankRentalAccountName")?.value.trim() || "";
    const accountNumber = document.getElementById("bankRentalAccountNumber")?.value.trim() || "";
    const startDate = document.getElementById("bankRentalStartDate").value;
    const endDate = document.getElementById("bankRentalEndDate").value;
    const amountInput = document.getElementById("bankRentalAmount").value;
    const parsedAmount = parseFloat(amountInput);
    const amount = roundMoney(parsedAmount);
    const remark = document.getElementById("bankRentalRemark").value.trim();
    const bankStatus = document.getElementById("bankRentalBankStatus").value;
    const settlementStatus = document.getElementById("bankRentalSettlementStatus")?.value || "None";
    const remainingInput = document.getElementById("bankRentalRemainingBalance").value;
    const settledInput = document.getElementById("bankRentalSettledAmount").value;
    const parsedRemaining = parseFloat(remainingInput || "0");
    const parsedSettled = parseFloat(settledInput || "0");
    const remainingBalance = roundMoney(Number.isNaN(parsedRemaining) ? 0 : parsedRemaining);
    const settledAmount = roundMoney(Number.isNaN(parsedSettled) ? 0 : parsedSettled);
    const outstanding = roundMoney(remainingBalance - settledAmount);
    const issueNotes = document.getElementById("bankRentalIssueNotes").value.trim();
    const bankDetail = document.getElementById("bankRentalBankDetail").value.trim();

    if (!name || !bankType || !bankName || !amountInput || Number.isNaN(parsedAmount)) {
        alert("Please complete all Bank Rental fields.");
        return null;
    }
    if (startDate && endDate && normalizeDateValue(endDate) < normalizeDateValue(startDate)) {
        alert("End Date cannot be earlier than Start Date.");
        return null;
    }

    return { name, agentName: name, bankType, bankName, accountName, accountNumber, startDate, endDate, amount, remark, bankStatus, settlementStatus, remainingBalance, settledAmount, outstanding, issueNotes, bankDetail };
}

function renderBankRentalForm(record = {}, options = {}) {
    const financials = getBankRentalFinancials(record);
    const showFinancials = canViewBankRentalFinancials();
    const showAmount = options.showAmount || showFinancials;
    const hiddenFinancialFields = `
        <input id="bankRentalAmount" type="hidden" value="${escapeHtml(record.amount ?? 0)}" />
        <input id="bankRentalRemainingBalance" type="hidden" value="${escapeHtml(financials.remainingBalance || 0)}" />
        <input id="bankRentalSettledAmount" type="hidden" value="${escapeHtml(financials.settledAmount || 0)}" />
        <input id="bankRentalIssueNotes" type="hidden" value="${escapeHtml(financials.issueNotes || "")}" />
        <input id="bankRentalSettlementStatus" type="hidden" value="${escapeHtml(financials.settlementStatus || "None")}" />
    `;
    return `
        <div class="bank-rental-form-card">
            ${options.includeSavedBankSelect ? `<div class="bank-rental-form-section">${renderBankRentalSavedBankField()}</div>` : ""}
            <div class="bank-rental-form-grid">
                <label>${t("Agent Name")}<input id="bankRentalName" placeholder="${t("Agent Name")}" value="${escapeHtml(record.name || "")}" /></label>
                <label>Category / ${t("Bank Type")}<input id="bankRentalBankType" placeholder="Category / ${t("Bank Type")}" value="${escapeHtml(record.bankType || "")}" /></label>
                <label>${t("Bank Name")}<input id="bankRentalBankName" placeholder="${t("Bank Name")}" value="${escapeHtml(record.bankName || "")}" /></label>
                <label>${t("Account Name")}<input id="bankRentalAccountName" placeholder="${t("Account Name")}" value="${escapeHtml(record.accountName || "")}" /></label>
                <label>${t("Account Number")}<input id="bankRentalAccountNumber" placeholder="${t("Account Number")}" value="${escapeHtml(record.accountNumber || "")}" /></label>
                <label>${t("Start Date")}<input id="bankRentalStartDate" type="date" value="${escapeHtml(normalizeDateValue(record.startDate))}" /></label>
                <label>${t("End Date")}<input id="bankRentalEndDate" type="date" value="${escapeHtml(normalizeDateValue(record.endDate))}" /></label>
                ${showAmount ? `<label>${t("Amount (MYR)")}<input id="bankRentalAmount" type="number" min="0" step="0.01" placeholder="${t("Amount (MYR)")}" value="${record.amount || ""}" /></label>` : ""}
                <label>${showFinancials ? t("Bank Status") : "Status"}
                    <select id="bankRentalBankStatus">
                        <option value="Normal" ${financials.bankStatus === "Normal" ? "selected" : ""}>${t("Normal")}</option>
                        <option value="Issue" ${financials.bankStatus === "Issue" ? "selected" : ""}>${t("Issue")}</option>
                        <option value="Settled" ${financials.bankStatus === "Settled" ? "selected" : ""}>${t("Settled")}</option>
                    </select>
                </label>
                ${showFinancials ? `
                    <label>${t("Remaining Balance")} (MYR)<input id="bankRentalRemainingBalance" type="number" min="0" step="0.01" placeholder="${t("Remaining Balance")} (MYR)" value="${financials.remainingBalance || ""}" /></label>
                    <label>${t("Settled Amount")} (MYR)<input id="bankRentalSettledAmount" type="number" min="0" step="0.01" placeholder="${t("Settled Amount")} (MYR)" value="${financials.settledAmount || ""}" /></label>
                ` : (showAmount ? hiddenFinancialFields.replace(/<input id="bankRentalAmount"[\s\S]*?\/>\s*/, "") : hiddenFinancialFields)}
            </div>
            <label>${t("Remark")}<textarea id="bankRentalRemark" placeholder="${t("Remark")}">${escapeHtml(record.remark || "")}</textarea></label>
            <label>${t("Bank Detail")}<textarea id="bankRentalBankDetail" placeholder="${t("Bank Detail")}">${escapeHtml(record.bankDetail || "")}</textarea></label>
            ${showFinancials ? `<label>${t("Issue Notes")}<textarea id="bankRentalIssueNotes" placeholder="${t("Issue Notes")}">${escapeHtml(financials.issueNotes)}</textarea></label><input id="bankRentalSettlementStatus" type="hidden" value="${escapeHtml(financials.settlementStatus || "None")}" />` : ""}
        </div>
    `;
}

function hasDuplicateBankRentalRecord(tabId, values, ignoreId = "") {
    const nextSignature = getBankRentalRecordSignature(values);
    if (!nextSignature.replaceAll("|", "")) return false;
    return getBankRentalRecords(tabId).some((record) => {
        if (ignoreId && record.id === ignoreId) return false;
        return getBankRentalRecordSignature(record) === nextSignature;
    });
}

function showAddBankRentalModal(tabId = activeBankRentalTab) {
    if (!guardOperation("create", "bank rental")) return;
    const tab = getBankRentalTab(tabId);
    const isSelectionTab = BANK_RENTAL_SELECTION_TAB_IDS.includes(tab.id);
    if (tab.id !== "bankRental" && !isSelectionTab) return;

    if (isSelectionTab) {
        openModal(
            `Add Record - ${tab.label}`,
            renderBankRentalExistingRecordSelect(),
            () => {
                const signature = document.getElementById("bankRentalSavedBankSelect")?.value || "";
                const sourceRecord = getBankRentalRecordBySignature(signature);
                if (!sourceRecord) {
                    alert("Please select a Bank Rental record.");
                    return;
                }
                const { id, sourceTabId, sourceTabLabel, ...recordValues } = sourceRecord;
                if (hasDuplicateBankRentalRecord(tab.id, recordValues)) {
                    alert("This Bank Rental record already exists.");
                    return;
                }
                forgetDeletedBankRentalSignature(recordValues);
                getBankRentalRecords(tab.id).push({
                    ...recordValues,
                    id: generateId("rent"),
                    updatedAt: new Date().toISOString()
                });
                renderApp();
                persistStateChange();
                closeModal();
            },
            "Save"
        );
        return;
    }

    openModal(
        "Add Bank Rental",
        renderBankRentalForm(),
        () => {
            const values = readBankRentalForm();
            if (!values) return;
            const recordValues = values;
            if (hasDuplicateBankRentalRecord(tab.id, recordValues)) {
                alert("This Bank Rental record already exists.");
                return;
            }
            forgetDeletedBankRentalSignature(recordValues);
            getBankRentalRecords(tab.id).push({
                id: generateId("rent"),
                ...recordValues,
                createdDate: normalizeDateValue(new Date()),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            applyCurrentOwner(getBankRentalRecords(tab.id).at(-1));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editBankRentalRecord(tabId, id) {
    if (!guardOperation("update", "bank rental")) return;
    const record = getBankRentalRecords(tabId).find((item) => item.id === id);
    if (!record) return;
    const tab = getBankRentalTab(tabId);
    if (tab.id === "block") {
        editBankRentalBlockRecord(id);
        return;
    }
    if (tab.id !== "bankRental" && !BANK_RENTAL_SELECTION_TAB_IDS.includes(tab.id)) return;
    openModal(
        "Edit Bank Rental",
        renderBankRentalForm(record),
        () => {
            const values = readBankRentalForm();
            if (!values) return;
            const recordValues = values;
            if (hasDuplicateBankRentalRecord(tab.id, recordValues, id)) {
                alert("This Bank Rental record already exists.");
                return;
            }
            Object.assign(record, recordValues, { updatedAt: new Date().toISOString() });
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function viewBankRentalRecord(tabId, id) {
    const record = getBankRentalRecords(tabId).find((item) => item.id === id);
    if (!record) return;
    const financials = getBankRentalFinancials(record);
    if (getBankRentalTab(tabId).id === "block") {
        const showFinancials = canViewBankRentalFinancials();
        openReadOnlyModal(
            "BLOCK Detail",
            `
                <div class="detail-grid">
                    ${renderDetailRow("Agent Name", getBankRentalAgentName(record))}
                    ${renderDetailRow("Category / Bank Type", record.bankType || record.blockType)}
                    ${renderDetailRow("Bank Name", record.bankName)}
                    ${renderDetailRow("Account Name", record.accountName)}
                    ${renderDetailRow("Account Number", record.accountNumber)}
                    ${renderDetailRow("Start Date", formatExportDate(record.startDate))}
                    ${renderDetailRow("End Date", formatExportDate(record.endDate))}
                    ${renderDetailRow("Amount", formatMoney(record.amount))}
                    ${renderDetailRow("Bank Status", t(financials.bankStatus))}
                    ${showFinancials ? `
                        ${renderDetailRow("Remaining Balance", formatMoney(financials.remainingBalance))}
                        ${renderDetailRow("Settled Amount", formatMoney(financials.settledAmount))}
                        ${renderDetailRow("Outstanding", formatMoney(financials.outstanding))}
                        ${renderDetailRow("Settlement Status", t(financials.settlementStatus))}
                    ` : ""}
                    ${renderDetailRow("Remark", record.remark)}
                    ${renderDetailRow("Bank Detail", getBankRentalDetailValue(record, "bankDetail", financials))}
                    ${showFinancials ? renderDetailRow("Issue Notes", financials.issueNotes) : ""}
                    ${renderDetailRow("Created Date", formatExportDate(record.createdDate || record.createdAt))}
                    ${renderDetailRow("Updated Date", formatExportDate(record.updatedAt))}
                </div>
            `
        );
        return;
    }
    const showFinancials = canViewBankRentalFinancials();
    openReadOnlyModal(
        "Bank Rental Detail",
        `
            <div class="detail-grid">
                ${renderDetailRow("Agent Name", getBankRentalAgentName(record))}
                ${renderDetailRow("Bank Type", record.bankType)}
                ${renderDetailRow("Bank Name", record.bankName)}
                ${renderDetailRow("Account Name", record.accountName)}
                ${renderDetailRow("Account Number", record.accountNumber)}
                ${renderDetailRow("Start Date", formatExportDate(record.startDate))}
                ${renderDetailRow("End Date", formatExportDate(record.endDate))}
                ${renderDetailRow("Bank Status", t(financials.bankStatus))}
                ${renderDetailRow("Remark", record.remark)}
                ${renderDetailRow("Bank Detail", getBankRentalDetailValue(record, "bankDetail", financials))}
                ${showFinancials ? `
                    ${renderDetailRow("Amount", formatMoney(record.amount))}
                    ${renderDetailRow("Remaining Balance", formatMoney(financials.remainingBalance))}
                    ${renderDetailRow("Settled Amount", formatMoney(financials.settledAmount))}
                    ${renderDetailRow("Outstanding", formatMoney(financials.outstanding))}
                    ${renderDetailRow("Issue Notes", financials.issueNotes)}
                ` : ""}
                ${renderDetailRow("Created Date", formatExportDate(record.createdDate || record.createdAt))}
            </div>
        `
    );
}

function confirmDeleteBankRentalRecord(tabId, id) {
    if (!guardOperation("delete", "bank rental")) return;
    const tab = getBankRentalTab(tabId);
    if (!["bankRental", "block", ...BANK_RENTAL_SELECTION_TAB_IDS].includes(tab.id)) return;
    const records = getBankRentalRecords(tabId);
    const record = records.find((item) => item.id === id);
    if (!record) return;
    if (!canDeleteSharedRecord(record)) {
        alert("You can only delete your own Bank Rental records.");
        return;
    }

    openModal(
        "Delete Bank Rental Record",
        `<p>Delete rental record for <strong>${escapeHtml(getBankRentalAgentName(record))}</strong>?</p>`,
        () => {
            if (tab.id === "bankRental") removeBankRentalRecordPermanently(tabId, id);
            else state.bankRental[tab.id] = records.filter((item) => item.id !== id);
            markSharedBankRentalMutation(tab.id);
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Delete"
    );
}

function addBankRentalRemark(tabId, id) {
    if (!guardOperation("update", "bank rental remark")) return;
    const record = getBankRentalRecords(tabId).find((item) => item.id === id);
    if (!record) return;
    openModal(
        "Remark",
        `<textarea id="bankRentalRemarkEdit" placeholder="${t("Remark")}">${escapeHtml(record.remark || "")}</textarea>`,
        () => {
            record.remark = document.getElementById("bankRentalRemarkEdit").value.trim();
            record.updatedAt = new Date().toISOString();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function readBankRentalBlockForm() {
    const name = document.getElementById("bankRentalName").value.trim();
    const bankType = document.getElementById("bankRentalBankType").value.trim();
    const bankName = document.getElementById("bankRentalBankName").value.trim();
    const accountName = document.getElementById("bankRentalAccountName")?.value.trim() || "";
    const accountNumber = document.getElementById("bankRentalAccountNumber")?.value.trim() || "";
    const startDate = document.getElementById("bankRentalStartDate").value;
    const endDate = document.getElementById("bankRentalEndDate").value;
    const amountInput = document.getElementById("bankRentalAmount").value;
    const parsedAmount = parseFloat(amountInput);
    const amount = roundMoney(parsedAmount);
    const bankStatus = document.getElementById("bankRentalBankStatus").value;
    const remainingInput = document.getElementById("bankRentalRemainingBalance").value;
    const settledInput = document.getElementById("bankRentalSettledAmount").value;
    const parsedRemaining = parseFloat(remainingInput || "0");
    const parsedSettled = parseFloat(settledInput || "0");
    const remainingBalance = roundMoney(Number.isNaN(parsedRemaining) ? 0 : parsedRemaining);
    const settledAmount = roundMoney(Number.isNaN(parsedSettled) ? 0 : parsedSettled);
    const outstanding = roundMoney(remainingBalance - settledAmount);
    const remark = document.getElementById("bankRentalRemark").value.trim();
    const issueNotes = document.getElementById("bankRentalIssueNotes").value.trim();
    const bankDetail = document.getElementById("bankRentalBankDetail")?.value.trim() || "";
    const settlementStatus = document.getElementById("bankRentalSettlementStatus")?.value || "None";

    if (!name || !bankType || !bankName || !amountInput || Number.isNaN(parsedAmount)) {
        alert("Please complete all Block fields.");
        return null;
    }
    if (startDate && endDate && normalizeDateValue(endDate) < normalizeDateValue(startDate)) {
        alert("End Date cannot be earlier than Start Date.");
        return null;
    }

    return {
        blockType: bankType,
        name,
        agentName: name,
        bankType,
        bankName,
        accountName,
        accountNumber,
        startDate,
        endDate,
        bankDetail,
        remark,
        amount,
        bankStatus,
        settlementStatus,
        remainingBalance,
        settledAmount,
        outstanding,
        issueNotes
    };
}

function renderBankRentalBlockForm(record = {}) {
    const financials = getBankRentalFinancials(record);
    const showFinancials = canViewBankRentalFinancials();
    const protectedFinancialInputs = `
        <input id="bankRentalRemainingBalance" type="hidden" value="${escapeHtml(financials.remainingBalance || 0)}" />
        <input id="bankRentalSettledAmount" type="hidden" value="${escapeHtml(financials.settledAmount || 0)}" />
        <input id="bankRentalIssueNotes" type="hidden" value="${escapeHtml(financials.issueNotes || "")}" />
        <input id="bankRentalSettlementStatus" type="hidden" value="${escapeHtml(financials.settlementStatus || "None")}" />
    `;
    return `
        <div class="bank-rental-form-card">
            <div class="bank-rental-form-grid">
                <label>${t("Agent Name")}<input id="bankRentalName" placeholder="${t("Agent Name")}" value="${escapeHtml(record.name || record.agentName || "")}" /></label>
                <label>Category / ${t("Bank Type")}<input id="bankRentalBankType" placeholder="Category / ${t("Bank Type")}" value="${escapeHtml(record.bankType || record.blockType || "")}" /></label>
                <label>${t("Bank Name")}<input id="bankRentalBankName" placeholder="${t("Bank Name")}" value="${escapeHtml(record.bankName || "")}" /></label>
                <label>${t("Account Name")}<input id="bankRentalAccountName" placeholder="${t("Account Name")}" value="${escapeHtml(record.accountName || "")}" /></label>
                <label>${t("Account Number")}<input id="bankRentalAccountNumber" placeholder="${t("Account Number")}" value="${escapeHtml(record.accountNumber || "")}" /></label>
                <label>${t("Start Date")}<input id="bankRentalStartDate" type="date" value="${escapeHtml(normalizeDateValue(record.startDate))}" /></label>
                <label>${t("End Date")}<input id="bankRentalEndDate" type="date" value="${escapeHtml(normalizeDateValue(record.endDate))}" /></label>
                <label>${t("Amount (MYR)")}<input id="bankRentalAmount" type="number" min="0" step="0.01" placeholder="${t("Amount (MYR)")}" value="${record.amount || ""}" /></label>
                <label>${t("Bank Status")}
                    <select id="bankRentalBankStatus">
                        <option value="Normal" ${financials.bankStatus === "Normal" ? "selected" : ""}>${t("Normal")}</option>
                        <option value="Issue" ${financials.bankStatus === "Issue" ? "selected" : ""}>${t("Issue")}</option>
                        <option value="Settled" ${financials.bankStatus === "Settled" ? "selected" : ""}>${t("Settled")}</option>
                    </select>
                </label>
                ${showFinancials ? `
                    <label>${t("Remaining Balance")} (MYR)<input id="bankRentalRemainingBalance" type="number" min="0" step="0.01" placeholder="${t("Remaining Balance")} (MYR)" value="${financials.remainingBalance || ""}" /></label>
                    <label>${t("Settled Amount")} (MYR)<input id="bankRentalSettledAmount" type="number" min="0" step="0.01" placeholder="${t("Settled Amount")} (MYR)" value="${financials.settledAmount || ""}" /></label>
                ` : protectedFinancialInputs}
            </div>
            <label>${t("Remark")}<textarea id="bankRentalRemark" placeholder="${t("Remark")}">${escapeHtml(record.remark || "")}</textarea></label>
            <label>${t("Bank Detail")}<textarea id="bankRentalBankDetail" placeholder="${t("Bank Detail")}">${escapeHtml(record.bankDetail || "")}</textarea></label>
            ${showFinancials ? `<label>${t("Issue Notes")}<textarea id="bankRentalIssueNotes" placeholder="${t("Issue Notes")}">${escapeHtml(financials.issueNotes)}</textarea></label>
            <input id="bankRentalSettlementStatus" type="hidden" value="${escapeHtml(financials.settlementStatus)}" />` : ""}
        </div>
    `;
}

function showAddBankRentalBlockModal() {
    if (!guardOperation("create", "bank rental block")) return;

    openModal(
        "Add Bank Rental",
        renderBankRentalBlockForm(),
        () => {
            const values = readBankRentalBlockForm();
            if (!values) return;
            if (hasDuplicateBankRentalRecord("block", values)) {
                alert("This Block record already exists.");
                return;
            }
            getBankRentalRecords("block").push({
                id: generateId("block"),
                ...values,
                createdDate: normalizeDateValue(new Date()),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            markSharedBankRentalMutation("block");
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editBankRentalBlockRecord(id) {
    if (!guardOperation("update", "bank rental block")) return;
    const record = getBankRentalRecords("block").find((item) => item.id === id);
    if (!record) return;

    openModal(
        "Edit Bank Rental",
        renderBankRentalBlockForm(record),
        () => {
            const values = readBankRentalBlockForm();
            if (!values) return;
            if (hasDuplicateBankRentalRecord("block", values, id)) {
                alert("This Block record already exists.");
                return;
            }
            Object.assign(record, values, { updatedAt: new Date().toISOString() });
            markSharedBankRentalMutation("block");
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function getBankRentalCategoryTotal(tabId) {
    return roundMoney((getBankRentalRecords(tabId) || []).reduce((sum, record) => sum + (Number(record.amount) || 0), 0));
}

function getBankRentalGrandTotal() {
    return getBankRentalAmountTotal(getBankRentalAmountRecords());
}

function renderManagementBankRental() {
    const tab = getBankRentalTab();
    const ui = getBankRentalUi(tab.id);
    const records = getFilteredBankRentalRecords(tab.id).map((record) => ({
        ...record,
        managementTabId: record.sourceTabId || tab.id,
        managementCategory: record.sourceTabLabel || tab.label
    }));
    const moduleData = getPaginatedModuleRecords(`managementBankRental_${tab.id}`, records, { preserveOrder: true });
    const categoryTotals = [
        ["bbj", "BBJ Total"],
        ["jes", "JES Total"],
        ["judy", "JUDY Total"],
        ["kj", "KJ Total"],
        ["candy", "CANDY Total"]
    ].map(([tabId, label]) => ({ tabId, label, total: getBankRentalCategoryTotal(tabId) }));
    const displayedTotal = roundMoney(records.reduce((sum, record) => sum + (Number(record.amount) || 0), 0));
    const selectedModuleTotalCards = BANK_RENTAL_SELECTION_TAB_IDS.includes(tab.id) || tab.id === "block";
    const totalCards = selectedModuleTotalCards
        ? [{ tabId: tab.id, label: `${tab.label} Total`, total: displayedTotal }]
        : categoryTotals;
    const tabButtons = BANK_RENTAL_TABS.map((item) => `
        <button class="btn ${item.id === tab.id ? "" : "btn-secondary"} btn-sm" onclick="setBankRentalTab('${item.id}')">${t(item.label)}</button>
    `).join("");
    const sortOptionItems = [
        ["date", "Date"],
        ["name", "Name"],
        ["bank", "Bank"],
        ["status", "Status"],
        ["bankType", "Bank Type"],
        ["bankName", "Bank Name"],
        ["amount", "Amount"],
        ["startDate", "Start Date"],
        ["endDate", "End Date"],
        ["createdDate", "Created Date"]
    ];
    const sortOptions = sortOptionItems.map(([value, label]) => `<option value="${value}" ${ui.sortBy === value ? "selected" : ""}>${t(label)}</option>`).join("");
    const rows = moduleData.pageRows.map((record) => {
        const financials = getBankRentalFinancials(record);
        const ownerId = getRecordOwner(record) || "-";
        const editedById = String(record.updatedBy || record.updatedById || ownerId || "").trim().toLowerCase();
        const dateRange = [formatExportDate(record.startDate), formatExportDate(record.endDate)].filter((value) => value && value !== "-").join(" - ") || "-";
        const details = combineDetailFields([
            { label: t("Account Name"), value: record.accountName },
            { label: t("Account Number"), value: record.accountNumber },
            { label: t("Remaining Balance"), value: formatMoney(financials.remainingBalance) },
            { label: t("Settled Amount"), value: formatMoney(financials.settledAmount) },
            { label: t("Remark"), value: record.remark },
            { label: t("Bank Detail"), value: getBankRentalDetailValue(record, "bankDetail", financials) },
            { label: t("Issue Notes"), value: financials.issueNotes }
        ]);
        return `
            <tr>
                <td class="table-name-cell">${escapeHtml(getBankRentalAgentName(record))}</td>
                <td><span class="badge">${escapeHtml(record.bankType || record.category || record.managementCategory || "-")}</span></td>
                <td>${escapeHtml(record.bankName || "-")}</td>
                <td>${escapeHtml(dateRange)}</td>
                <td class="bank-rental-money-cell">${renderBankRentalMoney(record.amount)}</td>
                <td><span class="badge">${escapeHtml(t(financials.bankStatus || record.bankStatus || "-"))}</span></td>
                <td class="text-wrap-cell bank-rental-detail-cell">${renderTableDetailButton("bank-rental-management", "details", details, "Details")}</td>
                <td>${escapeHtml(getUserDisplayNameOnly(editedById))}</td>
                <td class="btn-group">${renderActionMenu(`${t("Actions")} ${getBankRentalAgentName(record)}`, [
                    { label: t("View Detail"), action: `viewBankRentalRecord('${record.managementTabId}','${record.id}')` },
                    canEditData() ? { label: t("Edit"), action: `editBankRentalRecord('${record.managementTabId}','${record.id}')` } : null,
                    canDeleteData() ? { label: t("Delete"), action: `confirmDeleteBankRentalRecord('${record.managementTabId}','${record.id}')` } : null
                ])}</td>
            </tr>
        `;
    }).join("");

    return `
        <div class="module bank-rental-management-module">
            <div class="module-header">
                <h2>${t("Bank Rental")}</h2>
                <div class="btn-group">
                    <button class="btn" onclick="showAddBankRentalModal('bankRental')">+ ${t("Add Rental")}</button>
                    <button class="btn btn-secondary" onclick="printBankRentalTab('${tab.id}')">${t("Print")}</button>
                </div>
            </div>
            <div class="cards bank-rental-category-total-grid">
                ${totalCards.map((item) => `<div class="card"><h4>${escapeHtml(item.label)}</h4><h2>${formatMoney(item.total)}</h2></div>`).join("")}
                <div class="card"><h4>Grand Total</h4><h2>${formatMoney(displayedTotal)}</h2></div>
            </div>
            <div class="btn-group">${tabButtons}</div>
            <div class="database-filters">
                <label>${t("Search")} <input value="${escapeHtml(ui.search)}" oninput="updateBankRentalSearch('${tab.id}', this.value)" /></label>
                <label>${t("Sort By")}
                    <select onchange="updateBankRentalSort('${tab.id}', 'sortBy', this.value)">${sortOptions}</select>
                </label>
                <label>${t("Direction")}
                    <select onchange="updateBankRentalSort('${tab.id}', 'sortDir', this.value)">
                        <option value="desc" ${ui.sortDir === "desc" ? "selected" : ""}>${t("Descending")}</option>
                        <option value="asc" ${ui.sortDir === "asc" ? "selected" : ""}>${t("Ascending")}</option>
                    </select>
                </label>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Agent Name")}</th><th>Category</th><th>${t("Bank Name")}</th><th>${t("Date Range")}</th><th>${t("Amount (MYR)")}</th><th>Status</th><th>Details</th><th>Edited By</th><th>${t("Actions")}</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="9" class="empty-state">${t("No records to display")}</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination(`managementBankRental_${tab.id}`, records.length, moduleData.totalPages)}
        </div>
    `;
}

function renderBankRental() {
    const tab = getBankRentalTab();
    const ui = getBankRentalUi(tab.id);
    const filteredRecords = getFilteredBankRentalRecords(tab.id);
    const moduleData = getPaginatedModuleRecords(`bankRental_${tab.id}`, filteredRecords, { preserveOrder: true });
    const isSelectionTab = BANK_RENTAL_SELECTION_TAB_IDS.includes(tab.id);
    const editableActionTab = ["bankRental", "block"].includes(tab.id);
    const deletableActionTab = editableActionTab || isSelectionTab;
    const actionColumn = true;
    const showFinancials = canViewBankRentalFinancials();
    const showAmountColumn = canViewBankRentalAmount(tab.id);
    const showFinancialDetailColumn = showFinancials;
    const showManagementAudit = isSuperadmin;
    const emptyColSpan = 5 + (showAmountColumn ? 1 : 0) + (showFinancialDetailColumn ? 1 : 0) + (showManagementAudit ? 1 : 0) + (actionColumn ? 1 : 0);
    const tabButtons = BANK_RENTAL_TABS.map((item) => `
        <button class="btn ${item.id === tab.id ? "" : "btn-secondary"} btn-sm" onclick="setBankRentalTab('${item.id}')">${t(item.label)}</button>
    `).join("");
    const sortOptionItems = [
        ["date", "Date"],
        ["name", "Name"],
        ["bank", "Bank"],
        ["status", "Status"],
        ["bankType", "Bank Type"],
        ["bankName", "Bank Name"],
        ["startDate", "Start Date"],
        ["endDate", "End Date"],
        ["createdDate", "Created Date"]
    ];
    if (showAmountColumn) sortOptionItems.splice(2, 0, ["amount", "Amount"]);
    const sortOptions = sortOptionItems.map(([value, label]) => `<option value="${value}" ${ui.sortBy === value ? "selected" : ""}>${t(label)}</option>`).join("");
    const renderRows = (records) => records.map((record) => {
        const financials = getBankRentalFinancials(record);
        const recordTabId = record.sourceTabId || tab.id;
        const canEditRentalRecord = true;
        const canDeleteRentalRecord = canDeleteSharedRecord(record);
        const editedById = String(record.updatedBy || record.updatedById || getRecordOwner(record) || "").trim().toLowerCase();
        const dateRange = [formatExportDate(record.startDate), formatExportDate(record.endDate)].filter((value) => value && value !== "-").join(" - ") || "-";
        const financialDetails = showFinancialDetailColumn ? combineDetailFields([
            { label: t("Remaining Balance"), value: formatMoney(financials.remainingBalance) },
            { label: t("Settled Amount"), value: formatMoney(financials.settledAmount) },
            { label: t("Outstanding"), value: formatMoney(financials.outstanding) },
            { label: t("Remark"), value: record.remark },
            { label: t("Bank Detail"), value: getBankRentalDetailValue(record, "bankDetail", financials) },
            { label: t("Issue Notes"), value: financials.issueNotes }
        ]) : "";
        return `
            <tr>
                <td class="table-name-cell">${escapeHtml(getBankRentalAgentName(record))}</td>
                <td>${escapeHtml(record.bankType || "-")}</td>
                <td>${escapeHtml(record.bankName || "-")}</td>
                <td>${escapeHtml(dateRange)}</td>
                <td>${escapeHtml(t(financials.bankStatus))}</td>
                ${showAmountColumn ? `
                    <td class="bank-rental-money-cell">${renderBankRentalMoney(record.amount)}</td>
                ` : ""}
                ${showFinancialDetailColumn ? `
                    <td class="text-wrap-cell bank-rental-detail-cell">${renderTableDetailButton(`bank-rental-${tab.id}`, "financialDetails", financialDetails, "Financial Details")}</td>
                ` : ""}
                ${showManagementAudit ? `<td>${escapeHtml(getUserDisplayNameOnly(editedById))}</td>` : ""}
                ${actionColumn ? `<td class="btn-group">${renderActionMenu(`${t("Actions")} ${getBankRentalAgentName(record)}`, [
                    { label: t("View Detail"), action: `viewBankRentalRecord('${recordTabId}','${record.id}')` },
                    canEditData() && editableActionTab && canEditRentalRecord ? { label: t("Edit"), action: `editBankRentalRecord('${recordTabId}','${record.id}')` } : null,
                    canEditData() && editableActionTab && canEditRentalRecord ? { label: t("Remark"), action: `addBankRentalRemark('${recordTabId}','${record.id}')` } : null,
                    canDeleteData() && deletableActionTab && canDeleteRentalRecord ? { label: t("Delete"), action: `confirmDeleteBankRentalRecord('${recordTabId}','${record.id}')` } : null
                ])}</td>` : ""}
            </tr>
        `;
    }).join("");
    const rows = renderRows(moduleData.pageRows);
    const blockSummary = tab.id === "block" ? getBankRentalSummary(filteredRecords) : null;
    const blockCalculatedTotal = tab.id === "block" ? getBankRentalCategoryTotal("block") : 0;
    const blockSummaryCards = blockSummary ? `
        <div class="cards bank-rental-summary-cards">
            <div class="card"><h4>${t("Total Rental Amount")}</h4><h2>${formatMoney(blockSummary.amount)}</h2></div>
            ${showFinancials ? `
                <div class="card"><h4>${t("Total Remaining Balance")}</h4><h2>${formatMoney(blockSummary.remainingBalance)}</h2></div>
                <div class="card"><h4>${t("Total Settled Amount")}</h4><h2>${formatMoney(blockSummary.settledAmount)}</h2></div>
                <div class="card"><h4>${t("Total Outstanding")}</h4><h2>${formatMoney(blockSummary.outstanding)}</h2></div>
            ` : ""}
            <div class="bank-rental-inline-total"><span>Block calculated total</span><strong>${formatMoney(blockCalculatedTotal)}</strong></div>
        </div>
    ` : "";
    const managementCategoryTotals = showManagementAudit ? [
        ["bbj", "BBJ Total"],
        ["jes", "JES Total"],
        ["judy", "JUDY Total"],
        ["kj", "KJ Total"],
        ["candy", "CANDY Total"]
    ].map(([tabId, label]) => ({ label, total: getBankRentalCategoryTotal(tabId) })) : [];
    const managementTotals = showManagementAudit && tab.id !== "block" ? `
        <div class="cards bank-rental-category-total-grid">
            ${managementCategoryTotals.map((item) => `<div class="card"><h4>${escapeHtml(item.label)}</h4><h2>${formatMoney(item.total)}</h2></div>`).join("")}
            <div class="card"><h4>Grand Total</h4><h2>${formatMoney(getBankRentalGrandTotal())}</h2></div>
        </div>
    ` : "";
    const financialHeaders = `${showAmountColumn ? `<th>${t("Amount (MYR)")}</th>` : ""}${showFinancialDetailColumn ? `<th>Financial Details</th>` : ""}`;
    const auditHeader = showManagementAudit ? `<th>Edited By</th>` : "";
    const tableHeader = `<thead><tr><th>${t("Agent Name")}</th><th>${t("Bank Type")}</th><th>${t("Bank Name")}</th><th>${t("Date Range")}</th><th>${t("Bank Status")}</th>${financialHeaders}${auditHeader}${actionColumn ? `<th>${t("Actions")}</th>` : ""}</tr></thead>`;
    const totalRentalGroupedSections = tab.id === "totalRental" ? groupBankRentalRecordsByAgent(filteredRecords).map((group) => `
        <section class="bank-rental-agent-group">
            <div class="bank-rental-agent-header">
                <h3>${escapeHtml(group.agentName)}</h3>
                ${showFinancials ? `<div class="bank-rental-agent-totals">
                    <span>${t("Total Rental Amount")}: <strong>${formatMoney(group.summary.amount)}</strong></span>
                    <span>${t("Total Paid / Settled Amount")}: <strong>${formatMoney(group.summary.settledAmount)}</strong></span>
                    <span>${t("Total Outstanding Amount")}: <strong>${formatMoney(group.summary.outstanding)}</strong></span>
                    <span>${t("Record Count")}: <strong>${group.recordCount}</strong></span>
                </div>` : `<span class="badge">${t("Record Count")}: ${group.recordCount}</span>`}
            </div>
            <div class="table-wrapper">
                <table>
                    ${tableHeader}
                    <tbody>${renderRows(group.records) || `<tr><td colspan="${emptyColSpan}" class="empty-state">${t("No records to display")}</td></tr>`}</tbody>
                </table>
            </div>
        </section>
    `).join("") : "";
    const addButton = tab.id === "bankRental"
        ? `<button class="btn" onclick="showAddBankRentalModal('${tab.id}')">+ ${t("Add Rental")}</button>`
        : tab.id === "block"
            ? `<button class="btn" onclick="showAddBankRentalBlockModal()">+ ${t("Add")} Block</button>`
            : isSelectionTab
                ? `<button class="btn" onclick="showAddBankRentalModal('${tab.id}')">+ ${t("Add Record")}</button>`
                : "";

    return `
        <div class="module">
            <div class="module-header">
                <h2>${t("Bank Rental")}</h2>
                <div class="btn-group">
                    ${canCreateData() ? addButton : ""}
                    ${showFinancials ? `<button class="btn btn-secondary" onclick="printBankRentalTab('${tab.id}')">${t("Print")}</button>` : ""}
                </div>
            </div>
            <div class="btn-group">${tabButtons}</div>
            <div class="database-filters">
                <label>${t("Search")} <input value="${escapeHtml(ui.search)}" oninput="updateBankRentalSearch('${tab.id}', this.value)" /></label>
                <label>${t("Sort By")}
                    <select onchange="updateBankRentalSort('${tab.id}', 'sortBy', this.value)">${sortOptions}</select>
                </label>
                <label>${t("Direction")}
                    <select onchange="updateBankRentalSort('${tab.id}', 'sortDir', this.value)">
                        <option value="asc" ${ui.sortDir === "asc" ? "selected" : ""}>${t("Ascending")}</option>
                        <option value="desc" ${ui.sortDir === "desc" ? "selected" : ""}>${t("Descending")}</option>
                    </select>
                </label>
            </div>
            ${managementTotals}
            ${blockSummaryCards}
            ${tab.id === "totalRental" ? (totalRentalGroupedSections || `<div class="empty-state">${t("No records to display")}</div>`) : ""}
            ${tab.id !== "totalRental" ? `<div class="table-wrapper">
                <table>
                    ${tableHeader}
                    <tbody>${rows || `<tr><td colspan="${emptyColSpan}" class="empty-state">${t("No records to display")}</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination(`bankRental_${tab.id}`, filteredRecords.length, moduleData.totalPages)}` : ""}
        </div>
    `;
}

function printBankRentalTab(tabId = activeBankRentalTab) {
    const tab = getBankRentalTab(tabId);
    const rows = getFilteredBankRentalRecords(tab.id);
    const tableRows = rows.map((record) => {
        const financials = getBankRentalFinancials(record);
        return `
            <tr>
                <td>${escapeHtml(getBankRentalAgentName(record))}</td>
                <td>${escapeHtml(record.bankType || "-")}</td>
                <td>${escapeHtml(record.bankName || "-")}</td>
                <td>${formatExportDate(record.startDate)}</td>
                <td>${formatExportDate(record.endDate)}</td>
                <td>${formatMoney(record.amount)}</td>
                <td>${escapeHtml(t(financials.bankStatus))}</td>
                <td>${formatMoney(financials.remainingBalance)}</td>
                <td>${formatMoney(financials.settledAmount)}</td>
                <td>${formatMoney(financials.outstanding)}</td>
                <td>${escapeHtml(record.remark || "-")}</td>
                <td>${escapeHtml(getBankRentalDetailValue(record, "bankDetail", financials) || "-")}</td>
                <td>${escapeHtml(financials.issueNotes || "-")}</td>
                <td>${formatExportDate(record.createdDate || record.createdAt)}</td>
            </tr>
        `;
    }).join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
        <!doctype html>
        <html>
        <head>
            <title>WorkerTracker - ${escapeHtml(t("Bank Rental"))} ${escapeHtml(tab.label)}</title>
            <style>
                body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, sans-serif; color: #111827; margin: 24px; }
                h1 { font-size: 22px; margin-bottom: 16px; }
                table { width: 100%; table-layout: auto; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; overflow-wrap: normal; word-break: normal; }
                th { white-space: nowrap; }
                th { background: #f3f4f6; }
            </style>
        </head>
        <body>
            <h1>WorkerTracker - ${escapeHtml(t("Bank Rental"))} / ${escapeHtml(tab.label)}</h1>
            <table>
                <thead><tr><th>${t("Agent Name")}</th><th>${t("Bank Type")}</th><th>${t("Bank Name")}</th><th>${t("Start Date")}</th><th>${t("End Date")}</th><th>${t("Amount (MYR)")}</th><th>${t("Bank Status")}</th><th>${t("Remaining Balance")}</th><th>${t("Settled Amount")}</th><th>${t("Outstanding")}</th><th>${t("Remark")}</th><th>${t("Bank Detail")}</th><th>${t("Issue Notes")}</th><th>${t("Created Date")}</th></tr></thead>
                <tbody>${tableRows || `<tr><td colspan="14">${t("No records to display")}</td></tr>`}</tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function renderDatabase() {
    if (!canAccessDatabase()) {
        return `<div class="module"><div class="module-header"><h2>${t("Database Archive")}</h2></div><div class="empty-state">You don't have permission to access the database in ${currentRole} mode.</div></div>`;
    }
    
    const filteredSchedules = scopeRecordsForSelectedUser(state.schedules).filter((schedule) => !dbFilterStart && !dbFilterEnd || isWithinDateRange(schedule.startDate || schedule.date, dbFilterStart, dbFilterEnd));
    const filteredExpenses = scopeRecordsForSelectedUser(state.expenses).filter((expense) => !dbFilterStart && !dbFilterEnd || isWithinDateRange(expense.date, dbFilterStart, dbFilterEnd));
    const filteredClaims = scopeRecordsForSelectedUser(state.reimbursementClaims).filter((claim) => !dbFilterStart && !dbFilterEnd || isWithinDateRange(claim.date, dbFilterStart, dbFilterEnd));
    const totalExpenseAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalClaimAmount = filteredClaims.reduce((sum, claim) => sum + claim.amount, 0);
    const expenseRows = filteredExpenses.map((expense) => `
        <tr>
            <td>${formatExportDate(expense.date)}</td>
            <td>${escapeHtml(expense.type || "-")}</td>
            <td>${escapeHtml(expense.category || "-")}</td>
            <td class="table-money-cell">${renderMoneyCell(expense.amount)}</td>
            <td class="table-detail-cell">${renderTableDetailButton("database-expenses", "description", expense.description, "Description")}</td>
            <td>${escapeHtml(expense.paymentMethod || "-")}</td>
        </tr>
    `).join("");
    const claimRows = filteredClaims.map((claim) => `
        <tr>
            <td>${formatExportDate(claim.date)}</td>
            <td class="table-name-cell">${escapeHtml(getEmployeeName(claim.workerId || claim.employeeId))}</td>
            <td class="table-money-cell">${renderMoneyCell(claim.amount)}</td>
            <td class="table-detail-cell">${renderTableDetailButton("database-reimbursement-claims", "description", claim.description, "Description")}</td>
            <td><span class="badge">${escapeHtml(claim.status || "Pending")}</span></td>
        </tr>
    `).join("");

    const scheduleRows = filteredSchedules.map((schedule) => `
        <tr>
            <td>${formatExportDate(schedule.startDate || schedule.date)} - ${formatExportDate(schedule.endDate || schedule.date)}</td>
            <td class="table-name-cell">${escapeHtml(getEmployeeName(schedule.employeeId))}</td>
            <td>${escapeHtml(schedule.leaveType || schedule.shift || "-")}</td>
            <td class="table-detail-cell">${renderTableDetailButton("database-schedules", "reason", schedule.reason || schedule.remark, "Reason")}</td>
        </tr>
    `).join("");

    return `
        <div class="module">
            <div class="module-header">
                <h2>${t("Database Archive")}</h2>
                <div class="btn-group"></div>
            </div>
            <div class="database-filters">
                <label>${t("From")} <input id="dbStartDate" type="date" value="${escapeHtml(dbFilterStart)}" onchange="updateDatabaseFilter()" /></label>
                <label>${t("To")} <input id="dbEndDate" type="date" value="${escapeHtml(dbFilterEnd)}" onchange="updateDatabaseFilter()" /></label>
                <button class="btn btn-secondary btn-sm" onclick="resetDatabaseFilter()">${t("Reset")}</button>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Type")}</th><th>${t("Count")}</th><th>${t("Total")}</th></tr></thead>
                    <tbody>
                        <tr><td>Expenses</td><td>${filteredExpenses.length}</td><td class="table-money-cell">${renderMoneyCell(totalExpenseAmount)}</td></tr>
                        <tr><td>Reimbursement Claims</td><td>${filteredClaims.length}</td><td class="table-money-cell">${renderMoneyCell(totalClaimAmount)}</td></tr>
                        <tr><td>Schedules</td><td>${filteredSchedules.length}</td><td>-</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="table-wrapper">
                <h3>Expenses</h3>
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Type")}</th><th>${t("Category")}</th><th>${t("Amount")}</th><th>${t("Description")}</th><th>${t("Payment Method")}</th></tr></thead>
                    <tbody>${expenseRows || `<tr><td colspan="6" class="empty-state">No expenses match the selected date range.</td></tr>`}</tbody>
                </table>
            </div>
            <div class="table-wrapper">
                <h3>Reimbursement Claims</h3>
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Worker")}</th><th>${t("Amount")}</th><th>${t("Description")}</th><th>${t("Status")}</th></tr></thead>
                    <tbody>${claimRows || `<tr><td colspan="5" class="empty-state">No reimbursement claims match the selected date range.</td></tr>`}</tbody>
                </table>
            </div>
            <div class="table-wrapper">
                <h3>Schedules</h3>
                <table>
                    <thead><tr><th>${t("Date Range")}</th><th>${t("Employee")}</th><th>${t("Leave Type")}</th><th>${t("Reason")}</th></tr></thead>
                    <tbody>${scheduleRows || `<tr><td colspan="4" class="empty-state">No schedules match the selected date range.</td></tr>`}</tbody>
                </table>
            </div>
        </div>
    `;
}

function updateDatabaseFilter() {
    dbFilterStart = document.getElementById("dbStartDate").value;
    dbFilterEnd = document.getElementById("dbEndDate").value;
    renderApp();
}

function resetDatabaseFilter() {
    dbFilterStart = "";
    dbFilterEnd = "";
    renderApp();
}

// ============================================
// REPORT CENTER EXPORT
// ============================================

function getReportRecordId(moduleKey, record = {}, index = 0, subcollection = "") {
    const key = String(record.id || record.recordId || record.record_id || ("index_" + index)).trim();
    return [moduleKey, subcollection, key].filter(Boolean).join(":");
}

function getReportRecordDate(record = {}) {
    return normalizeRecordDate(record) || "-";
}

function getReportCellValue(record, accessor) {
    const value = typeof accessor === "function" ? accessor(record) : record?.[accessor];
    if (value === undefined || value === null || value === "") return "-";
    return String(value);
}

function getReportModuleRecords() {
    const bankRentalRecords = [];
    Object.entries(state.bankRental || {}).forEach(([tabId, records]) => {
        (Array.isArray(records) ? records : []).forEach((record, index) => {
            bankRentalRecords.push({ ...record, reportSubcollection: tabId, reportSourceIndex: index });
        });
    });

    const modules = [
        { id: "employees", label: "Employees", records: state.employees || [], columns: [["Name", "name"], ["Role", "role"], ["Department", "department"], ["Category", "category"]] },
        { id: "schedules", label: "Schedules", records: state.schedules || [], columns: [["Date", (record) => record.startDate || record.date], ["Employee", (record) => record.employeeName || getEmployeeName(record.employeeId)], ["Type", (record) => record.leaveType || record.shift], ["Reason", (record) => record.reason || record.remark]] },
        { id: "debts", label: "Debt Tracking", records: state.debts || [], columns: [["Date", "date"], ["Employee", (record) => getEmployeeName(record.employeeId)], ["Amount", (record) => formatMoney(record.amount)], ["Status", "status"], ["Reason", "reason"]] },
        { id: "expenses", label: "Expenses", records: state.expenses || [], columns: [["Date", "date"], ["Type", "type"], ["Category", "category"], ["Amount", (record) => formatMoney(record.amount)], ["Description", "description"]] },
        { id: "reimbursementClaims", label: "Reimbursement Claims", records: state.reimbursementClaims || [], columns: [["Date", "date"], ["Worker", (record) => getEmployeeName(record.workerId || record.employeeId)], ["Amount", (record) => formatMoney(record.amount)], ["Status", "status"], ["Description", "description"]] },
        { id: "payments", label: "Company Payments", records: state.payments || [], columns: [["Date", "date"], ["Recipient", "recipient"], ["Amount", (record) => formatMoney(record.amount)], ["Status", "status"], ["Description", (record) => record.description || record.describe]] },
        { id: "funds", label: "Funds", records: state.fundAccounts || [], columns: [["Date", "date"], ["Fund", "name"], ["Fund In", (record) => formatMoney(record.fundIn ?? record.initialBalance)], ["Fund Out", (record) => formatMoney(record.fundOut ?? 0)], ["Balance", (record) => formatMoney(record.currentBalance ?? record.netAmount)]] },
        { id: "atmCash", label: "ATM Cash", records: state.atmCashRecords || [], columns: [["Date", "date"], ["Fund In", (record) => formatMoney(record.fundIn)], ["Fund Out", (record) => formatMoney(record.fundOut)], ["Remark", "remark"]] },
        { id: "calendar", label: "Calendar", records: state.calendarEvents || [], columns: [["Date", "date"], ["Title", "title"], ["Time", (record) => [record.startTime, record.endTime].filter(Boolean).join(" - ")], ["Description", "description"]] },
        { id: "bankRental", label: "Bank Rental", records: bankRentalRecords, columns: [["Tab", "reportSubcollection"], ["Agent", (record) => getBankRentalAgentName(record)], ["Bank", "bankName"], ["Amount", (record) => formatMoney(record.amount)], ["Status", (record) => getBankRentalFinancials(record).bankStatus]] }
    ];

    getModuleRegistry().filter((module) => !module.builtIn).forEach((module) => {
        modules.push({
            id: module.id,
            label: module.label || module.id,
            records: getDynamicModuleRecords(module.id),
            columns: (module.fields || []).slice(0, 5).map((field) => [field.label || field.key, field.key])
        });
    });

    const filter = {
        preset: superAdminStore.reportMonth || superAdminStore.reportStart || superAdminStore.reportEnd ? "custom" : "all",
        start: superAdminStore.reportMonth ? superAdminStore.reportMonth + "-01" : superAdminStore.reportStart,
        end: superAdminStore.reportMonth ? superAdminStore.reportMonth + "-31" : superAdminStore.reportEnd
    };

    const reportOwner = String((isSuperadmin && superAdminStore.selectedRegisteredId) || currentRegisteredId || "").trim().toLowerCase();

    return modules
        .filter((module) => module.id !== "reports" && canAccessModule(module.id))
        .map((module) => ({
            ...module,
            records: (Array.isArray(module.records) ? module.records : [])
                .filter((record) => !reportOwner || getRecordOwner(record) === reportOwner)
                .filter((record) => isRecordInModuleRange(record, filter))
        }));
}

function getFlatReportRows() {
    return getReportModuleRecords().flatMap((module) => module.records.map((record, index) => ({
        id: getReportRecordId(module.id, record, record.reportSourceIndex ?? index, record.reportSubcollection || ""),
        moduleId: module.id,
        moduleLabel: module.label,
        record,
        columns: module.columns
    })));
}

function flattenReportModule(module) {
    if (!module) return [];
    return module.records.map((record, index) => ({
        id: getReportRecordId(module.id, record, record.reportSourceIndex ?? index, record.reportSubcollection || ""),
        moduleId: module.id,
        moduleLabel: module.label,
        record,
        columns: module.columns
    }));
}

function getScopedFlatReportRows() {
    const selectedOwner = isSuperadmin && superAdminStore.selectedRegisteredId ? String(superAdminStore.selectedRegisteredId).toLowerCase() : "";
    if (isSuperadmin && !selectedOwner) return [];
    if (selectedOwner && superAdminStore.reportScope !== "global") {
        return renderWithOwnerScope(selectedOwner, getFlatReportRows, ["employees", "schedules", "debts", "claims"], { filterBankRental: true });
    }
    return getFlatReportRows();
}

function toggleReportRow(id, checked, shouldRender = true) {
    if (checked) reportSelectionState.selectedIds.add(id);
    else reportSelectionState.selectedIds.delete(id);
    if (shouldRender) renderApp();
}

function toggleVisibleReportRows(checked) {
    getReportPageRows().forEach((row) => toggleReportRow(row.id, checked, false));
    renderApp();
}

function getReportPageRows() {
    const moduleId = String(superAdminStore.reportModuleId || "").trim();
    const rows = getScopedFlatReportRows().filter((row) => !moduleId || row.moduleId === moduleId);
    return getPaginatedModuleRecords(`reports_${moduleId || "modules"}`, rows, { preserveOrder: true, skipSelectedUserScope: true }).pageRows;
}

async function refreshReportHistory(shouldRender = false) {
    if (!canAccessModule("reports")) return;
    try {
        superAdminStore.reportHistory = await listReportHistory();
        if (shouldRender && currentView === "reports") renderApp();
    } catch (error) {
        console.warn("Unable to load report history.", error);
    }
}

async function exportPdf() {
    if (currentView !== "reports") {
        currentView = "reports";
        renderNavigation();
        renderApp();
        return;
    }
    const selectedRecordIds = [...reportSelectionState.selectedIds];
    if (!selectedRecordIds.length) {
        alert("Select report rows before exporting.");
        return;
    }

    try {
        await downloadReportPdf({
            targetUserId: isSuperadmin ? getSelectedUser()?.id || "" : "",
            selectedRecordIds,
            month: superAdminStore.reportMonth || "",
            start: superAdminStore.reportMonth ? "" : superAdminStore.reportStart || "",
            end: superAdminStore.reportMonth ? "" : superAdminStore.reportEnd || ""
        });
        await refreshReportHistory(true);
    } catch (error) {
        console.error("PDF Export Error:", error);
        alert(error.message || t("Failed to generate PDF. Please check the browser console for details."));
    }
}

function getEnabledReportLabels(labels) {
    return labels;
}

function getSelectedUser() {
    const owner = String(superAdminStore.selectedRegisteredId || "").trim().toLowerCase();
    if (!owner) return null;
    return (superAdminStore.users || []).find((user) => String(user.registeredId || user.email || "").trim().toLowerCase() === owner) || null;
}

function updateReportUser(ownerId) {
    const owner = String(ownerId || "").trim().toLowerCase();
    superAdminStore.selectedRegisteredId = owner;
    superAdminStore.selectedUserContext = owner;
    superAdminStore.eventFilter = owner;
    superAdminStore.reportScope = superAdminStore.selectedRegisteredId ? "current" : "global";
    superAdminStore.reportModuleId = "";
    reportSelectionState.selectedIds.clear();
    getModuleFilter("reports").page = 1;
    renderApp();
}

function updateReportModule(moduleId) {
    superAdminStore.reportModuleId = String(moduleId || "").trim();
    reportSelectionState.selectedIds.clear();
    getModuleFilter(`reports_${superAdminStore.reportModuleId}`).page = 1;
    renderApp();
}

function updateReportFilter(field, value) {
    if (field === "month") {
        superAdminStore.reportMonth = value;
        if (value) {
            superAdminStore.reportStart = "";
            superAdminStore.reportEnd = "";
        }
    }
    if (field === "start") {
        superAdminStore.reportStart = value;
        if (value) superAdminStore.reportMonth = "";
    }
    if (field === "end") {
        superAdminStore.reportEnd = value;
        if (value) superAdminStore.reportMonth = "";
    }
    reportSelectionState.selectedIds.clear();
    getModuleFilter(`reports_${superAdminStore.reportModuleId || "modules"}`).page = 1;
    renderApp();
}

function renderReports(scoped = false) {
    const selectedOwner = isSuperadmin && superAdminStore.selectedRegisteredId ? String(superAdminStore.selectedRegisteredId).toLowerCase() : "";
    if (!scoped && selectedOwner && superAdminStore.reportScope !== "global") {
        return renderWithOwnerScope(selectedOwner, () => renderReports(true), ["employees", "schedules", "debts", "claims"], { filterBankRental: true });
    }
    const currentUserScoped = Boolean(selectedOwner && superAdminStore.reportScope !== "global");
    const selectedUser = getSelectedUser();
    const reportScopeLabel = currentUserScoped
        ? `Current User: ${selectedUser?.displayName || selectedOwner} (${selectedOwner})`
        : isSuperadmin ? "Select a user" : (currentRegisteredId || "My records");
    const reportModules = isSuperadmin && !selectedOwner ? [] : getReportModuleRecords();
    const reportRows = isSuperadmin && !selectedOwner ? [] : reportModules.flatMap((module) => module.records.map((record, index) => ({
        id: getReportRecordId(module.id, record, record.reportSourceIndex ?? index, record.reportSubcollection || ""),
        moduleId: module.id,
        moduleLabel: module.label,
        record,
        columns: module.columns
    })));
    const moduleCounts = reportModules.filter((module) => module.records.length).map((module) => ({ id: module.id, label: module.label, count: module.records.length }));
    const selectedModule = reportModules.find((module) => module.id === superAdminStore.reportModuleId && module.records.length) || null;
    const selectedModuleRows = selectedModule ? flattenReportModule(selectedModule) : [];
    const paginated = getPaginatedModuleRecords(`reports_${selectedModule?.id || "modules"}`, selectedModuleRows, { preserveOrder: true, skipSelectedUserScope: true });
    const pageRows = paginated.pageRows;
    const selectedCount = [...reportSelectionState.selectedIds].filter((id) => selectedModuleRows.some((row) => row.id === id)).length;
    const visibleChecked = pageRows.length > 0 && pageRows.every((row) => reportSelectionState.selectedIds.has(row.id));
    const userOptions = (superAdminStore.users || [])
        .filter((user) => !user.isSuperadmin)
        .map((user) => {
            const owner = String(user.registeredId || user.email || "").trim().toLowerCase();
            return `<option value="${escapeAttribute(owner)}" ${owner === selectedOwner ? "selected" : ""}>${escapeHtml(user.displayName || owner)}</option>`;
        }).join("");
    const rows = pageRows.map((row) => {
        const checked = reportSelectionState.selectedIds.has(row.id) ? "checked" : "";
        return `
            <tr>
                <td class="report-checkbox-cell"><input type="checkbox" ${checked} onchange="toggleReportRow('${escapeAttribute(row.id)}', this.checked)" /></td>
                <td>${escapeHtml(getReportRecordDate(row.record))}</td>
                <td>${escapeHtml(getReportCellValue(row.record, row.columns[0]?.[1]))}</td>
                <td>${escapeHtml(getReportCellValue(row.record, row.columns[1]?.[1]))}</td>
                <td>${escapeHtml(getReportCellValue(row.record, row.columns[2]?.[1]))}</td>
            </tr>
        `;
    }).join("");
    const historyRows = (superAdminStore.reportHistory || []).map((report) => `
        <tr>
            <td>${escapeHtml(report.timestamp || "-")}</td>
            <td>${escapeHtml(report.targetOwnerId || "-")}</td>
            <td>${Number(report.recordCount) || 0}</td>
            <td>${escapeHtml(report.generatedBy || "-")}</td>
        </tr>
    `).join("");

    return `
        <div class="module report-module">
            <div class="module-header">
                <div>
                    <h2>${t("Reports")}</h2>
                    <p class="module-subtitle">${escapeHtml(reportScopeLabel)} - ${selectedCount} selected</p>
                </div>
                <div class="btn-group">
                    ${canUseMonthlyClosing() ? `<button class="btn btn-secondary" onclick="runMonthlyClosing()">${t("Monthly Closing")}</button>` : ""}
                    <button class="btn" onclick="exportPdf()" ${selectedCount ? "" : "disabled"}>${t("Download PDF")}</button>
                </div>
            </div>
            ${isSuperadmin ? `
                <div class="database-filters report-toolbar">
                    <span class="badge">${escapeHtml(reportScopeLabel)}</span>
                    <label>User
                        <select onchange="updateReportUser(this.value)">
                            <option value="">Select user</option>
                            ${userOptions}
                        </select>
                    </label>
                    <label>Month <input type="month" value="${escapeAttribute(superAdminStore.reportMonth || "")}" onchange="updateReportFilter('month', this.value)" /></label>
                    <label>From <input type="date" value="${escapeAttribute(superAdminStore.reportStart || "")}" onchange="updateReportFilter('start', this.value)" /></label>
                    <label>To <input type="date" value="${escapeAttribute(superAdminStore.reportEnd || "")}" onchange="updateReportFilter('end', this.value)" /></label>
                </div>
            ` : `
                <div class="database-filters report-toolbar">
                    <label>Month <input type="month" value="${escapeAttribute(superAdminStore.reportMonth || "")}" onchange="updateReportFilter('month', this.value)" /></label>
                    <label>From <input type="date" value="${escapeAttribute(superAdminStore.reportStart || "")}" onchange="updateReportFilter('start', this.value)" /></label>
                    <label>To <input type="date" value="${escapeAttribute(superAdminStore.reportEnd || "")}" onchange="updateReportFilter('end', this.value)" /></label>
                </div>
            `}
            <div class="report-module-strip">
                ${moduleCounts.map((item) => `<button class="btn btn-sm ${item.id === selectedModule?.id ? "" : "btn-secondary"}" type="button" onclick="updateReportModule('${escapeAttribute(item.id)}')">${escapeHtml(item.label)} (${item.count})</button>`).join("") || `<span class="badge">No modules with records.</span>`}
            </div>
            ${selectedModule ? `<div class="table-wrapper report-table-wrapper">
                <table class="report-table">
                    <thead><tr><th class="report-checkbox-cell"><input type="checkbox" ${visibleChecked ? "checked" : ""} onchange="toggleVisibleReportRows(this.checked)" /></th><th>Date</th><th>Primary</th><th>Detail</th><th>Value</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="5" class="empty-state">No report rows available.</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination(`reports_${selectedModule.id}`, selectedModuleRows.length, paginated.totalPages)}` : `<div class="empty-state">${isSuperadmin && !selectedOwner ? "Select a user, then open a module." : "Open a module to view report records."}</div>`}
            <div class="table-wrapper report-history-wrapper">
                <table class="report-table report-history-table">
                    <thead><tr><th>Generated Date</th><th>User</th><th>Rows</th><th>Generated By</th></tr></thead>
                    <tbody>${historyRows || `<tr><td colspan="4" class="empty-state">No report history yet.</td></tr>`}</tbody>
                </table>
            </div>
        </div>
        ${renderMonthlySummary()}
    `;
}

function renderMonthlySummary() {
    const monthlyClaims = getMonthlyClaims();
    const approvedClaims = monthlyClaims.filter((claim) => claim.status === "Approved");
    const pendingClaims = monthlyClaims.filter((claim) => claim.status === "Pending");
    const rejectedClaims = monthlyClaims.filter((claim) => claim.status === "Rejected");
    const rows = monthlyClaims.map((claim) => `
        <tr>
            <td>${formatExportDate(claim.date)}</td>
            <td class="table-name-cell">${escapeHtml(getEmployeeName(claim.workerId || claim.employeeId))}</td>
            <td class="table-money-cell">${renderMoneyCell(claim.amount)}</td>
            <td class="table-detail-cell">${renderTableDetailButton("monthly-summary", "description", claim.description, "Description")}</td>
            <td><span class="badge">${escapeHtml(claim.status)}</span></td>
        </tr>
    `).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Monthly Summary")}</h2></div>
            <div class="cards">
                <div class="card"><h4>${t("Monthly Claims")}</h4><h2>${formatMoney(getMonthlyClaimTotal())}</h2></div>
                <div class="card"><h4>${t("Approved")}</h4><h2>${approvedClaims.length}</h2></div>
                <div class="card"><h4>${t("Pending")}</h4><h2>${pendingClaims.length}</h2></div>
                <div class="card"><h4>${t("Rejected")}</h4><h2>${rejectedClaims.length}</h2></div>
                <div class="card"><h4>${t("Funds Used")}</h4><h2>${formatMoney(getMonthlyFundsUsed())}</h2></div>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>${t("Date")}</th><th>${t("Worker")}</th><th>${t("Amount")}</th><th>${t("Description")}</th><th>${t("Status")}</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="5" class="empty-state">No monthly claims available.</td></tr>`}</tbody>
                </table>
            </div>
        </div>
    `;
}

function runMonthlyClosing() {
    if (!guardOperation("monthlyClosing", "monthly closing")) return;
    alert("Monthly closing controls are available to the system owner. Current month summary has been reviewed.");
}

function showManualClearDataModal() {
    if (!isSuperadmin) {
        alert("This action is not available.");
        return;
    }
    if (!guardOperation("delete", "monthly data")) return;

    openModal(
        "Manual Clear Data",
        `
            <p>Use the Report module to export selected records before clearing monthly data.</p>
            <p>This clears business records only: employees, schedules, debts, expenses, reimbursement claims, payments, fund accounts, and computed summaries. It keeps login accounts, currency, categories, payment types, styling, and system settings.</p>
            <label>Type CLEAR to confirm
                <input id="manualClearConfirmText" autocomplete="off" />
            </label>
            <p class="error-message" id="manualClearMessage" aria-live="polite"></p>
        `,
        async () => {
            const confirmText = document.getElementById("manualClearConfirmText").value.trim();
            const message = document.getElementById("manualClearMessage");

            if (confirmText !== "CLEAR") {
                message.textContent = "Type CLEAR exactly to continue.";
                return;
            }

            state.employees = [];
            state.schedules = [];
            state.debts = [];
            state.claims = [];
            state.expenses = [];
            state.reimbursementClaims = [];
            state.payments = [];
            state.fundAccounts = [];
            recalculateState();
            currentView = "dashboard";
            renderApp();
            await saveState();
            closeModal();
            alert("Monthly business data has been cleared and totals were recalculated.");
        },
        "Clear Data"
    );
}

const AUDIT_SUMMARY_MAX_LENGTH = 100;

function truncateAuditSummary(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "-";
    return text.length > AUDIT_SUMMARY_MAX_LENGTH ? `${text.slice(0, AUDIT_SUMMARY_MAX_LENGTH - 1)}…` : text;
}

function containsTechnicalAuditData(value) {
    const text = String(value || "").trim();
    if (!text) return false;
    return [
        /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/,
        /\bBearer\s+[a-zA-Z0-9._-]+/i,
        /\b(jwt|token|authorization|payload|request payload|response payload|request body|response body|stack trace|stack|base64)\b/i,
        /data:[^;]+;base64,/i,
        /^\s*[{[]/,
        /[A-Za-z0-9+/=]{80,}/
    ].some((pattern) => pattern.test(text));
}

function getAuditModuleLabel(log) {
    return truncateAuditSummary(log?.module || (log?.kind === "activity" ? "Activity" : "Login"));
}

function getAuditUserLabel(log) {
    if (log?.kind === "activity") {
        return truncateAuditSummary(log.actorName || log.actorRegisteredId || "-");
    }
    return truncateAuditSummary(log.displayName || log.email || "-");
}

function getAuditActionLabel(log) {
    if (log?.kind !== "activity") return "Login";
    const action = String(log.action || "").trim();
    return truncateAuditSummary(action || "Activity");
}

function getAuditSummaryLabel(log) {
    if (log?.kind !== "activity") {
        return log?.success ? "Login successful." : "Login failed.";
    }
    const rawSummary = String(log.summary || "").trim();
    if (rawSummary && !containsTechnicalAuditData(rawSummary)) {
        return truncateAuditSummary(rawSummary);
    }
    const moduleLabel = String(log.module || "Record").replace(/\s+records?$/i, "").trim() || "Record";
    const action = String(log.action || "").toLowerCase();
    if (action.includes("delete")) return truncateAuditSummary(`${moduleLabel} deleted.`);
    if (action.includes("add") || action.includes("create")) return truncateAuditSummary(`${moduleLabel} created.`);
    if (action.includes("upload") && action.includes("photo")) return "Employee photo uploaded.";
    if (action.includes("remove") && action.includes("photo")) return "Employee photo removed.";
    if (action.includes("settle")) return truncateAuditSummary(`${moduleLabel} settled.`);
    if (action.includes("reset") && action.includes("password")) return "Password reset.";
    if (action.includes("update") || action.includes("edit") || action.includes("modified")) return truncateAuditSummary(`${moduleLabel} updated.`);
    return truncateAuditSummary(`${moduleLabel} activity recorded.`);
}

function renderAuditLogRows() {
    return (superAdminStore.authLogs || []).map((log) => {
        return `
            <div class="audit-log-row">
                <div><span>Time</span><strong>${escapeHtml(log.timestamp || log.loginTime || "-")}</strong></div>
                <div><span>User</span><strong>${escapeHtml(getAuditUserLabel(log))}</strong></div>
                <div><span>Action</span><strong>${escapeHtml(getAuditActionLabel(log))}</strong></div>
                <div><span>Module</span><strong>${escapeHtml(getAuditModuleLabel(log))}</strong></div>
                <div><span>Summary</span><strong>${escapeHtml(getAuditSummaryLabel(log))}</strong></div>
            </div>
        `;
    }).join("");
}

function renderLoginAudit() {
    if (!isSuperadmin) {
        return `<div class="module"><div class="module-header"><h2>Login Audit</h2></div><div class="empty-state">Access denied.</div></div>`;
    }
    const authLogRows = renderAuditLogRows();
    return `
        <div class="module">
            <div class="module-header">
                <h2>Login Audit</h2>
                <div class="btn-group">
                    <button class="btn btn-secondary" onclick="refreshSuperAdminManagement()">Refresh</button>
                    <button class="btn btn-danger" onclick="clearLoginAudit()">Clear Login Audit</button>
                </div>
            </div>
            <div class="login-audit-panel">${authLogRows || `<div class="empty-state">No login records yet.</div>`}</div>
        </div>
    `;
}

async function refreshSuperAdminManagement(shouldRender = true) {
    if (!isSuperadmin) return;
    try {
        const [users, authLogs, displayModuleData, customAccess, roleTemplates] = await Promise.all([listUsers(), listAuthLogs(), getDisplayModules(), getCustomModuleAccess(), getRoleTemplates()]);
        const registryModules = (displayModuleData.modules || customAccess.modules || []).map((module) => normalizeModuleDefinition(module)).filter(Boolean);
        superAdminStore = {
            ...superAdminStore,
            users,
            authLogs,
            displayModules: displayModuleData.displayModules || {},
            customModules: registryModules,
            userAccess: customAccess.access,
            roleTemplates,
            roleTemplateDrafts: cloneRoleTemplates(roleTemplates),
            roleTemplateDirty: {},
            loaded: true
        };
        if (registryModules.length) {
            state.moduleRegistry = registryModules;
            currentUserPermissions = normalizeUserPermissionSet(currentUserPermissions, currentRole);
        }
        validateSelectedUserContext();
        if (shouldRender && !modal.classList.contains("show")) renderAppPreservingScroll();
    } catch (error) {
        alert(error.message || "Unable to load management tools.");
    }
}

async function clearLoginAudit() {
    if (!isSuperadmin) return;
    openModal(
        "Clear Login Audit",
        "<p>Clear login audit records only? This will not affect users or business data.</p>",
        async () => {
            try {
                await clearAuthLogs();
                closeModal();
                await refreshSuperAdminManagement();
            } catch (error) {
                alert(error.message || "Unable to clear login audit.");
            }
        },
        "Clear"
    );
}

function setUserManagementSection(section) {
    if (section === "access") {
        openStaffAccessModule();
        return;
    }
    superAdminStore.userManagementSection = ["users", "profile", "data", "create"].includes(section) ? section : "users";
    renderApp();
}

function openStaffAccessModule(userId = "") {
    if (!isSuperadmin) return;
    captureScrollContext();
    currentView = "staffAccess";
    superAdminStore.userManagementSection = "access";
    superAdminStore.selectedAccessUserId = String(userId || "");
    skipNextRenderScrollCapture = true;
    setActiveNav();
    renderAppPreservingScroll();
}

function updateUserManagementSearch(value) {
    superAdminStore.viewerSearch = value;
    debouncedRenderApp();
}

function updateUserManagementFilter(key, value) {
    const allowed = {
        search: "viewerSearch",
        status: "userStatusFilter",
        role: "userRoleFilter",
        sort: "viewerSort"
    };
    const storeKey = allowed[key];
    if (!storeKey) return;
    superAdminStore[storeKey] = value;
    debouncedRenderApp();
}

function getManagementUserRoleLabel(user = {}) {
    if (user.isSuperadmin || user.role === "superadmin" || user.accountRole === "superadmin") return "Super Admin";
    if (user.role === "admin" || user.accountRole === "admin") return "Admin";
    return "User";
}

async function openUserManagementProfile(id) {
    if (!isSuperadmin) return;
    try {
        const data = await getUserProfile(id);
        superAdminStore.selectedUserProfile = {
            user: data.user,
            systemModules: data.systemModules || [],
            moduleData: data.moduleData || []
        };
        superAdminStore.userManagementSection = "profile";
        renderAppPreservingScroll();
    } catch (error) {
        alert(error.message || "Unable to load user profile.");
    }
}

async function openUserDataView(id) {
    if (!isSuperadmin) return;
    captureScrollContext();
    currentView = "userManagement";
    skipNextRenderScrollCapture = true;
    setActiveNav();
    await openUserManagementProfile(id);
    const user = superAdminStore.selectedUserProfile?.user;
    superAdminStore.selectedRegisteredId = String(user?.registeredId || user?.email || "").trim().toLowerCase();
    superAdminStore.userManagementSection = "data";
    renderApp();
}

function openUserDataViewByOwner(ownerId) {
    if (!isSuperadmin) return;
    const owner = String(ownerId || "").trim().toLowerCase();
    const user = (superAdminStore.users || []).find((item) => String(item.registeredId || item.email || "").trim().toLowerCase() === owner);
    if (user?.id) {
        openUserDataView(user.id);
        return;
    }
    superAdminStore.selectedRegisteredId = owner;
    superAdminStore.selectedUserProfile = { user: { registeredId: owner, email: owner }, systemModules: [], moduleData: [] };
    superAdminStore.userManagementSection = "data";
    captureScrollContext();
    currentView = "userManagement";
    skipNextRenderScrollCapture = true;
    setActiveNav();
    renderApp();
}

function openUserManagementAccess(id) {
    if (!isSuperadmin) return;
    openStaffAccessModule(id);
}

function showEditManagementUserModal(id) {
    if (!isSuperadmin) return;
    const user = (superAdminStore.users || []).find((item) => Number(item.id) === Number(id));
    if (!user) return;
    if (user.isSuperadmin) {
        alert("Super Admin is managed by the foundation reset and cannot be edited here.");
        return;
    }
    openModal(
        "Edit User",
        `
            <label>Name <input id="editManagementUserName" value="${escapeAttribute(user.displayName || "")}" /></label>
            <label>Email <input value="${escapeAttribute(user.email || user.registeredId || "")}" disabled /></label>
            <label>Status
                <select id="editManagementUserStatus">
                    <option value="active" ${user.status !== "disabled" ? "selected" : ""}>Active</option>
                    <option value="disabled" ${user.status === "disabled" ? "selected" : ""}>Disabled</option>
                </select>
            </label>
        `,
        async () => {
            try {
                const updated = await updateManagementUser(id, {
                    displayName: document.getElementById("editManagementUserName")?.value || "",
                    status: document.getElementById("editManagementUserStatus")?.value || "active"
                });
                superAdminStore.users = (superAdminStore.users || []).map((item) => Number(item.id) === Number(id) ? updated : item);
                closeModal();
                renderApp();
            } catch (error) {
                alert(error.message || "Unable to edit user.");
            }
        },
        "Save"
    );
}

function showResetManagementUserPasswordModal(id) {
    if (!isSuperadmin) return;
    const user = (superAdminStore.users || []).find((item) => Number(item.id) === Number(id));
    if (!user) return;
    if (user.isSuperadmin) {
        alert("Super Admin password is managed through the normal account flow.");
        return;
    }
    const email = user?.registeredId || user?.email || "this user";
    openModal(
        "Reset Password",
        `
            <p>Reset password for ${escapeHtml(email)}?</p>
            <label>New Password <input id="resetManagementUserPassword" type="password" autocomplete="new-password" minlength="6" /></label>
            <label>Confirm Password <input id="resetManagementUserPasswordConfirm" type="password" autocomplete="new-password" minlength="6" /></label>
        `,
        async () => {
            const password = document.getElementById("resetManagementUserPassword")?.value || "";
            const confirmPassword = document.getElementById("resetManagementUserPasswordConfirm")?.value || "";
            if (password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }
            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }
            try {
                const updated = await resetManagementUserPassword(id, password);
                superAdminStore.users = (superAdminStore.users || []).map((item) => Number(item.id) === Number(id) ? updated : item);
                if (superAdminStore.selectedUserProfile?.user && Number(superAdminStore.selectedUserProfile.user.id) === Number(id)) {
                    superAdminStore.selectedUserProfile.user = updated;
                }
                closeModal();
                renderApp();
                alert("Password reset successfully.");
            } catch (error) {
                alert(error.message || "Unable to reset password.");
            }
        },
        "Reset Password"
    );
}

async function setManagementUserStatus(id, status) {
    if (!isSuperadmin) return;
    const user = (superAdminStore.users || []).find((item) => Number(item.id) === Number(id));
    if (user?.isSuperadmin) {
        alert("Super Admin cannot be disabled.");
        return;
    }
    try {
        const updated = await updateManagementUserStatus(id, status);
        superAdminStore.users = (superAdminStore.users || []).map((item) => Number(item.id) === Number(id) ? updated : item);
        renderAppPreservingScroll();
    } catch (error) {
        alert(error.message || "Unable to update user status.");
    }
}

function confirmDeleteManagementUser(id) {
    if (!isSuperadmin) return;
    const user = (superAdminStore.users || []).find((item) => Number(item.id) === Number(id));
    if (user?.isSuperadmin) {
        alert("Super Admin cannot be deleted.");
        return;
    }
    const email = user?.registeredId || user?.email || "this user";
    openModal(
        "Delete User",
        `<p>Delete ${escapeHtml(email)}? This permanently removes the account, permissions, login records, and all owned records.</p>`,
        async () => {
            try {
                await deleteManagementUser(id);
                superAdminStore.users = (superAdminStore.users || []).filter((item) => Number(item.id) !== Number(id));
                if (String(superAdminStore.selectedRegisteredId || "") === String(email || "").toLowerCase()) {
                    superAdminStore.selectedRegisteredId = "";
                    superAdminStore.selectedUserProfile = null;
                    superAdminStore.reportScope = "global";
                }
                if (String(superAdminStore.selectedUserContext || "") === String(email || "").toLowerCase()) {
                    clearSelectedUserContext();
                }
                closeModal();
                await loadState();
                await refreshSuperAdminManagement(false);
                renderApp();
            } catch (error) {
                alert(error.message || "Unable to delete user.");
            }
        },
        "Delete"
    );
}

function renderUserManagementTabs() {
    const tabs = [
        ["users", "Users"],
        ["profile", "User Profile"],
        ["data", "User Data"],
        ["create", "Create User"],
        ["access", "Staff Access"]
    ];
    return `
        <div class="workspace-tabs">
            ${tabs.map(([id, label]) => `<button class="btn ${superAdminStore.userManagementSection === id ? "" : "btn-secondary"}" onclick="setUserManagementSection('${id}')">${label}</button>`).join("")}
        </div>
    `;
}

function renderUserManagementUsers() {
    const search = String(superAdminStore.viewerSearch || "").trim().toLowerCase();
    const statusFilter = superAdminStore.userStatusFilter || "all";
    const roleFilter = superAdminStore.userRoleFilter || "all";
    const sortMode = superAdminStore.viewerSort || "createdDate";
    const users = (superAdminStore.users || []).filter((user) => {
        const text = `${user.id || ""} ${user.displayName || ""} ${user.registeredId || ""} ${user.email || ""} ${user.status || ""}`.toLowerCase();
        const status = String(user.status || "active").trim().toLowerCase();
        const role = getManagementUserRoleLabel(user).toLowerCase().replace(/\s+/g, "");
        if (search && !text.includes(search)) return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (roleFilter !== "all" && role !== roleFilter) return false;
        return true;
    }).sort((a, b) => {
        if (sortMode === "name") return String(a.displayName || a.email || "").localeCompare(String(b.displayName || b.email || ""));
        if (sortMode === "email") return String(a.email || a.registeredId || "").localeCompare(String(b.email || b.registeredId || ""));
        if (sortMode === "role") return getManagementUserRoleLabel(a).localeCompare(getManagementUserRoleLabel(b));
        if (sortMode === "status") return String(a.status || "active").localeCompare(String(b.status || "active"));
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
    const rows = users.map((user) => `
        <tr>
            <td>${escapeHtml(user.displayName || "-")}</td>
            <td>${escapeHtml(user.email || user.registeredId || "-")}</td>
            <td><span class="badge">${escapeHtml(getManagementUserRoleLabel(user))}</span></td>
            <td><span class="badge">${escapeHtml(user.status || "active")}</span></td>
            <td>${escapeHtml(user.createdAt || "-")}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm" onclick="openUserManagementProfile(${Number(user.id)})">View User</button>
                    <button class="btn btn-secondary btn-sm" onclick="openUserDataView(${Number(user.id)})">View Data</button>
                    <button class="btn btn-secondary btn-sm" onclick="showEditManagementUserModal(${Number(user.id)})">Edit User</button>
                    <button class="btn btn-secondary btn-sm" onclick="showResetManagementUserPasswordModal(${Number(user.id)})">Reset Password</button>
                    <button class="btn btn-secondary btn-sm" onclick="openStaffAccessModule(${Number(user.id)})">Staff Access</button>
                    <button class="btn btn-secondary btn-sm" onclick="setManagementUserStatus(${Number(user.id)}, '${user.status === "disabled" ? "active" : "disabled"}')">${user.status === "disabled" ? "Enable User" : "Disable User"}</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteManagementUser(${Number(user.id)})">Delete User</button>
                </div>
            </td>
        </tr>
    `).join("");
    return `
        <section class="module">
            <div class="module-header">
                <h2>Users</h2>
                <button class="btn btn-secondary" onclick="refreshSuperAdminManagement()">${t("Refresh")}</button>
            </div>
            <div class="database-filters">
                <label>Search users <input type="search" value="${escapeHtml(superAdminStore.viewerSearch || "")}" oninput="updateUserManagementFilter('search', this.value)" /></label>
                <label>Status
                    <select onchange="updateUserManagementFilter('status', this.value)">
                        <option value="all" ${statusFilter === "all" ? "selected" : ""}>All</option>
                        <option value="active" ${statusFilter === "active" ? "selected" : ""}>Active</option>
                        <option value="disabled" ${statusFilter === "disabled" ? "selected" : ""}>Disabled</option>
                    </select>
                </label>
                <label>Role
                    <select onchange="updateUserManagementFilter('role', this.value)">
                        <option value="all" ${roleFilter === "all" ? "selected" : ""}>All</option>
                        <option value="superadmin" ${roleFilter === "superadmin" ? "selected" : ""}>Super Admin</option>
                        <option value="admin" ${roleFilter === "admin" ? "selected" : ""}>Admin</option>
                        <option value="user" ${roleFilter === "user" ? "selected" : ""}>User</option>
                    </select>
                </label>
                <label>Sort
                    <select onchange="updateUserManagementFilter('sort', this.value)">
                        <option value="createdDate" ${sortMode === "createdDate" ? "selected" : ""}>Newest</option>
                        <option value="name" ${sortMode === "name" ? "selected" : ""}>Name</option>
                        <option value="email" ${sortMode === "email" ? "selected" : ""}>Email</option>
                        <option value="role" ${sortMode === "role" ? "selected" : ""}>Role</option>
                        <option value="status" ${sortMode === "status" ? "selected" : ""}>Status</option>
                    </select>
                </label>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created Date</th><th>Actions</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="6" class="empty-state">No users found.</td></tr>`}</tbody>
                </table>
            </div>
        </section>
    `;
}

function renderUserManagementProfile() {
    const profile = superAdminStore.selectedUserProfile;
    if (!profile?.user) {
        return `<section class="module"><div class="module-header"><h2>User Profile</h2></div><div class="empty-state">Select a user from the Users section.</div></section>`;
    }
    const user = profile.user;
    const moduleRows = (profile.systemModules || []).map((moduleId) => `
        <div class="category-row">
            <span>${escapeHtml(moduleLabels[moduleId] || moduleId)}</span>
            <span class="badge">${escapeHtml(moduleId)}</span>
        </div>
    `).join("");
    const moduleDataById = new Map((profile.moduleData || []).map((module) => [module.module, module]));
    const assignedModules = [...new Set(profile.systemModules || [])].filter((moduleId) => moduleLabels[moduleId] || moduleDataById.has(moduleId));
    const summaryRows = assignedModules.map((moduleId) => {
        const summary = moduleDataById.get(moduleId) || { count: 0, totalAmount: 0 };
        const count = Number(summary.count) || 0;
        return `
            <tr>
                <td>${escapeHtml(moduleLabels[moduleId] || moduleId)}</td>
                <td><span class="badge">${escapeHtml(moduleId)}</span></td>
                <td>${count}</td>
                <td>${renderMoneyCell(summary.totalAmount || 0)}</td>
                <td><span class="badge ${count ? "module-status-active" : "module-status-inactive"}">${count ? "Has Data" : "No Data"}</span></td>
            </tr>
        `;
    }).join("");
    return `
        <section class="module">
            <div class="module-header">
                <h2>User Profile</h2>
                <div class="btn-group">
                    <button class="btn btn-secondary" onclick="setUserManagementSection('users')">Back to Users</button>
                    <button class="btn" onclick="openUserDataViewByOwner('${escapeAttribute(user.registeredId || user.email || "")}')">View User Data</button>
                </div>
            </div>
            <div class="detail-grid">
                ${renderDetailRow("User ID", user.registeredId || user.email || user.id)}
                ${renderDetailRow("Name", user.displayName || "-")}
                ${renderDetailRow("Email", user.email || user.registeredId || "-")}
                ${renderDetailRow("Role", getManagementUserRoleLabel(user))}
                ${renderDetailRow("Status", user.status || "active")}
                ${renderDetailRow("Created Date", user.createdAt || "-")}
                ${renderDetailRow("Last Login", user.lastLogin || "-")}
            </div>
            <hr>
            <div class="module-header"><h2>System Modules</h2></div>
            ${moduleRows || `<div class="empty-state">No assigned system modules.</div>`}
            <hr>
            <div class="module-header"><h2>Permissions</h2></div>
            <div class="detail-grid">
                ${PERMISSION_BOOLEAN_KEYS.map((key) => renderDetailRow(PERMISSION_LABELS[key] || key, user.permissions?.[key] ? "Allowed" : "Not allowed")).join("")}
            </div>
            <hr>
            <div class="module-header"><h2>Module Summary</h2></div>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Module</th><th>Module ID</th><th>Records</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>${summaryRows || `<tr><td colspan="5" class="empty-state">No assigned modules found.</td></tr>`}</tbody>
                </table>
            </div>
        </section>
    `;
}

function getOwnerModuleRecords(owner) {
    const normalizedOwner = String(owner || "").trim().toLowerCase();
    const owned = (records) => (Array.isArray(records) ? records : []).filter((record) => getRecordOwner(record) === normalizedOwner);
    const bankRentalRecords = getBankRentalAmountRecords(normalizedOwner).map((record) => ({
        ...record,
        tabId: record.sourceTabId || "bankRental"
    }));
    const modules = [
        { id: "employees", label: "Employees", records: owned(state.employees), columns: [["Name", "name"], ["Role", "role"], ["Department", "department"], ["Category", "category"]] },
        { id: "schedules", label: "Schedules", records: owned(state.schedules), columns: [["Employee", (record) => record.employeeName || getEmployeeName(record.employeeId)], ["Start", "startDate"], ["End", "endDate"], ["Type", (record) => record.leaveType || record.shift], ["Reason", (record) => record.reason || record.remark]] },
        { id: "debts", label: "Debt Tracking", records: owned(state.debts), columns: [["Date", "date"], ["Employee", (record) => getEmployeeName(record.employeeId)], ["Amount", (record) => formatMoney(record.amount)], ["Status", "status"], ["Reason", "reason"]] },
        { id: "expenses", label: "Expenses", records: owned(state.expenses), columns: [["Date", "date"], ["Type", "type"], ["Category", "category"], ["Amount", (record) => formatMoney(record.amount)], ["Description", "description"]] },
        { id: "reimbursementClaims", label: "Reimbursements", records: owned(state.reimbursementClaims), columns: [["Date", "date"], ["Worker", (record) => getUserDisplayNameOnly(getRecordOwner(record) || record.workerId)], ["Amount", (record) => formatMoney(record.amount)], ["Status", "status"], ["Description", "description"]] },
        { id: "payments", label: "Assets / Payments", records: owned(state.payments), columns: [["Date", "date"], ["Recipient", "recipient"], ["Amount", (record) => formatMoney(record.amount)], ["Status", "status"], ["Description", "description"]] },
        { id: "funds", label: "Funds", records: owned(state.fundAccounts), columns: [["Date", "date"], ["Name", "name"], ["Initial", (record) => formatMoney(record.initialBalance)], ["Current", (record) => formatMoney(record.currentBalance ?? record.netAmount)], ["Remark", "remark"]] },
        { id: "atmCash", label: "ATM Cash", records: owned(state.atmCashRecords), columns: [["Date", "date"], ["Fund In", (record) => formatMoney(record.fundIn)], ["Fund Out", (record) => formatMoney(record.fundOut)], ["Balance", (record) => formatMoney(record.balance)], ["Remark", "remark"]] },
        { id: "calendar", label: "Calendar", records: owned(state.calendarEvents), columns: [["Title", "title"], ["Date", "date"], ["Time", (record) => [record.startTime, record.endTime].filter(Boolean).join(" - ")], ["Description", "description"]] },
        { id: "bankRental", label: "Bank Rental", records: bankRentalRecords, columns: [["Tab", "tabId"], ["Agent", (record) => getBankRentalAgentName(record)], ["Bank", "bankName"], ["Amount", (record) => formatMoney(record.amount)], ["Status", (record) => getBankRentalFinancials(record).bankStatus]] }
    ];
    getModuleRegistry().filter((module) => !module.builtIn).forEach((module) => {
        modules.push({
            id: module.id,
            label: module.label || module.id,
            records: owned(getDynamicModuleRecords(module.id)),
            columns: (module.fields || []).slice(0, 5).map((field) => [field.label || field.key, field.key])
        });
    });
    return modules;
}

function renderReadonlyValue(record, accessor) {
    const value = typeof accessor === "function" ? accessor(record) : record?.[accessor];
    if (value === undefined || value === null || value === "") return "-";
    return String(value);
}

function renderOwnerReadonlyModule(module) {
    const rows = module.records.slice(0, 50).map((record) => `
        <tr>${module.columns.map(([, accessor]) => `<td>${escapeHtml(renderReadonlyValue(record, accessor))}</td>`).join("")}</tr>
    `).join("");
    return `
        <section class="user-data-table-section">
            <div class="user-data-table-header">
                <h3>${escapeHtml(module.label)}</h3>
                <span class="badge module-management-count">${module.records.length}</span>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr>${module.columns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
                    <tbody>${rows || `<tr><td colspan="${module.columns.length}" class="empty-state">No records for this user.</td></tr>`}</tbody>
                </table>
            </div>
            ${module.records.length > 50 ? `<div class="module-management-empty-row">Showing first 50 of ${module.records.length} records.</div>` : ""}
        </section>
    `;
}

function renderUserDataView() {
    const profileUser = superAdminStore.selectedUserProfile?.user || {};
    const owner = String(superAdminStore.selectedRegisteredId || profileUser.registeredId || profileUser.email || "").trim().toLowerCase();
    if (!owner) {
        return `<section class="module"><div class="module-header"><h2>User Data</h2></div><div class="empty-state">Select a user to view module data.</div></section>`;
    }
    const user = (superAdminStore.users || []).find((item) => String(item.registeredId || item.email || "").trim().toLowerCase() === owner) || profileUser;
    const modules = getOwnerModuleRecords(owner);
    const totalRecords = modules.reduce((sum, module) => sum + module.records.length, 0);
    return `
        <section class="module user-data-view">
            <div class="module-header">
                <div>
                    <h2>User Data</h2>
                    <p class="module-subtitle">${escapeHtml(user.displayName || user.registeredId || user.email || owner)} · ${totalRecords} owned records</p>
                </div>
                <div class="btn-group">
                    <button class="btn btn-secondary" onclick="setUserManagementSection('users')">Back to Users</button>
                    <button class="btn btn-secondary" onclick="openUserManagementProfile(${Number(user.id) || 0})">Profile</button>
                </div>
            </div>
            <div class="user-data-table-stack">
                ${modules.map(renderOwnerReadonlyModule).join("")}
            </div>
        </section>
    `;
}

async function submitManagementCreateUser() {
    if (!isSuperadmin) return;
    const name = document.getElementById("managementCreateName")?.value.trim() || "";
    const email = document.getElementById("managementCreateEmail")?.value.trim() || "";
    const password = document.getElementById("managementCreatePassword")?.value || "";
    const status = document.getElementById("managementCreateStatus")?.value || "active";
    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }
    try {
        const user = await createManagementUser({ name, email, password, status });
        await refreshSuperAdminManagement(false);
        await openUserManagementProfile(user.id);
    } catch (error) {
        alert(error.message || "Unable to create user.");
    }
}

function renderUserManagementCreate() {
    return `
        <section class="module">
            <div class="module-header"><h2>Create User</h2></div>
            <div class="settings-form-grid">
                <label>Name <input id="managementCreateName" placeholder="Name" /></label>
                <label>Email <input id="managementCreateEmail" placeholder="Email / Registered ID" /></label>
                <label>Password <input id="managementCreatePassword" type="password" placeholder="Password" /></label>
                <label>Status
                    <select id="managementCreateStatus">
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </label>
            </div>
            <div class="btn-group">
                <button class="btn" onclick="submitManagementCreateUser()">Create User</button>
            </div>
        </section>
    `;
}

async function updateStaffAccessRole(userId, role) {
    if (!isSuperadmin) return;
    const user = (superAdminStore.users || []).find((item) => Number(item.id) === Number(userId));
    if (!user || user.isSuperadmin) return;
    try {
        const roleKey = role === "admin" ? "admin" : "user";
        const updated = await updateManagementUserPermissions(userId, null, roleKey);
        superAdminStore.users = (superAdminStore.users || []).map((item) => Number(item.id) === Number(userId) ? updated : item);
        renderAppPreservingScroll();
    } catch (error) {
        alert(error.message || "Unable to update role.");
        await refreshSuperAdminManagement();
    }
}

function renderUserRoleAssignmentTable(users = []) {
    const rows = users.map((user) => {
        const roleValue = user.isSuperadmin || user.role === "superadmin" || user.accountRole === "superadmin"
            ? "superadmin"
            : user.role === "admin" || user.accountRole === "admin"
            ? "admin"
            : "user";
        return `
            <tr>
                <td>${escapeHtml(user.displayName || user.registeredId || user.email || "-")}</td>
                <td>${escapeHtml(user.email || user.registeredId || "-")}</td>
                <td><span class="badge">${escapeHtml(user.status || "active")}</span></td>
                <td>
                    <select onchange="updateStaffAccessRole(${Number(user.id)}, this.value)" ${roleValue === "superadmin" ? "disabled" : ""}>
                        <option value="superadmin" ${roleValue === "superadmin" ? "selected" : ""} disabled>SuperAdmin</option>
                        <option value="admin" ${roleValue === "admin" ? "selected" : ""}>Admin</option>
                        <option value="user" ${roleValue === "user" ? "selected" : ""}>User</option>
                    </select>
                </td>
            </tr>
        `;
    }).join("");
    return `
        <section class="user-access-panel">
            <div class="user-access-panel-header">
                <div>
                    <h3>User Role Management</h3>
                    <p>Assign account roles independently from role templates.</p>
                </div>
            </div>
            <div class="table-wrapper user-access-table-wrapper">
                <table class="user-access-table">
                    <thead><tr><th>User</th><th>Email</th><th>Status</th><th>Role</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="4" class="empty-state">No users found.</td></tr>`}</tbody>
                </table>
            </div>
        </section>
    `;
}

function setStaffAccessRoleTemplate(role) {
    superAdminStore.selectedRoleTemplate = role === "admin" ? "admin" : "user";
    renderAppPreservingScroll();
}

function cloneRoleTemplates(templates = {}) {
    return JSON.parse(JSON.stringify(templates || {}));
}

function getRoleTemplateDraft(role) {
    const roleKey = role === "admin" ? "admin" : "user";
    if (!superAdminStore.roleTemplateDrafts || !superAdminStore.roleTemplateDrafts[roleKey]) {
        superAdminStore.roleTemplateDrafts = cloneRoleTemplates(superAdminStore.roleTemplates || {});
    }
    return superAdminStore.roleTemplateDrafts[roleKey] || {};
}

function updateStaffRoleTemplate(moduleKey, action, checked) {
    if (!isSuperadmin) return;
    const role = superAdminStore.selectedRoleTemplate === "admin" ? "admin" : "user";
    const drafts = cloneRoleTemplates(superAdminStore.roleTemplateDrafts || superAdminStore.roleTemplates || {});
    const moduleActions = { ...(drafts[role] || {}) };
    moduleActions[moduleKey] = {
        read: moduleActions[moduleKey]?.read !== false,
        create: moduleActions[moduleKey]?.create !== false,
        update: moduleActions[moduleKey]?.update !== false,
        delete: moduleActions[moduleKey]?.delete === true,
        [action]: checked === true
    };
    drafts[role] = moduleActions;
    superAdminStore.roleTemplateDrafts = drafts;
    superAdminStore.roleTemplateDirty = {
        ...(superAdminStore.roleTemplateDirty || {}),
        [role]: true
    };
    renderAppPreservingScroll();
}

async function saveStaffRoleTemplate(role = superAdminStore.selectedRoleTemplate) {
    if (!isSuperadmin) return;
    const roleKey = role === "admin" ? "admin" : "user";
    if (!superAdminStore.roleTemplateDirty?.[roleKey]) return;
    try {
        const moduleActions = getRoleTemplateDraft(roleKey);
        const templates = await updateRoleTemplate(roleKey, moduleActions);
        superAdminStore.roleTemplates = templates;
        superAdminStore.roleTemplateDrafts = cloneRoleTemplates(templates);
        superAdminStore.roleTemplateDirty = {
            ...(superAdminStore.roleTemplateDirty || {}),
            [roleKey]: false
        };
        await refreshCurrentSessionPermissions();
        await refreshSuperAdminManagement(false);
        renderAppPreservingScroll();
    } catch (error) {
        alert(error.message || "Unable to save role template.");
        await refreshSuperAdminManagement();
    }
}

function renderStaffRoleTemplatePanel(modules = []) {
    const role = superAdminStore.selectedRoleTemplate === "admin" ? "admin" : "user";
    const template = getRoleTemplateDraft(role);
    const isDirty = superAdminStore.roleTemplateDirty?.[role] === true;
    const rows = modules.map((module) => {
        const actions = template[module.id] || {};
        return `
            <tr class="${isDirty ? "permission-row-dirty" : ""}">
                <td><strong>${escapeHtml(module.label)}</strong><small>${escapeHtml(module.id)}</small></td>
                ${STAFF_ACCESS_ACTIONS.map(([action, label]) => `<td class="permission-cell"><input class="permission-checkbox" type="checkbox" ${(actions[action] !== false && action !== "delete") || actions[action] === true ? "checked" : ""} onchange="updateStaffRoleTemplate('${escapeAttribute(module.id)}', '${action}', this.checked)" aria-label="${escapeAttribute(role)} ${escapeAttribute(label)} ${escapeAttribute(module.label)}" /></td>`).join("")}
            </tr>
        `;
    }).join("");
    return `
        <section class="user-access-panel">
            <div class="user-access-panel-header">
                <div>
                    <h3>Role Templates</h3>
                    <p>Defaults for future role assignment.</p>
                </div>
                <label>Template
                    <select onchange="setStaffAccessRoleTemplate(this.value)">
                        <option value="user" ${role === "user" ? "selected" : ""}>User</option>
                        <option value="admin" ${role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </label>
                <button class="btn btn-sm" onclick="saveStaffRoleTemplate('${role}')" ${isDirty ? "" : "disabled"}>Save</button>
            </div>
            <div class="table-wrapper user-access-table-wrapper">
                <table class="user-access-table">
                    <thead><tr><th>Module</th>${STAFF_ACCESS_ACTIONS.map(([, label]) => `<th>${label}</th>`).join("")}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </section>
    `;
}

function renderUserManagementAccess() {
    if (!isSuperadmin) {
        return `<div class="module"><div class="module-header"><h2>Staff Access</h2></div><div class="empty-state">Access denied.</div></div>`;
    }
    const modules = getModuleRegistry()
        .filter((module) => module.enabled !== false)
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.label.localeCompare(b.label));
    if (!modules.length) {
        return `
            <section class="module">
                <div class="module-header"><h2>Staff Access</h2></div>
                <div class="empty-state">No enabled modules are available for assignment.</div>
            </section>
        `;
    }
    return `
        <section class="module">
            <div class="module-header">
                <h2>Staff Access</h2>
                <button class="btn btn-secondary" onclick="refreshSuperAdminManagement()">${t("Refresh")}</button>
            </div>
            <div class="user-access-stack">
                ${renderUserRoleAssignmentTable(superAdminStore.users || [])}
                ${renderStaffRoleTemplatePanel(modules)}
            </div>
        </section>
    `;
}

function renderUserManagement() {
    if (!isSuperadmin) {
        return `<div class="module"><div class="module-header"><h2>User Management</h2></div><div class="empty-state">Access denied.</div></div>`;
    }
    const section = superAdminStore.userManagementSection || "users";
    const sections = {
        users: renderUserManagementUsers,
        profile: renderUserManagementProfile,
        data: renderUserDataView,
        access: renderUserManagementAccess,
        create: renderUserManagementCreate
    };
    return `
        <div class="workspace-shell user-management-workspace">
            <div class="module-header">
                <h2>User Management</h2>
            </div>
            ${renderUserManagementTabs()}
            ${sections[section] ? sections[section]() : renderUserManagementUsers()}
        </div>
    `;
}

function renderDisplayModules() {
    if (!isSuperadmin) {
        return `<div class="module"><div class="module-header"><h2>${t("Module Management")}</h2></div><div class="empty-state">Access denied.</div></div>`;
    }
    const allModules = getModuleRegistry()
        .slice()
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.label.localeCompare(b.label));
    const searchTerm = String(superAdminStore.moduleManagementSearch || "").trim().toLowerCase();
    const statusFilter = superAdminStore.moduleManagementStatus || "all";
    const sidebarFilter = superAdminStore.moduleManagementSidebar || "all";
    const typeFilter = superAdminStore.moduleManagementType || "all";
    const enabledCount = allModules.filter((module) => module.enabled !== false).length;
    const sidebarCount = allModules.filter((module) => module.sidebarVisible !== false && module.visibilityEnabled !== false).length;
    const modules = allModules.filter((module) => {
        const disabled = module.enabled === false;
        const sidebarHidden = module.sidebarVisible === false || module.visibilityEnabled === false;
        const type = module.systemModule ? "system" : "custom";
        const haystack = [module.label, module.id, module.icon, module.category, module.access, type]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");
        if (searchTerm && !haystack.includes(searchTerm)) return false;
        if (statusFilter === "enabled" && disabled) return false;
        if (statusFilter === "disabled" && !disabled) return false;
        if (sidebarFilter === "visible" && sidebarHidden) return false;
        if (sidebarFilter === "hidden" && !sidebarHidden) return false;
        if (typeFilter !== "all" && typeFilter !== type) return false;
        return true;
    });
    const rows = modules.map((module) => {
        const protectedModule = PROTECTED_MODULE_IDS.has(module.id);
        const superOnly = SUPERADMIN_ONLY_MODULE_IDS.has(module.id);
        const disabled = module.enabled === false;
        const actionOptions = [
            `<option value="">Actions</option>`,
            `<option value="view">View Details</option>`,
            `<option value="edit">Edit Module</option>`,
            `<option value="enable" ${!disabled ? "disabled" : ""}>Enable Module</option>`,
            `<option value="disable" ${disabled || protectedModule ? "disabled" : ""}>Disable Module</option>`,
            `<option value="show" ${module.sidebarVisible !== false ? "disabled" : ""}>Show In Sidebar</option>`,
            `<option value="hide" ${module.sidebarVisible === false ? "disabled" : ""}>Hide From Sidebar</option>`,
            `<option value="delete" ${protectedModule ? "disabled" : ""}>Delete Module</option>`
        ].join("");
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(module.label)}</strong>
                    <div class="module-subtitle">${escapeHtml(module.id)}${superOnly ? " · Super Admin only" : ""}</div>
                </td>
                <td>${escapeHtml(module.icon || "-")}</td>
                <td><input type="number" min="0" step="1" value="${Number(module.sortOrder) || 0}" onchange="updateModuleSortOrder('${module.id}', this.value)" /></td>
                <td><span class="badge ${disabled ? "module-status-inactive" : "module-status-active"}">${disabled ? "Disabled" : "Enabled"}</span></td>
                <td><span class="badge ${module.sidebarVisible === false ? "module-status-inactive" : "module-status-active"}">${module.sidebarVisible === false ? "Hidden" : "Visible"}</span></td>
                <td><span class="badge">${module.systemModule ? "System" : "Custom"}</span></td>
                <td class="btn-group">
                    <select class="module-management-action-menu" aria-label="Module actions for ${escapeAttribute(module.label)}" onchange="handleModuleManagementAction('${module.id}', this.value); this.value = '';">${actionOptions}</select>
                </td>
            </tr>
        `;
    }).join("");
    return `
        <div class="module module-management-module">
            <div class="module-header">
                <div>
                    <h2>${t("Module Management")}</h2>
                    <p class="module-subtitle">Super Admin access is retained for every enabled management module.</p>
                </div>
                <div class="btn-group">
                    <button class="btn" onclick="showCreateModuleUi()">Create Module</button>
                    <button class="btn btn-secondary" onclick="refreshSuperAdminManagement()">Refresh</button>
                </div>
            </div>
            <div class="module-management-summary">
                <span><strong>${allModules.length}</strong> registered</span>
                <span><strong>${enabledCount}</strong> enabled</span>
                <span><strong>${sidebarCount}</strong> sidebar-visible</span>
            </div>
            <div class="database-filters module-management-filters">
                <label>Search
                    <input type="search" value="${escapeAttribute(superAdminStore.moduleManagementSearch || "")}" placeholder="Module, key, icon" oninput="updateModuleManagementFilter('search', this.value)" />
                </label>
                <label>Status
                    <select onchange="updateModuleManagementFilter('status', this.value)">
                        <option value="all" ${statusFilter === "all" ? "selected" : ""}>All</option>
                        <option value="enabled" ${statusFilter === "enabled" ? "selected" : ""}>Enabled</option>
                        <option value="disabled" ${statusFilter === "disabled" ? "selected" : ""}>Disabled</option>
                    </select>
                </label>
                <label>Sidebar
                    <select onchange="updateModuleManagementFilter('sidebar', this.value)">
                        <option value="all" ${sidebarFilter === "all" ? "selected" : ""}>All</option>
                        <option value="visible" ${sidebarFilter === "visible" ? "selected" : ""}>Visible</option>
                        <option value="hidden" ${sidebarFilter === "hidden" ? "selected" : ""}>Hidden</option>
                    </select>
                </label>
                <label>Type
                    <select onchange="updateModuleManagementFilter('type', this.value)">
                        <option value="all" ${typeFilter === "all" ? "selected" : ""}>All</option>
                        <option value="system" ${typeFilter === "system" ? "selected" : ""}>System</option>
                        <option value="custom" ${typeFilter === "custom" ? "selected" : ""}>Custom</option>
                    </select>
                </label>
            </div>
            <div class="table-wrapper module-management-table">
                <table>
                    <thead>
                        <tr><th>Module</th><th>Icon</th><th>Sort Order</th><th>Status</th><th>Sidebar</th><th>Type</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rows || `<tr><td colspan="7" class="empty-state">No modules match the current filters.</td></tr>`}</tbody>
                </table>
            </div>
        </div>
    `;
}

function updateModuleManagementFilter(field, value) {
    const fields = {
        search: "moduleManagementSearch",
        status: "moduleManagementStatus",
        sidebar: "moduleManagementSidebar",
        type: "moduleManagementType"
    };
    const key = fields[field];
    if (!key) return;
    superAdminStore[key] = value;
    renderApp();
}

function getModuleManagementModule(moduleKey) {
    return getModuleRegistry().find((module) => module.id === moduleKey) || null;
}

function renderModuleManagementUiForm(module = {}) {
    return `
        <div class="module-management-ui-form">
            <label>Module Name <input id="moduleFormLabel" value="${escapeAttribute(module.label || "")}" placeholder="Module name" /></label>
            <label>Module Key <input id="moduleFormKey" value="${escapeAttribute(module.id || "")}" placeholder="moduleKey" ${module.id ? "disabled" : ""} /></label>
            <label>Icon <input id="moduleFormIcon" value="${escapeAttribute(module.icon || "")}" placeholder="Icon name" /></label>
            <label>Category
                <select id="moduleFormCategory">
                    ${MODULE_CATEGORIES.map(([id, label]) => `<option value="${escapeAttribute(id)}" ${module.category === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
                </select>
            </label>
            <label>Access
                <select id="moduleFormAccess">
                    <option value="all" ${module.access !== "management" ? "selected" : ""}>All Users</option>
                    <option value="management" ${module.access === "management" ? "selected" : ""}>Management Only</option>
                </select>
            </label>
            <label>Sort Order <input id="moduleFormSortOrder" type="number" value="${Number(module.sortOrder) || 0}" /></label>
            <label class="module-management-form-wide">Description <textarea id="moduleFormDescription" placeholder="Module description">${escapeHtml(module.description || "")}</textarea></label>
            <label class="module-management-checkline"><input id="moduleFormEnabled" type="checkbox" ${module.enabled === false ? "" : "checked"} /> Enabled</label>
            <label class="module-management-checkline"><input id="moduleFormSidebarVisible" type="checkbox" ${module.sidebarVisible === false ? "" : "checked"} /> Show In Sidebar</label>
        </div>
    `;
}

function showCreateModuleUi() {
    openModal(
        "Create Module",
        renderModuleManagementUiForm({ sortOrder: 0, enabled: true, sidebarVisible: true }),
        async () => {
            await submitModuleManagementForm();
        },
        "Create"
    );
}

function showEditModuleUi(moduleKey) {
    const module = getModuleManagementModule(moduleKey);
    if (!module) return;
    openModal(
        `Edit ${module.label}`,
        renderModuleManagementUiForm(module),
        async () => {
            await submitModuleManagementForm(module.id);
        },
        "Save"
    );
}

function readModuleManagementForm(existingKey = "") {
    const label = document.getElementById("moduleFormLabel")?.value.trim() || "";
    const moduleKey = existingKey || slugifyModuleId(document.getElementById("moduleFormKey")?.value || label);
    if (!label || !moduleKey) {
        alert("Module name and key are required.");
        return null;
    }
    return {
        moduleKey,
        label,
        icon: document.getElementById("moduleFormIcon")?.value.trim() || "",
        category: document.getElementById("moduleFormCategory")?.value || "system",
        access: document.getElementById("moduleFormAccess")?.value === "management" ? "management" : "all",
        description: document.getElementById("moduleFormDescription")?.value.trim() || "",
        enabled: document.getElementById("moduleFormEnabled")?.checked !== false,
        sidebarVisible: document.getElementById("moduleFormSidebarVisible")?.checked !== false,
        sortOrder: Number(document.getElementById("moduleFormSortOrder")?.value) || 0
    };
}

async function submitModuleManagementForm(existingKey = "") {
    const payload = readModuleManagementForm(existingKey);
    if (!payload) return;
    try {
        const result = existingKey
            ? await updateModule(existingKey, payload)
            : await createModule(payload);
        applyModuleManagementResult(result);
        closeModal();
        renderNavigation();
        renderApp();
    } catch (error) {
        alert(error.message || "Unable to save module.");
    }
}

function showModuleDetailsUi(moduleKey) {
    const module = getModuleManagementModule(moduleKey);
    if (!module) return;
    openReadOnlyModal("Module Details", `
        <div class="detail-grid module-management-detail-grid">
            ${renderDetailRow("Module", module.label)}
            ${renderDetailRow("Key", module.id)}
            ${renderDetailRow("Icon", module.icon || "-")}
            ${renderDetailRow("Category", module.category || "-")}
            ${renderDetailRow("Access", module.access === "management" ? "Management Only" : "All Users")}
            ${renderDetailRow("Status", module.enabled === false ? "Disabled" : "Enabled")}
            ${renderDetailRow("Sidebar", module.sidebarVisible === false ? "Hidden" : "Visible")}
            ${renderDetailRow("Type", module.systemModule ? "System" : "Custom")}
            ${renderDetailRow("Fields", String((module.fields || []).length))}
            ${renderDetailRow("Description", module.description || "-")}
        </div>
    `);
}

function handleModuleManagementAction(moduleKey, action) {
    if (!action) return;
    if (action === "view") return showModuleDetailsUi(moduleKey);
    if (action === "edit") return showEditModuleUi(moduleKey);
    if (action === "enable") return toggleModuleEnabled(moduleKey, true);
    if (action === "disable") return toggleModuleEnabled(moduleKey, false);
    if (action === "show") return toggleModuleSidebar(moduleKey, true);
    if (action === "hide") return toggleModuleSidebar(moduleKey, false);
    if (action === "delete") return confirmDeleteModule(moduleKey);
}

async function saveModuleManagementPatch(moduleKey, patch) {
    if (!isSuperadmin) return;
    try {
        const result = await updateDisplayModule(moduleKey, patch);
        applyModuleManagementResult(result);
        renderNavigation();
        renderApp();
    } catch (error) {
        alert(error.message || "Unable to update module.");
        await refreshSuperAdminManagement();
    }
}

function applyModuleManagementResult(result = {}) {
    const modules = (result.modules || []).map((module) => normalizeModuleDefinition(module)).filter(Boolean);
    if (!modules.length) return;
    state.moduleRegistry = modules;
    superAdminStore.customModules = modules;
    superAdminStore.displayModules = Object.fromEntries(modules.map((module) => [module.id, module.enabled !== false && module.sidebarVisible !== false]));
    currentUserPermissions = normalizeUserPermissionSet(currentUserPermissions, currentRole);
}

function confirmDeleteModule(moduleKey) {
    const module = getModuleManagementModule(moduleKey);
    if (!module || PROTECTED_MODULE_IDS.has(module.id)) return;
    openModal(
        "Delete Module",
        `<p>Delete ${escapeHtml(module.label)}? This removes the module from SQLite and from assigned permissions.</p>`,
        async () => {
            try {
                const result = await deleteModule(module.id);
                applyModuleManagementResult(result);
                closeModal();
                renderNavigation();
                renderApp();
            } catch (error) {
                alert(error.message || "Unable to delete module.");
            }
        },
        "Delete"
    );
}

function toggleModuleEnabled(moduleKey, enabled) {
    saveModuleManagementPatch(moduleKey, { enabled });
}

function toggleModuleSidebar(moduleKey, sidebarVisible) {
    saveModuleManagementPatch(moduleKey, { sidebarVisible });
}

function updateModuleSortOrder(moduleKey, value) {
    saveModuleManagementPatch(moduleKey, { sortOrder: Number(value) || 0 });
}

function renderWorkspaceModule(groupId, options = {}) {
    const renderers = {
        employees: renderEmployees,
        schedules: renderSchedules,
        debts: renderDebts,
        expenses: renderExpenses,
        funds: renderFunds,
        reimbursementClaims: renderReimbursementClaims,
        payments: renderPayments,
        bankRental: renderBankRental,
        atmCash: renderAtmCash,
        calendar: renderCalendar
    };
    const tabs = (getWorkspaceModuleGroups()[groupId] || [])
        .map(([id, label]) => [id, label, renderers[id]])
        .filter(([id]) => {
        return canAccessModule(id);
    });
    const active = tabs.some(([id]) => id === activeWorkspaceTab[groupId]) ? activeWorkspaceTab[groupId] : tabs[0]?.[0];
    const activeTab = tabs.find(([id]) => id === active);
    return `
        <div class="workspace-shell">
            <div class="module-header">
                <h2>${t(moduleLabels[groupId] || groupId)}</h2>
            </div>
            <div class="workspace-tabs">
                ${tabs.map(([id, label]) => `<button class="btn ${id === active ? "" : "btn-secondary"}" onclick="setWorkspaceTab('${groupId}','${id}')">${t(label)}</button>`).join("")}
            </div>
            ${activeTab ? activeTab[2]() : `<div class="module"><div class="empty-state">No module selected.</div></div>`}
        </div>
    `;
}

function setWorkspaceTab(groupId, tabId) {
    activeWorkspaceTab[groupId] = tabId;
    renderApp();
}

function getDynamicModuleRecords(moduleId) {
    state.dynamicModuleRecords = state.dynamicModuleRecords || {};
    if (!Array.isArray(state.dynamicModuleRecords[moduleId])) state.dynamicModuleRecords[moduleId] = [];
    return state.dynamicModuleRecords[moduleId];
}

function renderDynamicFieldValue(record, field) {
    if (field.type === "calculated") return calculateDynamicFormula(record, field.formula);
    const value = record?.[field.key];
    if (field.type === "checkbox") return value ? "Yes" : "No";
    if (field.type === "date") return formatExportDate(value);
    if (field.type === "currency") return formatMoney(value);
    if (field.type === "percentage") return value || value === 0 ? `${Number(value) || 0}%` : "-";
    return value || value === 0 ? String(value) : "-";
}

function calculateDynamicFormula(record = {}, formula = "") {
    const expression = String(formula || "").replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (key) => {
        const value = Number(record[key]);
        return Number.isFinite(value) ? String(value) : "0";
    });
    if (!/^[\d\s.+\-*/()]+$/.test(expression)) return "-";
    try {
        const result = Function(`"use strict"; return (${expression});`)();
        return Number.isFinite(result) ? roundMoney(result) : "-";
    } catch (error) {
        return "-";
    }
}

function renderDynamicModule(moduleId) {
    const module = getModuleDefinition(moduleId);
    if (!module || !canAccessModule(module.id)) {
        return `<div class="module"><div class="empty-state">Module unavailable.</div></div>`;
    }
    const records = getDynamicModuleRecords(module.id);
    const visibleRecords = records.filter((record) => canViewDynamicRecord(module, record));
    const moduleData = getPaginatedModuleRecords(`dynamic_${module.id}`, visibleRecords, { skipSelectedUserScope: isSharedDynamicModule(module) });
    const fields = module.fields.length ? module.fields : [{ key: "title", label: "Title", type: "text", required: true }];
    const rows = moduleData.pageRows.map((record) => `
        <tr>
            ${fields.map((field) => `<td>${escapeHtml(renderDynamicFieldValue(record, field))}</td>`).join("")}
            <td>${formatExportDate(record.createdAt)}</td>
            <td class="btn-group">${renderActionMenu(`${t("Actions")} ${module.label}`, [
                canEditDynamicRecord(module, record) ? { label: t("Edit"), action: `showEditDynamicRecordModal('${module.id}','${record.id}')` } : null,
                canDeleteDynamicRecord(module, record) ? { label: t("Delete"), action: `confirmDeleteDynamicRecord('${module.id}','${record.id}')` } : null
            ])}</td>
        </tr>
    `).join("");
    return `
        <div class="module">
            <div class="module-header">
                <h2>${escapeHtml(module.label)}</h2>
                ${canCreateData() ? `<button class="btn" onclick="showAddDynamicRecordModal('${module.id}')">+ ${t("Add")}</button>` : ""}
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr>${fields.map((field) => `<th>${escapeHtml(field.label)}</th>`).join("")}<th>${t("Created Date")}</th><th>${t("Actions")}</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="${fields.length + 2}" class="empty-state">${t("No records to display")}</td></tr>`}</tbody>
                </table>
            </div>
            ${renderPagination(`dynamic_${module.id}`, moduleData.filtered.length, moduleData.totalPages)}
        </div>
    `;
}

function renderDynamicRecordForm(module, record = {}) {
    const fields = module.fields.length ? module.fields : [{ key: "title", label: "Title", type: "text", required: true }];
    return fields.map((field) => {
        const value = record[field.key] ?? "";
        if (field.type === "calculated") return `<label>${escapeHtml(field.label)}<input value="${escapeHtml(renderDynamicFieldValue(record, field))}" disabled /></label>`;
        if (field.type === "textarea") return `<label>${escapeHtml(field.label)}<textarea id="dynamic_${field.key}">${escapeHtml(value)}</textarea></label>`;
        if (field.type === "select") {
            return `<label>${escapeHtml(field.label)}<select id="dynamic_${field.key}">${(field.options || []).map((option) => `<option ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
        }
        if (field.type === "checkbox") return `<label><input id="dynamic_${field.key}" type="checkbox" ${value ? "checked" : ""} /> ${escapeHtml(field.label)}</label>`;
        const inputType = ["number", "currency", "percentage"].includes(field.type) ? "number" : field.type === "date" ? "date" : "text";
        const step = ["currency", "percentage"].includes(field.type) ? ` step="0.01"` : "";
        return `<label>${escapeHtml(field.label)}<input id="dynamic_${field.key}" type="${inputType}"${step} value="${escapeHtml(value)}" ${field.required ? "required" : ""} /></label>`;
    }).join("");
}

function readDynamicRecordForm(module, existing = {}) {
    const fields = module.fields.length ? module.fields : [{ key: "title", label: "Title", type: "text", required: true }];
    const values = { ...existing };
    for (const field of fields) {
        if (field.type === "calculated") continue;
        const element = document.getElementById(`dynamic_${field.key}`);
        const value = field.type === "checkbox" ? Boolean(element?.checked) : String(element?.value || "").trim();
        if (field.required && !value) {
            alert(`${field.label} is required.`);
            return null;
        }
        values[field.key] = ["number", "currency", "percentage"].includes(field.type) ? (Number(value) || 0) : value;
    }
    fields.filter((field) => field.type === "calculated").forEach((field) => {
        values[field.key] = calculateDynamicFormula(values, field.formula);
    });
    return values;
}

function showAddDynamicRecordModal(moduleId) {
    const module = getModuleDefinition(moduleId);
    if (!module || !guardOperation("create", module.label)) return;
    openModal(
        `Add ${module.label}`,
        renderDynamicRecordForm(module),
        () => {
            const values = readDynamicRecordForm(module);
            if (!values) return;
            getDynamicModuleRecords(module.id).push(applyCurrentOwner({ id: generateId(module.id), ...values, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function showEditDynamicRecordModal(moduleId, recordId) {
    const module = getModuleDefinition(moduleId);
    const record = getDynamicModuleRecords(moduleId).find((item) => item.id === recordId);
    if (!module || !record || !canEditDynamicRecord(module, record) || !guardOperation("update", module.label)) return;
    openModal(
        `Edit ${module.label}`,
        renderDynamicRecordForm(module, record),
        () => {
            const values = readDynamicRecordForm(module, record);
            if (!values) return;
            Object.assign(record, values, { updatedAt: new Date().toISOString() });
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function confirmDeleteDynamicRecord(moduleId, recordId) {
    const module = getModuleDefinition(moduleId);
    const record = getDynamicModuleRecords(moduleId).find((item) => item.id === recordId);
    if (!module || !record || !canDeleteDynamicRecord(module, record) || !guardOperation("delete", module.label)) return;
    openModal(
        `Delete ${module.label}`,
        `<p>Delete this ${escapeHtml(module.label)} record?</p>`,
        () => {
            state.dynamicModuleRecords[moduleId] = getDynamicModuleRecords(moduleId).filter((item) => item.id !== recordId);
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Delete"
    );
}

function updateCalendarEventFilter(value) {
    superAdminStore.eventFilter = String(value || "").trim().toLowerCase();
    renderApp();
}

function renderWithOwnerScope(owner, renderer, excludeKeys = [], options = {}) {
    const backups = {};
    OWNED_STATE_ARRAY_KEYS.forEach((key) => {
        backups[key] = state[key];
        state[key] = excludeKeys.includes(key)
            ? []
            : (Array.isArray(state[key]) ? state[key] : []).filter((record) => getRecordOwner(record) === owner);
    });
    backups.dynamicModuleRecords = state.dynamicModuleRecords;
    state.dynamicModuleRecords = Object.fromEntries(Object.entries(state.dynamicModuleRecords || {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.filter((record) => getRecordOwner(record) === owner) : value
    ]));
    if (options.filterBankRental) {
        backups.bankRental = state.bankRental;
        state.bankRental = Object.fromEntries(Object.entries(state.bankRental || {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.filter((record) => getRecordOwner(record) === owner) : value
        ]));
    }
    try {
        return renderer();
    } finally {
        OWNED_STATE_ARRAY_KEYS.forEach((key) => {
            state[key] = backups[key];
        });
        state.dynamicModuleRecords = backups.dynamicModuleRecords;
        if (Object.prototype.hasOwnProperty.call(backups, "bankRental")) {
            state.bankRental = backups.bankRental;
        }
    }
}

function setReportScope(scope) {
    superAdminStore.reportScope = scope === "global" ? "global" : "current";
    renderApp();
}

function renderSettings() {
    if (!canAccessSettings()) {
        return `<div class="module"><div class="module-header"><h2>${t("Settings")}</h2></div><div class="empty-state">You don't have permission to access settings.</div></div>`;
    }

    const categoryRows = state.categories.map((category, idx) => `
        <div class="category-row">
            <span>${escapeHtml(category)}</span>
            ${canDeleteData() ? `<button class="btn btn-danger btn-sm" onclick="deleteCategory(${idx})">${t("Delete")}</button>` : ""}
        </div>
    `).join("");
    const paymentRows = state.paymentTypes.map((type, idx) => `
        <div class="category-row">
            <span>${escapeHtml(type)}</span>
            ${canDeleteData() ? `<button class="btn btn-danger btn-sm" onclick="deletePaymentType(${idx})">${t("Delete")}</button>` : ""}
        </div>
    `).join("");

    return `
        <div class="module">
            <div class="module-header"><h2>${t("Settings")}</h2></div>
            <div class="cards">
                <div class="card">
                    <h4>${t("Dark / Light")}</h4>
                    <button class="btn btn-secondary" onclick="toggleThemeMode()">${t("Dark / Light")}</button>
                </div>
                <div class="card">
                    <h4>Language</h4>
                    <div class="btn-group">
                        <button class="btn btn-secondary" onclick="setLanguage('en')">English</button>
                        <button class="btn btn-secondary" onclick="setLanguage('zh')">中文</button>
                    </div>
                </div>
                <div class="card">
                    <h4>Font Size</h4>
                    <div class="btn-group">
                        <button class="btn btn-secondary" onclick="setAppFontSize('14px')">Normal</button>
                        <button class="btn btn-secondary" onclick="setAppFontSize('16px')">Large</button>
                    </div>
                </div>
                <div class="card">
                    <h4>${t("Logout")}</h4>
                    <button class="btn btn-danger" onclick="logoutCurrentUser()">${t("Logout")}</button>
                </div>
                ${isSuperadmin ? `<div class="card"><h4>${t("Manual Clear Data")}</h4><button class="btn btn-danger" onclick="showManualClearDataModal()">${t("Manual Clear Data")}</button></div>` : ""}
            </div>
            ${isSuperadmin ? `
            <div class="category-row">
                <span>${t("Supported Currency")}</span>
                <span class="badge">${SUPPORTED_CURRENCY}</span>
            </div>
            <hr>
            <div class="module-header"><h2>${t("Global Categories")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddCategoryModal()">+ ${t("Add Category")}</button>` : ""}</div>
            ${categoryRows || `<div class="empty-state">No categories configured yet.</div>`}
            <hr>
            <div class="module-header"><h2>${t("Payment Types")}</h2>${canCreateData() ? `<button class="btn" onclick="showAddPaymentTypeModal()">+ ${t("Add Type")}</button>` : ""}</div>
            ${paymentRows || `<div class="empty-state">No payment types configured yet.</div>`}
            ` : ""}
        </div>
    `;
}

function renderApp() {
    const root = document.getElementById("appRoot");
    if (skipNextRenderScrollCapture) {
        skipNextRenderScrollCapture = false;
    }
    recalculateState();
    if (!modal.classList.contains("show")) detailViewerStore = {};
    if (!canAccessModule(currentView)) {
        currentView = getEffectivePermissions().modules.find((moduleId) => canAccessModule(moduleId)) || "expenses";
        renderNavigation();
    }

    let html = "";
    if (currentView === "dashboard") html = renderDashboard();
    if (currentView === "userManagement") html = renderUserManagement();
    if (currentView === "workforce") html = renderWorkspaceModule("workforce");
    if (currentView === "finance") html = renderWorkspaceModule("finance");
    if (currentView === "assets") html = renderWorkspaceModule("assets");
    if (currentView === "operations") html = renderWorkspaceModule("operations");
    if (currentView === "calendar") html = renderCalendar();
    if (currentView === "employees") html = renderEmployees();
    if (currentView === "schedules") html = renderSchedules();
    if (currentView === "debts") html = renderDebts();
    if (currentView === "expenses") html = renderExpenses();
    if (currentView === "reimbursementClaims") html = renderReimbursementClaims();
    if (currentView === "payments") html = renderPayments();
    if (currentView === "funds") html = renderFunds();
    if (currentView === "atmCash") html = renderAtmCash();
    if (currentView === "bankRental") html = renderBankRental();
    if (currentView === "staffAccess") html = renderUserManagementAccess();
    if (currentView === "displayModules") html = renderDisplayModules();
    if (currentView === "loginAudit") html = renderLoginAudit();
    if (currentView === "reports") html = renderReports();
    if (currentView === "monthlySummary") html = renderMonthlySummary();
    if (currentView === "database") html = renderDatabase();
    if (currentView === "settings") html = renderSettings();
    if (!html && isDynamicModule(currentView)) html = renderDynamicModule(currentView);
    root.innerHTML = html;
    if (currentView === "dashboard") updateDashboardNumbers();
}

function openModal(title, body, onConfirm, confirmText = "Confirm") {
    modalTitle.textContent = t(title);
    modalBody.innerHTML = body;
    modalConfirmBtn.hidden = false;
    modalCancelBtn.hidden = false;
    modalConfirmBtn.textContent = t(confirmText);
    modalCancelBtn.textContent = t("Cancel");
    modal.classList.add("show");
    activeModalCallback = onConfirm;
    activeModalReadOnly = false;
}

function openReadOnlyModal(title, body) {
    openModal(title, body, closeModal, "Close");
    modalCancelBtn.hidden = true;
    activeModalReadOnly = true;
}

function closeModal() {
    modal.classList.remove("show");
    modal.classList.remove("employee-photo-preview-modal");
    modalCancelBtn.hidden = false;
    modalConfirmBtn.hidden = false;
    activeModalCallback = null;
    activeModalReadOnly = false;
}

modalConfirmBtn.addEventListener("click", () => {
    if (activeModalCallback) activeModalCallback();
});
modalCancelBtn.addEventListener("click", closeModal);
modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModalReadOnly && modal.classList.contains("show")) closeModal();
});

function showAddEmployeeModal() {
    if (!guardOperation("create", "employee")) return;
    
    openModal(
        "Add Employee",
        `
            <input id="name" placeholder="Full name" />
            <input id="role" placeholder="Role / position" />
            <input id="department" placeholder="Department" />
            ${isSuperadmin ? `<input id="wages" placeholder="${t("Salary / wages / payment record")}" />` : ""}
            <label>Join Date <input id="joinDate" type="date" /></label>
            <label>Exit Date <input id="exitDate" type="date" /></label>
            <label>Worker Type
                <select id="workerType"><option value="Local">Local</option><option value="Foreign">Foreign</option></select>
            </label>
            <label>Passport Expiry <input id="passportExpiry" type="date" /></label>
            <label>Visa Expiry <input id="visaExpiry" type="date" /></label>
            <label>Permit Expiry <input id="permitExpiry" type="date" /></label>
            <label>Employee Status
                <select id="employeeStatus"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Exited">Exited</option><option value="On Leave">On Leave</option></select>
            </label>
            ${isSuperadmin ? `<label>${t("Employee Photo")} <input id="employeePhoto" type="file" accept="image/*" onchange="updateEmployeePhotoPreview(this)" /></label>
            <img id="employeePhotoPreview" class="employee-photo-preview" alt="Employee photo preview" hidden />` : ""}
            <select id="category">${state.categories.map((cat) => `<option>${escapeHtml(cat)}</option>`).join("")}</select>
        `,
        async () => {
            const name = document.getElementById("name").value.trim();
            const role = document.getElementById("role").value.trim();
            const department = document.getElementById("department").value.trim();
            const wages = isSuperadmin ? document.getElementById("wages")?.value.trim() || "" : "";
            const category = document.getElementById("category").value;
            const lifecycle = {
                join_date: document.getElementById("joinDate")?.value || "",
                exit_date: document.getElementById("exitDate")?.value || "",
                worker_type: document.getElementById("workerType")?.value || "Local",
                passport_expiry: document.getElementById("passportExpiry")?.value || "",
                visa_expiry: document.getElementById("visaExpiry")?.value || "",
                permit_expiry: document.getElementById("permitExpiry")?.value || "",
                employee_status: document.getElementById("employeeStatus")?.value || "Active"
            };
            if (!name || !role || !department) {
                alert("Please complete all employee fields.");
                return;
            }
            const photo = isSuperadmin ? await readImageFileAsDataUrl(document.getElementById("employeePhoto")?.files?.[0]) : "";
            state.employees.push(applyCurrentOwner({ id: generateId("emp"), name, role, department, wages, category, photo, remark: "", ...lifecycle }));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editEmployee(id) {
    if (!guardOperation("update", "employee")) return;
    
    const employee = state.employees.find((item) => item.id === id);
    if (!employee) return;
    openModal(
        "Edit Employee",
        `
            <input id="name" value="${escapeAttribute(employee.name)}" />
            <input id="role" value="${escapeAttribute(employee.role)}" />
            <input id="department" value="${escapeAttribute(employee.department)}" />
            ${isSuperadmin ? `<input id="wages" placeholder="${t("Salary / wages / payment record")}" value="${escapeAttribute(employee.wages || employee.salary || employee.paymentRecord || "")}" />` : ""}
            <label>Join Date <input id="joinDate" type="date" value="${escapeAttribute(employee.join_date || "")}" /></label>
            <label>Exit Date <input id="exitDate" type="date" value="${escapeAttribute(employee.exit_date || "")}" /></label>
            <label>Worker Type
                <select id="workerType"><option value="Local" ${employee.worker_type === "Local" ? "selected" : ""}>Local</option><option value="Foreign" ${employee.worker_type === "Foreign" ? "selected" : ""}>Foreign</option></select>
            </label>
            <label>Passport Expiry <input id="passportExpiry" type="date" value="${escapeAttribute(employee.passport_expiry || "")}" /></label>
            <label>Visa Expiry <input id="visaExpiry" type="date" value="${escapeAttribute(employee.visa_expiry || "")}" /></label>
            <label>Permit Expiry <input id="permitExpiry" type="date" value="${escapeAttribute(employee.permit_expiry || "")}" /></label>
            <label>Employee Status
                <select id="employeeStatus">${["Active", "Inactive", "Exited", "On Leave"].map((status) => `<option value="${status}" ${getEmployeeStatus(employee) === status ? "selected" : ""}>${status}</option>`).join("")}</select>
            </label>
            ${isSuperadmin ? `<label>${t("Employee Photo")} <input id="employeePhoto" type="file" accept="image/*" onchange="updateEmployeePhotoPreview(this)" /></label>
            <img id="employeePhotoPreview" class="employee-photo-preview" src="${escapeAttribute(employee.photo || "")}" alt="Employee photo preview" ${employee.photo ? "" : "hidden"} />` : ""}
            <select id="category">${state.categories.map((cat) => `<option ${employee.category === cat ? "selected" : ""}>${escapeHtml(cat)}</option>`).join("")}</select>
        `,
        async () => {
            employee.name = document.getElementById("name").value.trim();
            employee.role = document.getElementById("role").value.trim();
            employee.department = document.getElementById("department").value.trim();
            if (isSuperadmin) employee.wages = document.getElementById("wages")?.value.trim() || "";
            employee.category = document.getElementById("category").value;
            employee.join_date = document.getElementById("joinDate")?.value || "";
            employee.exit_date = document.getElementById("exitDate")?.value || "";
            employee.worker_type = document.getElementById("workerType")?.value || "Local";
            employee.passport_expiry = document.getElementById("passportExpiry")?.value || "";
            employee.visa_expiry = document.getElementById("visaExpiry")?.value || "";
            employee.permit_expiry = document.getElementById("permitExpiry")?.value || "";
            employee.employee_status = document.getElementById("employeeStatus")?.value || "Active";
            if (!employee.name || !employee.role || !employee.department) {
                alert("Please complete all employee fields.");
                return;
            }
            const nextPhoto = isSuperadmin ? await readImageFileAsDataUrl(document.getElementById("employeePhoto")?.files?.[0]) : "";
            if (nextPhoto) employee.photo = nextPhoto;
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function addRemark(type, id) {
    if (!guardOperation("update", "remark")) return;
    const collection = state[type];
    const item = collection?.find((entry) => entry.id === id);
    const sharedEditable = type === "employees" || type === "schedules";
    if (item && !sharedEditable && !canManageRecord(item)) {
        alert("You can only edit your own records.");
        return;
    }

    openModal(
        "Add Remark",
        `<textarea id="remarkText" rows="4" placeholder="Type a remark"></textarea>`,
        () => {
            const remark = document.getElementById("remarkText").value.trim();
            if (item) {
                item.remark = remark;
                renderApp();
                persistStateChange();
                closeModal();
            }
        },
        "Save"
    );
}

function confirmDelete(type, id) {
    if (!guardOperation("delete", type)) return;
    
    const labels = {
        employee: "employee",
        schedule: "schedule",
        debt: "debt",
        expense: "expense",
        reimbursementClaim: "reimbursement claim",
        claim: "expense",
        payment: "payment",
        fund: "fund account",
        atmCash: "ATM cash record"
    };
    const keys = {
        employee: "employees",
        schedule: "schedules",
        debt: "debts",
        expense: "expenses",
        reimbursementClaim: "reimbursementClaims",
        claim: "expenses",
        payment: "payments",
        fund: "fundAccounts",
        atmCash: "atmCashRecords"
    };
    const key = keys[type];
    const targetRecord = state[key]?.find((item) => item.id === id);
    const sharedDelete = type === "employee" || type === "schedule";
    if (targetRecord && (sharedDelete ? !canDeleteSharedRecord(targetRecord) : !canManageRecord(targetRecord))) {
        alert("You can only delete your own records.");
        return;
    }
    openModal(
        `Delete ${labels[type] || "item"}`,
        `<p>Are you sure you want to remove this ${labels[type] || "item"}? This action cannot be undone.</p>`,
        () => {
            state[key] = state[key].filter((item) => item.id !== id);
            if (type === "fund" || type === "claim" || type === "expense" || type === "reimbursementClaim") recalcFundBalances();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Delete"
    );
}

function showAddScheduleModal() {
    if (!guardOperation("create", "schedule")) return;
    
    openModal(
        "Add Schedule",
        `
            <select id="employeeId">${getContextEmployeeOptions()}</select>
            <input id="startDate" type="date" />
            <input id="endDate" type="date" />
            <select id="leaveType">${LEAVE_TYPES.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}</select>
            <textarea id="reason" placeholder="Reason / 原因"></textarea>
        `,
        () => {
            const employeeId = document.getElementById("employeeId").value;
            const employeeName = getEmployeeName(employeeId);
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            const leaveType = document.getElementById("leaveType").value;
            const reason = document.getElementById("reason").value.trim();
            if (!employeeId || !startDate || !endDate || !leaveType) {
                alert("Please complete all schedule fields.");
                return;
            }
            if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
                alert("End Date cannot be earlier than Start Date.");
                return;
            }
            const now = new Date().toISOString();
            state.schedules.push(applyCurrentOwner({ id: generateId("sch"), employeeId, employeeName, startDate, endDate, leaveType, reason, createdAt: now, updatedAt: now }));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editSchedule(id) {
    if (!guardOperation("update", "schedule")) return;
    
    const schedule = state.schedules.find((item) => item.id === id);
    if (!schedule) return;
    openModal(
        "Edit Schedule",
        `
            <select id="employeeId">${getContextEmployeeOptions(schedule.employeeId)}</select>
            <input id="startDate" type="date" value="${escapeHtml(schedule.startDate || schedule.date || "")}" />
            <input id="endDate" type="date" value="${escapeHtml(schedule.endDate || schedule.date || "")}" />
            <select id="leaveType">${LEAVE_TYPES.map((type) => `<option ${schedule.leaveType === type || schedule.shift === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select>
            <textarea id="reason" placeholder="Reason / 原因">${escapeHtml(schedule.reason || schedule.remark || "")}</textarea>
        `,
        () => {
            schedule.employeeId = document.getElementById("employeeId").value;
            schedule.employeeName = getEmployeeName(schedule.employeeId);
            schedule.startDate = document.getElementById("startDate").value;
            schedule.endDate = document.getElementById("endDate").value;
            schedule.leaveType = document.getElementById("leaveType").value;
            schedule.reason = document.getElementById("reason").value.trim();
            if (!schedule.employeeId || !schedule.startDate || !schedule.endDate || !schedule.leaveType) {
                alert("Please complete all schedule fields.");
                return;
            }
            if (new Date(`${schedule.endDate}T00:00:00`) < new Date(`${schedule.startDate}T00:00:00`)) {
                alert("End Date cannot be earlier than Start Date.");
                return;
            }
            if (!schedule.createdAt) schedule.createdAt = new Date().toISOString();
            schedule.updatedAt = new Date().toISOString();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function showAddDebtModal() {
    if (!guardOperation("create", "debt")) return;
    
    openModal(
        "Record Debt",
        `
            <input id="date" type="date" required />
            <select id="employeeId">${getContextEmployeeOptions()}</select>
            <input id="amount" type="number" placeholder="Amount" />
            <input id="reason" placeholder="Reason" />
        `,
        () => {
            const date = document.getElementById("date").value;
            const employeeId = document.getElementById("employeeId").value;
            const amount = parseFloat(document.getElementById("amount").value);
            const reason = document.getElementById("reason").value.trim();
            if (!date || !employeeId || !amount || !reason) {
                alert("Please complete all debt fields.");
                return;
            }
            state.debts.push(applyCurrentOwner({ id: generateId("debt"), date, employeeId, amount, reason, status: "Outstanding", remark: "" }));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editDebt(id) {
    if (!guardOperation("update", "debt")) return;
    
    const debt = state.debts.find((item) => item.id === id);
    if (!debt) return;
    if (!canManageRecord(debt)) {
        alert("You can only edit your own debt records.");
        return;
    }
    openModal(
        "Edit Debt",
        `
            <select id="employeeId">${getContextEmployeeOptions(debt.employeeId)}</select>
            <input id="date" type="date" value="${escapeHtml(debt.date || "")}" />
            <input id="amount" type="number" value="${debt.amount}" />
            <input id="reason" value="${escapeHtml(debt.reason)}" />
            <select id="status">
                <option ${debt.status === "Outstanding" ? "selected" : ""}>Outstanding</option>
                <option ${debt.status === "Resolved" ? "selected" : ""}>Resolved</option>
            </select>
        `,
        () => {
            debt.employeeId = document.getElementById("employeeId").value;
            debt.date = document.getElementById("date").value;
            debt.amount = parseFloat(document.getElementById("amount").value);
            debt.reason = document.getElementById("reason").value.trim();
            debt.status = document.getElementById("status").value;
            if (!debt.date || !debt.employeeId || !debt.amount || !debt.reason) {
                alert("Please complete all debt fields.");
                return;
            }
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function markDebtResolved(id) {
    if (!guardOperation("update", "debt")) return;
    
    const debt = state.debts.find((item) => item.id === id);
    if (debt && !canManageRecord(debt)) {
        alert("You can only edit your own debt records.");
        return;
    }
    if (debt) {
        debt.status = debt.status === "Resolved" ? "Outstanding" : "Resolved";
        renderApp();
        persistStateChange();
    }
}

function showAddExpenseModal() {
    if (!guardOperation("create", "expense")) return;
    
    openModal(
        "Add Expense",
        `
            <input id="date" type="date" required />
            <input id="type" placeholder="Type" />
            <select id="category">${EXPENSE_CATEGORIES.map((cat) => `<option>${escapeHtml(cat)}</option>`).join("")}</select>
            <input id="amount" type="number" placeholder="Amount" />
            <input id="description" placeholder="Description" />
            <input id="paymentMethod" placeholder="Payment method" />
            <textarea id="notes" placeholder="Notes"></textarea>
        `,
        () => {
            const date = document.getElementById("date").value;
            const type = document.getElementById("type").value.trim();
            const category = document.getElementById("category").value;
            const amount = parseFloat(document.getElementById("amount").value);
            const description = document.getElementById("description").value.trim();
            const paymentMethod = document.getElementById("paymentMethod").value.trim();
            const notes = document.getElementById("notes").value.trim();
            if (!date || !amount) {
                alert("Please enter expense date and amount.");
                return;
            }
            state.expenses.push(applyCurrentOwner({ id: generateId("exp"), date, type, category, amount, description, paymentMethod, notes }));
            recalcFundBalances();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editExpense(id) {
    if (!guardOperation("update", "expense")) return;
    
    const expense = state.expenses.find((item) => item.id === id);
    if (!expense) return;
    if (!canManageRecord(expense)) {
        alert("You can only edit your own expense records.");
        return;
    }
    openModal(
        "Edit Expense",
        `
            <input id="date" type="date" value="${escapeHtml(expense.date || "")}" />
            <input id="type" value="${escapeHtml(expense.type || "")}" />
            <select id="category">${EXPENSE_CATEGORIES.map((cat) => `<option ${expense.category === cat ? "selected" : ""}>${escapeHtml(cat)}</option>`).join("")}</select>
            <input id="amount" type="number" value="${expense.amount}" />
            <input id="description" value="${escapeHtml(expense.description || "")}" />
            <input id="paymentMethod" value="${escapeHtml(expense.paymentMethod || "")}" />
            <textarea id="notes">${escapeHtml(expense.notes || expense.remark || "")}</textarea>
        `,
        () => {
            expense.date = document.getElementById("date").value;
            expense.type = document.getElementById("type").value.trim();
            expense.category = document.getElementById("category").value;
            expense.amount = parseFloat(document.getElementById("amount").value);
            expense.description = document.getElementById("description").value.trim();
            expense.paymentMethod = document.getElementById("paymentMethod").value.trim();
            expense.notes = document.getElementById("notes").value.trim();
            if (!expense.date || !expense.amount) {
                alert("Please enter expense date and amount.");
                return;
            }
            recalcFundBalances();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function showAddClaimModal() {
    showAddExpenseModal();
}

function editClaim(id) {
    editExpense(id);
}

function updateClaimStatus() {
    alert("Expense records do not use approval status. Use Reimbursement Claims for claim approval.");
}

function showAddReimbursementClaimModal() {
    if (!guardOperation("create", "reimbursement claim")) return;
    const managementMode = isSuperadmin;

    openModal(
        "Add Reimbursement Claim",
        `
            <input id="date" type="date" required />
            ${managementMode ? `<select id="workerId">${getOwnerOptions(getSelectedUserContext() || superAdminStore.selectedRegisteredId || currentRegisteredId)}</select>` : ""}
            <input id="amount" type="number" placeholder="Amount" />
            <textarea id="description" rows="4" data-autoresize="true" placeholder="Description"></textarea>
            <label>${t("Source of Funds / Remark")}
                <textarea id="remark" rows="4" maxlength="500" data-autoresize="true" placeholder="Example:&#10;- Petty Cash from Office&#10;- Cash Advance from Manager&#10;- Personal Payment Reimbursement&#10;- Bank Transfer to Supplier"></textarea>
            </label>
            ${managementMode ? `<select id="status">
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Paid</option>
            </select>` : ""}
        `,
        () => {
            const date = document.getElementById("date").value;
            const workerId = managementMode ? document.getElementById("workerId").value : currentRegisteredId;
            const ownerId = String(workerId || currentRegisteredId || "").trim().toLowerCase();
            const amount = parseFloat(document.getElementById("amount").value);
            const description = document.getElementById("description").value.trim();
            const remark = document.getElementById("remark").value.trim();
            const status = managementMode ? document.getElementById("status").value : "Pending";
            if (remark.length > 500) {
                alert("Source of Funds / Remark must be 500 characters or less.");
                return;
            }
            if (!date || !amount) {
                alert("Please enter claim date and amount.");
                return;
            }
            state.reimbursementClaims.push(applyOwnerToRecord({ id: generateId("rclm"), date, workerId: ownerId, amount, description, remark, status }, ownerId));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editReimbursementClaim(id) {
    if (!guardOperation("update", "reimbursement claim")) return;

    const claim = state.reimbursementClaims.find((item) => item.id === id);
    if (!claim) return;
    if (!canManageRecord(claim)) {
        alert("You can only edit your own reimbursement claims.");
        return;
    }
    const managementMode = isSuperadmin;
    const claimOwner = getReimbursementClaimOwner(claim) || currentRegisteredId;
    openModal(
        "Edit Reimbursement Claim",
        `
            <input id="date" type="date" value="${escapeHtml(claim.date || "")}" />
            ${managementMode ? `<select id="workerId">${getOwnerOptions(claimOwner)}</select>` : ""}
            <input id="amount" type="number" value="${claim.amount || 0}" />
            <textarea id="description" rows="4" data-autoresize="true" placeholder="Description">${escapeHtml(claim.description || "")}</textarea>
            <label>${t("Source of Funds / Remark")}
                <textarea id="remark" rows="4" maxlength="500" data-autoresize="true" placeholder="Example:&#10;- Petty Cash from Office&#10;- Cash Advance from Manager&#10;- Personal Payment Reimbursement&#10;- Bank Transfer to Supplier">${escapeHtml(claim.remark || "")}</textarea>
            </label>
            ${managementMode ? `<select id="status">
                <option ${claim.status === "Pending" ? "selected" : ""}>Pending</option>
                <option ${claim.status === "Approved" ? "selected" : ""}>Approved</option>
                <option ${claim.status === "Rejected" ? "selected" : ""}>Rejected</option>
                <option ${claim.status === "Paid" ? "selected" : ""}>Paid</option>
            </select>` : ""}
        `,
        () => {
            claim.date = document.getElementById("date").value;
            claim.workerId = managementMode ? document.getElementById("workerId").value : (claim.workerId || claim.employeeId || currentRegisteredId);
            claim.amount = parseFloat(document.getElementById("amount").value);
            claim.description = document.getElementById("description").value.trim();
            claim.remark = document.getElementById("remark").value.trim();
            claim.status = managementMode ? document.getElementById("status").value : (claim.status || "Pending");
            if (claim.remark.length > 500) {
                alert("Source of Funds / Remark must be 500 characters or less.");
                return;
            }
            if (!claim.date || !claim.amount) {
                alert("Please enter claim date and amount.");
                return;
            }
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function showAddPaymentModal() {
    if (!guardOperation("create", "payment")) return;
    
    openModal(
        "Add Payment",
        `
            <input id="date" type="date" required />
            <input id="recipient" placeholder="Recipient" />
            <input id="amount" type="number" placeholder="Amount" />
            <textarea id="description" placeholder="Description"></textarea>
            <select id="type">${state.paymentTypes.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}</select>
        `,
        () => {
            const date = document.getElementById("date").value;
            const recipient = document.getElementById("recipient").value.trim();
            const amount = parseFloat(document.getElementById("amount").value);
            const description = document.getElementById("description").value.trim();
            const type = document.getElementById("type").value;
            if (!date || !recipient || !amount || !description) {
                alert("Please complete all payment fields.");
                return;
            }
            state.payments.push(applyCurrentOwner({ id: generateId("pay"), date, recipient, amount, description, status: "Pending", type, remark: "" }));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function showAddFundModal() {
    if (!guardOperation("create", "fund")) return;
    
    openModal(
        "Add Fund Account",
        `
            <input id="fundDate" type="date" required />
            <input id="fundName" placeholder="Fund name" />
            <input id="fundAmount" type="number" placeholder="Amount" />
        `,
        () => {
            const date = document.getElementById("fundDate").value;
            const name = document.getElementById("fundName").value.trim();
            const amount = parseFloat(document.getElementById("fundAmount").value);
            if (!date || !name || isNaN(amount)) {
                alert("Please enter both fund name and amount.");
                return;
            }
            state.fundAccounts.push(applyCurrentOwner({ id: generateId("fund"), date, name, initialBalance: amount, currentBalance: amount, remark: "" }));
            recalcFundBalances();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editFund(id) {
    if (!guardOperation("update", "fund")) return;
    
    const fund = state.fundAccounts.find((item) => item.id === id);
    if (!fund) return;
    if (!canManageRecord(fund)) {
        alert("You can only edit your own fund records.");
        return;
    }
    openModal(
        "Edit Fund Account",
        `
            <input id="fundName" value="${escapeHtml(fund.name)}" />
            <input id="fundDate" type="date" value="${escapeHtml(fund.date || "")}" />
            <input id="fundAmount" type="number" value="${fund.initialBalance}" />
        `,
        () => {
            const name = document.getElementById("fundName").value.trim();
            const date = document.getElementById("fundDate").value;
            const amount = parseFloat(document.getElementById("fundAmount").value);
            if (!date || !name || isNaN(amount)) {
                alert("Please enter both fund name and amount.");
                return;
            }
            fund.name = name;
            fund.date = date;
            fund.initialBalance = amount;
            fund.currentBalance = amount;
            recalcFundBalances();
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function readAtmCashForm() {
    const date = document.getElementById("atmCashDate").value;
    const fundIn = roundMoney(parseFloat(document.getElementById("atmCashFundIn").value) || 0);
    const fundOut = roundMoney(parseFloat(document.getElementById("atmCashFundOut").value) || 0);
    const remark = document.getElementById("atmCashRemark").value.trim();

    if (!date) {
        alert("Please enter a date.");
        return null;
    }
    if ((fundIn <= 0 && fundOut <= 0) || (fundIn > 0 && fundOut > 0)) {
        alert("Please enter either Fund In or Fund Out amount.");
        return null;
    }

    return { date, fundIn, fundOut, remark };
}

function showAddAtmCashModal() {
    if (!guardOperation("create", "ATM cash")) return;

    openModal(
        "Add ATM Cash Record",
        `
            <input id="atmCashDate" type="date" required />
            <input id="atmCashFundIn" type="number" min="0" step="0.01" placeholder="${t("Fund In")}" />
            <input id="atmCashFundOut" type="number" min="0" step="0.01" placeholder="${t("Fund Out")}" />
            <textarea id="atmCashRemark" placeholder="${t("Remark")}"></textarea>
        `,
        () => {
            const values = readAtmCashForm();
            if (!values) return;
            const owner = String(currentRegisteredId || "").trim().toLowerCase();
            state.atmCashRecords.push(applyCurrentOwner({
                id: generateId("atm"),
                ...values,
                owner_id: owner,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Save"
    );
}

function editAtmCashRecord(id) {
    if (!guardOperation("update", "ATM cash")) return;

    const record = state.atmCashRecords.find((item) => item.id === id);
    if (!record) return;
    if (!canManageRecord(record)) {
        alert("You can only edit your own ATM Cash records.");
        return;
    }
    openModal(
        "Edit ATM Cash Record",
        `
            <input id="atmCashDate" type="date" value="${escapeHtml(record.date || "")}" required />
            <input id="atmCashFundIn" type="number" min="0" step="0.01" value="${record.fundIn || ""}" placeholder="${t("Fund In")}" />
            <input id="atmCashFundOut" type="number" min="0" step="0.01" value="${record.fundOut || ""}" placeholder="${t("Fund Out")}" />
            <textarea id="atmCashRemark" placeholder="${t("Remark")}">${escapeHtml(record.remark || "")}</textarea>
        `,
        () => {
            const values = readAtmCashForm();
            if (!values) return;
            Object.assign(record, values, { updatedAt: new Date().toISOString() });
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function editPayment(id) {
    if (!guardOperation("update", "payment")) return;
    
    const payment = state.payments.find((item) => item.id === id);
    if (!payment) return;
    openModal(
        "Edit Payment",
        `
            <input id="recipient" value="${escapeHtml(payment.recipient)}" />
            <input id="date" type="date" value="${escapeHtml(payment.date || "")}" />
            <input id="amount" type="number" value="${payment.amount}" />
            <textarea id="description">${escapeHtml(payment.description)}</textarea>
            <select id="type">${state.paymentTypes.map((type) => `<option ${payment.type === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select>
            <select id="status">
                <option ${payment.status === "Pending" ? "selected" : ""}>Pending</option>
                <option ${payment.status === "Approved" ? "selected" : ""}>Approved</option>
                <option ${payment.status === "Paid" ? "selected" : ""}>Paid</option>
                <option ${payment.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
        `,
        () => {
            payment.recipient = document.getElementById("recipient").value.trim();
            payment.date = document.getElementById("date").value;
            payment.amount = parseFloat(document.getElementById("amount").value);
            payment.description = document.getElementById("description").value.trim();
            payment.type = document.getElementById("type").value;
            payment.status = document.getElementById("status").value;
            if (!payment.date || !payment.recipient || !payment.amount || !payment.description) {
                alert("Please complete all payment fields.");
                return;
            }
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Update"
    );
}

function updatePaymentStatus(id) {
    if (!guardOperation("update", "payment")) return;
    
    const payment = state.payments.find((item) => item.id === id);
    if (!payment) return;
    if (payment.status === "Pending") payment.status = "Approved";
    else if (payment.status === "Approved") payment.status = "Paid";
    else if (payment.status === "Paid") payment.status = "Cancelled";
    else payment.status = "Pending";
    renderApp();
    persistStateChange();
}

function deleteCategory(index) {
    if (!guardOperation("delete", "category")) return;
    state.categories.splice(index, 1);
    renderApp();
    persistStateChange();
}

function showAddCategoryModal() {
    if (!guardOperation("create", "category")) return;
    
    openModal(
        "Add Category",
        `<input id="categoryName" placeholder="Category name" />`,
        () => {
            const categoryName = document.getElementById("categoryName").value.trim();
            if (!categoryName) {
                alert("Please enter a category name.");
                return;
            }
            if (!state.categories.includes(categoryName)) {
                state.categories.push(categoryName);
            }
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Add"
    );
}

function deletePaymentType(index) {
    if (!guardOperation("delete", "type")) return;
    state.paymentTypes.splice(index, 1);
    renderApp();
    persistStateChange();
}

function showAddPaymentTypeModal() {
    if (!guardOperation("create", "type")) return;
    
    openModal(
        "Add Payment Type",
        `<input id="paymentTypeName" placeholder="Payment type" />`,
        () => {
            const paymentTypeName = document.getElementById("paymentTypeName").value.trim();
            if (!paymentTypeName) {
                alert("Please enter a payment type.");
                return;
            }
            if (!state.paymentTypes.includes(paymentTypeName)) {
                state.paymentTypes.push(paymentTypeName);
            }
            renderApp();
            persistStateChange();
            closeModal();
        },
        "Add"
    );
}

function initTheme() {
    document.getElementById("darkModeToggle")?.addEventListener("click", toggleThemeMode);
}

function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach((button) => {
        button.addEventListener("click", () => {
            captureScrollContext();
            currentView = button.dataset.view;
            skipNextRenderScrollCapture = true;
            setActiveNav();
            renderApp();
        });
    });
}

async function init() {
    const expectsSuperadmin = pageAccess === "super";
    const session = await requireAdmin(expectsSuperadmin ? "owner" : "user");
    if (!session) return;
    isSuperadmin = Boolean(session.isSuperadmin);
    currentRole = isSuperadmin ? "super" : (session.user?.accountRole === "admin" || session.user?.role === "admin" ? "admin" : "user");
    currentUserPermissions = normalizeUserPermissionSet(session.user?.permissions, currentRole);
    currentRegisteredId = String(session.user?.email || session.user?.registeredId || "").trim().toLowerCase();
    if (expectsSuperadmin && !isSuperadmin) {
        location.href = "index.html";
        return;
    }
    restoreUiContext();
    
    await loadState();
    recalcFundBalances();
    initTheme();
    initMobileDrawer();
    document.getElementById("langEnglishBtn")?.addEventListener("click", () => setLanguage("en"));
    document.getElementById("langChineseBtn")?.addEventListener("click", () => setLanguage("zh"));
    applyLanguageChrome();
    updateRoleIndicator();
    subscribeToState();
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn && currentRegisteredId) {
        logoutBtn.addEventListener("click", async () => {
            clearSelectedUserContext();
            await logoutAdmin();
            location.href = "index.html";
        });
    }
    const manualClearDataBtn = document.getElementById("manualClearDataBtn");
    if (manualClearDataBtn) {
        manualClearDataBtn.hidden = !isSuperadmin;
        manualClearDataBtn.disabled = !isSuperadmin;
        if (isSuperadmin) {
            manualClearDataBtn.addEventListener("click", showManualClearDataModal);
        }
    }
    const exportBtn = document.getElementById("exportJsonBtn");
    if (exportBtn) {
        exportBtn.hidden = !canExportData();
        exportBtn.addEventListener("click", exportPdf);
    }
    if (isSuperadmin) {
        try {
            const [users, authLogs, displayModuleData, customAccess, roleTemplates] = await Promise.all([listUsers(), listAuthLogs(), getDisplayModules(), getCustomModuleAccess(), getRoleTemplates()]);
            const registryModules = (displayModuleData.modules || customAccess.modules || []).map((module) => normalizeModuleDefinition(module)).filter(Boolean);
            superAdminStore = {
                ...superAdminStore,
                users,
                authLogs,
                displayModules: displayModuleData.displayModules || {},
                customModules: registryModules,
                userAccess: customAccess.access,
                roleTemplates,
                loaded: true
            };
            if (registryModules.length) state.moduleRegistry = registryModules;
            clearSelectedUserContext();
            await restoreSuperAdminSelectionContext();
        } catch (error) {
            console.warn("Unable to preload management tools.", error);
        }
        if (authLogRefreshTimer) window.clearInterval(authLogRefreshTimer);
        authLogRefreshTimer = window.setInterval(() => refreshSuperAdminManagement(false), 30000);
    }
    await refreshReportHistory(false);
    if (!canAccessModule(currentView)) currentView = getEffectivePermissions().modules[0] || "expenses";
    renderNavigation();
    renderApp();
}

window.showAddEmployeeModal = showAddEmployeeModal;
window.editEmployee = editEmployee;
window.updateEmployeePhotoPreview = updateEmployeePhotoPreview;
window.previewEmployeePhoto = previewEmployeePhoto;
window.uploadEmployeePhotoFromCard = uploadEmployeePhotoFromCard;
window.removeEmployeePhoto = removeEmployeePhoto;
window.handleEmployeePhotoError = handleEmployeePhotoError;
window.viewEmployeeDetail = viewEmployeeDetail;
window.confirmDelete = confirmDelete;
window.addRemark = addRemark;
window.showAddScheduleModal = showAddScheduleModal;
window.editSchedule = editSchedule;
window.showAddDebtModal = showAddDebtModal;
window.editDebt = editDebt;
window.markDebtResolved = markDebtResolved;
window.showAddClaimModal = showAddClaimModal;
window.editClaim = editClaim;
window.updateClaimStatus = updateClaimStatus;
window.showAddExpenseModal = showAddExpenseModal;
window.editExpense = editExpense;
window.showAddReimbursementClaimModal = showAddReimbursementClaimModal;
window.editReimbursementClaim = editReimbursementClaim;
window.viewReimbursementClaimDetail = viewReimbursementClaimDetail;
window.showAddPaymentModal = showAddPaymentModal;
window.viewPaymentDetail = viewPaymentDetail;
window.viewTableDetail = viewTableDetail;
window.handleRowActionMenu = handleRowActionMenu;
window.editPayment = editPayment;
window.updatePaymentStatus = updatePaymentStatus;
window.showAddFundModal = showAddFundModal;
window.editFund = editFund;
window.showAddAtmCashModal = showAddAtmCashModal;
window.editAtmCashRecord = editAtmCashRecord;
window.setBankRentalTab = setBankRentalTab;
window.updateBankRentalSearch = updateBankRentalSearch;
window.updateBankRentalSavedBankSearch = updateBankRentalSavedBankSearch;
window.updateBankRentalSort = updateBankRentalSort;
window.selectBankRentalExistingRecord = selectBankRentalExistingRecord;
window.applySavedBankToBankRentalForm = applySavedBankToBankRentalForm;
window.filterBankRentalSavedBankSelect = filterBankRentalSavedBankSelect;
window.showAddBankRentalModal = showAddBankRentalModal;
window.showAddBankRentalBlockModal = showAddBankRentalBlockModal;
window.editBankRentalRecord = editBankRentalRecord;
window.editBankRentalBlockRecord = editBankRentalBlockRecord;
window.confirmDeleteBankRentalRecord = confirmDeleteBankRentalRecord;
window.addBankRentalRemark = addBankRentalRemark;
window.viewBankRentalRecord = viewBankRentalRecord;
window.viewBankRentalDetail = viewBankRentalDetail;
window.printBankRentalTab = printBankRentalTab;
window.updateDatabaseFilter = updateDatabaseFilter;
window.resetDatabaseFilter = resetDatabaseFilter;
window.updateModuleFilter = updateModuleFilter;
window.updateModuleSort = updateModuleSort;
window.exportPdf = exportPdf;
window.toggleReportRow = toggleReportRow;
window.toggleVisibleReportRows = toggleVisibleReportRows;
window.deleteCategory = deleteCategory;
window.showAddCategoryModal = showAddCategoryModal;
window.deletePaymentType = deletePaymentType;
window.showAddPaymentTypeModal = showAddPaymentTypeModal;
window.runMonthlyClosing = runMonthlyClosing;
window.showManualClearDataModal = showManualClearDataModal;
window.refreshSuperAdminManagement = refreshSuperAdminManagement;
window.updateModuleManagementFilter = updateModuleManagementFilter;
window.showCreateModuleUi = showCreateModuleUi;
window.showEditModuleUi = showEditModuleUi;
window.showModuleDetailsUi = showModuleDetailsUi;
window.handleModuleManagementAction = handleModuleManagementAction;
window.toggleModuleEnabled = toggleModuleEnabled;
window.toggleModuleSidebar = toggleModuleSidebar;
window.updateModuleSortOrder = updateModuleSortOrder;
window.clearLoginAudit = clearLoginAudit;
window.setUserManagementSection = setUserManagementSection;
window.updateUserManagementSearch = updateUserManagementSearch;
window.updateUserManagementFilter = updateUserManagementFilter;
window.openUserManagementProfile = openUserManagementProfile;
window.openUserDataView = openUserDataView;
window.openUserDataViewByOwner = openUserDataViewByOwner;
window.openUserManagementAccess = openUserManagementAccess;
window.openStaffAccessModule = openStaffAccessModule;
window.showEditManagementUserModal = showEditManagementUserModal;
window.showResetManagementUserPasswordModal = showResetManagementUserPasswordModal;
window.setManagementUserStatus = setManagementUserStatus;
window.confirmDeleteManagementUser = confirmDeleteManagementUser;
window.submitManagementCreateUser = submitManagementCreateUser;
window.updateStaffAccessRole = updateStaffAccessRole;
window.setStaffAccessRoleTemplate = setStaffAccessRoleTemplate;
window.updateStaffRoleTemplate = updateStaffRoleTemplate;
window.saveStaffRoleTemplate = saveStaffRoleTemplate;
window.setReportScope = setReportScope;
window.updateReportUser = updateReportUser;
window.updateReportModule = updateReportModule;
window.updateReportFilter = updateReportFilter;
window.setWorkspaceTab = setWorkspaceTab;
window.showAddDynamicRecordModal = showAddDynamicRecordModal;
window.showEditDynamicRecordModal = showEditDynamicRecordModal;
window.confirmDeleteDynamicRecord = confirmDeleteDynamicRecord;
window.updateCalendarEventFilter = updateCalendarEventFilter;
window.setSelectedUserContext = setSelectedUserContext;
window.updateSuperAdminUserContextSearch = updateSuperAdminUserContextSearch;
window.setDashboardScope = setDashboardScope;
window.showAddCalendarEventModal = showAddCalendarEventModal;
window.editCalendarEvent = editCalendarEvent;
window.confirmDeleteCalendarEvent = confirmDeleteCalendarEvent;
window.toggleThemeMode = toggleThemeMode;
window.setLanguage = setLanguage;
window.setAppFontSize = setAppFontSize;
window.logoutCurrentUser = logoutCurrentUser;
window.setRole = setRole;
window.getRole = getRole;
window.canCreateData = canCreateData;
window.canEditData = canEditData;
window.canDeleteData = canDeleteData;
window.canAccessDatabase = canAccessDatabase;
window.canAccessSettings = canAccessSettings;

init();
