import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { MAINTENANCE_STATUS, normalizeMaintenanceStatus } from "../constants/maintenanceStatus";
import ScreenHeader from "./ScreenHeader";

import { API_URL } from '../../api';
const C = { navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5", surface: "#FFFFFF", border: "#DDE3EC", textMute: "#8A9BB0", danger: "#9B1C1C", dangerBg: "#FEE8E8", success: "#1A7A4A", successBg: "#EAF6EF", warn: "#B45C10", warnBg: "#FEF3E2", info: "#155E8A", infoBg: "#E6F2FA" };
const TIME_SLOTS = [
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildCalendarCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    cells.push({ day: d, dateStr: cellDate.toISOString().split("T")[0], past: cellDate < today });
  }
  return cells;
}

export default function AssignScheduleScreen({ user, request, onBack, onSuccess }) {
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(request || null);
  const [loading, setLoading] = useState(!request);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState("");
  const [title, setTitle] = useState("Maintenance Schedule");
  const [notes, setNotes] = useState("");

  useEffect(() => { if (!request) fetchApproved(); }, []);

  const fetchApproved = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/maintenance-requests`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const data = await res.json();
      const all = Array.isArray(data) ? data : data.data || [];

      const tRes = await fetch(`${API_URL}/maintenance-types`, { headers: { Authorization: `Bearer ${token}` } });
      const tData = await tRes.json();
      const tList = Array.isArray(tData) ? tData : tData.data || [];
      const tMap = {};
      tList.forEach(t => { tMap[t.id] = t.name || t.type_name; });

      setApprovedRequests(
        all
          .filter((requestItem) => {
            const status = normalizeMaintenanceStatus(requestItem.status, requestItem.status_id);
            const alreadyScheduled = requestItem.scheduled_date && requestItem.scheduled_date !== "";
            const isDone = status === MAINTENANCE_STATUS.DONE;
            return status === MAINTENANCE_STATUS.APPROVED && !alreadyScheduled && !isDone;
          })
          .map(r => ({ ...r, maintenance_type_name: tMap[r.maintenance_type_id] || r.maintenance_type?.name || r.maintenance_type || r.type }))
      );
    } catch (_e) { setApprovedRequests([]); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    setError("");
    if (!selectedRequest) { setError("Please select a request."); return; }
    if (!scheduledDate.trim()) { setError("Please enter a scheduled date."); return; }
    if (!scheduledTime) { setError("Please select a time slot."); return; }
    if (!title.trim()) { setError("Please enter a title."); return; }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/schedule-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          maintenance_request_id: selectedRequest.id,
          title: title.trim(),
          date: scheduledDate,
          time: scheduledTime,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Automatically mark the request as done once a schedule is assigned
        await fetch(`${API_URL}/maintenance-requests/${selectedRequest.id}/mark-done`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        setSuccess(true);
      } else {
        setError(data.message || "Failed to assign schedule.");
      }
    } catch (_e) { setError("Cannot connect to server."); }
    finally { setSubmitting(false); }
  };

  const prevMonth = () => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1));
  const nextMonth = () => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1));
  const calCells = buildCalendarCells(calendarMonth);

  if (success) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={styles.successBadge}><Text style={styles.successBadgeText}>OK</Text></View>
      <Text style={styles.successOrg}>GSU GATEWAY</Text>
      <Text style={styles.successTitle}>Schedule Assigned!</Text>
      <Text style={styles.successSub}>The requester will be notified of their schedule.</Text>
      <View style={styles.successCard}>
        <Text style={styles.successCardTitle}>Schedule Details</Text>
        {[["Request", selectedRequest?.maintenance_type_name || selectedRequest?.maintenance_type || selectedRequest?.type], ["Title", title], ["Date", scheduledDate], ["Time", scheduledTime]].map(([l, v], i, arr) => (
          <View key={i} style={[styles.dRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.dLabel}>{l}</Text>
            <Text style={styles.dValue}>{v || "-"}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={onSuccess} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>BACK TO DASHBOARD</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenHeader title="Assign Schedule" subtitle="Assign schedule for approved requests" onBack={onBack} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          {!request && (
            <>
              <SLabel title="Select Request" />
              {loading ? <ActivityIndicator color={C.steel} style={{ marginVertical: 20 }} />
                : approvedRequests.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>No approved requests awaiting schedule.</Text></View>
                  : approvedRequests.map((req, i) => (
                    <TouchableOpacity key={i} style={[styles.reqCard, selectedRequest?.id === req.id && styles.reqCardActive]} onPress={() => setSelectedRequest(req)} activeOpacity={0.8}>
                      <View style={styles.reqCardTopRow}>
                        <Text style={styles.reqType} numberOfLines={1}>{req.maintenance_type_name || req.maintenance_type?.name || req.maintenance_type || req.type || "Maintenance Request"}</Text>
                        {selectedRequest?.id === req.id && <View style={styles.selectedTag}><Text style={styles.selectedTagText}>Selected</Text></View>}
                      </View>
                      {[
                        ["Location", req.location],
                        ["Requested by", req.requester_name || req.user?.name || req.requester?.name],
                        ["Date Submitted", req.date_requested?.slice(0, 10) || req.created_at?.slice(0, 10)],
                        ["Description", req.details || req.description],
                      ].map(([label, value], idx) => value ? (
                        <View key={idx} style={styles.reqDetailRow}>
                          <Text style={styles.reqDetailLabel}>{label}:</Text>
                          <Text style={styles.reqDetailValue} numberOfLines={2}>{value}</Text>
                        </View>
                      ) : null)}
                    </TouchableOpacity>
                  ))}
            </>
          )}

          {selectedRequest && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Selected Request</Text>
              <Text style={styles.summaryType}>{selectedRequest.maintenance_type || selectedRequest.type}</Text>
              <Text style={styles.summaryMeta}>{selectedRequest.location} - Priority: {selectedRequest.priority_number || selectedRequest.priority || "Pending"}</Text>
            </View>
          )}

          <SLabel title="Schedule Details" />
          <Text style={styles.label}>Scheduled Date *</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCalendar(true)} activeOpacity={0.8}>
            <Text style={[styles.dateBtnText, !scheduledDate && { color: "#a0aec0" }]}>
              {scheduledDate || "Select a date"}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>

          <Modal transparent animationType="fade" visible={showCalendar} onRequestClose={() => setShowCalendar(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.calSheet}>
                <View style={styles.calHeader}>
                  <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                    <Text style={styles.navArrow}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.calMonthLabel}>{MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</Text>
                  <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                    <Text style={styles.navArrow}>›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dayRow}>
                  {DAY_LABELS.map(d => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
                </View>

                <View style={styles.calGrid}>
                  {calCells.map((cell, i) => {
                    if (!cell) return <View key={i} style={styles.calCell} />;
                    const isSelected = scheduledDate === cell.dateStr;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.calCell, isSelected && styles.calCellSelected, cell.past && styles.calCellPast]}
                        onPress={() => { if (!cell.past) { setScheduledDate(cell.dateStr); setShowCalendar(false); } }}
                        disabled={cell.past}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected, cell.past && styles.calCellTextPast]}>
                          {cell.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowCalendar(false)}>
                  <Text style={styles.calCloseBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} placeholder="e.g. Maintenance Schedule" placeholderTextColor="#a0aec0" value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Time Slot *</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot, i) => (
              <TouchableOpacity key={i} style={[styles.timeBtn, scheduledTime === slot.value && styles.timeBtnActive]} onPress={() => setScheduledTime(slot.value)} activeOpacity={0.8}>
                <Text style={[styles.timeBtnText, scheduledTime === slot.value && styles.timeBtnTextActive]}>{slot.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Additional instructions..." placeholderTextColor="#a0aec0" value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" />

          <TouchableOpacity style={[styles.submitBtn, (submitting || !selectedRequest) && { opacity: 0.6 }]} onPress={handleAssign} disabled={submitting || !selectedRequest} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>ASSIGN SCHEDULE</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SLabel({ title }) {
  return (
    <View style={styles.sLabel}>
      <View style={styles.sLabelAccent} />
      <Text style={styles.sLabelText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, scroll: { paddingBottom: 40 },
  body: { padding: 16 },
  errorBox: { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },
  sLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 },
  sLabelAccent: { width: 4, height: 16, backgroundColor: C.gold, borderRadius: 2 },
  sLabelText: { fontSize: 12, fontWeight: "800", color: C.navy, textTransform: "uppercase", letterSpacing: 1 },
  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },
  reqCard: { backgroundColor: C.surface, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: C.border },
  reqCardActive: { borderColor: C.steel, backgroundColor: C.infoBg },
  reqCardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reqType: { fontSize: 14, fontWeight: "800", color: C.navy, flex: 1 },
  reqDetailRow: { flexDirection: "row", marginTop: 3 },
  reqDetailLabel: { fontSize: 11, fontWeight: "700", color: C.textMute, width: 100 },
  reqDetailValue: { fontSize: 11, color: C.navy, fontWeight: "600", flex: 1 },
  selectedTag: { backgroundColor: C.steel, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 },
  selectedTagText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  summaryCard: { backgroundColor: C.infoBg, borderRadius: 10, padding: 14, marginBottom: 4, borderLeftWidth: 4, borderLeftColor: C.steel },
  summaryTitle: { fontSize: 10, fontWeight: "800", color: C.info, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  summaryType: { fontSize: 15, fontWeight: "800", color: C.navy },
  summaryMeta: { fontSize: 12, color: C.textMute, marginTop: 2 },
  label: { fontSize: 11, fontWeight: "800", color: C.navy, marginBottom: 8, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: C.navy, borderWidth: 1.5, borderColor: C.border },
  textarea: { height: 100, paddingTop: 12 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  timeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  timeBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
  timeBtnText: { fontSize: 12, fontWeight: "700", color: C.textMute },
  timeBtnTextActive: { color: "#fff" },
  submitBtn: { backgroundColor: C.steel, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 22, elevation: 4 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  successBadge: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.navy, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successBadgeText: { fontSize: 28, color: C.gold, fontWeight: "900" },
  successOrg: { fontSize: 10, fontWeight: "900", color: C.textMute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  successTitle: { fontSize: 22, fontWeight: "900", color: C.navy, marginBottom: 6 },
  successSub: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  successCard: { width: "100%", backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  successCardTitle: { fontSize: 11, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  dRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  dLabel: { fontSize: 12, color: C.textMute, fontWeight: "600" },
  dValue: { fontSize: 13, color: C.navy, fontWeight: "700" },
  doneBtn: { width: "100%", backgroundColor: C.navy, borderRadius: 10, paddingVertical: 14, alignItems: "center", elevation: 4 },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  // Date button
  dateBtn: { backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: C.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateBtnText: { fontSize: 13, color: C.navy, fontWeight: "600" },
  dateIcon: { fontSize: 16 },
  // Calendar modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  calSheet: { backgroundColor: C.surface, borderRadius: 16, padding: 16, width: "100%", maxWidth: 360 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: C.navy, fontWeight: "700" },
  calMonthLabel: { fontSize: 15, fontWeight: "800", color: C.navy },
  dayRow: { flexDirection: "row", marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: C.textMute, paddingVertical: 4 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calCellSelected: { backgroundColor: C.navy, borderRadius: 100 },
  calCellPast: { opacity: 0.3 },
  calCellText: { fontSize: 13, fontWeight: "600", color: C.navy },
  calCellTextSelected: { color: "#fff", fontWeight: "800" },
  calCellTextPast: { color: C.textMute },
  calCloseBtn: { marginTop: 12, paddingVertical: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: C.border },
  calCloseBtnText: { fontSize: 14, fontWeight: "700", color: C.danger },
});
