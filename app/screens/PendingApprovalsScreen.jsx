import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
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
    navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5",
    surface: "#FFFFFF", border: "#DDE3EC", textMute: "#8A9BB0",
    success: "#1A7A4A", successBg: "#EAF6EF",
    danger: "#9B1C1C", dangerBg: "#FEE8E8",
    warn: "#B45C10", warnBg: "#FEF3E2",
    info: "#155E8A", infoBg: "#E6F2FA",
};

const STATUS = {
    pending: { color: C.warn, bg: C.warnBg, label: "Pending" },
    approved: { color: C.success, bg: C.successBg, label: "Approved" },
    disapproved: { color: C.danger, bg: C.dangerBg, label: "Disapproved" },
    rejected: { color: C.danger, bg: C.dangerBg, label: "Rejected" },
};

const FILTERS = ["All", "Pending", "Approved", "Disapproved"];

function getStatus(user) {
    const s = user?.account_status?.toLowerCase() || user?.status?.toLowerCase() || "pending";
    return STATUS[s] || STATUS.pending;
}

export default function PendingApprovalsScreen({ user, onBack }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("All");
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchAccounts = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
            const res = await fetch(`${API_URL}/users-list`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
            const data = await res.json();
            setAccounts(Array.isArray(data) ? data : data.data || []);
        } catch (e) {
            console.error("fetchAccounts error:", e.name === "TimeoutError" ? "Request timed out" : e.message);
            setAccounts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchAccounts(); };

    const filtered = [...(filter === "All"
        ? accounts
        : accounts.filter(a => {
            const s = a?.account_status?.toLowerCase() || a?.status?.toLowerCase() || "pending";
            return s === filter.toLowerCase();
        }))].sort((a, b) => {
            const timeA = Date.parse(a?.created_at || "");
            const timeB = Date.parse(b?.created_at || "");
            if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
                return timeB - timeA;
            }
            return Number(b?.id || 0) - Number(a?.id || 0);
        });

    const doAction = async (id, action, reason = "") => {
        setActionLoading(true);
        try {
            const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
            const endpoint = action === "approve"
                ? `${API_URL}/users/${id}/updateAccountStatus`
                : `${API_URL}/users/${id}/disapproveAccountStatus`;
            const body = { status_id: action === "approve" ? 2 : 3 };
            if (action === "reject") body.rejection_reason = reason;

            const res = await fetch(endpoint, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const msg = action === "approve" ? "Account approved successfully." : "Account rejected successfully.";
                setSuccessMsg(msg);
                
                // Update local state immediately so UI reflects the change
                const newStatus = action === "approve" ? "approved" : "disapproved";
                if (selected) {
                    setSelected({ ...selected, account_status: newStatus, status: newStatus });
                }
                setAccounts(prev => prev.map(a => (a.id === id || a.user_id === id) ? { ...a, account_status: newStatus, status: newStatus } : a));

                await fetchAccounts(); // Background refresh
                setTimeout(() => {
                    setSuccessMsg("");
                    setSelected(null);
                }, 1500);
            } else {
                const d = await res.json();
                setSuccessMsg(d.message || "Action failed.");
            }
        } catch (_e) {
            setSuccessMsg("Cannot connect to server.");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Detail View ──────────────────────────────────────────────
    if (selected) {
        const s = getStatus(selected);
        const st = selected?.account_status?.toLowerCase() || selected?.status?.toLowerCase() || "pending";
        const isPending = st === "pending";
        const initials = (selected?.first_name?.[0] || selected?.name?.[0] || "?").toUpperCase()
            + (selected?.last_name?.[0] || "").toUpperCase();
        const fullName = selected?.first_name
            ? `${selected.first_name} ${selected.last_name || ""}`.trim()
            : selected?.name || "Unknown User";

        const officeLabel = selected?.office || selected?.office_name || "Not specified";
        const positionLabel = selected?.position || selected?.position_name || "Not specified";
        const roleLabel = selected?.role || selected?.role_name || getRoleLabel(normalizeRoleId(selected?.role_id), "User");

        return (
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                <ScreenHeader
                    title="User Request Details"
                    onBack={() => { setSelected(null); setSuccessMsg(""); }}
                    backLabel="← Back to Requests"
                />
                <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                    {/* Success / Error Message */}
                    {!!successMsg && (
                        <View style={[styles.msgBox, {
                            borderLeftColor: successMsg.includes("success") ? C.success : C.danger,
                            backgroundColor: successMsg.includes("success") ? C.successBg : C.dangerBg,
                        }]}>
                            <Text style={[styles.msgText, { color: successMsg.includes("success") ? C.success : C.danger }]}>
                                {successMsg}
                            </Text>
                        </View>
                    )}

                    {/* Avatar + Name */}
                    <View style={styles.avatarCard}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View>
                            <Text style={styles.detailName}>{fullName}</Text>
                            <Text style={styles.detailEmail}>{selected?.email || "—"}</Text>
                        </View>
                    </View>

                    {/* Info Grid */}
                    <View style={styles.infoGrid}>
                        {/* User Information */}
                        <View style={styles.infoSection}>
                            <Text style={styles.infoSectionTitle}>User Information</Text>
                            <InfoRow label="USERNAME" value={selected?.username} />
                            <InfoRow label="EMAIL" value={selected?.email} />
                            <InfoRow label="CONTACT NUMBER" value={selected?.contact_number} last />
                        </View>

                        {/* Work Information */}
                        <View style={[styles.infoSection, { marginTop: 10 }]}>
                            <Text style={styles.infoSectionTitle}>Work Information</Text>
                            <InfoRow label="OFFICE" value={officeLabel} />
                            <InfoRow label="POSITION" value={positionLabel} />
                            <InfoRow label="ROLE" value={roleLabel} last />
                        </View>
                    </View>

                    {/* Bottom bar */}
                    <View style={styles.bottomBar}>
                        <View style={styles.bottomMeta}>
                            <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                                <Text style={[styles.statusChipText, { color: s.color }]}>
                                    Current Status: {s.label}
                                </Text>
                            </View>
                            {selected?.created_at && (
                                <Text style={styles.regDate}>
                                    Registered on: {new Date(selected.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </Text>
                            )}
                        </View>

                        {isPending && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.rejectBtn, actionLoading && { opacity: 0.6 }]}
                                    onPress={() => setIsRejectModalVisible(true)}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <ActivityIndicator color={C.danger} size="small" /> : (
                                        <Text style={styles.rejectBtnText}>✕  Reject Request</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]}
                                    onPress={() => doAction(selected.user_id || selected.id, "approve")}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                                        <Text style={styles.approveBtnText}>✓  Approve Request</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Rejection Modal */}
                <Modal visible={isRejectModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Reject Request</Text>
                            <Text style={styles.modalSub}>
                                Please provide a reason for rejection. This will be sent to the user.
                            </Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Type reason here..."
                                placeholderTextColor={C.textMute}
                                multiline
                                numberOfLines={4}
                                value={rejectionReason}
                                onChangeText={setRejectionReason}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => { setIsRejectModalVisible(false); setRejectionReason(""); }}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalSubmitBtn, !rejectionReason.trim() && { opacity: 0.5 }]}
                                    disabled={!rejectionReason.trim()}
                                    onPress={() => {
                                        const r = rejectionReason;
                                        setIsRejectModalVisible(false);
                                        setRejectionReason("");
                                        doAction(selected.user_id || selected.id, "reject", r);
                                    }}
                                >
                                    <Text style={styles.modalSubmitText}>Reject and Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // ── List View ─────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <ScreenHeader
                title="Account Approvals"
                subtitle="Manage user account requests"
                onBack={onBack}
            />

            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                            onPress={() => setFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel} />}
                keyboardShouldPersistTaps="handled"
            >
                {loading ? (
                    <ActivityIndicator color={C.steel} style={{ marginTop: 40 }} />
                ) : filtered.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                            No {filter !== "All" ? filter.toLowerCase() : ""} account requests.
                        </Text>
                    </View>
                ) : filtered.map((acct, i) => {
                    const s = getStatus(acct);
                    const fullName = acct?.first_name
                        ? `${acct.first_name} ${acct.last_name || ""}`.trim()
                        : acct?.name || "Unknown User";
                    const initials = (acct?.first_name?.[0] || acct?.name?.[0] || "?").toUpperCase()
                        + (acct?.last_name?.[0] || "").toUpperCase();

                    return (
                        <TouchableOpacity
                            key={acct.id || i}
                            style={[styles.card, { borderLeftColor: s.color }]}
                            onPress={() => setSelected(acct)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardAvatarWrap}>
                                <View style={[styles.cardAvatar, { backgroundColor: C.steel }]}>
                                    <Text style={styles.cardAvatarText}>{initials}</Text>
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.cardName} numberOfLines={1}>{fullName}</Text>
                                    <View style={[styles.chip, { backgroundColor: s.bg }]}>
                                        <Text style={[styles.chipText, { color: s.color }]}>{s.label}</Text>
                                    </View>
                                </View>
                                <Text style={styles.cardEmail} numberOfLines={1}>{acct?.email || "—"}</Text>
                                {acct?.created_at && (
                                    <Text style={styles.cardDate}>
                                        {new Date(acct.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
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
    filterContainer: { marginTop: 12, marginBottom: 4 },
    filterScrollContent: { paddingHorizontal: 14, gap: 10, paddingVertical: 4 },
    filterTab: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: C.border,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    filterTabActive: { backgroundColor: C.navy, borderColor: C.navy, elevation: 4 },
    filterTabText: { fontSize: 13, fontWeight: "600", color: C.textMid },
    filterTabTextActive: { color: "#fff", fontWeight: "700" },

    emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 36, alignItems: "center", borderWidth: 1, borderColor: C.border },
    emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },

    card: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border, elevation: 1, flexDirection: "row", gap: 12, alignItems: "center" },
    cardAvatarWrap: { alignItems: "center", justifyContent: "center" },
    cardAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    cardAvatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
    cardName: { fontSize: 15, fontWeight: "700", color: C.navy, flex: 1 },
    cardEmail: { fontSize: 12, color: C.textMute, marginTop: 2 },
    cardDate: { fontSize: 11, color: C.textMute, marginTop: 4 },
    chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
    chipText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },

    // Detail
    msgBox: { borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 12 },
    msgText: { fontSize: 13, fontWeight: "600" },

    avatarCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.infoBg, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
    avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.steel, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 20, fontWeight: "900", color: "#fff" },
    detailName: { fontSize: 17, fontWeight: "800", color: C.navy },
    detailEmail: { fontSize: 13, color: C.info, marginTop: 2 },

    infoGrid: {},
    infoSection: { backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, elevation: 1 },
    infoSectionTitle: { fontSize: 13, fontWeight: "800", color: C.navy, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 },
    infoRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    infoLabel: { fontSize: 10, fontWeight: "700", color: C.textMute, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 },
    infoValue: { fontSize: 14, fontWeight: "600", color: C.navy },

    bottomBar: { marginTop: 14 },
    bottomMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" },
    statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    statusChipText: { fontSize: 12, fontWeight: "700" },
    regDate: { fontSize: 12, color: C.textMute },

    actionRow: { flexDirection: "row", gap: 10 },
    rejectBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: C.danger },
    rejectBtnText: { color: C.danger, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
    approveBtn: { flex: 1.3, backgroundColor: C.steel, borderRadius: 10, paddingVertical: 14, alignItems: "center", elevation: 3 },
    approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 24, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: "800", color: C.navy, marginBottom: 8 },
    modalSub: { fontSize: 13, color: C.textMute, lineHeight: 18, marginBottom: 16 },
    modalInput: { backgroundColor: C.bg, borderRadius: 10, padding: 14, height: 100, textAlignVertical: "top", color: C.navy, fontSize: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    modalActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
    modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: C.border },
    modalCancelText: { color: C.navy, fontWeight: "700", fontSize: 14 },
    modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: C.danger },
    modalSubmitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
