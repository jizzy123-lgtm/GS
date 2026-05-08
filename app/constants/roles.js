export const ROLE_IDS = {
  SYSTEM_ADMIN: 1,
  HEAD: 2,
  STAFF: 3,
  REQUESTER: 4,
  CAMPUS_DIRECTOR: 5,
};

export const ROLE_LABELS = {
  [ROLE_IDS.SYSTEM_ADMIN]: "System Admin",
  [ROLE_IDS.HEAD]: "Head",
  [ROLE_IDS.STAFF]: "Staff",
  [ROLE_IDS.REQUESTER]: "Requester",
  [ROLE_IDS.CAMPUS_DIRECTOR]: "Campus Director",
};

export function normalizeRoleId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getRoleLabel(roleId, fallback = "User") {
  return ROLE_LABELS[normalizeRoleId(roleId)] || fallback;
}

export default {};
