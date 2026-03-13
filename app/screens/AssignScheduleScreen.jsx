import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";

const C = {
  navy:      "#0B1F3A",
  steel:     "#1E4D8C",
  gold:      "#C9A84C",
  bg:        "#F0F2F5",
  surface:   "#FFFFFF",
  border:    "#DDE3EC",
  textMute:  "#8A9BB0",
  danger:    "#9B1C1C",
  dangerBg:  "#FEE8E8",
  success:   "#1A7A4A",
  successBg: "#EAF6EF",
  warn:      "#B45C10",
  warnBg:    "#FEF3E2",
  info:      "#155E8A",
  infoBg:    "#E6F2FA",
};

const PRIORITY_LEVELS = [
  { key: "low",      label: "Low",      color: C.success },
  { key: "medium",   label: "Medium",   color: C.warn },
  { key: "high",     label: "High",     color: C.danger },
  { key: "urgent",   label: "Urgent",   color: "#6B21A8" },
];

const TIME_SLOTS = [
  "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
];

export default function AssignScheduleScreen({ user, requestId, request, onBack, onSuccess }) {
  const [confirmedRequests, setConfirmedRequests] = useState([]);
  const [selectedRequest,   setSelectedRequest]   = useState(request || null);
  const [loading,           setLoading]           = useState(!request);
  const [submitting,        setSubmitting]         = useState(false);
  const [success,           setSuccess]           = useState(false);
  const [error,             setError]             = useState("");

  const [scheduledDate,  setScheduledDate]  = useState("");
  const [scheduledTime,  setScheduledTime]  = useState("");
  const [assignedStaff,  setAssignedStaff]  = useState(
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
  );
  const [priority,       setPriority]       = useState(request?.priority || "medium");
  const [notes,          setNotes]          = useState("");

  // Fetch confirmed requests if no specific request passed
  useEffect(() => {
    if (!request) {
      fetchConfirmedRequests();
    }
  }, []);

  const fetchConfirmedRequests = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/staff/requests`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      const all = Array.isArray(data) ? data : data.data || [];
      // Only show confirmed/approved requests that don't have a schedule yet
      const confirmed = all.filter(r =>
        (r.status?.toLowerCase() === "confirmed" || r.status?.toLowerCase() === "approved")
        && !r.scheduled_date
      );
      setConfirmedRequests(confirmed);
    } catch (e) {
      setConfirmedRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    setError("");
    if (!selectedRequest) { setError("Please select a request."); return; }
    if (!scheduledDate.trim()) { setError("Please enter a scheduled date."); return; }
    if (!scheduledTime) { setError("Please select a time slot."); return; }
    if (!assignedStaff.trim()) { setError("Please enter the assigned staff name."); return; }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/requests/${selectedRequest.id}/assign-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          assigned_staff: assignedStaff,
          priority,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to assign schedule.");
      }
    } catch (e) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <View style={styles.successRoot}>
        <View style={styles.topBar} />
        <View style={styles.successContent}>
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>✓</Text>
          </View>
          <Text style={styles.successOrg}>GSU GATEWAY</Text>
          <Text style={styles.successTitle}>Schedule Assigned!</Text>
          <Text style={styles.successSub}>
            The maintenance schedule has been assigned successfully.
            The requester will be notified.
          </Text>
          <View style={styles.successCard}>
            <Text style={styles.successCardTitle}>Schedule Details</Text>
            <DetailRow label="Request"  value={selectedRequest?.maintenance_type || selectedRequest?.type} />
            <DetailRow label="Date"     value={scheduledDate} />
            <DetailRow label="Time"     value={scheduledTime} />
            <DetailRow label="Staff"    value={assignedStaff} />
            <DetailRow label="Priority" value={priority} last />
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={onSuccess} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>BACK TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Assign Schedule</Text>
            <Text style={styles.headerSub}>Assign maintenance schedule for confirmed requests</Text>
          </View>
        </View>

        <View style={styles.body}>

          {error ? (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          ) : null}

          {/* Select Request (if not pre-selected) */}
          {!request && (
            <>
              <SectionHeader title="Select Request" />
              {loading ? (
                <ActivityIndicator color={C.steel} style={{ marginVertical: 20 }} />
              ) : confirmedRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No confirmed requests awaiting schedule.</Text>
                </View>
              ) : (
                confirmedRequests.map((req, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.reqSelectCard, selectedRequest?.id === req.id && styles.reqSelectCardActive]}
                    onPress={() => { setSelectedRequest(req); setPriority(req.priority || "medium"); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reqSelectType}>{req.maintenance_type || req.type}</Text>
                    <Text style={styles.reqSelectMeta}>{req.location} · {req.created_at?.slice(0, 10)}</Text>
                    {selectedRequest?.id === req.id && (
                      <View style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Show selected request summary */}
          {selectedRequest && (
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryTitle}>Request Summary</Text>
              <Text style={styles.selectedSummaryType}>{selectedRequest.maintenance_type || selectedRequest.type}</Text>
              <Text style={styles.selectedSummaryMeta}>{selectedRequest.location} · Priority: {selectedRequest.priority}</Text>
              {selectedRequest.description ? (
                <Text style={styles.selectedSummaryDesc} numberOfLines={2}>{selectedRequest.description}</Text>
              ) : null}
            </View>
          )}

          {/* Schedule Details */}
          <SectionHeader title="Schedule Details" />

          <Text style={styles.label}>Scheduled Date <Text style={{ color: C.danger }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-03-15 or March 15, 2026"
            placeholderTextColor="#a0aec0"
            value={scheduledDate}
            onChangeText={setScheduledDate}
          />

          <Text style={styles.label}>Time Slot <Text style={{ color: C.danger }}>*</Text></Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.timeBtn, scheduledTime === slot && styles.timeBtnActive]}
                onPress={() => setScheduledTime(slot)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeBtnText, scheduledTime === slot && styles.timeBtnTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Assigned Staff <Text style={{ color: C.danger }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Staff name"
            placeholderTextColor="#a0aec0"
            value={assignedStaff}
            onChangeText={setAssignedStaff}
          />

          {/* Priority */}
          <SectionHeader title="Priority Schedule" />
          <View style={styles.priorityGrid}>
            {PRIORITY_LEVELS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.priorityBtn, priority === p.key && { backgroundColor: p.color, borderColor: p.color }]}
                onPress={() => setPriority(p.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.priorityText, priority === p.key && { color: "#fff" }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Additional instructions or notes..."
            placeholderTextColor="#a0aec0"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || !selectedRequest) && { opacity: 0.6 }]}
            onPress={handleAssign}
            disabled={submitting || !selectedRequest}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>ASSIGN SCHEDULE</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <View style={[styles.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  topBar:      { height: 4, backgroundColor: C.gold },
  header:      { backgroundColor: C.navy, paddingBottom: 20 },
  headerInner: { paddingHorizontal: 20, paddingTop: 14 },
  backBtn:     { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 12 },
  backText:    { color: "#8A9FC0", fontSize: 12, fontWeight: "700" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub:   { color: "#6A85A8", fontSize: 12, marginTop: 4 },

  body: { padding: 16 },

  errorBox:  { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 },
  sectionAccent: { width: 4, height: 16, backgroundColor: C.gold, borderRadius: 2 },
  sectionTitle:  { fontSize: 12, fontWeight: "800", color: C.navy, textTransform: "uppercase", letterSpacing: 1 },

  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },

  reqSelectCard:       { backgroundColor: C.surface, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: C.border },
  reqSelectCardActive: { borderColor: C.steel, backgroundColor: C.infoBg },
  reqSelectType:       { fontSize: 14, fontWeight: "700", color: C.navy },
  reqSelectMeta:       { fontSize: 12, color: C.textMute, marginTop: 3 },
  selectedTag:         { marginTop: 6, backgroundColor: C.steel, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  selectedTagText:     { fontSize: 11, color: "#fff", fontWeight: "700" },

  selectedSummary:      { backgroundColor: C.infoBg, borderRadius: 10, padding: 14, marginBottom: 4, borderLeftWidth: 4, borderLeftColor: C.steel },
  selectedSummaryTitle: { fontSize: 10, fontWeight: "800", color: C.info, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  selectedSummaryType:  { fontSize: 15, fontWeight: "800", color: C.navy },
  selectedSummaryMeta:  { fontSize: 12, color: C.textMute, marginTop: 3 },
  selectedSummaryDesc:  { fontSize: 12, color: C.textMute, marginTop: 4, fontStyle: "italic" },

  label: { fontSize: 11, fontWeight: "800", color: C.navy, marginBottom: 8, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: C.navy, borderWidth: 1.5, borderColor: C.border },
  textarea: { height: 100, paddingTop: 12 },

  timeGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  timeBtn:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  timeBtnActive:   { backgroundColor: C.navy, borderColor: C.navy },
  timeBtnText:     { fontSize: 12, fontWeight: "700", color: C.textMute },
  timeBtnTextActive: { color: "#fff" },

  priorityGrid:    { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  priorityBtn:     { flex: 1, minWidth: "45%", paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  priorityText:    { fontSize: 12, fontWeight: "700", color: C.textMute },

  submitBtn:  { backgroundColor: C.steel, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 24, elevation: 4 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },

  successRoot:      { flex: 1, backgroundColor: C.bg },
  successContent:   { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  successBadge:     { width: 72, height: 72, borderRadius: 36, backgroundColor: C.navy, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successBadgeText: { fontSize: 28, color: C.gold, fontWeight: "900" },
  successOrg:       { fontSize: 10, fontWeight: "900", color: C.textMute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  successTitle:     { fontSize: 22, fontWeight: "900", color: C.navy, marginBottom: 8 },
  successSub:       { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  successCard:      { width: "100%", backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  successCardTitle: { fontSize: 11, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  detailRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel:      { fontSize: 12, color: C.textMute, fontWeight: "600" },
  detailValue:      { fontSize: 13, color: C.navy, fontWeight: "700" },
  doneBtn:          { width: "100%", backgroundColor: C.navy, borderRadius: 10, paddingVertical: 14, alignItems: "center", elevation: 4 },
  doneBtnText:      { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
});
