import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import { MAINTENANCE_STATUS, normalizeMaintenanceStatus } from "../constants/maintenanceStatus";

import { API_URL } from "../../api";

const C = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  gold: "#C9A84C",
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  border: "#DDE3EC",
  textMute: "#8A9BB0",
  success: "#1A7A4A",
  successBg: "#EAF6EF",
  warn: "#B45C10",
  warnBg: "#FEF3E2",
  info: "#155E8A",
  infoBg: "#E6F2FA",
};

const RATINGS = [
  { value: 1, emoji: " ", label: "Poor" },
  { value: 2, emoji: " ", label: "Fair" },
  { value: 3, emoji: " ", label: "Okay" },
  { value: 4, emoji: " ", label: "Good" },
  { value: 5, emoji: "  ", label: "Excellent" },
];

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const isRequestOwnedByUser = (request, currentUser) => {
  const userIds = [currentUser?.id, currentUser?.user_id].map(toNumberOrNull).filter((v) => v !== null);

  const requestOwnerIds = [
    request?.requesting_personnel,
    request?.requesting_personnel_id,
    request?.requester_id,
    request?.user_id,
    request?.personnel_id,
    request?.requested_by,
    request?.user?.id,
    request?.user?.user_id,
    request?.requester?.id,
    request?.requester?.user_id,
  ]
    .map(toNumberOrNull)
    .filter((v) => v !== null);

  if (userIds.length > 0 && requestOwnerIds.length > 0) {
    return requestOwnerIds.some((id) => userIds.includes(id));
  }

  const requestUsername = String(
    request?.username || request?.requester?.username || request?.user?.username || ""
  )
    .trim()
    .toLowerCase();
  const currentUsername = String(currentUser?.username || "").trim().toLowerCase();
  if (requestUsername && currentUsername) return requestUsername === currentUsername;

  return false;
};

const toLabelDate = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 10);
};

