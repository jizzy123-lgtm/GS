import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "./ScreenHeader";
import { normalizeRoleId } from "../constants/roles";
import { getTargetFromNotificationLike } from "../../utils/notificationNavigation";

import { API_URL } from '../../api';
const C = {
  navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5", surface: "#FFFFFF",
  border: "#DDE3EC", textMute: "#8A9BB0", success: "#1A7A4A", successBg: "#EAF6EF",
  warn: "#B45C10", warnBg: "#FEF3E2", danger: "#9B1C1C", dangerBg: "#FEE8E8",
  info: "#155E8A", infoBg: "#E6F2FA",
};
const ICONS = { director: "notifications", request: "notifications", approved: "checkmark-circle", disapproved: "close-circle", completed: "ribbon", pending: "time", feedback: "chatbubble", schedule: "calendar", default: "notifications" };

export default function NotificationsScreen({ user, onBack, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : data.data || []);
    } catch (_e) { setNotifications([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (_e) { }
  };

  const markRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/${id}/read`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (_e) { }
  };

  const handleTap = async (n) => {
    if (!n?.read_at) await markRead(n.id);
    const target = getTargetFromNotificationLike(n, normalizeRoleId(user?.role_id));
    if (target?.screen && onNavigate) {
      onNavigate(target.screen, target.params);
      return;
    }
    Alert.alert(
      n?.data?.title || n?.title || "Notification",
      n?.data?.message || n?.message || n?.body || "You have a new notification."
    );
  };

  useEffect(() => { fetch_(); }, []);
  const onRefresh = () => { setRefreshing(true); fetch_(); };
  const unread = notifications.filter(n => !n.read_at).length;

  const getIcon = (n) => {
    const t = n.type?.toLowerCase() || n.data?.type?.toLowerCase() || "";
    for (const k of Object.keys(ICONS)) if (t.includes(k)) return ICONS[k];
    return ICONS.default;
  };

  const getNotificationReason = (n) => {
    const candidates = [
      n?.data?.rejection_reason,
      n?.data?.disapproval_reason,
      n?.data?.reason,
      n?.data?.remarks,
      n?.data?.comment,
      n?.rejection_reason,
      n?.disapproval_reason,
      n?.reason,
      n?.remarks,
      n?.comment,
    ];
    const value = candidates.find((item) => String(item || "").trim().length > 0);
    return value ? String(value).trim() : "";
  };

  const getDisplayMessage = (n) => {
    const base = String(n?.data?.message || n?.message || n?.body || "New notification.").trim();
    const reason = getNotificationReason(n);
    if (!reason) return base;
    const hasReasonAlready = /reason\s*:/i.test(base);
    if (hasReasonAlready) return base;
    return `${base}\nReason: ${reason}`;
  };

  return (
    <>
      <ScreenHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : undefined}
        onBack={onBack}
        rightAction={unread > 0 ? { label: "Mark all read", onPress: markAllRead } : undefined}
      />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}>
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-off" size={48} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>You are all caught up!</Text>
            </View>
          ) : notifications.map((n, i) => (
            <TouchableOpacity key={n.id || i} style={[styles.card, !n.read_at && styles.cardUnread]} onPress={() => handleTap(n)} activeOpacity={0.8}>
              <View style={[styles.iconBox, !n.read_at && styles.iconBoxUnread]}>
                <Ionicons name={getIcon(n)} size={18} color={!n.read_at ? C.navy : C.textMute} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, !n.read_at && { color: C.navy, fontWeight: "800" }]} numberOfLines={1}>
                    {n.data?.title || n.title || "Notification"}
                  </Text>
                  {!n.read_at && <View style={styles.dot} />}
                </View>
                <Text style={styles.cardMsg} numberOfLines={3}>{getDisplayMessage(n)}</Text>
                <Text style={styles.cardTime}>{n.created_at?.slice(0, 16).replace("T", " ") || ""}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F0F2F5" }, scroll: { paddingBottom: 40 },
  body: { padding: 14 },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: "#DDE3EC", elevation: 1 },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: "#0B1F3A", backgroundColor: "#F0F4FF" },
  iconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#F0F2F5", alignItems: "center", justifyContent: "center" },
  iconBoxUnread: { backgroundColor: "#E0E8FF" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#8A9BB0", flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0B1F3A" },
  cardMsg: { fontSize: 13, color: "#64748b", marginTop: 2, lineHeight: 18 },
  cardTime: { fontSize: 11, color: "#8A9BB0", marginTop: 4 },
  emptyCard: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0B1F3A", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#8A9BB0", textAlign: "center" },
});
