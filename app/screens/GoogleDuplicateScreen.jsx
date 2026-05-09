import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import { API_URL } from "../../api";
import { normalizeRoleId } from "../constants/roles";
import { registerForPushNotificationsAsync } from "../../hooks/usePushNotifications";

const C = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  gold: "#C9A84C",
  bg: "#F0F2F5",
  border: "#DDE3EC",
  mute: "#8A9BB0",
  danger: "#9B1C1C",
  dangerBg: "#FEE8E8",
  successBg: "#EAF6EF",
  successText: "#1A7A4A",
};

export default function GoogleDuplicateScreen({ accounts = [], googleData, onBack, onLoginSuccess }) {
  const [reportingId, setReportingId] = useState(null);
  const [reportedIds, setReportedIds] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleReportDuplicate = async (accountId) => {
    setError("");
    setSuccessMsg("");
    setReportingId(accountId);
    try {
      const res = await fetch(`${API_URL}/auth/google/report-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ google_id: googleData?.google_id, account_id: accountId }),
      });
      const data = await res.json();
      if (res.ok) {
        setReportedIds(prev => [...prev, accountId]);
        setSuccessMsg("Report submitted. Our admin will review this shortly.");
      } else {
        setError(data.message || "Failed to submit report.");
      }
    } catch (_err) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setReportingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Multiple Accounts Found" onBack={onBack} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>Google account already linked</Text>
          <Text style={styles.infoBannerSub}>
            The Google account{googleData?.email ? ` (${googleData.email})` : ""} is associated with
            multiple existing accounts. Please contact your administrator or report a duplicate below.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}
        {successMsg ? (
          <View style={styles.successBox}><Text style={styles.successText}>{successMsg}</Text></View>
        ) : null}

        <Text style={styles.sectionLabel}>LINKED ACCOUNTS</Text>

        {accounts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No account details available.</Text>
          </View>
        ) : (
          accounts.map((acc, i) => (
            <View key={acc.id ?? i} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(acc.first_name?.[0] || acc.username?.[0] || "?").toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>
                    {acc.first_name && acc.last_name
                      ? `${acc.first_name} ${acc.last_name}`
                      : acc.username || "Unknown"}
                  </Text>
                  <Text style={styles.accountUsername}>@{acc.username || "—"}</Text>
                  {acc.role_name || acc.role ? (
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{acc.role_name || acc.role}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {reportedIds.includes(acc.id) ? (
                <View style={styles.reportedBadge}>
                  <Text style={styles.reportedBadgeText}>Reported</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.reportBtn, reportingId === acc.id && { opacity: 0.6 }]}
                  onPress={() => handleReportDuplicate(acc.id)}
                  disabled={reportingId !== null}
                  activeOpacity={0.8}
                >
                  {reportingId === acc.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.reportBtnText}>Report Duplicate</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            If one of these is your account, please log in using your username and password instead.
          </Text>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.backBtnText}>BACK TO LOGIN</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: C.navy, borderRadius: 12, padding: 16, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: C.gold,
  },
  infoBannerTitle: { color: "#fff", fontSize: 14, fontWeight: "800", marginBottom: 6 },
  infoBannerSub: { color: "#8A9BB0", fontSize: 13, lineHeight: 19 },
  errorBox: {
    backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },
  successBox: {
    backgroundColor: C.successBg, borderLeftWidth: 4, borderLeftColor: C.successText,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  successText: { color: C.successText, fontSize: 13, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11, fontWeight: "800", color: C.mute,
    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: "#fff", borderRadius: 12, padding: 20,
    alignItems: "center", borderWidth: 1, borderColor: C.border,
  },
  emptyText: { color: C.mute, fontSize: 13 },
  accountCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, elevation: 2,
  },
  accountInfo: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.steel,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  accountName: { fontSize: 14, fontWeight: "800", color: C.navy },
  accountUsername: { fontSize: 12, color: C.mute, marginTop: 2 },
  rolePill: {
    marginTop: 4, alignSelf: "flex-start",
    backgroundColor: "#EEF2FF", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  rolePillText: { fontSize: 10, color: C.steel, fontWeight: "700" },
  reportBtn: {
    backgroundColor: C.danger, borderRadius: 8, paddingVertical: 10,
    alignItems: "center",
  },
  reportBtnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  reportedBadge: {
    backgroundColor: "#EAF6EF", borderRadius: 8, paddingVertical: 10,
    alignItems: "center", borderWidth: 1, borderColor: C.successText,
  },
  reportedBadgeText: { color: C.successText, fontSize: 12, fontWeight: "700" },
  noteBox: {
    backgroundColor: "#FEF3E2", borderLeftWidth: 4, borderLeftColor: C.gold,
    borderRadius: 8, padding: 12, marginTop: 6, marginBottom: 16,
  },
  noteText: { color: "#B45C10", fontSize: 12, lineHeight: 18 },
  backBtn: {
    backgroundColor: C.navy, borderRadius: 10, paddingVertical: 14,
    alignItems: "center", elevation: 3,
  },
  backBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1.5 },
});
