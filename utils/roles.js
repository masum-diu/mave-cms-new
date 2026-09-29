/** Normalize role_id from API (number | string | JSON array | object). */
export const unwrapRoleId = (roleId) => {
  if (roleId == null || roleId === "") return roleId;

  if (Array.isArray(roleId)) {
    return roleId[0] ?? roleId;
  }

  if (typeof roleId === "object") {
    return roleId.id ?? roleId.role_id ?? roleId;
  }

  if (typeof roleId === "string") {
    const trimmed = roleId.trim();
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return unwrapRoleId(JSON.parse(trimmed));
      } catch (_) {
        return roleId;
      }
    }
  }

  return roleId;
};

/**
 * Tenant `users.role_id` is a MySQL JSON column.
 * - bare number → "Invalid JSON text"
 * - JS/PHP array → "Array to string conversion" (no array cast on model)
 * So send a JSON string, e.g. "[2]".
 */
export const formatRoleIdForApi = (roleId) => {
  const id = unwrapRoleId(roleId);
  if (id == null || id === "") return "[]";
  const numeric = Number(id);
  const value = Number.isNaN(numeric) ? id : numeric;
  return JSON.stringify([value]);
};

/** Admin role id checks that tolerate string ("1") or number (1) from the API. */
export const isAdminRole = (roleId) => String(unwrapRoleId(roleId)) === "1";

export const isUserRole = (roleId) => String(unwrapRoleId(roleId)) === "2";

const roleLabelOf = (role) =>
  String(role?.name || role?.title || "")
    .toLowerCase()
    .trim();

/**
 * Find the "User" role id from /roles.
 * Only exact "User" (or id 2) — never fall back to roles like "Everything".
 */
export const resolveUserRoleId = (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) return 2;

  const exactUser = roles.find((r) => roleLabelOf(r) === "user");
  if (exactUser?.id != null) return exactUser.id;

  const byId = roles.find((r) => String(r.id) === "2");
  if (byId?.id != null) return byId.id;

  return 2;
};

const getRoleName = (user) =>
  (
    user?.role_mave?.name ||
    user?.role_mave?.title ||
    user?.role?.name ||
    user?.role?.title ||
    (typeof user?.role === "string" ? user.role : "") ||
    ""
  )
    .toLowerCase()
    .trim();

const normalizeRoleLabel = (label) => {
  if (!label) return label;
  const lower = String(label).toLowerCase().trim();
  // Tenant DBs often seed role_id 1 as "Super Admin" — show Admin in UI
  if (lower === "super admin" || lower === "superadmin") return "Admin";
  // Mistaken non-admin roles should still read as User in this CMS UI
  if (lower === "everything" || lower === "editor" || lower === "guest") {
    return "User";
  }
  return label;
};

/**
 * Who can create/manage users in Settings.
 * Tenant admins (slug login) often get role_id 1, but some tenants store
 * Admin only under role_mave / role name — accept all of those.
 * If role metadata is missing on a tenant session, still allow (API enforces).
 */
export const canManageUsers = (user) => {
  if (!user) return false;

  if (isAdminRole(user.role_id)) return true;
  if (isAdminRole(user.role_mave?.id)) return true;
  if (isAdminRole(user.role?.id)) return true;

  const name = getRoleName(user);
  if (
    name === "admin" ||
    name === "super admin" ||
    name === "superadmin" ||
    name.includes("admin")
  ) {
    return true;
  }

  // Regular "User" role must not manage others
  if (isUserRole(user.role_id)) return false;

  // Tenant org session with incomplete role payload (common after admin/register)
  if (typeof window !== "undefined") {
    try {
      const slug = localStorage.getItem("mave_tenant_slug");
      if (slug && user.email) return true;
    } catch (_) {}
  }

  return false;
};

export const getRoleLabel = (roleId, roles = []) => {
  const id = unwrapRoleId(roleId);
  const matched = roles.find((r) => String(r?.id) === String(id));
  if (matched) {
    return normalizeRoleLabel(
      matched.name || matched.title || `Role ${matched.id}`
    );
  }
  if (isAdminRole(id)) return "Admin";
  if (isUserRole(id)) return "User";
  return id != null && id !== "" ? "N/A" : "Guest";
};

/** True only for primary Admin role (role_id 1). Used to protect delete. */
export const isPrivilegedRole = (roleId) => isAdminRole(roleId);
