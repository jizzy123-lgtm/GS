import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const { width } = Dimensions.get("window");

const C = {
  bg:          "#F0F2F5",
  surface:     "#FFFFFF",
  surfaceAlt:  "#F7F9FC",
  navy:        "#0B1F3A",
  navyMid:     "#162C50",
  steel:       "#1E4D8C",
  steelLight:  "#2E6BC4",
  gold:        "#C9A84C",
  goldLight:   "#F0D080",
  text:        "#0B1F3A",
  textMid:     "#3D5068",
  textMute:    "#8A9BB0",
  border:      "#DDE3EC",
  success:     "#1A7A4A",
  successBg:   "#EAF6EF",
  warn:        "#B45C10",
  warnBg:      "#FEF3E2",
  danger:      "#9B1C1C",
  dangerBg:    "#FEE8E8",
  info:        "#155E8A",
  infoBg:      "#E6F2FA",
};

const ROLE_LABELS = { 1: "Administrator", 2: "Head / Director", 3: "GSO Staff", 4: "Requester" };
const ROLE_COLORS = { 1: C.danger, 2: C.steel, 3: C.success, 4: C.navyMid };

export default function DashboardScreen({ user, onLogout, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const roleId = user?.role_id;
  const roleLabel = ROLE_LABELS[roleId] || "User";
  const roleColor = ROLE_COLORS[roleId] || C.navy;

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
      let endpoint = "/requests";
      if (roleId === 1) endpoint = "/admin/requests";
      else if (roleId === 2) endpoint = "/head/requests";
      else if (roleId === 3) endpoint = "/staff/requests";

      const res = await fetch(`${API_URL}${endpoint}`, { headers, signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      const requests = Array.isArray(data) ? data : data.data || [];
      setRecentRequests(requests.slice(0, 4));
      const pending   = requests.filter(r => r.status?.toLowerCase() === "pending").length;
      const approved  = requests.filter(r => r.status?.toLowerCase() === "approved").length;
      const completed = requests.filter(r => r.status?.toLowerCase() === "completed").length;
      setStats({ total: requests.length, pending, approved, completed });
    } catch (e) {
      setStats({ total: 0, pending: 0, approved: 0, completed: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    onLogout && onLogout();
  };

  const quickActions = getQuickActions(roleId, onNavigate);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── TOP HEADER PANEL ── */}
      <View style={styles.headerPanel}>
        <View style={styles.stripeGold} />
        <View style={styles.stripeSteel} />

        <View style={styles.headerInner}>
          <View style={styles.orgRow}>
            <View style={styles.orgInitials}>
              <Text style={styles.orgInitialsText}>GSU</Text>
            </View>
            <View>
              <Text style={styles.orgName}>General Services Office</Text>
              <Text style={styles.orgSub}>Jose Rizal Memorial State University</Text>
            </View>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.userRow}>
            {/* Avatar — tappable to go to Profile */}
            <TouchableOpacity onPress={() => onNavigate("Profile")} activeOpacity={0.8}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => onNavigate("Profile")} activeOpacity={0.8}>
                <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
              </TouchableOpacity>
              <View style={styles.roleRow}>
                <View style={[styles.rolePill, { backgroundColor: roleColor }]}>
                  <Text style={styles.rolePillText}>{roleLabel}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.dateText}>{today}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.steel} size="large" />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      ) : (
        <>
          {/* ── KPI STATS ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
            <View style={styles.kpiGrid}>
              <KPICard label="Total"    value={stats?.total}     color={C.steel}   bg={C.infoBg} />
              <KPICard label="Pending"  value={stats?.pending}   color={C.warn}    bg={C.warnBg} />
              <KPICard label="Approved" value={stats?.approved}  color={C.success} bg={C.successBg} />
              <KPICard label="Done"     value={stats?.completed} color={C.textMid} bg={C.surfaceAlt} />
            </View>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionArrow}>&gt;</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── RECENT REQUESTS ── */}
          <View style={[styles.section, { marginBottom: 32 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Recent Requests</Text>
              <TouchableOpacity onPress={() => onNavigate("ViewRequestStatus")} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {recentRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No requests to display.</Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Type</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>Status</Text>
                </View>
                {recentRequests.map((req, i) => (
                  <TableRow
                    key={i}
                    request={req}
                    isLast={i === recentRequests.length - 1}
                    onPress={() => onNavigate("ViewRequestStatus", { requestId: req.id })}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function KPICard({ label, value, color, bg }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <Text style={[styles.kpiValue, { color }]}>{value ?? 0}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function TableRow({ request, isLast, onPress }) {
  const statusMap = {
    pending:     { color: C.warn,    bg: C.warnBg,     label: "Pending" },
    approved:    { color: C.success, bg: C.successBg,  label: "Approved" },
    completed:   { color: C.textMid, bg: C.surfaceAlt, label: "Done" },
    disapproved: { color: C.danger,  bg: C.dangerBg,   label: "Denied" },
  };
  const s = statusMap[request.status?.toLowerCase()] || statusMap.pending;

  return (
    <TouchableOpacity
      style={[styles.tableRow, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
        {request.maintenance_type || request.type || "Request"}
      </Text>
      <Text style={[styles.tableCell, { flex: 1.5, color: C.textMute }]}>
        {request.created_at?.slice(0, 10) || "—"}
      </Text>
      <View style={[styles.statusChip, { backgroundColor: s.bg, flex: 1.2, alignSelf: "center" }]}>
        <Text style={[styles.statusChipText, { color: s.color }]}>{s.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getQuickActions(roleId, onNavigate) {
  // Common actions for all roles
  const common = [
    { label: "My Profile",     onPress: () => onNavigate("Profile") },
    { label: "Notifications",  onPress: () => onNavigate("Notifications") },
  ];

  if (roleId === 4) {
    // Requester
    return [
      { label: "New Request",       onPress: () => onNavigate("SubmitRequest") },
      { label: "My Requests",       onPress: () => onNavigate("ViewRequestStatus") },
      { label: "Feedback",          onPress: () => onNavigate("Feedback") },
      ...common,
    ];
  }
  if (roleId === 1) {
    // Admin
    return [
      { label: "All Requests",      onPress: () => onNavigate("ViewRequestStatus") },
      { label: "Review Requests",   onPress: () => onNavigate("ReviewRequests") },
      ...common,
    ];
  }
  if (roleId === 2) {
    // Head / Director
    return [
      { label: "Review Requests",   onPress: () => onNavigate("ReviewRequests") },
      { label: "All Requests",      onPress: () => onNavigate("ViewRequestStatus") },
      ...common,
    ];
  }
  if (roleId === 3) {
    // GSO Staff
    return [
      { label: "Review Requests",   onPress: () => onNavigate("ReviewRequests") },
      { label: "Assign Schedule",   onPress: () => onNavigate("AssignSchedule") },
      { label: "All Requests",      onPress: () => onNavigate("ViewRequestStatus") },
      ...common,
    ];
  }
  return common;
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 20 },

  headerPanel: { backgroundColor: C.navy, paddingBottom: 24, overflow: "hidden" },
  stripeGold:  { height: 4, backgroundColor: C.gold },
  stripeSteel: { height: 2, backgroundColor: C.steelLight },
  headerInner: { paddingHorizontal: 20, paddingTop: 16 },
  orgRow:      { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  orgInitials: { width: 44, height: 44, borderRadius: 8, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  orgInitialsText: { fontSize: 13, fontWeight: "900", color: C.navy, letterSpacing: 0.5 },
  orgName:    { fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  orgSub:     { fontSize: 10, color: "#8A9FC0", marginTop: 1 },
  headerDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 16 },
  userRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.steelLight, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.gold },
  avatarText:   { fontSize: 16, fontWeight: "800", color: "#fff" },
  userName:     { fontSize: 17, fontWeight: "800", color: "#fff" },
  roleRow:      { flexDirection: "row", marginTop: 4 },
  rolePill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  rolePillText: { fontSize: 10, fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
  logoutBtn:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  logoutIcon:   { fontSize: 11, color: "#fff", fontWeight: "700", letterSpacing: 0.5 },
  dateText:     { fontSize: 11, color: "#6A85A8", marginTop: 14 },

  loadingBox:  { alignItems: "center", paddingVertical: 60 },
  loadingText: { color: C.textMute, fontSize: 14, marginTop: 12 },

  section:       { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  sectionAccent: { width: 4, height: 18, backgroundColor: C.gold, borderRadius: 2 },
  sectionTitle:  { fontSize: 13, fontWeight: "800", color: C.text, textTransform: "uppercase", letterSpacing: 1.2, flex: 1 },
  viewAllBtn:    { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.infoBg, borderRadius: 6 },
  viewAllText:   { fontSize: 11, color: C.steel, fontWeight: "700" },

  kpiGrid: { flexDirection: "row", gap: 10 },
  kpiCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 12, alignItems: "center", borderTopWidth: 3, elevation: 2 },
  kpiValue: { fontSize: 22, fontWeight: "900" },
  kpiLabel: { fontSize: 9, color: C.textMute, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 3 },

  actionsGrid: { gap: 10 },
  actionCard:  { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.border, elevation: 1 },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: C.text },
  actionArrow: { fontSize: 16, color: C.textMute },

  tableCard: { backgroundColor: C.surface, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: C.border, elevation: 2 },
  tableHeader:     { flexDirection: "row", backgroundColor: C.surfaceAlt, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  tableHeaderCell: { fontSize: 10, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  tableCell:       { fontSize: 13, color: C.text, fontWeight: "600" },
  statusChip:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignItems: "center" },
  statusChipText:  { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 36, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },
});