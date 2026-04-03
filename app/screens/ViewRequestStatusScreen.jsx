import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import { MAINTENANCE_STATUS, normalizeMaintenanceStatus } from "../constants/maintenanceStatus";
import { normalizeRoleId, ROLE_IDS } from "../constants/roles";

import { API_URL } from '../../api';

const C = {
  navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5", surface: "#FFFFFF",
  surfaceAlt: "#F7F9FC", border: "#DDE3EC", textMute: "#8A9BB0",
  success: "#1A7A4A", successBg: "#EAF6EF", warn: "#B45C10", warnBg: "#FEF3E2",
  danger: "#9B1C1C", dangerBg: "#FEE8E8", info: "#155E8A", infoBg: "#E6F2FA",
};
const STATUS = {
  [MAINTENANCE_STATUS.PENDING]: { color: C.warn, bg: C.warnBg, label: "Pending", icon: "P" },
  [MAINTENANCE_STATUS.APPROVED]: { color: C.success, bg: C.successBg, label: "Approved", icon: "A" },
  [MAINTENANCE_STATUS.DISAPPROVED]: { color: C.danger, bg: C.dangerBg, label: "Disapproved", icon: "D" },
  [MAINTENANCE_STATUS.DONE]: { color: C.navy, bg: C.surfaceAlt, label: "Done", icon: "N" },
  [MAINTENANCE_STATUS.CANCELLED]: { color: C.textMute, bg: C.surfaceAlt, label: "Cancelled", icon: "C" },
};
const FILTERS = ["All", "Pending", "Approved", "Done", "Disapproved", "Cancelled"];

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const isRequestOwnedByUser = (request, user) => {
  const userIds = [user?.id, user?.user_id].map(toNumberOrNull).filter(v => v !== null);
  const ownerIds = [
    request?.requesting_personnel,
    request?.requesting_personnel_id,
    request?.requester_id,
    request?.user_id,
    request?.personnel_id,
    request?.requested_by,
    request?.user?.id,
    request?.user?.user_id,
    request?.requester?.id,
    request?.requester?.user_id,
  ].map(toNumberOrNull).filter(v => v !== null);

  if (userIds.length > 0 && ownerIds.length > 0) return ownerIds.some(id => userIds.includes(id));

  const ownerUsername = String(request?.username || request?.requester?.username || request?.user?.username || "").trim().toLowerCase();
  const currentUsername = String(user?.username || "").trim().toLowerCase();
  return Boolean(ownerUsername && currentUsername && ownerUsername === currentUsername);
};
const normalizeFilter = (value) => {
  const target = String(value || "").toLowerCase();
  return FILTERS.find(f => f.toLowerCase() === target) || "All";
};
const sortRequestsDescending = (list) => {
  const getTimestamp = (request) => {
    const value = request?.created_at || request?.date_requested || request?.updated_at;
    const ts = Date.parse(value || "");
    return Number.isNaN(ts) ? -Infinity : ts;
  };

  return [...list].sort((a, b) => {
    const byDate = getTimestamp(b) - getTimestamp(a);
    if (byDate !== 0) return byDate;
    return Number(b?.id || 0) - Number(a?.id || 0);
  });
};
const normalizeRequestScope = (value) => {
  const target = String(value || "").toLowerCase();
  if (target === "all" || target === "my") return target;
  return null;
};

