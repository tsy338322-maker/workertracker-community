function normalizeSessionUser(user = {}) {
    const registeredId = user.registeredId || user.email || "";
    return {
        isSuperadmin: Boolean(user.isSuperadmin || user.role === "superadmin"),
        registeredId,
        email: registeredId,
        displayName: user.displayName || user.display_name || "",
        role: user.role || user.accountRole || "user",
        accountRole: user.accountRole || user.role || "user",
        permissions: user.permissions || null
    };
}

function redirectAccountUnavailable(message = "Account unavailable. This account has been removed by administrator.") {
    const url = new URL("index.html", location.href);
    url.searchParams.set("auth", "account_removed");
    url.searchParams.set("message", message);
    location.href = url.toString();
}

export async function signInAdmin(email, password) {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registeredId: email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        throw new Error(data.error || response.statusText || "Login failed.");
    }
    return normalizeSessionUser(data.user);
}

export async function registerViewer(email, password) {
    const response = await fetch("/api/auth/register-viewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registeredId: email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        throw new Error(data.error || response.statusText || "Registration failed.");
    }
    return normalizeSessionUser(data.user);
}

export async function updateDisplayName(displayName) {
    const data = await apiRequest("/api/auth/display-name", {
        method: "POST",
        body: JSON.stringify({ displayName })
    });
    return normalizeSessionUser(data.user);
}

export async function logoutAdmin() {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
        console.warn("Logout API request failed.", error);
    }
}

export async function getCurrentUser() {
    try {
        const response = await fetch("/api/auth/me");
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403 || data.code === "ACCOUNT_REMOVED") {
            if (data.code === "ACCOUNT_REMOVED" || data.code === "ACCOUNT_UNAVAILABLE") {
                redirectAccountUnavailable(data.error || "Account unavailable. This account has been removed by administrator.");
            }
            return null;
        }
        if (response.ok && data.success && data.user?.registeredId) {
            const session = normalizeSessionUser(data.user);
            return {
                user: {
                    email: session.registeredId,
                    registeredId: session.registeredId,
                    displayName: session.displayName || "",
                    role: session.role,
                    accountRole: session.accountRole,
                    permissions: session.permissions || null
                },
                isSuperadmin: session.isSuperadmin
            };
        }
    } catch (error) {
        console.warn("Session check failed.", error);
    }
    return null;
}

export async function requireAdmin(expectedAccess = "user") {
    const session = await getCurrentUser();
    const allowed = expectedAccess === "owner" ? session?.isSuperadmin : Boolean(session);
    if (!allowed) {
        location.href = "index.html";
        return null;
    }
    return session;
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        if (response.status === 401 || data.code === "ACCOUNT_REMOVED" || data.code === "ACCOUNT_UNAVAILABLE") {
            redirectAccountUnavailable(data.error || "Account unavailable. This account has been removed by administrator.");
        }
        throw new Error(data.error || response.statusText || "Request failed.");
    }
    return data;
}

export async function downloadReportPdf(payload = {}) {
    const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || data.code === "ACCOUNT_REMOVED" || data.code === "ACCOUNT_UNAVAILABLE") {
            redirectAccountUnavailable(data.error || "Account unavailable. This account has been removed by administrator.");
        }
        throw new Error(data.error || response.statusText || "Unable to export PDF.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workertracker_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export async function listReportHistory() {
    const data = await apiRequest("/api/reports/history");
    return data.reports || [];
}

export async function listUsers() {
    const data = await apiRequest("/api/superadmin/users");
    return data.users || [];
}

export async function getUserProfile(id) {
    return apiRequest(`/api/superadmin/users/${id}/profile`);
}

export async function createManagementUser(user) {
    const data = await apiRequest("/api/superadmin/users", {
        method: "POST",
        body: JSON.stringify(user)
    });
    return data.user;
}

export async function updateManagementUser(id, user) {
    const data = await apiRequest(`/api/superadmin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(user)
    });
    return data.user;
}

export async function updateManagementUserStatus(id, status) {
    const data = await apiRequest(`/api/superadmin/users/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status })
    });
    return data.user;
}

export async function resetManagementUserPassword(id, password) {
    const data = await apiRequest(`/api/superadmin/users/${id}/password`, {
        method: "POST",
        body: JSON.stringify({ password })
    });
    return data.user;
}

export async function updateManagementUserPermissions(id, permissions, role = "") {
    const data = await apiRequest(`/api/superadmin/users/${id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissions, role })
    });
    return data.user;
}

export async function getRoleTemplates() {
    const data = await apiRequest("/api/superadmin/role-templates");
    return data.templates || {};
}

export async function updateRoleTemplate(role, moduleActions) {
    const data = await apiRequest(`/api/superadmin/role-templates/${encodeURIComponent(role)}`, {
        method: "PUT",
        body: JSON.stringify({ moduleActions: moduleActions || {} })
    });
    return data.templates || {};
}

export async function deleteManagementUser(id) {
    await apiRequest(`/api/superadmin/users/${id}`, { method: "DELETE" });
}

export async function getCustomModuleAccess() {
    const data = await apiRequest("/api/superadmin/custom-modules");
    return {
        modules: data.modules || [],
        access: data.access || []
    };
}

export async function listAuthLogs() {
    const data = await apiRequest("/api/superadmin/auth-logs");
    const loginLogs = (data.logs || []).map((log) => ({ ...log, kind: log.kind || "login" }));
    const activityLogs = (data.activityLogs || []).map((log) => ({ ...log, kind: "activity" }));
    return [...loginLogs, ...activityLogs].sort((a, b) => {
        const left = a.timestamp || a.loginTime || "";
        const right = b.timestamp || b.loginTime || "";
        return String(right).localeCompare(String(left));
    });
}

export async function clearAuthLogs() {
    await apiRequest("/api/superadmin/auth-logs", { method: "DELETE" });
}

export async function getDisplayModules() {
    const data = await apiRequest("/api/superadmin/display-modules");
    return {
        displayModules: data.displayModules || {},
        modules: data.modules || []
    };
}

export async function updateDisplayModule(moduleKey, patch) {
    const data = await apiRequest(`/api/superadmin/display-modules/${encodeURIComponent(moduleKey)}`, {
        method: "PATCH",
        body: JSON.stringify(patch || {})
    });
    return data;
}

export async function listModules() {
    const data = await apiRequest("/api/modules");
    return data.modules || [];
}

export async function createModule(module) {
    const data = await apiRequest("/api/modules", {
        method: "POST",
        body: JSON.stringify(module || {})
    });
    return data;
}

export async function updateModule(moduleKey, module) {
    const data = await apiRequest(`/api/modules/${encodeURIComponent(moduleKey)}`, {
        method: "PUT",
        body: JSON.stringify(module || {})
    });
    return data;
}

export async function deleteModule(moduleKey) {
    const data = await apiRequest(`/api/modules/${encodeURIComponent(moduleKey)}`, {
        method: "DELETE"
    });
    return data;
}
