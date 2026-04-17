import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenHeader from "./ScreenHeader";
import { normalizeRoleId, ROLE_IDS, getRoleLabel } from "../constants/roles";
import {
  extractApiItem,
  extractApiList,
  getApiErrorMessage,
  getAuthHeaders,
  getAuthToken,
} from "../../utils/maintenanceRequests";
import { API_URL } from "../../api";

const C = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  gold: "#C9A84C",
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F9FC",
  border: "#DDE3EC",
  textMute: "#8A9BB0",
  success: "#1A7A4A",
  successBg: "#EAF6EF",
  warn: "#B45C10",
  warnBg: "#FEF3E2",
  danger: "#9B1C1C",
  dangerBg: "#FEE8E8",
  info: "#155E8A",
  infoBg: "#E6F2FA",
};

const sortLogsNewestFirst = (items = []) =>
  [...items].sort((a, b) => {
    const aTime = Date.parse(a?.created_at || "");
    const bTime = Date.parse(b?.created_at || "");
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    return Number(b?.id || 0) - Number(a?.id || 0);
  });

const formatDateTime = (value) => {
  const parsed = Date.parse(value || "");
  if (Number.isNaN(parsed)) return "-";
  return new Date(parsed).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Unavailable";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export default function LoginLocationTrackingScreen({ user, onBack }) {
  const roleId = normalizeRoleId(user?.role_id);
  const isAdmin = roleId === ROLE_IDS.SYSTEM_ADMIN;
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const messageTone = useMemo(() => {
    if (!message) return null;
    return /failed|cannot|unauthorized|authenticated/i.test(message) ? "error" : "success";
  }, [message]);

  const fetchTrackingData = useCallback(async () => {
    if (!isAdmin) {
      setError("Admin account required to manage login location tracking.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");
      const token = await getAuthToken();
      const headers = getAuthHeaders(token);
      const [settingsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/settings`, { headers }),
        fetch(`${API_URL}/login-locations`, { headers }),
      ]);
      const [settingsData, logsData] = await Promise.all([
        settingsRes.json().catch(() => ({})),
        logsRes.json().catch(() => ({})),
      ]);

      if (!settingsRes.ok) {
        throw new Error(getApiErrorMessage(settingsRes.status, settingsData, "Failed to load tracking settings."));
      }
      if (!logsRes.ok) {
        throw new Error(getApiErrorMessage(logsRes.status, logsData, "Failed to load login location logs."));
      }

      const settings = extractApiItem(settingsData) || {};
      setTrackingEnabled(Boolean(settings?.track_login_locations));
      setLogs(sortLogsNewestFirst(extractApiList(logsData)));
    } catch (fetchError) {
      setError(fetchError?.message || "Failed to load login location tracking data.");
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  const handleToggle = async (nextValue) => {
    if (!isAdmin || toggleLoading) return;

    setToggleLoading(true);
    setMessage("");
    setError("");
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/settings/toggle-location-tracking`, {
        method: "POST",
        headers: getAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ track_login_locations: nextValue }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getApiErrorMessage(res.status, data, "Failed to update tracking setting."));
      }

      setTrackingEnabled(Boolean(data?.track_login_locations));
      setMessage(data?.message || `Login location tracking ${nextValue ? "enabled" : "disabled"}.`);
    } catch (toggleError) {
      setMessage(toggleError?.message || "Failed to update tracking setting.");
    } finally {
      setToggleLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackingData();
  };

  if (!isAdmin) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Login Location Tracking" subtitle="Admin-only tracking controls" onBack={onBack} />
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Unauthorized</Text>
          <Text style={styles.emptyText}>Only Admin accounts can manage login location tracking.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Login Location Tracking" subtitle="Manage login-location tracking and audit logs" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={C.steel} size="large" />
            <Text style={styles.loadingText}>Loading tracking settings...</Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={[styles.messageBox, { borderLeftColor: C.danger, backgroundColor: C.dangerBg }]}>
                <Text style={[styles.messageText, { color: C.danger }]}>{error}</Text>
              </View>
            ) : null}
            {messageTone ? (
              <View style={[styles.messageBox, messageTone === "error"
                ? { borderLeftColor: C.danger, backgroundColor: C.dangerBg }
                : { borderLeftColor: C.success, backgroundColor: C.successBg }]}>
                <Text style={[styles.messageText, { color: messageTone === "error" ? C.danger : C.success }]}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Track Login Locations</Text>
                <Text style={styles.toggleSub}>
                  When enabled, new login records are stored for Head, Staff, and Campus Director accounts.
                </Text>
              </View>
              <View style={styles.toggleSide}>
                <View style={[styles.statusChip, trackingEnabled ? styles.statusChipOn : styles.statusChipOff]}>
                  <Text style={[styles.statusChipText, { color: trackingEnabled ? C.success : C.textMute }]}>
                    {trackingEnabled ? "ON" : "OFF"}
                  </Text>
                </View>
                <Switch
                  value={trackingEnabled}
                  onValueChange={handleToggle}
                  disabled={toggleLoading}
                  trackColor={{ false: "#d6deea", true: "#9bd3b3" }}
                  thumbColor={trackingEnabled ? C.success : "#f4f3f4"}
                />
                {toggleLoading ? <ActivityIndicator color={C.steel} size="small" /> : null}
              </View>
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>Frontend behavior</Text>
              <Text style={styles.noteText}>
                The app attempts to attach latitude, longitude, and address on login when location permission is already granted. Login still proceeds if location is unavailable.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Login Location Logs</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No login location logs yet</Text>
                <Text style={styles.emptyText}>New entries appear here when tracking is enabled and eligible users sign in.</Text>
              </View>
            ) : (
              logs.map((logItem) => (
                <View key={logItem.id} style={styles.logCard}>
                  <View style={styles.logTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{logItem.account_name || "Unknown Account"}</Text>
                      <Text style={styles.logMeta}>{getRoleLabel(normalizeRoleId(logItem.role_id), "User")}</Text>
                    </View>
                    <Text style={styles.logDate}>{formatDateTime(logItem.created_at)}</Text>
                  </View>

                  <DetailRow label="Address" value={logItem.address || "Unavailable"} />
                  <DetailRow label="Coordinates" value={formatCoordinates(logItem.latitude, logItem.longitude)} />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textMute, fontWeight: "600" },
  messageBox: { borderLeftWidth: 4, borderRadius: 12, padding: 12, marginBottom: 12 },
  messageText: { fontSize: 13, fontWeight: "600" },
  toggleCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    flexDirection: "row",
    gap: 14,
  },
  toggleLabel: { fontSize: 16, fontWeight: "800", color: C.navy, marginBottom: 6 },
  toggleSub: { fontSize: 13, lineHeight: 19, color: C.textMute },
  toggleSide: { alignItems: "center", justifyContent: "center", gap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  statusChipOn: { backgroundColor: C.successBg },
  statusChipOff: { backgroundColor: C.surfaceAlt },
  statusChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  noteCard: {
    backgroundColor: C.infoBg,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: C.info,
    marginBottom: 16,
  },
  noteTitle: { fontSize: 11, fontWeight: "800", color: C.info, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  noteText: { fontSize: 13, lineHeight: 19, color: C.navy },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  sectionTitle: { flex: 1, fontSize: 12, fontWeight: "800", color: C.navy, textTransform: "uppercase", letterSpacing: 1 },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  refreshBtnText: { color: C.steel, fontSize: 12, fontWeight: "700" },
  emptyCard: { backgroundColor: C.surface, borderRadius: 14, padding: 28, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.navy, marginBottom: 6, textAlign: "center" },
  emptyText: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 19 },
  logCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  logTop: { flexDirection: "row", gap: 12, marginBottom: 8, alignItems: "flex-start" },
  logName: { fontSize: 15, fontWeight: "800", color: C.navy },
  logMeta: { fontSize: 12, color: C.steel, marginTop: 2, fontWeight: "600" },
  logDate: { fontSize: 11, color: C.textMute, fontWeight: "600" },
  detailRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 8 },
  detailLabel: { fontSize: 10, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  detailValue: { fontSize: 13, color: C.navy, fontWeight: "600", lineHeight: 18 },
});
