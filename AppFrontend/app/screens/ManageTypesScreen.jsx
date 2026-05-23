import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import { normalizeRoleId, ROLE_IDS } from "../constants/roles";

import { API_URL } from '../../api';
const C = { navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5", surface: "#FFFFFF", surfaceAlt: "#F7F9FC", border: "#DDE3EC", textMute: "#8A9BB0", danger: "#9B1C1C", dangerBg: "#FEE8E8", success: "#1A7A4A", successBg: "#EAF6EF", warn: "#B45C10", warnBg: "#FEF3E2", info: "#155E8A", infoBg: "#E6F2FA" };

export default function ManageTypesScreen({ user, onBack, onNavigate }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | { id, type_name }
  const [typeName, setTypeName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roleId = normalizeRoleId(user?.role_id);
  const isAdmin = roleId === ROLE_IDS.SYSTEM_ADMIN;

  const fetchTypes = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/maintenance-types`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setTypes(list);
    } catch (_e) { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openAdd = () => { setModal("add"); setTypeName(""); setError(""); setSuccess(""); };
  const openEdit = (t) => { setModal({ id: t.id, type_name: t.type_name }); setTypeName(t.type_name); setError(""); setSuccess(""); };
  const closeModal = () => { setModal(null); setTypeName(""); setError(""); setSuccess(""); };

  const handleSubmit = async () => {
    const trimmed = typeName.trim();
    if (!trimmed) { setError("Type name is required."); return; }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const isEdit = modal && modal.id;
      const url = isEdit ? `${API_URL}/maintenance-types/${modal.id}` : `${API_URL}/maintenance-types`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type_name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errors?.type_name) setError(data.errors.type_name.join(", "));
        else setError(data.message || "Operation failed.");
        return;
      }
      setSuccess(data.message || (isEdit ? "Type updated." : "Type added."));
      closeModal();
      fetchTypes();
    } catch (_e) { setError("Cannot connect to server."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (t) => {
    Alert.alert(
      "Delete Type",
      `Are you sure you want to delete "${t.type_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setError("");
            setSuccess("");
            try {
              const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
              const res = await fetch(`${API_URL}/maintenance-types/${t.id}`, {
                method: "DELETE",
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (!res.ok) { setError(data.message || "Delete failed."); return; }
              setSuccess(data.message || "Type deleted.");
              fetchTypes();
            } catch (_e) { setError("Cannot connect to server."); }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScreenHeader title="Manage Types" subtitle="Admin only" onBack={onBack} />
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>You do not have permission to access this screen.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Manage Types" subtitle="Maintenance type categories" onBack={onBack} />
      {error ? <View style={styles.msgBox}><Text style={styles.errorText}>{error}</Text></View> : null}
      {success ? <View style={[styles.msgBox, { backgroundColor: C.successBg, borderLeftColor: C.success }]}><Text style={[styles.errorText, { color: C.success }]}>{success}</Text></View> : null}
      <View style={styles.headerRow}>
        <Text style={styles.headerCount}>{types.length} type{types.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add Type</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={C.steel} style={{ marginTop: 40 }} />
        ) : types.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No maintenance types found.</Text>
          </View>
        ) : (
          types.map((t, i) => (
            <View key={t.id || i} style={styles.typeCard}>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{t.type_name}</Text>
                <Text style={styles.typeId}>ID: {t.id}</Text>
              </View>
              <View style={styles.typeActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(t)} activeOpacity={0.8}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(t)} activeOpacity={0.8}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {modal && (
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modal === "add" ? "Add Type" : "Edit Type"}</Text>
            <Text style={styles.modalLabel}>Type Name *</Text>
            <TextInput
              style={styles.input}
              value={typeName}
              onChangeText={setTypeName}
              placeholder="e.g. Plumbing"
              placeholderTextColor={C.textMute}
              maxLength={255}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!typeName.trim() || submitting) && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={!typeName.trim() || submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{modal === "add" ? "Add" : "Save"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  msgBox: { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginHorizontal: 14, marginTop: 12 },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },
  scroll: { padding: 14, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingTop: 14 },
  headerCount: { fontSize: 12, fontWeight: "700", color: C.textMute },
  addBtn: { backgroundColor: C.steel, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 36, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },
  typeCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", elevation: 1 },
  typeInfo: { flex: 1 },
  typeName: { fontSize: 15, fontWeight: "700", color: C.navy },
  typeId: { fontSize: 11, color: C.textMute, marginTop: 2 },
  typeActions: { flexDirection: "row", gap: 8 },
  editBtn: { backgroundColor: C.infoBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.info },
  editBtnText: { fontSize: 11, fontWeight: "700", color: C.info },
  deleteBtn: { backgroundColor: C.dangerBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.danger },
  deleteBtnText: { fontSize: 11, fontWeight: "700", color: C.danger },
  modalBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: C.surface, borderRadius: 20, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: C.navy, marginBottom: 12 },
  modalLabel: { fontSize: 12, color: C.textMute, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: C.surfaceAlt, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: C.navy, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: C.bg },
  cancelBtnText: { color: C.textMute, fontWeight: "800" },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: C.steel },
  saveBtnText: { color: "#fff", fontWeight: "800" },
});
