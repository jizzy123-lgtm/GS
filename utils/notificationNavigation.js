import { normalizeRoleId, ROLE_IDS } from "../app/constants/roles";

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getNotificationData = (input) => {
  if (!input) return {};
  if (input?.notification?.request?.content?.data) return input.notification.request.content.data;
  if (input?.request?.content?.data) return input.request.content.data;
  if (typeof input?.data === "object" && input.data) return input.data;
  if (typeof input === "object") return input;
  return {};
};

export const extractNotificationRequestId = (input) => {
  const data = getNotificationData(input);
  return (
    toNumberOrNull(data?.request_id) ??
    toNumberOrNull(data?.maintenance_request_id) ??
    toNumberOrNull(data?.requestId) ??
    toNumberOrNull(data?.maintenanceRequestId) ??
    null
  );
};

export const extractNotificationRoleId = (input) => {
  const data = getNotificationData(input);
  return (
    normalizeRoleId(data?.role_id) ??
    normalizeRoleId(data?.user_role_id) ??
    normalizeRoleId(data?.roleId) ??
    null
  );
};

export const getNotificationNavigationTarget = ({ requestId, roleId }) => {
  const resolvedRequestId = toNumberOrNull(requestId);
  const resolvedRoleId = normalizeRoleId(roleId);

  if (!resolvedRequestId) return null;
  if (resolvedRoleId === ROLE_IDS.SYSTEM_ADMIN) return null;

  return {
    screen: "ViewRequestStatus",
    params: {
      requestId: resolvedRequestId,
      requestScope: resolvedRoleId === ROLE_IDS.REQUESTER ? "my" : "all",
    },
  };
};

export const getTargetFromNotificationLike = (input, fallbackRoleId = null) => {
  const requestId = extractNotificationRequestId(input);
  // Prefer the current authenticated user role over notification payload role.
  // Payload role can represent the actor/requester and may not match the device user.
  const roleId = normalizeRoleId(fallbackRoleId) ?? extractNotificationRoleId(input);
  return getNotificationNavigationTarget({ requestId, roleId });
};
