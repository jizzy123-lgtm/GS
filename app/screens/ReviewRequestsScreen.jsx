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

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";

const C = {
  navy:      "#0B1F3A",
  steel:     "#1E4D8C",
  gold:      "#C9A84C",
  bg:        "#F0F2F5",
  surface:   "#FFFFFF",
  surfaceAlt:"#F7F9FC",
  border:    "#DDE3EC",
  textMute:  "#8A9BB0",
  danger:    "#9B1C1C",
  dangerBg:  "#FEE8E8",
  success:   "#1A7A4A",
  successBg: "#EAF6EF",
  warn:      "#B45C10",
  warnBg:    "#FEF3E2",
  info:      "#155E8A",
  infoBg:    "#E6F2FA",
};

const STATUS_MAP = {
  pending:     { color: C.warn,    bg: C.warnBg,    label: "Pending" },
  approved:    { color: C.success, bg: C.successBg, label: "Approved" },
  confirmed:   { color: C.info,    bg: C.infoBg,    label: "Confirmed" },
  completed:   { color: C.navy,    bg: C.surfaceAlt,label: "Completed" },
  disapproved: { color: C.danger,  bg: C.dangerBg,  label: "Disapproved" },
};

const FILTERS = ["All", "Pending", "Approved", "Confirmed", "Completed", "Disapproved"];

