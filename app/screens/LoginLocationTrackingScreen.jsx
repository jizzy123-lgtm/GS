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
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
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
  bg: "#F4F7FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  border: "#E2E8F0",
  textMute: "#64748B",
  textDark: "#1E293B",
  success: "#10B981",
  successBg: "#D1FAE5",
  warn: "#F59E0B",
  warnBg: "#FEF3C7",
  danger: "#EF4444",
  dangerBg: "#FEE2E2",
  info: "#3B82F6",
  infoBg: "#DBEAFE",
};

const ELIGIBLE_ROLE_LABELS = ["Requester", "Head", "Staff", "Campus Director"];

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

const formatRelativeTime = (value) => {
  const parsed = Date.parse(value || "");
  if (Number.isNaN(parsed)) return "No recent activity";

  const diffMs = Date.now() - parsed;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDateTime(value);
};

const handleOpenMap = (lat, lng) => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url).catch(() => {});
};

const formatCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Unavailable Location";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

const getRoleTone = (roleId) => {
  if (roleId === ROLE_IDS.HEAD) return { color: C.info, bg: C.infoBg };
  if (roleId === ROLE_IDS.STAFF) return { color: C.success, bg: C.successBg };
  if (roleId === ROLE_IDS.CAMPUS_DIRECTOR) return { color: C.warn, bg: C.warnBg };
  if (roleId === ROLE_IDS.REQUESTER) return { color: '#8B5CF6', bg: '#EDE9FE' }; // Purple for requesters
  return { color: C.textMute, bg: C.surfaceAlt };
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
      setTimeout(() => setMessage(""), 5000); // clear success msg after 5s
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackingData();
  };

  if (!isAdmin) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Location Tracking" onBack={onBack} />
        <View style={styles.centerBox}>
          <View style={styles.blockedCard}>
            <Ionicons name="shield-half-outline" size={42} color={C.warn} style={{ marginBottom: 12 }} />
            <Text style={styles.blockedEyebrow}>Restricted Access</Text>
            <Text style={styles.blockedTitle}>Admin Privileges Required</Text>
            <Text style={styles.blockedText}>
              Security & audit logs are strictly isolated to system administrators to protect personnel privacy.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Audit & Security" subtitle="Login Location Tracking" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={C.steel} size="large" />
            <Text style={styles.loadingText}>Synchronizing audit logs...</Text>
          </View>
        ) : (
          <>
            {error ? <MessageBox tone="error" text={error} /> : null}
            {messageTone && message ? <MessageBox tone={messageTone} text={message} /> : null}

            {/* Master Tracking Switch Panel */}
            <View style={styles.masterSettingsPanel}>
              <View style={styles.panelHeader}>
                <Ionicons name="location-outline" size={22} color={C.navy} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.panelTitle}>Master Tracking Control</Text>
                  <Text style={styles.panelSubtitle}>Record GPS logs during user authentication</Text>
                </View>
                {toggleLoading ? (
                  <ActivityIndicator color={C.steel} size="small" style={{ marginRight: 8 }} />
                ) : null}
                <Switch
                  value={trackingEnabled}
                  onValueChange={handleToggle}
                  disabled={toggleLoading}
                  trackColor={{ false: C.border, true: C.success }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : trackingEnabled ? '#FFFFFF' : '#f4f3f4'}
                  style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 0.9 : 1.1 }, { scaleY: Platform.OS === 'ios' ? 0.9 : 1.1 }] }}
                />
              </View>

              <View style={styles.trackedRolesContainer}>
                <Text style={styles.trackedRolesLabel}>ELIGIBLE ROLES:</Text>
                <View style={styles.rolePillRow}>
                  {ELIGIBLE_ROLE_LABELS.map((label) => (
                    <Text key={label} style={styles.rolePillText}>{label}</Text>
                  ))}
                </View>
              </View>
            </View>

            {/* How It Works Note */}
            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={20} color={C.info} />
              <Text style={styles.noteText}>
                Requires active location permission on device. If GPS is blocked or disabled, the login process will proceed securely without coordinates.
              </Text>
            </View>

            {/* Logs List Section */}
            <View style={styles.logHeaderArea}>
              <Text style={styles.sectionTitle}>Recent Activity Logs</Text>
              <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
                <Ionicons name="refresh" size={18} color={C.textMute} />
              </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="map-outline" size={32} color={C.border} />
                </View>
                <Text style={styles.emptyTitle}>No tracking data available</Text>
                <Text style={styles.emptyText}>New login activities will appear here once tracking is active and personnel authenticate.</Text>
              </View>
            ) : (
              logs.map((logItem) => {
                const normalizedLogRoleId = normalizeRoleId(logItem?.role_id);
                const roleTone = getRoleTone(normalizedLogRoleId);
                const hasLocation = Number.isFinite(Number(logItem.latitude)) && Number.isFinite(Number(logItem.longitude));

                return (
                  <View key={logItem.id} style={styles.auditCard}>
                    <View style={styles.auditCardHeader}>
                      <View style={[styles.avatarCircle, { backgroundColor: roleTone.bg }]}>
                        <Text style={[styles.avatarText, { color: roleTone.color }]}>
                          {(logItem.account_name || "U")[0].toUpperCase()}
                        </Text>
                      </View>
                      
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.auditName} numberOfLines={1}>{logItem.account_name || "Unknown Account"}</Text>
                        <Text style={styles.auditRoleLabel}>{getRoleLabel(normalizedLogRoleId, "User")}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.auditRelativeTime}>{formatRelativeTime(logItem.created_at)}</Text>
                        <Text style={styles.auditAbsoluteTime}>{formatDateTime(logItem.created_at)}</Text>
                      </View>
                    </View>

                    <View style={styles.auditCardBody}>
                      <View style={styles.dataRow}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="pin-outline" size={16} color={C.textMute} />
                        </View>
                        <View style={{ flex: 1, paddingLeft: 10 }}>
                          <Text style={styles.dataLabel}>LOCATION ADDRESS</Text>
                          {hasLocation ? (
                            <TouchableOpacity onPress={() => handleOpenMap(logItem.latitude, logItem.longitude)} activeOpacity={0.6}>
                              <Text style={[styles.dataValue, { color: C.info, textDecorationLine: 'underline' }]} numberOfLines={2}>
                                {logItem.address || "Address unresolved"}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={[styles.dataValue, !logItem.address && styles.dataValueEmpty]} numberOfLines={2}>
                              {logItem.address || "Address unresolved"}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.dataSeparator} />

                      <View style={styles.dataRow}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="compass-outline" size={16} color={hasLocation ? C.textMute : C.danger} />
                        </View>
                        <View style={{ flex: 1, paddingLeft: 10 }}>
                          <Text style={styles.dataLabel}>GPS COORDINATES</Text>
                          <Text style={[styles.dataValue, !hasLocation && { color: C.danger }]}>
                            {formatCoordinates(logItem.latitude, logItem.longitude)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MessageBox({ tone, text }) {
  const isError = tone === "error";
  return (
    <View style={[styles.messageBox, { backgroundColor: isError ? C.dangerBg : C.successBg }]}>
      <Ionicons name={isError ? "warning-outline" : "checkmark-circle-outline"} size={20} color={isError ? C.danger : C.success} style={{ marginRight: 8 }} />
      <Text style={[styles.messageText, { color: isError ? C.danger : C.success }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 60 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, marginTop: 40 },
  loadingText: { marginTop: 16, fontSize: 13, color: C.textMute, fontWeight: "600", letterSpacing: 0.5 },
  
  // Restricted State
  blockedCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: "center",
    shadowColor: C.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  blockedEyebrow: { fontSize: 12, fontWeight: "800", color: C.danger, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  blockedTitle: { fontSize: 20, fontWeight: "800", color: C.textDark, marginBottom: 12, textAlign: "center" },
  blockedText: { fontSize: 13, lineHeight: 22, color: C.textMute, textAlign: "center" },

  // Alerts
  messageBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 16 },
  messageText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  // Master Settings Panel
  masterSettingsPanel: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  panelTitle: { fontSize: 16, fontWeight: "700", color: C.textDark, marginBottom: 2 },
  panelSubtitle: { fontSize: 12, color: C.textMute },
  trackedRolesContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 16 },
  trackedRolesLabel: { fontSize: 10, fontWeight: "800", color: C.textMute, letterSpacing: 0.5, marginRight: 12 },
  rolePillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 },
  rolePillText: { color: C.steel, fontSize: 12, fontWeight: "600", backgroundColor: C.infoBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },

  // Info Note
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 10,
    marginBottom: 24,
    marginHorizontal: 4,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: C.textMute, marginLeft: 10 },

  // Headers
  logHeaderArea: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.navy, letterSpacing: 0.5 },
  refreshIconBtn: { padding: 6 },

  // Empty State
  emptyCard: {
    backgroundColor: 'transparent',
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, maxWidth: '80%' },

  // Audit Cards
  auditCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  auditCardHeader: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatarCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: "800" },
  auditName: { fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 2 },
  auditRoleLabel: { fontSize: 11, color: C.textMute, fontWeight: "500" },
  auditRelativeTime: { fontSize: 12, fontWeight: "600", color: C.steel, textAlign: 'right', marginBottom: 2 },
  auditAbsoluteTime: { fontSize: 10, color: C.textMute, textAlign: 'right' },
  
  auditCardBody: { padding: 14, backgroundColor: '#FAFAFA', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dataSeparator: { height: 1, backgroundColor: C.border, marginVertical: 12, marginLeft: 26 },
  iconContainer: { width: 16, alignItems: 'center', marginTop: 2 },
  dataLabel: { fontSize: 9, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  dataValue: { fontSize: 13, color: C.textDark, fontWeight: "500", lineHeight: 18 },
  dataValueEmpty: { color: C.textMute, fontStyle: 'italic' },
});
