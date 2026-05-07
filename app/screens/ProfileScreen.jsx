import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "./ScreenHeader";

import { API_URL } from '../../api';
import { getRoleLabel, normalizeRoleId } from "../constants/roles";

const resolveProfile = (raw) => ({
  ...raw,
  first_name: raw?.first_name || raw?.firstname || "",
  last_name: raw?.last_name || raw?.lastname || raw?.surname || "",
  middle_initial: raw?.middle_initial || raw?.middle_name || raw?.middlename || raw?.mi || "",
  email: raw?.email || "",
  contact_number: raw?.contact_number || raw?.contact || raw?.phone || raw?.mobile || "",
  department: raw?.department || raw?.office || raw?.office_name || raw?.department_name || raw?.college || "",
  username: raw?.username || "",
  role_id: raw?.role_id,
});

export default function ProfileScreen({ user, onBack, onUpdateUser, onNavigate }) {
  const [profileData, setProfileData] = useState(resolveProfile(user));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: profileData.first_name, last_name: profileData.last_name,
    middle_initial: profileData.middle_initial, email: profileData.email,
    contact_number: profileData.contact_number, department: profileData.department,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data?.data || data?.user || data;
          const resolved = resolveProfile({ ...user, ...raw });
          setProfileData(resolved);
          setForm({
            first_name: resolved.first_name, last_name: resolved.last_name,
            middle_initial: resolved.middle_initial, email: resolved.email,
            contact_number: resolved.contact_number, department: resolved.department,
          });
        }
      } catch (_e) {}
      finally { setFetchLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError(""); setSuccess(false);
    if (!form.first_name.trim()) { setError("First name required."); return; }
    if (!form.last_name.trim()) { setError("Last name required."); return; }
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
        const u = { ...user, ...profileData, ...form };
        await AsyncStorage.setItem("user", JSON.stringify(u));
        setProfileData(resolveProfile(u));
        onUpdateUser && onUpdateUser(u);
        setSuccess(true); setEditing(false);
      } else setError(data.message || "Failed to update.");
    } catch (_e) { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  const initials = (profileData.first_name?.[0] || "") + (profileData.last_name?.[0] || "");
  const roleLabel = getRoleLabel(normalizeRoleId(profileData.role_id));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenHeader title="My Profile" onBack={onBack} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {fetchLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.avatarText}>{initials}</Text>}
          </View>
          <Text style={styles.fullName}>{profileData.first_name} {profileData.last_name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
          <Text style={styles.username}>@{profileData.username}</Text>
        </View>

        <View style={styles.body}>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          {success ? <View style={styles.successBox}><Text style={styles.successText}>Profile updated!</Text></View> : null}

          {!editing ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => { setEditing(true); setSuccess(false); }}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <InfoRow label="First Name" value={profileData.first_name} />
              <InfoRow label="Last Name" value={profileData.last_name} />
              <InfoRow label="Middle Initial" value={profileData.middle_initial} />
              <InfoRow label="Email" value={profileData.email} />
              <InfoRow label="Contact" value={profileData.contact_number} />
              <InfoRow label="Department" value={profileData.department} last />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput style={styles.input} value={form.first_name} onChangeText={v => set("first_name", v)} />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Last Name *</Text>
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
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>SAVE</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            <InfoRow label="Username" value={profileData.username} />
            <InfoRow label="Role" value={roleLabel} last />
          </View>

          <TouchableOpacity style={styles.manualBtn} onPress={() => onNavigate && onNavigate('UserManual')} activeOpacity={0.85}>
            <Ionicons name="book-outline" size={18} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.manualBtnText}>User Manual</Text>
            <Ionicons name="chevron-forward" size={16} color="#C9A84C" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
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
  root: { flex: 1, backgroundColor: "#F0F2F5" }, scroll: { paddingBottom: 40 },
  avatarSection: { backgroundColor: "#0B1F3A", alignItems: "center", paddingVertical: 20, paddingBottom: 28 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#1E4D8C", borderWidth: 3, borderColor: "#C9A84C", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { fontSize: 24, fontWeight: "900", color: "#fff" },
  fullName: { color: "#fff", fontSize: 18, fontWeight: "800" },
  rolePill: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  rolePillText: { fontSize: 11, color: "#C9A84C", fontWeight: "700", letterSpacing: 1 },
  username: { color: "#6A85A8", fontSize: 13, marginTop: 4 },
  body: { padding: 14 },
  errorBox: { backgroundColor: "#FEE8E8", borderLeftWidth: 4, borderLeftColor: "#9B1C1C", borderRadius: 10, padding: 12, marginBottom: 10 },
  errorText: { color: "#9B1C1C", fontSize: 13, fontWeight: "600" },
  successBox: { backgroundColor: "#EAF6EF", borderLeftWidth: 4, borderLeftColor: "#1A7A4A", borderRadius: 10, padding: 12, marginBottom: 10 },
  successText: { color: "#1A7A4A", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#DDE3EC", elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: "800", color: "#0B1F3A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#0B1F3A", borderRadius: 8 },
  editBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#DDE3EC" },
  infoLabel: { fontSize: 13, color: "#8A9BB0", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#0B1F3A", fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  row: { flexDirection: "row", gap: 10 }, half: { flex: 1 },
  label: { fontSize: 11, fontWeight: "800", color: "#0B1F3A", marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { backgroundColor: "#F0F2F5", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: "#0B1F3A", borderWidth: 1.5, borderColor: "#DDE3EC" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: "#DDE3EC" },
  cancelText: { fontSize: 13, fontWeight: "700", color: "#8A9BB0" },
  saveBtn: { flex: 2, backgroundColor: "#0B1F3A", borderRadius: 10, paddingVertical: 13, alignItems: "center", elevation: 3 },
  saveText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  manualBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#0B1F3A", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#C9A84C", elevation: 2 },
  manualBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

