import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";

const C = {
  navy:      "#0B1F3A",
  navyDark:  "#0d1550",
  steel:     "#1E4D8C",
  gold:      "#C9A84C",
  bg:        "#F0F2F5",
  surface:   "#FFFFFF",
  border:    "#DDE3EC",
  textMute:  "#8A9BB0",
  success:   "#1A7A4A",
  successBg: "#EAF6EF",
  warn:      "#B45C10",
  warnBg:    "#FEF3E2",
  danger:    "#9B1C1C",
  dangerBg:  "#FEE8E8",
  info:      "#155E8A",
  infoBg:    "#E6F2FA",
};

const NOTIF_ICONS = {
  approved:    "✅",
  disapproved: "❌",
  completed:   "🎉",
  pending:     "⏳",
  feedback:    "💬",
  account:     "👤",
  schedule:    "📅",
  default:     "🔔",
};

export default function NotificationsScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [selected,      setSelected]      = useState(null); // for modal

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {}
  };

  const markRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (e) {}
  };

  const handleTap = (notif) => {
    setSelected(notif);
    if (!notif.read_at) markRead(notif.id);
  };

  const closeModal = () => setSelected(null);

  useEffect(() => { fetchNotifications(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const getIcon = (notif) => {
    const type = notif.type?.toLowerCase() || notif.data?.type?.toLowerCase() || "";
    for (const key of Object.keys(NOTIF_ICONS)) {
      if (type.includes(key)) return NOTIF_ICONS[key];
    }
    return NOTIF_ICONS.default;
  };

  const getModalColor = (notif) => {
    const type = notif?.type?.toLowerCase() || notif?.data?.type?.toLowerCase() || "";
    if (type.includes("approved"))    return { color: C.success, bg: C.successBg };
    if (type.includes("disapproved")) return { color: C.danger,  bg: C.dangerBg };
    if (type.includes("completed"))   return { color: C.success, bg: C.successBg };
    if (type.includes("pending"))     return { color: C.warn,    bg: C.warnBg };
    if (type.includes("schedule"))    return { color: C.info,    bg: C.infoBg };
    return { color: C.navy, bg: C.border };
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topBar} />
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={styles.unreadCount}>{unreadCount} unread</Text>
                )}
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* List */}
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={C.navy} style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔕</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map((notif, i) => (
              <TouchableOpacity
                key={notif.id || i}
                style={[styles.notifCard, !notif.read_at && styles.notifCardUnread]}
                onPress={() => handleTap(notif)}
                activeOpacity={0.8}
              >
                <View style={[styles.notifIconBox, !notif.read_at && styles.notifIconBoxUnread]}>
                  <Text style={styles.notifIcon}>{getIcon(notif)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTop}>
                    <Text
                      style={[styles.notifTitle, !notif.read_at && { color: C.navy, fontWeight: "800" }]}
                      numberOfLines={1}
                    >
                      {notif.data?.title || notif.title || "Notification"}
                    </Text>
                    {!notif.read_at && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {notif.data?.message || notif.message || notif.body || "You have a new notification."}
                  </Text>
                  <Text style={styles.notifTime}>
                    {notif.created_at?.slice(0, 16).replace("T", " ") || ""}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── MODAL POPUP ── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>

                {/* Top accent */}
                <View style={[styles.modalTopBar, { backgroundColor: getModalColor(selected).color }]} />

                {/* Icon */}
                <View style={[styles.modalIconBox, { backgroundColor: getModalColor(selected).bg }]}>
                  <Text style={styles.modalIcon}>{selected ? getIcon(selected) : "🔔"}</Text>
                </View>

                {/* Title */}
                <Text style={styles.modalTitle}>
                  {selected?.data?.title || selected?.title || "Notification"}
                </Text>

                {/* Time */}
                <Text style={styles.modalTime}>
                  {selected?.created_at?.slice(0, 16).replace("T", " ") || ""}
                </Text>

                {/* Divider */}
                <View style={styles.modalDivider} />

                {/* Message */}
                <Text style={styles.modalMessage}>
                  {selected?.data?.message || selected?.message || selected?.body || "You have a new notification."}
                </Text>

                {/* Extra data if any */}
                {selected?.data?.request_id ? (
                  <View style={[styles.modalInfoBox, { backgroundColor: getModalColor(selected).bg }]}>
                    <Text style={[styles.modalInfoText, { color: getModalColor(selected).color }]}>
                      Request #{selected.data.request_id}
                    </Text>
                  </View>
                ) : null}

                {/* Close button */}
                <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal} activeOpacity={0.85}>
                  <Text style={styles.modalCloseBtnText}>CLOSE</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  topBar:      { height: 4, backgroundColor: C.gold },
  header:      { backgroundColor: C.navy, paddingBottom: 24 },
  headerInner: { paddingHorizontal: 20, paddingTop: 14 },
  backBtn:     { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 14 },
  backText:    { color: "#8A9FC0", fontSize: 12, fontWeight: "700" },
  headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  unreadCount: { color: C.gold, fontSize: 12, fontWeight: "600", marginTop: 4 },
  markAllBtn:  { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  markAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  body: { padding: 16 },

  notifCard: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: C.surface,
    borderRadius: 12, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: C.border, elevation: 1,
  },
  notifCardUnread:    { borderLeftWidth: 4, borderLeftColor: C.navy, backgroundColor: "#F0F4FF" },
  notifIconBox:       { width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  notifIconBoxUnread: { backgroundColor: "#E0E8FF" },
  notifIcon:          { fontSize: 20 },
  notifTop:           { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle:         { fontSize: 14, fontWeight: "700", color: C.textMute, flex: 1 },
  unreadDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: C.navy },
  notifMessage:       { fontSize: 13, color: "#64748b", marginTop: 3, lineHeight: 18 },
  notifTime:          { fontSize: 11, color: C.textMute, marginTop: 5 },

  emptyCard:  { alignItems: "center", paddingVertical: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.navy, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: C.textMute, textAlign: "center" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalCard: {
    backgroundColor: C.surface, borderRadius: 20, width: "100%",
    overflow: "hidden", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
  },
  modalTopBar:   { height: 5, width: "100%", marginBottom: 24 },
  modalIconBox:  { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalIcon:     { fontSize: 28 },
  modalTitle:    { fontSize: 18, fontWeight: "900", color: C.navy, textAlign: "center", paddingHorizontal: 20 },
  modalTime:     { fontSize: 11, color: C.textMute, marginTop: 4, marginBottom: 14 },
  modalDivider:  { height: 1, backgroundColor: C.border, width: "100%", marginBottom: 16 },
  modalMessage:  { fontSize: 14, color: "#3D5068", lineHeight: 22, textAlign: "center", paddingHorizontal: 24, marginBottom: 16 },
  modalInfoBox:  { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 16 },
  modalInfoText: { fontSize: 13, fontWeight: "700" },
  modalCloseBtn: { width: "100%", backgroundColor: C.navy, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  modalCloseBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
});