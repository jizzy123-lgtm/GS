import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const NAVY = "#1a2472";
const NAVY_DARK = "#0d1550";
const GOLD = "#f0c030";
const TEAL = "#1a5c72";
const CREAM = "#f5f7fa";

const MAINTENANCE_TYPES = [
  { key: "janitorial", label: "🧹 Janitorial", color: "#10b981" },
  { key: "carpentry", label: "🔨 Carpentry", color: "#f59e0b" },
  { key: "electrical", label: "⚡ Electrical", color: "#3b82f6" },
  { key: "air_conditioning", label: "❄️ Air Conditioning", color: "#06b6d4" },
];

const PRIORITY_LEVELS = [
  { key: "low", label: "Low", color: "#10b981" },
  { key: "medium", label: "Medium", color: "#f59e0b" },
  { key: "high", label: "High", color: "#ef4444" },
];

export default function SubmitRequestScreen({ onBack, onSuccess }) {
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!type) { setError("Please select a maintenance type."); return; }
    if (!location.trim()) { setError("Please enter the location."); return; }
    if (!description.trim()) { setError("Please describe the issue."); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maintenance_type: type,
          priority,
          location,
          description,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success! ✅", "Your maintenance request has been submitted and is pending approval.", [
          { text: "OK", onPress: () => onSuccess && onSuccess() },
        ]);
      } else {
        setError(data.message || "Failed to submit request. Please try again.");
      }
    } catch (e) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Request</Text>
          <Text style={styles.headerSub}>Submit a maintenance service request</Text>
        </View>

        <View style={styles.body}>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Maintenance Type */}
          <Text style={styles.label}>Maintenance Type <Text style={styles.required}>*</Text></Text>
          <View style={styles.typeGrid}>
            {MAINTENANCE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeCard, type === t.key && { borderColor: t.color, backgroundColor: t.color + "15" }]}
                onPress={() => setType(t.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.typeLabel}>{t.label}</Text>
                {type === t.key && <View style={[styles.typeCheck, { backgroundColor: t.color }]}><Text style={{ color: "#fff", fontSize: 10 }}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priority Level <Text style={styles.required}>*</Text></Text>
          <View style={styles.priorityRow}>
            {PRIORITY_LEVELS.map((p) => (
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

          {/* Location */}
          <Text style={styles.label}>Location / Room <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Room 204, Admin Building"
            placeholderTextColor="#a0aec0"
            value={location}
            onChangeText={setLocation}
          />

          {/* Description */}
          <Text style={styles.label}>Issue Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the issue in detail..."
            placeholderTextColor="#a0aec0"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              📌 Your request will be reviewed by the Head/Campus Director before processing.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>SUBMIT REQUEST →</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  scroll: { paddingBottom: 40 },
  header: {
    backgroundColor: NAVY_DARK, paddingTop: 56, paddingBottom: 28,
    paddingHorizontal: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: "#a0aec0", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSub: { color: "#7a8aaa", fontSize: 13, marginTop: 4 },
  body: { padding: 20 },
  errorBox: {
    backgroundColor: "#fff0f0", borderLeftWidth: 4, borderLeftColor: "#ef4444",
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "700", color: NAVY_DARK, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  required: { color: "#ef4444" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: "#e2e8f0", alignItems: "center",
    shadowColor: NAVY, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  typeLabel: { fontSize: 13, fontWeight: "700", color: NAVY_DARK },
  typeCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center",
    borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff",
  },
  priorityText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  input: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: NAVY_DARK, borderWidth: 1.5, borderColor: "#e2e8f0",
    shadowColor: NAVY, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  textarea: { height: 120, paddingTop: 12 },
  noteBox: {
    backgroundColor: "#fffbeb", borderLeftWidth: 4, borderLeftColor: GOLD,
    borderRadius: 10, padding: 12, marginTop: 16,
  },
  noteText: { color: "#92400e", fontSize: 12, lineHeight: 18 },
  submitBtn: {
    backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16,
    alignItems: "center", marginTop: 24,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 2 },
});