export default function FeedbackScreen({ onBack, requestId, user }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(requestId || null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRequests, setFetchingRequests] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const selectedRequestDetails = useMemo(
    () => requests.find((request) => Number(request.id) === Number(selectedRequest)) || null,
    [requests, selectedRequest]
  );

  const canSubmitFeedback = Boolean(
    selectedRequestDetails &&
      selectedRequestDetails.status === MAINTENANCE_STATUS.DONE &&
      !selectedRequestDetails.has_feedback
  );

  const fetchRequests = useCallback(async () => {
    try {
      const token = (await AsyncStorage.getItem("authToken")) || (await AsyncStorage.getItem("token"));
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

      const [reqRes, typesRes] = await Promise.allSettled([
        fetch(`${API_URL}/maintenance-requests`, { headers }),
        fetch(`${API_URL}/maintenance-types`, { headers }),
      ]);

      let reqList = [];
      if (reqRes.status === "fulfilled") {
        const reqData = await reqRes.value.json();
        reqList = Array.isArray(reqData) ? reqData : reqData?.data || [];
      }

      let typeMap = {};
      if (typesRes.status === "fulfilled" && typesRes.value.ok) {
        const typeData = await typesRes.value.json().catch(() => ({}));
        const typeList = Array.isArray(typeData) ? typeData : typeData?.data || [];
        typeList.forEach((item) => {
          typeMap[item.id] = item.name || item.type_name;
        });
      }

      const scoped = reqList
        .filter((requestItem) => isRequestOwnedByUser(requestItem, user))
        .map((requestItem) => ({
          ...requestItem,
          status: normalizeMaintenanceStatus(requestItem.status, requestItem.status_id),
          maintenance_type_name:
            typeMap[requestItem.maintenance_type_id] ||
            requestItem.maintenance_type?.name ||
            requestItem.maintenance_type ||
            requestItem.type ||
            "Maintenance Request",
          description_text: requestItem.details || requestItem.description || "-",
        }))
        .filter(
          (requestItem) =>
            requestItem.status === MAINTENANCE_STATUS.SCHEDULED || requestItem.status === MAINTENANCE_STATUS.DONE
        )
        .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));

      setRequests(scoped);
      if (selectedRequest) {
        const exists = scoped.some((requestItem) => Number(requestItem.id) === Number(selectedRequest));
        if (!exists) setSelectedRequest(null);
      }
    } catch (_e) {
      setRequests([]);
    } finally {
      setFetchingRequests(false);
    }
  }, [selectedRequest, user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!selectedRequest) {
      Alert.alert("Error", "Please select a request.");
      return;
    }
    if (!canSubmitFeedback) {
      Alert.alert("Unavailable", "You can submit feedback only for your done requests that have no feedback yet.");
      return;
    }
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a comment.");
      return;
    }

    setLoading(true);
    try {
      const token = (await AsyncStorage.getItem("authToken")) || (await AsyncStorage.getItem("token"));
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request_id: Number(selectedRequest),
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
        return;
      }
      if (res.status === 409) {
        Alert.alert("Already Submitted", data.message || "Feedback was already submitted for this request.");
        setRequests((prev) =>
          prev.map((requestItem) =>
            Number(requestItem.id) === Number(selectedRequest)
              ? { ...requestItem, has_feedback: true }
              : requestItem
          )
        );
        setRating(0);
        setComment("");
        setFetchingRequests(true);
        fetchRequests();
        return;
      }
      Alert.alert("Error", data.message || "Failed to submit.");
    } catch (_e) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successIcon}>OK</Text>
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
      <ScreenHeader title="Feedback" subtitle="Rate the service you received" onBack={onBack} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {!requestId && (
            <>
              <Text style={styles.label}>Select Your Request</Text>
              {fetchingRequests ? (
                <ActivityIndicator color={C.navy} style={{ marginVertical: 16 }} />
              ) : requests.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No scheduled or done requests found for your account.</Text>
                </View>
              ) : (
                requests.map((requestItem) => {
                  const isSelected = Number(selectedRequest) === Number(requestItem.id);
                  const isDone = requestItem.status === MAINTENANCE_STATUS.DONE;
                  const hasFeedback = Boolean(requestItem.has_feedback);
                  const statusText = isDone ? "Done" : "Scheduled";
                  return (
                    <TouchableOpacity
                      key={requestItem.id}
                      style={[styles.reqOption, isSelected && styles.reqOptionActive]}
                      onPress={() => setSelectedRequest(requestItem.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reqType} numberOfLines={1}>
                          #{requestItem.id} {requestItem.maintenance_type_name}
                        </Text>
                        <Text style={styles.reqDescription} numberOfLines={2}>
                          {requestItem.description_text}
                        </Text>
                        <Text style={styles.reqDate}>
                          Status: {statusText} | Date: {toLabelDate(requestItem.scheduled_date || requestItem.created_at)}
                        </Text>
                        {hasFeedback ? <Text style={styles.reqSubmitted}>Feedback already submitted</Text> : null}
                      </View>
                      {isSelected ? (
                        <View style={styles.check}>
                          <Text style={{ color: "#fff", fontSize: 12 }}>OK</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {selectedRequestDetails && (
            <View style={styles.selectedMeta}>
              <Text style={styles.selectedMetaText}>
                Selected: #{selectedRequestDetails.id} {selectedRequestDetails.maintenance_type_name}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Overall Rating</Text>
          <View style={styles.ratingRow}>
            {RATINGS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.ratingBtn, rating === r.value && styles.ratingBtnActive]}
                onPress={() => setRating(r.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.ratingEmoji}>{r.emoji}</Text>
                <Text style={[styles.ratingLabel, rating === r.value && { color: "#fff", fontWeight: "800" }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 ? (
            <View style={styles.ratingDisplay}>
              <Text style={styles.ratingDisplayText}>
                {RATINGS[rating - 1].emoji} Rated:{" "}
                <Text style={{ fontWeight: "800", color: C.navy }}>{RATINGS[rating - 1].label}</Text>
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Comments / Suggestions</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Share your experience..."
            placeholderTextColor="#a0aec0"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {!canSubmitFeedback ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                You can only submit feedback for your done requests that do not have feedback yet.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, (loading || !canSubmitFeedback) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading || !canSubmitFeedback}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT FEEDBACK</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },
  body: { padding: 18 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: C.navy,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  reqOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    elevation: 1,
  },
  reqOptionActive: { borderColor: C.navy, backgroundColor: "#f0f4ff" },
  reqType: { fontSize: 14, fontWeight: "700", color: C.navy },
  reqDescription: { fontSize: 12, color: "#475569", marginTop: 3, lineHeight: 16 },
  reqDate: { fontSize: 11, color: C.textMute, marginTop: 6 },
  reqSubmitted: { fontSize: 11, color: C.success, marginTop: 4, fontWeight: "700" },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedMeta: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: C.infoBg,
    borderLeftWidth: 4,
    borderLeftColor: C.info,
  },
  selectedMetaText: { color: C.navy, fontSize: 12, fontWeight: "700" },
  ratingRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  ratingBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.border,
    elevation: 3,
  },
  ratingBtnActive: { borderColor: C.navy, backgroundColor: C.navy, transform: [{ scale: 1.05 }] },
  ratingEmoji: { fontSize: 22, marginBottom: 4 },
  ratingLabel: {
    fontSize: 9,
    color: C.textMute,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingDisplay: {
    backgroundColor: "#f0f4ff",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.navy,
  },
  ratingDisplayText: { fontSize: 13, color: "#475569" },
  input: {
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: C.navy,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  textarea: { height: 120, paddingTop: 12 },
  noteBox: {
    backgroundColor: C.warnBg,
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  },
  noteText: { color: C.warn, fontSize: 12, lineHeight: 18 },
  submitBtn: {
    backgroundColor: C.steel,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    elevation: 5,
  },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  emptyBox: { backgroundColor: C.surface, borderRadius: 12, padding: 20, alignItems: "center" },
  emptyText: { color: C.textMute, fontSize: 13, textAlign: "center" },
  successScreen: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 40 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: "800", color: C.navy, marginBottom: 6 },
  successSub: { fontSize: 14, color: C.textMute, textAlign: "center", marginBottom: 36, lineHeight: 22 },
  doneBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 48, elevation: 5 },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
});
