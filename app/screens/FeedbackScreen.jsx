import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
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

const RATINGS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Fair" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Excellent" },
];

export default function FeedbackScreen({ onBack, requestId, user }) {
  const [completedRequests, setCompletedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(requestId || null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRequests, setFetchingRequests] = useState(!requestId);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!requestId) fetchCompletedRequests();
  }, []);

  const fetchCompletedRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/requests`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const completed = list.filter(r => r.status?.toLowerCase() === "completed" && !r.has_feedback);
      setCompletedRequests(completed);
    } catch (e) {
      setCompletedRequests([]);
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRequest) { Alert.alert("Error", "Please select a request to give feedback on."); return; }
    if (rating === 0) { Alert.alert("Error", "Please select a rating."); return; }
    if (!comment.trim()) { Alert.alert("Error", "Please write a comment."); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request_id: selectedRequest, rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        Alert.alert("Error", data.message || "Failed to submit feedback.");
      }
    } catch (e) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Thank You!</Text>
        <Text style={styles.successSub}>Your feedback helps us improve our services.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback</Text>
          <Text style={styles.headerSub}>Rate the service you received</Text>
        </View>

        <View style={styles.body}>

          {/* Select Request (if not pre-selected) */}
          {!requestId && (
            <>
              <Text style={styles.label}>Select Completed Request <Text style={styles.required}>*</Text></Text>
              {fetchingRequests ? (
                <ActivityIndicator color={NAVY} style={{ marginVertical: 16 }} />
              ) : completedRequests.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No completed requests available for feedback.</Text>
                </View>
              ) : (
                completedRequests.map((req) => (
                  <TouchableOpacity
                    key={req.id}
                    style={[styles.reqOption, selectedRequest === req.id && styles.reqOptionActive]}
                    onPress={() => setSelectedRequest(req.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reqType}>{req.maintenance_type || req.type}</Text>
                      <Text style={styles.reqDate}>{req.created_at?.slice(0, 10)}</Text>
                    </View>
                    {selectedRequest === req.id && (
                      <View style={styles.checkCircle}><Text style={{ color: "#fff", fontSize: 12 }}>✓</Text></View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Rating */}
          <Text style={styles.label}>Overall Rating <Text style={styles.required}>*</Text></Text>
          <View style={styles.ratingRow}>
            {RATINGS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.ratingBtn, rating === r.value && styles.ratingBtnActive]}
                onPress={() => setRating(r.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.ratingEmoji}>{r.emoji}</Text>
                <Text style={[styles.ratingLabel, rating === r.value && { color: NAVY, fontWeight: "800" }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected rating display */}
          {rating > 0 && (
            <View style={styles.ratingDisplay}>
              <Text style={styles.ratingDisplayText}>
                {RATINGS[rating - 1].emoji}  You rated this service: <Text style={{ fontWeight: "800", color: NAVY }}>{RATINGS[rating - 1].label}</Text>
              </Text>
            </View>
          )}

          {/* Comment */}
          <Text style={styles.label}>Comments / Suggestions <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Share your experience or suggestions for improvement..."
            placeholderTextColor="#a0aec0"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              📝 Feedback is mandatory after service completion. Your input improves the quality of our services.
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
              <Text style={styles.submitText}>SUBMIT FEEDBACK →</Text>
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
  label: { fontSize: 13, fontWeight: "700", color: NAVY_DARK, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  required: { color: "#ef4444" },
  reqOption: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: "#e2e8f0",
    shadowColor: NAVY, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  reqOptionActive: { borderColor: NAVY, backgroundColor: "#f0f4ff" },
  reqType: { fontSize: 14, fontWeight: "700", color: NAVY_DARK },
  reqDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  ratingRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  ratingBtn: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 10, alignItems: "center",
    borderWidth: 1.5, borderColor: "#e2e8f0",
    shadowColor: NAVY, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  ratingBtnActive: { borderColor: NAVY, backgroundColor: "#f0f4ff" },
  ratingEmoji: { fontSize: 24, marginBottom: 4 },
  ratingLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "600" },
  ratingDisplay: {
    backgroundColor: "#f0f4ff", borderRadius: 12, padding: 12, marginTop: 8,
    borderLeftWidth: 4, borderLeftColor: NAVY,
  },
  ratingDisplayText: { fontSize: 13, color: "#475569" },
  input: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: NAVY_DARK, borderWidth: 1.5, borderColor: "#e2e8f0",
  },
  textarea: { height: 120, paddingTop: 12 },
  noteBox: {
    backgroundColor: "#fffbeb", borderLeftWidth: 4, borderLeftColor: GOLD,
    borderRadius: 10, padding: 12, marginTop: 16,
  },
  noteText: { color: "#92400e", fontSize: 12, lineHeight: 18 },
  submitBtn: {
    backgroundColor: TEAL, borderRadius: 16, paddingVertical: 16,
    alignItems: "center", marginTop: 24,
    shadowColor: TEAL, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 2 },
  emptyBox: { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center" },
  successScreen: { flex: 1, backgroundColor: CREAM, alignItems: "center", justifyContent: "center", padding: 40 },
  successIcon: { fontSize: 72, marginBottom: 20 },
  successTitle: { fontSize: 32, fontWeight: "800", color: NAVY_DARK, marginBottom: 8 },
  successSub: { fontSize: 15, color: "#64748b", textAlign: "center", marginBottom: 40, lineHeight: 22 },
  doneBtn: {
    backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  doneBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 2 },
});
