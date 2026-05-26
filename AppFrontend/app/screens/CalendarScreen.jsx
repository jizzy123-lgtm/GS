import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

import { API_URL } from '../../api';
const C = {
  bg: "#F0F2F5", surface: "#FFFFFF", surfaceAlt: "#F7F9FC", navy: "#0B1F3A",
  navyMid: "#162C50", steel: "#1E4D8C", steelLight: "#2E6BC4", gold: "#C9A84C",
  text: "#0B1F3A", textMid: "#3D5068", textMute: "#8A9BB0", border: "#DDE3EC",
  success: "#1A7A4A", successBg: "#EAF6EF", warn: "#B45C10", warnBg: "#FEF3E2",
  danger: "#9B1C1C", dangerBg: "#FEE8E8", info: "#155E8A", infoBg: "#E6F2FA",
};
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

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export default function CalendarScreen({ user, onBack, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/schedule-events`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setEvents(list);
    } catch (_e) { setEvents([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const eventsByDate = {};
  events.forEach((ev) => {
    const d = ev.date || "";
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(ev);
  });

  const calCells = buildCalendarCells(viewDate);
  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  const selectedEvents = eventsByDate[selectedDate] || [];

  const handleDayPress = (cell) => {
    if (cell.dateStr === selectedDate) {
      setSelectedDate("");
    } else {
      setSelectedDate(cell.dateStr);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Calendar" subtitle="Scheduled Maintenance Events" onBack={onBack} />
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.steel} size="large" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarCard}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dayRow}>
              {DAY_LABELS.map((d) => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
            </View>

            <View style={styles.calGrid}>
              {calCells.map((cell, i) => {
                if (!cell) return <View key={i} style={styles.calCell} />;
                const hasEvents = Boolean(eventsByDate[cell.dateStr]);
                const isSelected = selectedDate === cell.dateStr;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calCell, isSelected && styles.calCellSelected, cell.past && styles.calCellPast]}
                    onPress={() => handleDayPress(cell)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected, cell.past && styles.calCellTextPast]}>
                      {cell.day}
                    </Text>
                    {hasEvents && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedDate ? (
            <View style={styles.eventsSection}>
              <View style={styles.eventsHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.eventsTitle}>
                  Events on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              {selectedEvents.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No events scheduled for this date.</Text>
                </View>
              ) : (
                selectedEvents.map((ev, idx) => (
                  <View key={ev.id || idx} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                    </View>
                    <View style={styles.eventMeta}>
                      {ev.time ? (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Time</Text>
                          <Text style={styles.metaValue}>{formatTime(ev.time)}</Text>
                        </View>
                      ) : null}
                      {ev.location ? (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Location</Text>
                          <Text style={styles.metaValue}>{ev.location}</Text>
                        </View>
                      ) : null}
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Office</Text>
                        <Text style={styles.metaValue}>{ev.office?.name || "—"}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Staff</Text>
                        <Text style={styles.metaValue}>{ev.creator?.name || "—"}</Text>
                      </View>
                      {ev.maintenance_request ? (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Type</Text>
                          <Text style={styles.metaValue}>{ev.maintenance_request.maintenance_type_name || ev.maintenance_request.maintenance_type?.name || ev.maintenance_request.type || "Maintenance"}</Text>
                        </View>
                      ) : null}
                    </View>
                    {ev.maintenance_request_id ? (
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => onNavigate("ViewRequestStatus", { requestId: ev.maintenance_request_id })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewBtnText}>View Request</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Tap a date with events to see details.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: C.textMute, fontSize: 14, marginTop: 12 },
  scroll: { padding: 16, paddingBottom: 40 },
  calendarCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, elevation: 2, marginBottom: 16 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: C.navy, fontWeight: "700" },
  calMonthLabel: { fontSize: 15, fontWeight: "800", color: C.navy },
  dayRow: { flexDirection: "row", marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: C.textMute, paddingVertical: 4 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", paddingTop: 2 },
  calCellSelected: { backgroundColor: C.navy, borderRadius: 100 },
  calCellPast: { opacity: 0.3 },
  calCellText: { fontSize: 13, fontWeight: "600", color: C.navy },
  calCellTextSelected: { color: "#fff", fontWeight: "800" },
  calCellTextPast: { color: C.textMute },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.steel, marginTop: 2 },
  dotSelected: { backgroundColor: "#fff" },
  eventsSection: { marginBottom: 16 },
  eventsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  sectionAccent: { width: 4, height: 16, backgroundColor: C.gold, borderRadius: 2 },
  eventsTitle: { fontSize: 12, fontWeight: "800", color: C.text, textTransform: "uppercase", letterSpacing: 1.2, flex: 1 },
  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },
  eventCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, elevation: 1 },
  eventHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 14, fontWeight: "800", color: C.navy, flex: 1 },
  eventMeta: { marginBottom: 4 },
  metaRow: { flexDirection: "row", paddingVertical: 3 },
  metaLabel: { fontSize: 11, fontWeight: "700", color: C.textMute, width: 60 },
  metaValue: { fontSize: 12, color: C.navy, fontWeight: "600", flex: 1 },
  viewBtn: { backgroundColor: C.steel, borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 8 },
  viewBtnText: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
});
