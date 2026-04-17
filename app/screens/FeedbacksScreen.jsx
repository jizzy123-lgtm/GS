import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import { MAINTENANCE_STATUS, normalizeMaintenanceStatus } from "../constants/maintenanceStatus";

import { API_URL } from "../../api";

const C = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  border: "#DDE3EC",
  textMute: "#8A9BB0",
  success: "#1A7A4A",
  successBg: "#EAF6EF",
  info: "#155E8A",
  infoBg: "#E6F2FA",
  warn: "#B45C10",
  warnBg: "#FEF3E2",
  danger: "#9B1C1C",
  dangerBg: "#FEE8E8",
};

const STATUS_META = {
  [MAINTENANCE_STATUS.SCHEDULED]: { label: "Scheduled", color: C.info, bg: C.infoBg },
  [MAINTENANCE_STATUS.DONE]: { label: "Done", color: C.success, bg: C.successBg },
};

const getFeedbackRequestId = (feedback) => {
  const id = Number(
    feedback?.maintenance_request_id ||
      feedback?.request_id ||
      feedback?.maintenanceRequestId ||
      feedback?.requestId ||
      feedback?.maintenance_request?.id ||
      feedback?.request?.id ||
      feedback?.data?.maintenance_request_id ||
      feedback?.data?.request_id ||
      feedback?.data?.maintenanceRequestId ||
      feedback?.data?.requestId ||
      feedback?.data?.maintenance_request?.id ||
      feedback?.data?.request?.id ||
      0
  );
  return Number.isFinite(id) && id > 0 ? id : null;
};

