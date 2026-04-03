import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, Modal, RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../../api";
import { getRoleLabel, normalizeRoleId } from "../constants/roles";
import ScreenHeader from "./ScreenHeader";

const C = {
    bg: "#F0F2F5", surface: "#FFFFFF", surfaceAlt: "#F7F9FC", navy: "#0B1F3A",
    steel: "#1E4D8C", gold: "#C9A84C", text: "#0B1F3A", textMute: "#8A9BB0",
    border: "#DDE3EC", danger: "#9B1C1C", dangerBg: "#FEE8E8", success: "#1A7A4A",
    successBg: "#EAF6EF", info: "#155E8A", infoBg: "#E6F2FA", warn: "#B45C10", warnBg: "#FEF3E2"
};

function UserManagementScreen({ user, onBack }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
            const res = await fetch(`${API_URL}/users-list`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("fetchUsers error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = (user) => {
        Alert.alert(
            "Delete Account",
            `Are you sure you want to delete ${user.first_name} ${user.last_name}'s account? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
                            const res = await fetch(`${API_URL}/users/${user.user_id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                            });
                            if (res.ok) {
                                Alert.alert("Success", "Account deleted.");
                                fetchUsers();
                            } else {
                                const d = await res.json();
                                Alert.alert("Error", d.message || "Failed to delete.");
                            }
                        } catch (_e) { Alert.alert("Error", "Connection failed."); }
                        finally { setActionLoading(false); }
                    }
                }
            ]
        );
    };

    const startEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            contact_number: user.contact_number,
            username: user.username,
        });
    };

    const handleUpdate = async () => {
        setActionLoading(true);
        try {
            const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/${editingUser.user_id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                Alert.alert("Success", "User updated successfully.");
                setEditingUser(null);
                fetchUsers();
            } else {
                const d = await res.json();
                Alert.alert("Error", d.message || "Failed to update.");
            }
        } catch (_e) {
            Alert.alert("Error", "Connection failed.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <ScreenHeader title="User Management" subtitle="Manage all registered system users" onBack={onBack} />

            {loading ? (
                <ActivityIndicator color={C.steel} size="large" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {users.map((u) => (
                        <View key={u.user_id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{u.first_name?.[0]}{u.last_name?.[0]}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.name}>{u.first_name} {u.last_name}</Text>
                                    <Text style={styles.username}>@{u.username}</Text>
                                </View>
                                <View style={[styles.statusPill, { backgroundColor: u.status_id === 2 ? C.successBg : C.warnBg }]}>
                                    <Text style={[styles.statusText, { color: u.status_id === 2 ? C.success : C.warn }]}>
                                        {u.status || "Pending"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardBody}>
                                <InfoRow label="Role" value={getRoleLabel(normalizeRoleId(u.role_id), "") || u.role || "User"} />
                                <InfoRow label="Office" value={u.office || "N/A"} />
                                <InfoRow label="Contact" value={u.contact_number || "N/A"} />
                            </View>

                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(u)}>
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Edit Modal */}
            <Modal visible={!!editingUser} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit User Info</Text>
                        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
                            <Label>First Name</Label>
                            <Input value={editForm.first_name} onChangeText={(v) => setEditForm({ ...editForm, first_name: v })} />

                            <Label>Last Name</Label>
                            <Input value={editForm.last_name} onChangeText={(v) => setEditForm({ ...editForm, last_name: v })} />

                            <Label>Email</Label>
                            <Input value={editForm.email} onChangeText={(v) => setEditForm({ ...editForm, email: v })} />

                            <Label>Contact Number</Label>
                            <Input value={editForm.contact_number} onChangeText={(v) => setEditForm({ ...editForm, contact_number: v })} />

                            <Label>Username</Label>
                            <Input value={editForm.username} onChangeText={(v) => setEditForm({ ...editForm, username: v })} />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingUser(null)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={actionLoading}>
                                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function InfoRow({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}:</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function Label({ children }) {
    return <Text style={styles.inputLabel}>{children}</Text>;
}

function Input({ ...props }) {
    return <TextInput style={styles.input} placeholderTextColor={C.textMute} {...props} />;
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { padding: 16 },
    card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3, borderWidth: 1, borderColor: C.border },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.steel, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    name: { fontSize: 16, fontWeight: "bold", color: C.navy },
    username: { fontSize: 13, color: C.textMute },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
    cardBody: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.surfaceAlt },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    infoLabel: { fontSize: 13, color: C.textMute },
    infoValue: { fontSize: 13, fontWeight: "600", color: C.navy },
    cardActions: { flexDirection: "row", gap: 10, marginTop: 12 },
    editBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: C.surfaceAlt, alignItems: "center", borderWidth: 1, borderColor: C.border },
    editBtnText: { color: C.steel, fontWeight: "bold", fontSize: 13 },
    deleteBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: C.dangerBg, alignItems: "center", borderWidth: 1, borderColor: "rgba(155, 28, 28, 0.2)" },
    deleteBtnText: { color: C.danger, fontWeight: "bold", fontSize: 13 },
    modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: C.navy, marginBottom: 20 },
    inputLabel: { fontSize: 11, fontWeight: "bold", color: C.textMute, textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: C.surfaceAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: C.navy, fontSize: 14, borderWidth: 1, borderColor: C.border },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: C.bg },
    cancelBtnText: { color: C.textMute, fontWeight: "bold" },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: C.steel },
    saveBtnText: { color: "#fff", fontWeight: "bold" },
});

export default UserManagementScreen;
