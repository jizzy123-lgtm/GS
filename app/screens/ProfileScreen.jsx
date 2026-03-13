import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";

const C = {
  navy:     "#0B1F3A",
  steel:    "#1E4D8C",
  gold:     "#C9A84C",
  bg:       "#F0F2F5",
  surface:  "#FFFFFF",
  border:   "#DDE3EC",
  textMute: "#8A9BB0",
  danger:   "#9B1C1C",
  dangerBg: "#FEE8E8",
  success:  "#1A7A4A",
  successBg:"#EAF6EF",
};

const ROLE_LABELS = { 1: "Administrator", 2: "Head / Director", 3: "GSO Staff", 4: "Requester" };

export default function ProfileScreen({ user, onBack, onUpdateUser }) {
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error,   setError]     = useState("");

  const [form, setForm] = useState({
    first_name:     user?.first_name     || "",
    last_name:      user?.last_name      || "",
    middle_initial: user?.middle_initial || "",
    email:          user?.email          || "",
    contact_number: user?.contact_number || "",
    department:     user?.department     || "",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    if (!form.first_name.trim()) { setError("First name is required."); return; }
    if (!form.last_name.trim())  { setError("Last name is required."); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, ...form };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        onUpdateUser && onUpdateUser(updatedUser);
        setSuccess(true);
        setEditing(false);
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (e) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.first_name?.[0] || "") + (user?.last_name?.[0] || "");
  const roleLabel = ROLE_LABELS[user?.role_id] || "User";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topBar} />
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleLabel}</Text>
              </View>
            </View>

            <Text style={styles.headerName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.headerUsername}>@{user?.username}</Text>
          </View>
        </View>

        <View style={styles.body}>

          {error ? (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          ) : null}

          {success ? (
            <View style={styles.successBox}><Text style={styles.successText}>Profile updated successfully!</Text></View>
          ) : null}

          {/* Info Card (view mode) */}
          {!editing ? (
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoCardTitle}>Personal Information</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => { setEditing(true); setSuccess(false); }}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <InfoRow label="First Name"      value={user?.first_name} />
              <InfoRow label="Last Name"       value={user?.last_name} />
              <InfoRow label="Middle Initial"  value={user?.middle_initial || "—"} />
              <InfoRow label="Email"           value={user?.email} />
              <InfoRow label="Contact Number"  value={user?.contact_number || "—"} />
              <InfoRow label="Department"      value={user?.department || "—"} last />
            </View>
          ) : (
            // Edit mode
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Edit Profile</Text>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>First Name <Text style={{ color: C.danger }}>*</Text></Text>
                  <TextInput style={styles.input} value={form.first_name} onChangeText={v => set("first_name", v)} />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Last Name <Text style={{ color: C.danger }}>*</Text></Text>
                  <TextInput style={styles.input} value={form.last_name} onChangeText={v => set("last_name", v)} />
                </View>
              </View>

              <Text style={styles.label}>Middle Initial</Text>
              <TextInput style={styles.input} value={form.middle_initial} onChangeText={v => set("middle_initial", v)} maxLength={2} />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={v => set("email", v)} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>Contact Number</Text>
              <TextInput style={styles.input} value={form.contact_number} onChangeText={v => set("contact_number", v)} keyboardType="phone-pad" />

              <Text style={styles.label}>Department / Office</Text>
              <TextInput style={styles.input} value={form.department} onChangeText={v => set("department", v)} />

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Account Info (read-only) */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Account Information</Text>
            <InfoRow label="Username" value={user?.username} />
            <InfoRow label="Role"     value={roleLabel} last />
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  topBar:       { height: 4, backgroundColor: C.gold },
  header:       { backgroundColor: C.navy, paddingBottom: 28 },
  headerInner:  { paddingHorizontal: 20, paddingTop: 14, alignItems: "center" },
  backBtn:      { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 20 },
  backText:     { color: "#8A9FC0", fontSize: 12, fontWeight: "700" },

  avatarWrap:   { alignItems: "center", marginBottom: 12 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1E4D8C", borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText:   { fontSize: 26, fontWeight: "900", color: "#fff" },
  rolePill:     { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  rolePillText: { fontSize: 11, color: C.gold, fontWeight: "700", letterSpacing: 1 },

  headerName:     { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 },
  headerUsername: { color: "#6A85A8", fontSize: 13, marginTop: 2 },

  body: { padding: 16 },

  errorBox:   { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:  { color: C.danger, fontSize: 13, fontWeight: "600" },
  successBox: { backgroundColor: C.successBg, borderLeftWidth: 4, borderLeftColor: C.success, borderRadius: 10, padding: 12, marginBottom: 12 },
  successText:{ color: C.success, fontSize: 13, fontWeight: "600" },

  infoCard:       { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, elevation: 2 },
  infoCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  infoCardTitle:  { fontSize: 12, fontWeight: "800", color: C.navy, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  editBtn:        { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.navy, borderRadius: 8 },
  editBtnText:    { color: "#fff", fontSize: 12, fontWeight: "700" },

  infoRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: 13, color: C.textMute, fontWeight: "600" },
  infoValue: { fontSize: 13, color: C.navy, fontWeight: "700", maxWidth: "60%", textAlign: "right" },

  row:  { flexDirection: "row", gap: 10 },
  half: { flex: 1 },

  label: { fontSize: 11, fontWeight: "800", color: C.navy, marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: C.navy, borderWidth: 1.5, borderColor: C.border },

  btnRow:      { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn:   { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: C.border },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: C.textMute },
  saveBtn:     { flex: 2, backgroundColor: C.navy, borderRadius: 10, paddingVertical: 13, alignItems: "center", elevation: 3 },
  saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
});