const getFeedbackId = (feedback) => {
  const id = Number(feedback?.id || feedback?.feedback_id || feedback?.data?.id || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const formatSubmittedBy = (userLike, fallback = "") => {
  const lastName = String(
    userLike?.last_name || userLike?.lastname || userLike?.lastName || ""
  ).trim();
  const username = String(
    userLike?.username || userLike?.user_name || userLike?.userName || ""
  ).trim();
  const firstName = String(
    userLike?.first_name || userLike?.firstname || userLike?.firstName || ""
  ).trim();
  const name = String(
    userLike?.name || userLike?.full_name || userLike?.fullName || ""
  ).trim();
  const personName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (lastName && username) return `${lastName}, ${username}`;
  if (personName && username) return `${personName} (${username})`;
  return lastName || username || personName || name || String(fallback || "").trim();
};

const mapFeedbackDetails = (feedback) => {
  if (!feedback) return null;
  const sourceUser =
    feedback?.user ||
    feedback?.data?.user ||
    feedback?.requester ||
    feedback?.data?.requester ||
    feedback?.submitted_by ||
    feedback?.data?.submitted_by ||
    {};
  return {
    feedbackId: getFeedbackId(feedback),
    rating: feedback?.rating ?? feedback?.data?.rating ?? null,
    comment: String(feedback?.comment ?? feedback?.data?.comment ?? "").trim(),
    submittedAt: feedback?.created_at || feedback?.data?.created_at || feedback?.date_submitted || null,
    by: formatSubmittedBy(sourceUser, feedback?.requester_name),
  };
};

const getFeedbackDetailsFromRequest = (request) => {
  const embedded = request?.feedback || request?.latest_feedback || request?.feedback_details;
  if (!embedded) return null;
  const sourceUser =
    embedded?.user ||
    embedded?.requester ||
    embedded?.submitted_by ||
    embedded?.data?.submitted_by ||
    {};
  return {
    feedbackId: Number(embedded?.id) || null,
    rating: embedded?.rating ?? null,
    comment: String(embedded?.comment ?? "").trim(),
    submittedAt: embedded?.created_at || embedded?.date_submitted || null,
    by: formatSubmittedBy(sourceUser, embedded?.requester_name),
  };
};

const extractFeedbackList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const getAuthCandidates = async () => {
  const token = await AsyncStorage.getItem("token");
  const authToken = await AsyncStorage.getItem("authToken");
  return [...new Set([token, authToken].filter(Boolean))];
};

const fetchWithAnyToken = async (url, options = {}, tokenCandidates = []) => {
  const candidates = tokenCandidates.length > 0 ? tokenCandidates : [null];
  let lastResponse = null;
  let lastError = null;

  for (const token of candidates) {
    try {
      const headers = {
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, { ...options, headers });
      lastResponse = res;
      // If authenticated and authorized, stop retry loop.
      if (res.status !== 401 && res.status !== 403) return res;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("Request failed");
};

const sortByDateDescending = (list) =>
  [...list].sort((a, b) => {
    const ta = Date.parse(a?.updated_at || a?.created_at || a?.date_requested || "");
    const tb = Date.parse(b?.updated_at || b?.created_at || b?.date_requested || "");
    return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
  });

export default function FeedbacksScreen({ onBack }) {
  const [requests, setRequests] = useState([]);
  const [feedbackByRequestId, setFeedbackByRequestId] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedFeedbackDetails, setSelectedFeedbackDetails] = useState(null);
  const [fetchingSelectedFeedback, setFetchingSelectedFeedback] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [feedbackMeta, setFeedbackMeta] = useState({
    fetchOk: true,
    status: null,
    message: "",
    unresolvedCount: 0,
    mappedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const selectedRequest = useMemo(
    () => requests.find((item) => Number(item.id) === Number(selectedRequestId)) || null,
    [requests, selectedRequestId]
  );

  const selectedFeedback = useMemo(() => {
    if (!selectedRequestId) return null;
    return (
      selectedFeedbackDetails ||
      feedbackByRequestId[selectedRequestId] ||
      getFeedbackDetailsFromRequest(selectedRequest) ||
      null
    );
  }, [feedbackByRequestId, selectedRequest, selectedRequestId, selectedFeedbackDetails]);

  const fetchData = useCallback(async () => {
    try {
      const tokenCandidates = await getAuthCandidates();
      const headers = { Accept: "application/json" };

      const [reqRes, typesRes, feedbackRes] = await Promise.allSettled([
        fetchWithAnyToken(`${API_URL}/maintenance-requests`, { headers }, tokenCandidates),
        fetchWithAnyToken(`${API_URL}/maintenance-types`, { headers }, tokenCandidates),
        fetchWithAnyToken(`${API_URL}/feedbacks`, { headers }, tokenCandidates),
      ]);

      let reqList = [];
      if (reqRes.status === "fulfilled") {
        const reqData = await reqRes.value.json();
        reqList = Array.isArray(reqData) ? reqData : reqData?.data || [];
      }

      let typeMap = {};
      if (typesRes.status === "fulfilled" && typesRes.value.ok) {
        const typeData = await typesRes.value.json().catch(() => ({}));
        const typeList = Array.isArray(typeData) ? typeData : typeData?.data || [];
        typeList.forEach((item) => {
          typeMap[item.id] = item.name || item.type_name;
        });
      }

      const normalizedRequests = reqList
        .map((request) => ({
          ...request,
          status: normalizeMaintenanceStatus(request?.status, request?.status_id),
          maintenance_type_name:
            typeMap[request?.maintenance_type_id] ||
            request?.maintenance_type?.name ||
            request?.maintenance_type ||
            request?.type ||
            "Maintenance Request",
        }))
        .filter((request) => [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.DONE].includes(request.status));

      const nextFeedbackMap = {};
      let unresolvedCount = 0;
      let feedbackFetchOk = false;
      let feedbackStatus = null;
      let feedbackMessage = "";
      if (feedbackRes.status === "fulfilled" && feedbackRes.value.ok) {
        feedbackFetchOk = true;
        feedbackStatus = feedbackRes.value.status;
        const feedbackData = await feedbackRes.value.json().catch(() => null);
        const feedbackList = extractFeedbackList(feedbackData);
        feedbackList.forEach((feedback) => {
          const requestId = getFeedbackRequestId(feedback);
          if (!requestId) {
            unresolvedCount += 1;
            return;
          }
          nextFeedbackMap[requestId] = mapFeedbackDetails(feedback);
        });
      } else if (feedbackRes.status === "fulfilled") {
        feedbackStatus = feedbackRes.value.status;
        if (feedbackStatus === 403) {
          feedbackMessage = "Admin account required to view feedbacks.";
        } else if (feedbackStatus === 401) {
          feedbackMessage = "Session expired. Please log out and log in again.";
        } else {
          feedbackMessage = "Unable to load feedback list. Pull to refresh and try again.";
        }
      } else {
        feedbackMessage = "Unable to load feedback list. Pull to refresh and try again.";
      }

      const sorted = sortByDateDescending(normalizedRequests);
      setRequests(sorted);
      setFeedbackByRequestId(nextFeedbackMap);
      setFeedbackMeta({
        fetchOk: feedbackFetchOk,
        status: feedbackStatus,
        message: feedbackMessage,
        unresolvedCount,
        mappedCount: Object.keys(nextFeedbackMap).length,
      });

      setSelectedRequestId((currentSelectedRequestId) => {
        if (!currentSelectedRequestId) return currentSelectedRequestId;
        const stillExists = sorted.some((request) => Number(request.id) === Number(currentSelectedRequestId));
        if (stillExists) return currentSelectedRequestId;
        setSelectedFeedbackDetails(null);
        setDetailError("");
        return null;
      });
    } catch (_error) {
      setRequests([]);
      setFeedbackByRequestId({});
      setFeedbackMeta({
        fetchOk: false,
        status: null,
        message: "Unable to load feedback list. Pull to refresh and try again.",
        unresolvedCount: 0,
        mappedCount: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedRequestId) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedRequestId(null);
      setSelectedFeedbackDetails(null);
      setDetailError("");
      return true;
    });
    return () => sub.remove();
  }, [selectedRequestId]);

  useEffect(() => {
    if (!selectedRequestId) {
      setSelectedFeedbackDetails(null);
      setFetchingSelectedFeedback(false);
      setDetailError("");
      return;
    }

    const feedbackSummary = feedbackByRequestId[selectedRequestId];
    const feedbackId = feedbackSummary?.feedbackId;
    if (!feedbackId) {
      setSelectedFeedbackDetails(null);
      setFetchingSelectedFeedback(false);
      if (selectedRequest?.has_feedback) {
        setDetailError("Feedback exists but cannot be resolved from the feedback list. Pull to refresh.");
      } else {
        setDetailError("");
      }
      return;
    }

    let mounted = true;
    const fetchFeedbackDetail = async () => {
      setFetchingSelectedFeedback(true);
      setDetailError("");
      try {
        const tokenCandidates = await getAuthCandidates();
        const res = await fetchWithAnyToken(
          `${API_URL}/feedbacks/${feedbackId}/details`,
          { headers: { Accept: "application/json" } },
          tokenCandidates
        );
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) {
          setSelectedFeedbackDetails(null);
          setDetailError(data?.message || "Unable to load feedback details.");
          return;
        }
        setSelectedFeedbackDetails(mapFeedbackDetails(data));
      } catch (_error) {
        if (mounted) {
          setSelectedFeedbackDetails(null);
          setDetailError("Unable to load feedback details.");
        }
      } finally {
        if (mounted) setFetchingSelectedFeedback(false);
      }
    };

    fetchFeedbackDetail();
    return () => {
      mounted = false;
    };
  }, [feedbackByRequestId, selectedRequest?.has_feedback, selectedRequestId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (selectedRequest) {
    const statusMeta = STATUS_META[selectedRequest.status] || STATUS_META[MAINTENANCE_STATUS.DONE];
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScreenHeader
          title="Request Feedback"
          onBack={() => {
            setSelectedRequestId(null);
            setSelectedFeedbackDetails(null);
            setDetailError("");
          }}
          backLabel="Back to List"
        />
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          <View style={[styles.statusBanner, { backgroundColor: statusMeta.bg, borderColor: statusMeta.color }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>

          {!feedbackMeta.fetchOk ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{feedbackMeta.message || "Unable to load feedback list. Pull to refresh and try again."}</Text>
            </View>
          ) : null}

          {feedbackMeta.fetchOk && feedbackMeta.unresolvedCount > 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Some feedback records could not be mapped ({feedbackMeta.unresolvedCount}). Please refresh.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <DetailRow label="Request ID" value={`#${selectedRequest.id}`} />
            <DetailRow label="Maintenance Type" value={selectedRequest.maintenance_type_name || "Maintenance Request"} />
            <DetailRow label="Location" value={selectedRequest.location || "-"} />
            <DetailRow label="Description" value={selectedRequest.details || selectedRequest.description || "-"} />
            <DetailRow label="Scheduled Date" value={selectedRequest.scheduled_date || "-"} />
            <DetailRow label="Scheduled Time" value={selectedRequest.scheduled_time || "-"} />
            <DetailRow
              label="Assigned Staff ID"
              value={selectedRequest.assigned_staff_id || selectedRequest.assigned_staff || "-"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Feedback Details</Text>
            {fetchingSelectedFeedback && !selectedFeedback ? (
              <ActivityIndicator color={C.navy} style={{ marginVertical: 10 }} />
            ) : selectedFeedback ? (
              <>
                <DetailRow label="Rating" value={selectedFeedback.rating ?? "-"} />
                <DetailRow label="Comment" value={selectedFeedback.comment || "-"} />
                <DetailRow
                  label="Submitted At"
                  value={
                    selectedFeedback.submittedAt
                      ? String(selectedFeedback.submittedAt).slice(0, 19).replace("T", " ")
                      : "-"
                  }
                />
                <DetailRow label="Submitted By" value={selectedFeedback.by || "-"} />
              </>
            ) : detailError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{detailError}</Text>
              </View>
            ) : (
              <View style={styles.emptyFeedbackBox}>
                <Text style={styles.emptyFeedbackText}>No feedback yet.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Feedbacks" subtitle={`${requests.length} requests`} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
      >
        {loading ? (
          <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No scheduled or done maintenance requests found.</Text>
          </View>
        ) : (
          requests.map((request) => {
            const statusMeta = STATUS_META[request.status] || STATUS_META[MAINTENANCE_STATUS.DONE];
            const hasFeedback = Boolean(
              feedbackByRequestId[request.id] || getFeedbackDetailsFromRequest(request) || request?.has_feedback
            );
            return (
              <TouchableOpacity
                key={request.id}
                style={styles.itemCard}
                onPress={() => {
                  setSelectedFeedbackDetails(null);
                  setDetailError("");
                  setSelectedRequestId(request.id);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {request.maintenance_type_name || "Maintenance Request"}
                  </Text>
                  <View style={[styles.chip, { backgroundColor: statusMeta.bg }]}>
                    <Text style={[styles.chipText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                  </View>
                </View>
                <Text style={styles.itemMeta}>Request: #{request.id}</Text>
                <Text style={styles.itemMeta} numberOfLines={1}>
                  {request.details || request.description || "-"}
                </Text>
                <Text style={styles.itemMeta}>
                  Scheduled: {request.scheduled_date || "-"} {request.scheduled_time || ""}
                </Text>
                <Text style={[styles.feedbackState, { color: hasFeedback ? C.success : C.warn }]}>
                  {hasFeedback ? "Feedback submitted" : "No feedback yet"}
                </Text>
                <Text style={styles.openText}>Open Details</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 10,
  },
  emptyText: { color: C.textMute, fontSize: 14, textAlign: "center" },
  itemCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: C.navy },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  itemMeta: { fontSize: 12, color: C.textMute, marginTop: 2 },
  feedbackState: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  openText: { fontSize: 12, color: C.steel, fontWeight: "700", marginTop: 8, textAlign: "right" },
  statusBanner: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  statusText: { fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    color: C.textMute,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLabel: { fontSize: 11, color: C.textMute, fontWeight: "700", marginBottom: 2 },
  detailValue: { fontSize: 14, color: C.navy, fontWeight: "600" },
  emptyFeedbackBox: {
    backgroundColor: C.warnBg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.warn,
    padding: 12,
    marginTop: 4,
  },
  emptyFeedbackText: { color: C.warn, fontSize: 13, fontWeight: "600" },
  errorBox: {
    backgroundColor: C.dangerBg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.danger,
    padding: 12,
    marginBottom: 10,
  },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },
});