export default function ReviewRequestsScreen({ user, onBack, onNavigate }) {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("All");
  const [selected,   setSelected]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg,  setActionMsg]  = useState("");

  const roleId = user?.role_id;

  const fetchRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
      let endpoint = roleId === 2 ? "/head/requests" : "/staff/requests";
      const res = await fetch(`${API_URL}${endpoint}`, { headers, signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const filtered = filter === "All"
    ? requests
    : requests.filter(r => r.status?.toLowerCase() === filter.toLowerCase());

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    setActionMsg("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        setActionMsg("Request approved successfully.");
        fetchRequests();
        setSelected(null);
      } else {
        const data = await res.json();
        setActionMsg(data.message || "Failed to approve.");
      }
    } catch (e) {
      setActionMsg("Cannot connect to server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisapprove = async (requestId) => {
    setActionLoading(true);
    setActionMsg("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/requests/${requestId}/disapprove`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        setActionMsg("Request disapproved.");
        fetchRequests();
        setSelected(null);
      } else {
        const data = await res.json();
        setActionMsg(data.message || "Failed to disapprove.");
      }
    } catch (e) {
      setActionMsg("Cannot connect to server.");
    } finally {
      setActionLoading(false);
    }
  };

  // Detail View
  if (selected) {
    const s = STATUS_MAP[selected.status?.toLowerCase()] || STATUS_MAP.pending;
    const isConfirmed = selected.status?.toLowerCase() === "confirmed" || selected.status?.toLowerCase() === "approved";
    const canApprove = roleId === 2 && selected.status?.toLowerCase() === "pending";
    const canAssignSchedule = roleId === 3 && isConfirmed;

    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.topBar} />
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => { setSelected(null); setActionMsg(""); }} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to List</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Request Details</Text>
          </View>
        </View>

        <View style={styles.body}>

          {actionMsg ? (
            <View style={[styles.msgBox, { borderLeftColor: actionMsg.includes("success") ? C.success : C.danger, backgroundColor: actionMsg.includes("success") ? C.successBg : C.dangerBg }]}>
              <Text style={[styles.msgText, { color: actionMsg.includes("success") ? C.success : C.danger }]}>{actionMsg}</Text>
            </View>
          ) : null}

          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: s.bg, borderLeftColor: s.color }]}>
            <Text style={[styles.statusBannerText, { color: s.color }]}>{s.label}</Text>
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            <DetailRow label="Request ID"   value={`#${selected.id}`} />
            <DetailRow label="Type"         value={selected.maintenance_type || selected.type} />
            <DetailRow label="Priority"     value={selected.priority} />
            <DetailRow label="Location"     value={selected.location} />
            <DetailRow label="Submitted by" value={selected.requester_name || selected.user?.name || "—"} />
            <DetailRow label="Date"         value={selected.created_at?.slice(0, 10)} />
            <DetailRow label="Description"  value={selected.description} last />
          </View>

          {/* Schedule info if assigned */}
          {selected.scheduled_date ? (
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleCardTitle}>Assigned Schedule</Text>
              <DetailRow label="Date"     value={selected.scheduled_date} />
              <DetailRow label="Time"     value={selected.scheduled_time || "—"} />
              <DetailRow label="Assigned Staff" value={selected.assigned_staff || "—"} last />
            </View>
          ) : null}

          {/* Actions */}
          {canApprove && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]}
                onPress={() => handleApprove(selected.id)}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.approveBtnText}>APPROVE</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.disapproveBtn, actionLoading && { opacity: 0.6 }]}
                onPress={() => handleDisapprove(selected.id)}
                disabled={actionLoading}
              >
                <Text style={styles.disapproveBtnText}>DISAPPROVE</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Staff: Assign Schedule if confirmed by director */}
          {canAssignSchedule && (
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => onNavigate("AssignSchedule", { requestId: selected.id, request: selected })}
              activeOpacity={0.85}
            >
              <Text style={styles.assignBtnText}>ASSIGN SCHEDULE</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    );
  }

  // List View
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel} />}
    >
      <View style={styles.header}>
        <View style={styles.topBar} />
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Requests</Text>
          <Text style={styles.headerSub}>
            {roleId === 2 ? "Approve or disapprove maintenance requests" : "View confirmed requests and assign schedules"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.steel} size="large" />
            <Text style={styles.loadingText}>Loading requests…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No {filter !== "All" ? filter.toLowerCase() : ""} requests found.</Text>
          </View>
        ) : (
          filtered.map((req, i) => {
            const s = STATUS_MAP[req.status?.toLowerCase()] || STATUS_MAP.pending;
            const isConfirmed = req.status?.toLowerCase() === "confirmed" || req.status?.toLowerCase() === "approved";
            return (
              <TouchableOpacity
                key={i}
                style={[styles.requestCard, { borderLeftColor: s.color }]}
                onPress={() => setSelected(req)}
                activeOpacity={0.8}
              >
                <View style={styles.requestCardTop}>
                  <Text style={styles.requestType} numberOfLines={1}>
                    {req.maintenance_type || req.type || "Request"}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusChipText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                <Text style={styles.requestMeta}>
                  {req.location || "—"}  ·  {req.created_at?.slice(0, 10) || "—"}
                </Text>
                {roleId === 3 && isConfirmed && !req.scheduled_date && (
                  <View style={styles.assignTag}>
                    <Text style={styles.assignTagText}>Needs Schedule Assignment</Text>
                  </View>
                )}
                {req.scheduled_date && (
                  <Text style={styles.scheduledText}>Scheduled: {req.scheduled_date}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <View style={[styles.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  topBar:      { height: 4, backgroundColor: C.gold },
  header:      { backgroundColor: C.navy, paddingBottom: 20 },
  headerInner: { paddingHorizontal: 20, paddingTop: 14 },
  backBtn:     { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 12 },
  backText:    { color: "#8A9FC0", fontSize: 12, fontWeight: "700" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub:   { color: "#6A85A8", fontSize: 12, marginTop: 4 },

  body: { padding: 16 },

  filterScroll: { marginBottom: 16 },
  filterTab:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, marginRight: 8, borderWidth: 1.5, borderColor: C.border },
  filterTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTabText:       { fontSize: 12, fontWeight: "700", color: C.textMute },
  filterTabTextActive: { color: "#fff" },

  loadingBox:  { alignItems: "center", paddingVertical: 60 },
  loadingText: { color: C.textMute, fontSize: 14, marginTop: 12 },

  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 36, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },

  requestCard:    { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border, elevation: 1 },
  requestCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  requestType:    { fontSize: 15, fontWeight: "700", color: C.navy, flex: 1 },
  requestMeta:    { fontSize: 12, color: C.textMute, marginTop: 2 },
  statusChip:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  statusChipText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },

  assignTag:     { marginTop: 8, backgroundColor: C.infoBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  assignTagText: { fontSize: 11, color: C.info, fontWeight: "700" },
  scheduledText: { fontSize: 11, color: C.success, fontWeight: "600", marginTop: 6 },

  msgBox:   { borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 14 },
  msgText:  { fontSize: 13, fontWeight: "600" },

  statusBanner:     { borderLeftWidth: 4, borderRadius: 8, padding: 14, marginBottom: 14 },
  statusBannerText: { fontSize: 16, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  detailCard:     { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, elevation: 2 },
  detailRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel:    { fontSize: 12, color: C.textMute, fontWeight: "600", flex: 1 },
  detailValue:    { fontSize: 13, color: C.navy, fontWeight: "700", flex: 2, textAlign: "right" },

  scheduleCard:      { backgroundColor: C.successBg, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.success },
  scheduleCardTitle: { fontSize: 12, fontWeight: "800", color: C.success, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },

  actionRow:      { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 10 },
  approveBtn:     { flex: 1, backgroundColor: C.success, borderRadius: 10, paddingVertical: 14, alignItems: "center", elevation: 3 },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  disapproveBtn:     { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: C.danger },
  disapproveBtnText: { color: C.danger, fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },

  assignBtn:     { backgroundColor: C.steel, borderRadius: 10, paddingVertical: 15, alignItems: "center", elevation: 4, marginTop: 8 },
  assignBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
});
