(function initWorkspaceConfig(root) {
    const SYSTEM_MODULE_REGISTRY = [
        { module_key: 'dashboard', module_name: 'Dashboard', icon: 'LayoutDashboard', sidebar_visible: true, sort_order: 10, enabled: true, system_module: true, category: 'dashboard', access: 'all', fields: [] },
        { module_key: 'workforce', module_name: 'Workforce', icon: 'Users', sidebar_visible: true, sort_order: 20, enabled: true, system_module: true, category: 'workforce', access: 'all', fields: [] },
        { module_key: 'employees', module_name: 'Employees', icon: 'UserRound', sidebar_visible: false, sort_order: 30, enabled: true, system_module: true, category: 'workforce', access: 'all', fields: [] },
        { module_key: 'schedules', module_name: 'Schedules', icon: 'CalendarDays', sidebar_visible: false, sort_order: 40, enabled: true, system_module: true, category: 'workforce', access: 'all', fields: [] },
        { module_key: 'finance', module_name: 'Finance', icon: 'Wallet', sidebar_visible: true, sort_order: 50, enabled: true, system_module: true, category: 'finance', access: 'all', fields: [] },
        { module_key: 'debts', module_name: 'Debt Tracking', icon: 'ReceiptText', sidebar_visible: false, sort_order: 60, enabled: true, system_module: true, category: 'finance', access: 'management', fields: [] },
        { module_key: 'expenses', module_name: 'Expenses', icon: 'Receipt', sidebar_visible: false, sort_order: 70, enabled: true, system_module: true, category: 'finance', access: 'all', fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'type', label: 'Type', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'amount', label: 'Amount', type: 'number' },
            { key: 'description', label: 'Description', type: 'textarea' }
        ] },
        { module_key: 'funds', module_name: 'Funds', icon: 'PiggyBank', sidebar_visible: false, sort_order: 80, enabled: true, system_module: true, category: 'finance', access: 'all', fields: [] },
        { module_key: 'reimbursementClaims', module_name: 'Reimbursement Claims', icon: 'BadgeDollarSign', sidebar_visible: false, sort_order: 90, enabled: true, system_module: true, category: 'finance', access: 'all', fields: [] },
        { module_key: 'assets', module_name: 'Assets', icon: 'BriefcaseBusiness', sidebar_visible: true, sort_order: 100, enabled: true, system_module: true, category: 'assets', access: 'all', fields: [] },
        { module_key: 'payments', module_name: 'Company Payments', icon: 'CreditCard', sidebar_visible: false, sort_order: 110, enabled: true, system_module: true, category: 'assets', access: 'all', fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'recipient', label: 'Recipient', type: 'text', required: true },
            { key: 'amount', label: 'Amount', type: 'number' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'type', label: 'Type', type: 'text' },
            { key: 'status', label: 'Status', type: 'text' }
        ] },
        { module_key: 'bankRental', module_name: 'Bank Rental', icon: 'Landmark', sidebar_visible: true, sort_order: 120, enabled: true, system_module: true, category: 'bankRental', access: 'all', fields: [] },
        { module_key: 'operations', module_name: 'Operations', icon: 'Cog', sidebar_visible: true, sort_order: 130, enabled: true, system_module: true, category: 'operations', access: 'all', fields: [] },
        { module_key: 'atmCash', module_name: 'ATM Cash', icon: 'Banknote', sidebar_visible: false, sort_order: 140, enabled: true, system_module: true, category: 'operations', access: 'all', fields: [] },
        { module_key: 'calendar', module_name: 'Calendar', icon: 'Calendar', sidebar_visible: true, sort_order: 150, enabled: true, system_module: true, category: 'calendar', access: 'all', fields: [] },
        { module_key: 'announcements', module_name: 'Announcements', icon: 'Megaphone', sidebar_visible: false, sort_order: 155, enabled: true, system_module: true, category: 'calendar', access: 'all', fields: [] },
        { module_key: 'reports', module_name: 'Reports', icon: 'ChartNoAxesColumn', sidebar_visible: true, sort_order: 160, enabled: true, system_module: true, category: 'reports', access: 'all', fields: [] },
        { module_key: 'settings', module_name: 'Settings', icon: 'Settings', sidebar_visible: true, sort_order: 170, enabled: true, system_module: true, category: 'system', access: 'all', fields: [] },
        { module_key: 'userManagement', module_name: 'User Management', icon: 'ShieldUser', sidebar_visible: true, sort_order: 180, enabled: true, system_module: true, category: 'system', access: 'management', fields: [] },
        { module_key: 'staffAccess', module_name: 'Staff Access', icon: 'KeyRound', sidebar_visible: true, sort_order: 190, enabled: true, system_module: true, category: 'system', access: 'management', fields: [] },
        { module_key: 'displayModules', module_name: 'Module Management', icon: 'PanelsTopLeft', sidebar_visible: true, sort_order: 200, enabled: true, system_module: true, category: 'system', access: 'management', fields: [] },
        { module_key: 'loginAudit', module_name: 'Login Audit', icon: 'FileClock', sidebar_visible: true, sort_order: 210, enabled: true, system_module: true, category: 'system', access: 'management', fields: [] }
    ];

    SYSTEM_MODULE_REGISTRY.forEach((module) => {
        module.id = module.module_key;
        module.label = module.module_name;
        module.builtIn = module.system_module;
    });

    const WORKSPACE_NAVIGATION = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'userManagement', label: 'User Management' },
        { id: 'workforce', label: 'Workforce' },
        { id: 'finance', label: 'Finance' },
        { id: 'assets', label: 'Assets' },
        { id: 'bankRental', label: 'Bank Rental' },
        { id: 'operations', label: 'Operations' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'reports', label: 'Reports' },
        { id: 'settings', label: 'Settings' },
        { id: 'staffAccess', label: 'Staff Access' },
        { id: 'displayModules', label: 'Module Management' },
        { id: 'loginAudit', label: 'Login Audit' }
    ];

    const WORKSPACE_GROUPS = WORKSPACE_NAVIGATION.reduce((groups, navModule) => {
        const children = SYSTEM_MODULE_REGISTRY
            .filter((module) => module.category === navModule.id && module.id !== navModule.id)
            .map((module) => [module.id, module.label]);
        if (children.length) groups[navModule.id] = children;
        return groups;
    }, {});

    const MANAGEMENT_ONLY_MODULE_IDS = new Set(['userManagement', 'staffAccess', 'displayModules', 'loginAudit']);

    function isManagementModule(moduleId) {
        return MANAGEMENT_ONLY_MODULE_IDS.has(moduleId);
    }

    function getGroupChildIds(groupId) {
        return (WORKSPACE_GROUPS[groupId] || [])
            .map(([moduleId]) => moduleId)
            .filter((moduleId) => !isManagementModule(moduleId));
    }

    function expandNavigationModules(moduleIds, includeChild) {
        const modules = [];
        const seen = new Set();
        function add(moduleId) {
            if (!moduleId || seen.has(moduleId)) return;
            seen.add(moduleId);
            modules.push(moduleId);
        }
        moduleIds.forEach((moduleId) => {
            add(moduleId);
            if (includeChild) getGroupChildIds(moduleId).forEach(add);
        });
        return modules;
    }

    const USER_NAVIGATION_MODULES = WORKSPACE_NAVIGATION
        .map((module) => module.id)
        .filter((moduleId) => !isManagementModule(moduleId));

    const MANAGEMENT_NAVIGATION_MODULES = WORKSPACE_NAVIGATION
        .map((module) => module.id);

    const USER_WORKSPACE_MODULES = expandNavigationModules(
        USER_NAVIGATION_MODULES,
        true
    );

    const ALL_WORKSPACE_MODULES = expandNavigationModules(
        MANAGEMENT_NAVIGATION_MODULES,
        true
    );

    const MODULE_CLASSIFICATION = {
        user: USER_NAVIGATION_MODULES,
        management: WORKSPACE_NAVIGATION.map((module) => module.id).filter(isManagementModule),
        shared: ['workforce', 'bankRental']
    };

    const config = {
        USER_WORKSPACE_MODULES,
        ALL_WORKSPACE_MODULES,
        SYSTEM_MODULE_REGISTRY,
        WORKSPACE_NAVIGATION,
        WORKSPACE_GROUPS,
        MODULE_CLASSIFICATION
    };

    root.WorkerTrackerWorkspaceConfig = config;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = config;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
