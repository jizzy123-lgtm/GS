import {
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

const C = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  gold: "#C9A84C",
  bg: "#F0F2F5",
  border: "#DDE3EC",
  mute: "#8A9BB0",
};

export default function GoogleDuplicateScreen({ accounts = [], googleData, onBack }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Multiple Accounts Found" onBack={onBack} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>

        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>Google account already linked</Text>
          <Text style={styles.infoBannerSub}>
            The Google account{googleData?.email ? ` (${googleData.email})` : ""} is associated with
            multiple existing accounts. Please contact your administrator.
          </Text>
        </View>

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
  accountInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
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