export default function ViewRequestStatusScreen({ onBack, onNavigate, user, initialFilter, requestScope, requestId }) {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState(normalizeFilter(initialFilter));
  const [types, setTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const roleId = normalizeRoleId(user?.role_id);
  const scope = normalizeRequestScope(requestScope) || (roleId === ROLE_IDS.REQUESTER ? "my" : "all");
  const screenTitle = scope === "all" ? "All Requests" : "My Requests";

  const fetchRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");

      if (!token) {
        setRequests([]);
        return;
      }

      const ep = "/maintenance-requests";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      let res;
      try {
        res = await fetch(`${API_URL}${ep}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const reqList = Array.isArray(data) ? data : data.data || [];

      // Fetch maintenance types if not loaded
      let currentTypes = types;
      if (Object.keys(currentTypes).length === 0) {
        const tRes = await fetch(`${API_URL}/maintenance-types`, { headers: { Authorization: `Bearer ${token}` } });
        const tData = await tRes.json();
        const tList = Array.isArray(tData) ? tData : tData.data || [];
        const tMap = {};
        tList.forEach(t => tMap[t.id] = t.name || t.type_name);
        setTypes(tMap);
        currentTypes = tMap;
      }

      const normalizedRequests = reqList.map(r => ({
        ...r,
        status: normalizeMaintenanceStatus(r.status, r.status_id),
        maintenance_type_name: currentTypes[r.maintenance_type_id] || r.maintenance_type?.name || r.maintenance_type || r.type
      }));

      const scoped = scope === "my"
        ? normalizedRequests.filter((request) => isRequestOwnedByUser(request, user))
        : normalizedRequests;
      const sorted = sortRequestsDescending(scoped);
      setRequests(sorted);
    } catch (_e) {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => {
    setActiveFilter(normalizeFilter(initialFilter));
  }, [initialFilter]);
  useEffect(() => {
    setFiltered(
      activeFilter === "All"
        ? requests
        : requests.filter(r => {
          const s = normalizeMaintenanceStatus(r.status, r.status_id);
          return s === activeFilter.toLowerCase();
        })
    );
  }, [activeFilter, requests]);

  useEffect(() => {
    if (!requestId || requests.length === 0) return;
    const target = requests.find((request) => Number(request.id) === Number(requestId));
    if (target) setSelected(target);
  }, [requestId, requests]);

  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const cancelRequest = async (request) => {
    setActionLoading(true);
    setActionMsg("");

    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/maintenance-requests/${request.id}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionMsg(data?.message || "Failed to cancel request.");
        return;
      }

      setActionMsg("Request cancelled successfully.");
      setSelected(null);
      fetchRequests();
    } catch (_e) {
      setActionMsg("Cannot connect to server.");
    } finally {
      setActionLoading(false);
    }
  };

  if (selected) return (
    <RequestDetail
      request={selected}
      onBack={() => setSelected(null)}
      user={user}
      actionMsg={actionMsg}
      onCancel={() => cancelRequest(selected)}
      cancelLoading={actionLoading}
      onFeedback={() => onNavigate("Feedback", { requestId: selected.id })}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title={screenTitle} subtitle={`${filtered.length} found`} onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.body}>
          {loading
            ? <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
            : filtered.length === 0
              ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>-</Text>
                  <Text style={styles.emptyText}>No requests found.</Text>
                </View>
              )
              : filtered.map((req, i) => {
                const st = normalizeMaintenanceStatus(req.status, req.status_id);
                const s = STATUS[st] || STATUS[MAINTENANCE_STATUS.PENDING];
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.card, { borderLeftColor: s.color }]}
                    onPress={() => setSelected(req)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardTop}>
                      <View style={[styles.badge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.badgeText, { color: s.color }]}>{s.icon} {s.label}</Text>
                      </View>
                      <Text style={styles.cardDate}>{req.created_at?.slice(0, 10)}</Text>
                    </View>
                    <Text style={styles.cardType}>{req.maintenance_type_name || req.maintenance_type?.name || "Maintenance Request"}</Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>{req.location || "Office/Campus"}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{req.details || req.description || "No description provided."}</Text>
                    <Text style={styles.viewMore}>View Details</Text>
                  </TouchableOpacity>
                );
              })
          }
        </View>
      </ScrollView>
    </View>
  );
}

function RequestDetail({ request, onBack, user, onFeedback, onCancel, cancelLoading, actionMsg }) {
  const st = normalizeMaintenanceStatus(request.status, request.status_id);
  const s = STATUS[st] || STATUS[MAINTENANCE_STATUS.PENDING];
  const isDone = st === MAINTENANCE_STATUS.DONE;
  const isPending = st === MAINTENANCE_STATUS.PENDING;
  const isRequester = normalizeRoleId(user?.role_id) === ROLE_IDS.REQUESTER;
  const canCancel = isRequester && isPending;
  const actionError = /failed|cannot|only|unable|required|missing/i.test(String(actionMsg || ""));

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F2F5" }}>
      <ScreenHeader title="Request Details" onBack={onBack} backLabel="Back to List" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 14 }}>
          {actionMsg ? (
            <View style={[styles.statusMessage, { borderLeftColor: actionError ? C.danger : C.success, backgroundColor: actionError ? C.dangerBg : C.successBg }]}>
              <Text style={[styles.statusMessageText, { color: actionError ? C.danger : C.success }]}>{actionMsg}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBanner, { backgroundColor: s.bg, borderColor: s.color }]}>
            <Text style={[styles.statusBannerText, { color: s.color }]}>{s.icon}  {s.label}</Text>
          </View>
          {[
            { l: "Request ID", v: `#${request.id}` },
            { l: "Maintenance Type", v: request.maintenance_type_name || request.maintenance_type?.name || "Unknown Type" },
            { l: "Priority", v: request.priority_number || request.priority || "Pending priority assignment" },
            { l: "Location", v: request.location },
            { l: "Description", v: request.details || request.description },
            { l: "Submitted", v: (request.date_requested || request.created_at)?.slice(0, 10) },
          ].map((row, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.l}</Text>
              <Text style={styles.detailValue}>{row.v || "-"}</Text>
            </View>
          ))}
          {request.remarks && (
            <View style={[styles.detailRow, { backgroundColor: "#fffbeb" }]}>
              <Text style={styles.detailLabel}>Remarks</Text>
              <Text style={[styles.detailValue, { color: "#92400e", fontWeight: "700" }]}>{request.remarks}</Text>
            </View>
          )}
          {canCancel && (
            <TouchableOpacity style={[styles.feedbackBtn, cancelLoading && { opacity: 0.7 }]} onPress={onCancel} activeOpacity={0.85} disabled={cancelLoading}>
              {cancelLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.feedbackBtnText}>Cancel Request</Text>}
            </TouchableOpacity>
          )}
          {isDone && isRequester && (
            <TouchableOpacity style={styles.feedbackBtn} onPress={onFeedback} activeOpacity={0.85}>
              <Text style={styles.feedbackBtnText}>Leave Feedback</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  filterRow: { marginTop: 12, marginBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#DDE3EC" },
  filterBtnActive: { backgroundColor: "#0B1F3A", borderColor: "#0B1F3A" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#fff" },
  body: { padding: 14 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardDate: { fontSize: 11, color: "#94a3b8" },
  cardType: { fontSize: 15, fontWeight: "800", color: "#0B1F3A", marginBottom: 3 },
  cardLocation: { fontSize: 12, color: "#64748b", marginBottom: 3 },
  cardDesc: { fontSize: 13, color: "#475569", lineHeight: 18 },
  viewMore: { fontSize: 12, color: "#1E4D8C", fontWeight: "700", marginTop: 6, textAlign: "right" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  statusMessage: { borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 12 },
  statusMessageText: { fontSize: 13, fontWeight: "600" },
  statusBanner: { borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 14 },
  statusBannerText: { fontSize: 17, fontWeight: "800" },
  detailRow: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  detailLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: 14, color: "#0B1F3A", fontWeight: "600" },
  feedbackBtn: { backgroundColor: "#1a5c72", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14, elevation: 4 },
  feedbackBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});

