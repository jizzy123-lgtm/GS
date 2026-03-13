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
const NAVY = "#1a2472";
const NAVY_DARK = "#0d1550";
const TEAL = "#1a5c72";
const CREAM = "#f5f7fa";

const STATUS_CONFIG = {
  pending:     { color: "#f59e0b", bg: "#fffbeb", label: "Pending",     icon: "⏳" },
  approved:    { color: "#10b981", bg: "#f0fdf4", label: "Approved",    icon: "✅" },
  disapproved: { color: "#ef4444", bg: "#fff0f0", label: "Disapproved", icon: "❌" },
  completed:   { color: "#3b82f6", bg: "#eff6ff", label: "Completed",   icon: "🎉" },
  in_progress: { color: "#8b5cf6", bg: "#f5f3ff", label: "In Progress", icon: "🔧" },
};

const FILTERS = ["All", "Pending", "Approved", "Completed", "Disapproved"];

export default function ViewRequestStatusScreen({ onBack, onNavigate, user }) {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const roleId = user?.role_id;
      let endpoint = "/requests";
      if (roleId === 1) endpoint = "/admin/requests";
      else if (roleId === 2) endpoint = "/head/requests";
      else if (roleId === 3) endpoint = "/staff/requests";

      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setRequests(list);
      setFiltered(list);
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    if (activeFilter === "All") setFiltered(requests);
    else setFiltered(requests.filter(r => r.status?.toLowerCase() === activeFilter.toLowerCase()));
  }, [activeFilter, requests]);

  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  if (selected) {
    return <RequestDetail request={selected} onBack={() => setSelected(null)} user={user} onFeedback={() => onNavigate("Feedback", { requestId: selected.id })} />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <Text style={styles.headerSub}>{filtered.length} request{filtered.length !== 1 ? "s" : ""} found</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
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

      {/* List */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={NAVY} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} requests found.</Text>
          </View>
        ) : (
          filtered.map((req, i) => (
            <RequestCard key={i} request={req} onPress={() => setSelected(req)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function RequestCard({ request, onPress }) {
  const status = request.status?.toLowerCase() || "pending";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: config.color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.icon} {config.label}</Text>
        </View>
        <Text style={styles.cardDate}>{request.created_at?.slice(0, 10)}</Text>
      </View>
      <Text style={styles.cardType}>{request.maintenance_type || request.type || "Maintenance Request"}</Text>
      <Text style={styles.cardLocation} numberOfLines={1}>📍 {request.location || "—"}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{request.description || "No description provided."}</Text>
      <Text style={styles.viewMore}>View Details →</Text>
    </TouchableOpacity>
  );
}

function RequestDetail({ request, onBack, user, onFeedback }) {
  const status = request.status?.toLowerCase() || "pending";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isCompleted = status === "completed";
  const isRequester = user?.role_id === 4;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Requests</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
      </View>

      <View style={styles.body}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: config.bg, borderColor: config.color }]}>
          <Text style={[styles.statusBannerText, { color: config.color }]}>{config.icon}  {config.label}</Text>
        </View>

        <DetailRow label="Request ID" value={`#${request.id}`} />
        <DetailRow label="Maintenance Type" value={request.maintenance_type || request.type} />
        <DetailRow label="Priority" value={request.priority} />
        <DetailRow label="Location" value={request.location} />
        <DetailRow label="Description" value={request.description} />
        <DetailRow label="Submitted" value={request.created_at?.slice(0, 10)} />
        {request.remarks && <DetailRow label="Remarks" value={request.remarks} highlight />}

        {isCompleted && isRequester && (
          <TouchableOpacity style={styles.feedbackBtn} onPress={onFeedback} activeOpacity={0.85}>
            <Text style={styles.feedbackBtnText}>💬 Leave Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <View style={[styles.detailRow, highlight && { backgroundColor: "#fffbeb" }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: "#92400e", fontWeight: "700" }]}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  scroll: { paddingBottom: 40 },
  header: {
    backgroundColor: NAVY_DARK, paddingTop: 56, paddingBottom: 28,
    paddingHorizontal: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: "#a0aec0", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSub: { color: "#7a8aaa", fontSize: 13, marginTop: 4 },
  filterRow: { marginTop: 16 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e2e8f0",
  },
  filterBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#fff" },
  body: { padding: 16 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardDate: { fontSize: 11, color: "#94a3b8" },
  cardType: { fontSize: 16, fontWeight: "800", color: NAVY_DARK, marginBottom: 4 },
  cardLocation: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#475569", lineHeight: 18 },
  viewMore: { fontSize: 12, color: TEAL, fontWeight: "700", marginTop: 8, textAlign: "right" },
  emptyCard: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  statusBanner: {
    borderWidth: 1.5, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16,
  },
  statusBannerText: { fontSize: 18, fontWeight: "800" },
  detailRow: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  detailLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, color: NAVY_DARK, fontWeight: "600" },
  feedbackBtn: {
    backgroundColor: TEAL, borderRadius: 16, paddingVertical: 16,
    alignItems: "center", marginTop: 16,
    shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  feedbackBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
