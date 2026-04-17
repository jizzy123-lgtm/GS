import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import {
  MAX_IMAGE_ATTACHMENTS,
  appendImageAssetsToFormData,
  validateImageAsset,
} from "../../utils/imageAttachments";

import { API_URL } from '../../api';
const C = {
  navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5", surface: "#FFFFFF",
  border: "#DDE3EC", textMute: "#8A9BB0", danger: "#9B1C1C", dangerBg: "#FEE8E8",
  success: "#1A7A4A", warn: "#B45C10", warnBg: "#FEF3E2",
};

function Toast({ visible, message }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: visible ? 1 : 0, duration: visible ? 300 : 250, useNativeDriver: true }),
      Animated.timing(ty, { toValue: visible ? 0 : -20, duration: visible ? 300 : 250, useNativeDriver: true }),
    ]).start();
  }, [visible, op, ty]);
  return (
    <Animated.View style={[styles.toast, { opacity: op, transform: [{ translateY: ty }] }]}>
      <View style={styles.toastDot} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function WaitingScreen({ submittedType, onNewRequest, onGoHome }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={styles.waitBadge}>
        <Text style={styles.waitBadgeText}>OK</Text>
      </View>
      <Text style={styles.waitOrg}>GSU GATEWAY</Text>
      <Text style={styles.waitTitle}>Request Submitted!</Text>
      <Text style={styles.waitSub}>Your <Text style={{ color: C.steel, fontWeight: "800" }}>{submittedType}</Text> request has been received.</Text>
      <View style={styles.waitCard}>
        <Text style={styles.waitCardTitle}>What happens next?</Text>
        {[
          "Staff verifies your request first",
          "Head reviews after staff verification",
          "Campus Director reviews after Head approval",
          "Staff assigns priority, then schedule and completion follows",
        ].map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNum, i === 0 && styles.stepNumActive]}>
              <Text style={[styles.stepNumText, i === 0 && styles.stepNumTextActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.newBtn} onPress={onNewRequest} activeOpacity={0.85}>
        <Text style={styles.newBtnText}>SUBMIT ANOTHER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.85}>
        <Text style={styles.homeBtnText}>BACK TO HOME</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SubmitRequestScreen({ onBack, onSuccess }) {
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedTypeName, setSelectedTypeName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState("");
  const [userData, setUserData] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  const flattenErrorMessages = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.flatMap(flattenErrorMessages);
    if (typeof value === "object") return Object.values(value).flatMap(flattenErrorMessages);
    return [String(value)];
  };

  // Load maintenance types and user data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get stored user data
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) setUserData(JSON.parse(userStr));

      // Fetch maintenance types from API
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/maintenance-types`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const types = Array.isArray(data) ? data : data.data || [];
      setMaintenanceTypes(types);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!selectedTypeId) { setError("Please select a maintenance type."); return; }
    if (!location.trim()) { setError("Please enter the location."); return; }
    if (!description.trim()) { setError("Please describe the issue."); return; }
    if (!userData) { setError("User data not found. Please login again."); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");

      const payload = {
        date_requested: new Date().toISOString().slice(0, 10),
        details: description,
        requesting_personnel: userData.id,
        position_id: userData.position_id,
        requesting_office: userData.office_id,
        contact_number: userData.contact_number || "",
        maintenance_type_id: selectedTypeId,
        location: location,
      };
      const makeFormData = (mode = "brackets", includeImages = true) => {
        const next = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          next.append(key, String(value ?? ""));
        });
        if (includeImages) appendImageAssetsToFormData(next, selectedImages, mode);
        return next;
      };

      const submitRequest = async (body) => fetch(`${API_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const uploadModes = ["brackets", "indexed", "single"];
      let res = null;
      let data = {};
      let usedFallbackWithoutImages = false;

      if (selectedImages.length === 0) {
        res = await submitRequest(makeFormData("brackets", false));
        data = await res.json().catch(() => ({}));
      } else {
        for (const mode of uploadModes) {
          res = await submitRequest(makeFormData(mode, true));
          data = await res.json().catch(() => ({}));
          if (res.ok) break;
        }

        if (res && !res.ok) {
          const fallbackRes = await submitRequest(makeFormData("brackets", false));
          const fallbackData = await fallbackRes.json().catch(() => ({}));
          if (fallbackRes.ok) {
            usedFallbackWithoutImages = true;
            res = fallbackRes;
            data = fallbackData;
          }
        }
      }

      if (res.ok) {
        if (usedFallbackWithoutImages) {
          setError("Request submitted without images. Server rejected file upload; try smaller JPG/PNG (max 2MB).");
        }
        setSubmittedType(selectedTypeName);
        setShowToast(true);
        setTimeout(() => { setShowToast(false); setSubmitted(true); }, 1800);
      } else {
        const mergedErrors = flattenErrorMessages(data?.errors).join("\n");
        setError(mergedErrors || data?.message || "Failed to submit.");
      }
    } catch (_e) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickImages = async () => {
    setError("");

    if (selectedImages.length >= MAX_IMAGE_ATTACHMENTS) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Please allow photo library access to attach images.");
      return;
    }

    const remainingSlots = MAX_IMAGE_ATTACHMENTS - selectedImages.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.4,
    });

    if (result.canceled || !Array.isArray(result.assets)) return;

    const next = [...selectedImages];
    for (const asset of result.assets) {
      if (next.length >= MAX_IMAGE_ATTACHMENTS) break;
      const validation = validateImageAsset(asset);
      if (!validation.valid) {
        setError(validation.message);
        continue;
      }
      next.push(asset);
    }
    setSelectedImages(next.slice(0, MAX_IMAGE_ATTACHMENTS));
  };

  const removeSelectedImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleNew = () => {
    setSelectedTypeId(null);
    setSelectedTypeName("");
    setLocation("");
    setDescription("");
    setError("");
    setSubmitted(false);
    setSubmittedType("");
    setSelectedImages([]);
  };

  const pickerLabel = selectedImages.length === 0 ? "Choose Files" : "Add File";

  if (submitted) return <WaitingScreen submittedType={submittedType} onNewRequest={handleNew} onGoHome={onSuccess} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Toast visible={showToast} message="Request submitted successfully!" />
      <ScreenHeader title="New Request" subtitle="Submit a maintenance service request" onBack={onBack} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          {/* Maintenance Type */}
          <Text style={styles.label}>Maintenance Type *</Text>
          {loadingTypes ? (
            <ActivityIndicator color={C.steel} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.typeGrid}>
              {maintenanceTypes.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeCard, selectedTypeId === t.id && styles.typeCardActive]}
                  onPress={() => { setSelectedTypeId(t.id); setSelectedTypeName(t.name || t.type_name || t.maintenance_type); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeLabel, selectedTypeId === t.id && styles.typeLabelActive]}>
                    {t.name || t.type_name || t.maintenance_type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Location */}
          <Text style={styles.label}>Location / Room *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Room 204, Admin Building"
            placeholderTextColor="#a0aec0"
            value={location}
            onChangeText={setLocation}
          />

          {/* Description */}
          <Text style={styles.label}>Issue Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the issue..."
            placeholderTextColor="#a0aec0"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Images (Optional)</Text>
          <Text style={styles.imageCount}>{selectedImages.length}/{MAX_IMAGE_ATTACHMENTS} images selected</Text>
          {selectedImages.length < MAX_IMAGE_ATTACHMENTS && (
            <TouchableOpacity style={styles.pickBtn} onPress={handlePickImages} activeOpacity={0.85}>
              <Text style={styles.pickBtnText}>{pickerLabel}</Text>
            </TouchableOpacity>
          )}
          {selectedImages.length > 0 && (
            <View style={styles.thumbGrid}>
              {selectedImages.map((asset, index) => (
                <View key={`${asset.uri}-${index}`} style={styles.thumbWrap}>
                  <Image source={{ uri: asset.uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeThumbBtn} onPress={() => removeSelectedImage(index)} activeOpacity={0.9}>
                    <Text style={styles.removeThumbText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>Your request goes through Staff verification, Head approval, and Campus Director approval before final scheduling.</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT REQUEST</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, scroll: { paddingBottom: 40 },
  body: { padding: 18 },
  toast: { position: "absolute", top: 16, alignSelf: "center", zIndex: 999, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.navy, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: C.gold, elevation: 10 },
  toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  errorBox: { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },
  label: { fontSize: 11, fontWeight: "800", color: C.navy, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 1 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: "center", elevation: 1 },
  typeCardActive: { backgroundColor: C.navy, borderColor: C.navy },
  typeLabel: { fontSize: 13, fontWeight: "700", color: C.navy },
  typeLabelActive: { color: "#fff" },
  input: { backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.navy, borderWidth: 1.5, borderColor: C.border },
  textarea: { height: 120, paddingTop: 12 },
  noteBox: { backgroundColor: C.warnBg, borderLeftWidth: 4, borderLeftColor: C.gold, borderRadius: 8, padding: 12, marginTop: 16 },
  noteText: { color: C.warn, fontSize: 12, lineHeight: 18 },
  imageCount: { color: C.textMute, fontSize: 12, marginBottom: 8 },
  pickBtn: { alignSelf: "flex-start", backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.steel, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  pickBtnText: { color: C.steel, fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  thumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  thumbWrap: { width: 82, height: 82, borderRadius: 8, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  thumb: { width: "100%", height: "100%" },
  removeThumbBtn: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(11,31,58,0.9)", alignItems: "center", justifyContent: "center" },
  removeThumbText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  submitBtn: { backgroundColor: C.navy, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 22, elevation: 5 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  waitBadge: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.navy, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  waitBadgeText: { fontSize: 28, color: C.gold, fontWeight: "900" },
  waitOrg: { fontSize: 10, fontWeight: "900", color: C.textMute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  waitTitle: { fontSize: 22, fontWeight: "900", color: C.navy, marginBottom: 6 },
  waitSub: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  waitCard: { width: "100%", backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  waitCardTitle: { fontSize: 11, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  stepNumActive: { backgroundColor: C.navy, borderColor: C.navy },
  stepNumText: { fontSize: 11, fontWeight: "800", color: C.textMute },
  stepNumTextActive: { color: C.gold },
  stepLabel: { fontSize: 13, color: C.textMute, flex: 1 },
  stepLabelActive: { color: C.navy, fontWeight: "700" },
  newBtn: { width: "100%", backgroundColor: C.navy, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 10, elevation: 4 },
  newBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  homeBtn: { width: "100%", borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  homeBtnText: { color: C.navy, fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
});

