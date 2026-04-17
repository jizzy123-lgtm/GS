import AsyncStorage from "@react-native-async-storage/async-storage";

import { normalizeRoleId, ROLE_IDS } from "../app/constants/roles";

export const getAuthToken = async () =>
  (await AsyncStorage.getItem("authToken")) ||
  (await AsyncStorage.getItem("token")) ||
  "";

export const getAuthHeaders = (token, extraHeaders = {}) => ({
  Accept: "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extraHeaders,
});

export const extractApiList = (data) => (Array.isArray(data) ? data : data?.data || []);

export const extractApiItem = (data) => {
  if (Array.isArray(data)) return data[0] || null;
  return data?.data || data || null;
};

export const flattenErrorMessages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenErrorMessages);
  if (typeof value === "object") return Object.values(value).flatMap(flattenErrorMessages);
  return [String(value)];
};

export const getApiErrorMessage = (status, data, fallback = "Request failed.") => {
  const validationErrors = flattenErrorMessages(data?.errors).join("\n");
  if (status === 422 && validationErrors) return validationErrors;
  if (status === 401) return data?.message || "You are not authenticated. Please sign in again.";
  if (status === 403) return data?.message || "You are not authorized to perform this action.";
  return validationErrors || data?.message || fallback;
};

export const getMaintenanceTypeLabel = (type) =>
  type?.name || type?.type_name || type?.maintenance_type || "";

const isRoleHeadLike = (value) => {
  const text = String(value || "").toLowerCase();
  return text.includes("head") && !text.includes("director");
};

export const getRequesterRoleId = (request) => {
  const possibleRoleIds = [
    request?.requester_role_id,
    request?.requesting_personnel_role_id,
    request?.requester?.role_id,
    request?.requesting_personnel?.role_id,
    request?.requester?.role?.id,
    request?.requesting_personnel?.role?.id,
    request?.user?.role_id,
    request?.user?.role?.id,
  ];

  for (const value of possibleRoleIds) {
    const roleId = normalizeRoleId(value);
    if (roleId !== null) return roleId;
  }

  const possibleRoleLabels = [
    request?.requester_role_name,
    request?.requesting_personnel_role_name,
    request?.requester?.role_name,
    request?.requester?.role?.role_name,
    request?.requesting_personnel?.role?.role_name,
    request?.user?.role_name,
    request?.user?.role?.role_name,
  ];

  if (possibleRoleLabels.some((value) => isRoleHeadLike(value))) return ROLE_IDS.HEAD;
  return null;
};

export const requesterIsHead = (request) => getRequesterRoleId(request) === ROLE_IDS.HEAD;

export const mergeRequestData = (currentRequest, detailRequest) => {
  if (!currentRequest) return detailRequest || null;
  if (!detailRequest) return currentRequest;

  return {
    ...currentRequest,
    ...detailRequest,
    requester: detailRequest?.requester || currentRequest?.requester,
    user: detailRequest?.user || currentRequest?.user,
    requesting_personnel: detailRequest?.requesting_personnel || currentRequest?.requesting_personnel,
    maintenance_type:
      detailRequest?.maintenance_type || currentRequest?.maintenance_type,
    maintenance_type_name:
      detailRequest?.maintenance_type_name ||
      currentRequest?.maintenance_type_name ||
      getMaintenanceTypeLabel(detailRequest?.maintenance_type) ||
      getMaintenanceTypeLabel(currentRequest?.maintenance_type),
    requester_role_id:
      getRequesterRoleId(detailRequest) ??
      getRequesterRoleId(currentRequest) ??
      detailRequest?.requester_role_id ??
      currentRequest?.requester_role_id ??
      null,
  };
};
