import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_URL } from "../../api";
import {
  MAX_IMAGE_ATTACHMENTS,
  appendImageAssetsToFormData,
  validateImageAsset,
} from "../../utils/imageAttachments";
import {
  extractApiItem,
  extractApiList,
  getApiErrorMessage,
  getAuthHeaders,
  getAuthToken,
  getMaintenanceTypeLabel,
} from "../../utils/maintenanceRequests";
import { getRoleLabel, normalizeRoleId, ROLE_IDS } from "../constants/roles";
import ScreenHeader from "./ScreenHeader";

const C = {
  navy: "#0B1F3A",
  navySoft: "#16355F",
  steel: "#1E4D8C",
  steelSoft: "#D8E6F7",
  gold: "#C9A84C",
  slate: "#5B6B7A",
  bg: "#EEF3F7",
  bgAlt: "#E2EBF2",
  surface: "#FFFFFF",
  surfaceAlt: "#F7FAFC",
  border: "#D6E0E8",
  text: "#0B1F3A",
  textMute: "#708295",
  success: "#1A7A4A",
  successBg: "#EAF6EF",
  warn: "#B45C10",
  warnBg: "#FEF3E2",
  danger: "#9B1C1C",
  dangerBg: "#FEE8E8",
  info: "#155E8A",
  infoBg: "#E6F2FA",
};

const R = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  gold: "#C9A84C",
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  border: "#DDE3EC",
  textMute: "#8A9BB0",
  danger: "#9B1C1C",
  dangerBg: "#FEE8E8",
  warn: "#B45C10",
  warnBg: "#FEF3E2",
};

const INTERNAL_ROLE_IDS = [ROLE_IDS.STAFF, ROLE_IDS.HEAD];

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

const buildDisplayName = (info, user) => {
  const joined = [
    firstNonEmpty(info?.first_name, user?.first_name),
    firstNonEmpty(info?.middle_name),
    firstNonEmpty(info?.last_name, user?.last_name),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return firstNonEmpty(joined, info?.name, info?.full_name, user?.name, user?.username) || "System-linked account";
};

const buildOfficeLabel = (info, user) =>
  firstNonEmpty(
    info?.office_name,
    info?.office?.office_name,
    info?.office?.name,
    info?.office?.label,
    info?.office,
    user?.office_name,
    user?.office?.name
  ) || (info?.office_id ? `Office #${info.office_id}` : "Office record pending");

const buildPositionLabel = (info, user) =>
  firstNonEmpty(
    info?.position_name,
    info?.position?.position_name,
    info?.position?.name,
    info?.position?.label,
    info?.position,
    user?.position_name,
    user?.position?.name
  ) || (info?.position_id ? `Position #${info.position_id}` : "Position record pending");

const buildContactLabel = (info, user) =>
  firstNonEmpty(info?.contact_number, user?.contact_number) || "No contact number on file";

const getTypeInitials = (label) => {
  const parts = String(label || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "MR";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
};

const getRoleCopy = (roleId) => {
  if (roleId === ROLE_IDS.HEAD) {
    return {
      headerTitle: "Internal Maintenance Request",
      headerSubtitle: "For Staff and Head Personnel",
      heroEyebrow: "Internal Service Desk",
      heroTitle: "Office-Level Request",
      heroText: "Submit a structured campus work order using your verified office identity and internal routing path.",
      summaryTitle: "System-Sourced Personnel Record",
      summaryHelper: "These fields are linked from your account profile and are used directly in the request payload.",
      typeTitle: "Select Service Category",
      typeHelper: "Choose the service lane that best matches the issue before routing the work order.",
      locationTitle: "Where should the team respond?",
      locationHelper: "Use the exact building, room, office, or facility area for dispatch accuracy.",
      descriptionTitle: "Work-Order Narrative",
      descriptionHelper: "Describe the operational impact, what was observed, and any urgency indicators for the maintenance team.",
      evidenceTitle: "Attach Photo Documentation",
      evidenceHelper: `Upload up to ${MAX_IMAGE_ATTACHMENTS} images for evidence or visual reference.`,
      workflowTitle: "Office-to-Director Approval Route",
      workflowLead: "Because this request is submitted by a Head account, it moves from staff verification directly to Campus Director review before scheduling.",
      workflowSteps: [
        "Staff verifies the internal request",
        "Campus Director reviews the office-submitted request",
        "Staff assigns priority and schedule",
        "Maintenance work is completed and closed",
      ],
      submitLabel: "SUBMIT OFFICE REQUEST",
      uploadButtonLabel: "ADD EVIDENCE",
      roleTone: "Office-Level Request",
    };
  }

  if (roleId === ROLE_IDS.STAFF) {
    return {
      headerTitle: "Internal Maintenance Request",
      headerSubtitle: "For Staff and Head Personnel",
      heroEyebrow: "Internal Service Desk",
      heroTitle: "Operational Request",
      heroText: "Create an internal work order with verified personnel and office routing for campus operations support.",
      summaryTitle: "System-Sourced Personnel Record",
      summaryHelper: "These fields are linked from your account profile and are used directly in the request payload.",
      typeTitle: "Select Service Category",
      typeHelper: "Choose the correct service lane so the issue reaches the right maintenance queue.",
      locationTitle: "Where should the team respond?",
      locationHelper: "Use the exact building, room, office, or facility area for dispatch accuracy.",
      descriptionTitle: "Work-Order Narrative",
      descriptionHelper: "Describe the operational impact, what was observed, and any urgency indicators for the maintenance team.",
      evidenceTitle: "Attach Photo Documentation",
      evidenceHelper: `Upload up to ${MAX_IMAGE_ATTACHMENTS} images for evidence or visual reference.`,
      workflowTitle: "Standard Internal Approval Route",
      workflowLead: "Staff-submitted requests still move through verification, Head approval, Campus Director approval, and final scheduling.",
      workflowSteps: [
        "Staff verifies the internal request",
        "Head approves the request",
        "Campus Director approves the request",
        "Staff assigns priority and schedule",
      ],
      submitLabel: "SUBMIT OPERATIONAL REQUEST",
      uploadButtonLabel: "ADD EVIDENCE",
      roleTone: "Operational Request",
    };
  }

  return {
    headerTitle: "New Request",
    headerSubtitle: "Submit a maintenance service request",
    heroEyebrow: "Self-Service Request",
    heroTitle: "Maintenance Support Form",
    heroText: "Tell the maintenance team what happened, where support is needed, and attach images if helpful.",
    summaryTitle: "",
    summaryHelper: "",
    typeTitle: "Choose a Maintenance Type",
    typeHelper: "Pick the category that best fits the issue you want to report.",
    locationTitle: "Where is the issue located?",
    locationHelper: "Add the room, office, or campus area so the team can find it quickly.",
    descriptionTitle: "Describe the Issue",
    descriptionHelper: "Share the issue clearly so the maintenance team understands what needs attention.",
    evidenceTitle: "Optional Images",
    evidenceHelper: `Add up to ${MAX_IMAGE_ATTACHMENTS} images if they help explain the problem.`,
    workflowTitle: "What happens next?",
    workflowLead: "Your request goes through verification, approvals, and final scheduling before maintenance work begins.",
    workflowSteps: [
      "Staff verifies the request",
      "Head reviews the request",
      "Campus Director approves the request",
      "Staff schedules the maintenance work",
    ],
    submitLabel: "SUBMIT REQUEST",
    uploadButtonLabel: "CHOOSE FILES",
    roleTone: "Maintenance Request",
  };
};

function Toast({ visible, message, legacy = false }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 280 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : -20,
        duration: visible ? 280 : 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Animated.View style={[legacy ? styles.legacyToast : styles.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.toastDot} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function WaitingScreen({ submittedType, onNewRequest, onGoHome, requesterRoleId }) {
  const isInternal = INTERNAL_ROLE_IDS.includes(requesterRoleId);
  const copy = getRoleCopy(requesterRoleId);

  if (!isInternal) {
    return (
      <View style={styles.legacyWaitRoot}>
        <View style={styles.legacyWaitBadge}>
          <Text style={styles.legacyWaitBadgeText}>OK</Text>
        </View>
        <Text style={styles.legacyWaitOrg}>GSU GATEWAY</Text>
        <Text style={styles.legacyWaitTitle}>Request Submitted!</Text>
        <Text style={styles.legacyWaitSub}>
          Your <Text style={styles.legacyWaitSubStrong}>{submittedType}</Text> request has been received.
        </Text>
        <View style={styles.legacyWaitCard}>
          <Text style={styles.legacyWaitCardTitle}>What happens next?</Text>
          {[
            "Staff verifies your request first",
            "Head reviews after staff verification",
            "Campus Director reviews after Head approval",
            "Staff assigns priority, then schedule and completion follows",
          ].map((step, index) => (
            <View key={`${step}-${index}`} style={styles.legacyStepRow}>
              <View style={[styles.legacyStepNum, index === 0 && styles.legacyStepNumActive]}>
                <Text style={[styles.legacyStepNumText, index === 0 && styles.legacyStepNumTextActive]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.legacyStepLabel, index === 0 && styles.legacyStepLabelActive]}>{step}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.legacyNewBtn} onPress={onNewRequest} activeOpacity={0.85}>
          <Text style={styles.legacyNewBtnText}>SUBMIT ANOTHER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legacyHomeBtn} onPress={onGoHome} activeOpacity={0.85}>
          <Text style={styles.legacyHomeBtnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.waitRoot}>
      <View style={styles.waitBadge}>
        <Text style={styles.waitBadgeText}>OK</Text>
      </View>
      <Text style={styles.waitEyebrow}>{isInternal ? "INTERNAL SERVICE DESK" : "GSU GATEWAY"}</Text>
      <Text style={styles.waitTitle}>{isInternal ? "Internal Request Logged" : "Request Submitted!"}</Text>
      <Text style={styles.waitSub}>
        Your <Text style={styles.waitSubStrong}>{submittedType || copy.roleTone}</Text> has been recorded successfully.
      </Text>

      <View style={styles.waitCard}>
        <Text style={styles.waitCardTitle}>{copy.workflowTitle}</Text>
        {copy.workflowSteps.map((step, index) => (
          <View key={`${step}-${index}`} style={styles.waitStepRow}>
            <View style={[styles.waitStepDot, index === 0 && styles.waitStepDotActive]}>
              <Text style={[styles.waitStepText, index === 0 && styles.waitStepTextActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.waitStepLabel, index === 0 && styles.waitStepLabelActive]}>{step}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryActionBtn} onPress={onNewRequest} activeOpacity={0.86}>
        <Text style={styles.primaryActionText}>{isInternal ? "LOG ANOTHER REQUEST" : "SUBMIT ANOTHER"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryActionBtn} onPress={onGoHome} activeOpacity={0.86}>
        <Text style={styles.secondaryActionText}>BACK TO HOME</Text>
      </TouchableOpacity>
    </View>
  );
}

function SectionCard({ eyebrow, title, helper, badgeLabel, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {badgeLabel ? (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
      {helper ? <Text style={styles.sectionHelper}>{helper}</Text> : null}
      {children}
    </View>
  );
}

function IdentityField({ label, value }) {
  return (
    <View style={styles.identityField}>
      <Text style={styles.identityLabel}>{label}</Text>
      <Text style={styles.identityValue}>{value || "Not available"}</Text>
    </View>
  );
}

function WorkflowStep({ index, label, active }) {
  return (
    <View style={styles.workflowStepRow}>
      <View style={[styles.workflowStepIndex, active && styles.workflowStepIndexActive]}>
        <Text style={[styles.workflowStepIndexText, active && styles.workflowStepIndexTextActive]}>{index + 1}</Text>
      </View>
      <Text style={[styles.workflowStepLabel, active && styles.workflowStepLabelActive]}>{label}</Text>
    </View>
  );
}

export default function SubmitRequestScreen({ user, onBack, onSuccess }) {
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedTypeName, setSelectedTypeName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState("");
  const [requesterInfo, setRequesterInfo] = useState(null);
  const [requesterRoleId, setRequesterRoleId] = useState(normalizeRoleId(user?.role_id));
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const nextRoleId = normalizeRoleId(user?.role_id);
    if (nextRoleId !== null) setRequesterRoleId(nextRoleId);
  }, [user?.role_id]);

  const loadInitialData = async () => {
    setLoadingTypes(true);
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const storedUser = JSON.parse(userStr);
        const storedRoleId = normalizeRoleId(storedUser?.role_id);
        if (storedRoleId !== null) setRequesterRoleId((current) => current ?? storedRoleId);
      }

      const token = await getAuthToken();
      if (!token) throw new Error("You are not authenticated. Please sign in again.");

      const [typesRes, infoRes] = await Promise.all([
        fetch(`${API_URL}/maintenance-types`, { headers: getAuthHeaders(token) }),
        fetch(`${API_URL}/users/reqInfo`, { headers: getAuthHeaders(token) }),
      ]);
      const [typesData, infoData] = await Promise.all([
        typesRes.json().catch(() => ({})),
        infoRes.json().catch(() => ({})),
      ]);

      if (!typesRes.ok) {
        throw new Error(getApiErrorMessage(typesRes.status, typesData, "Failed to load maintenance types."));
      }
      if (!infoRes.ok) {
        throw new Error(getApiErrorMessage(infoRes.status, infoData, "Failed to load requester information."));
      }

      setMaintenanceTypes(extractApiList(typesData));
      setRequesterInfo(extractApiItem(infoData));
    } catch (fetchError) {
      console.error("Failed to load data:", fetchError);
      setError(fetchError?.message || "Failed to load submission form.");
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSubmit = async () => {
    const internalRequester = INTERNAL_ROLE_IDS.includes(normalizeRoleId(requesterRoleId));
    setError("");
    if (internalRequester) {
      const nextFieldErrors = {};

      if (!selectedTypeId) {
        nextFieldErrors.type = "Select a maintenance type to route this request.";
      }
      if (!location.trim()) {
        nextFieldErrors.location = "Enter the exact campus location for dispatch.";
      }
      if (!description.trim()) {
        nextFieldErrors.description = "Provide a work-order narrative before submitting.";
      }
      setFieldErrors(nextFieldErrors);

      if (Object.keys(nextFieldErrors).length > 0) {
        setError("Review the highlighted fields before submitting.");
        return;
      }
    } else {
      setFieldErrors({});
      if (!selectedTypeId) {
        setError("Please select a maintenance type.");
        return;
      }
      if (!location.trim()) {
        setError("Please enter the location.");
        return;
      }
      if (!description.trim()) {
        setError("Please describe the issue.");
        return;
      }
    }
    if (requesterRoleId !== null && ![ROLE_IDS.REQUESTER, ROLE_IDS.HEAD, ROLE_IDS.STAFF].includes(requesterRoleId)) {
      setError("This account is not allowed to submit maintenance requests.");
      return;
    }
    if (!requesterInfo) {
      setError(internalRequester ? "Requester information not found. Please login again." : "User data not found. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setError("You are not authenticated. Please sign in again.");
        return;
      }

      const payload = {
        date_requested: new Date().toISOString().slice(0, 10),
        details: description.trim(),
        requesting_personnel: requesterInfo.user_id,
        position_id: requesterInfo.position_id,
        requesting_office: requesterInfo.office_id,
        contact_number: requesterInfo.contact_number || "",
        maintenance_type_id: selectedTypeId,
        location: location.trim(),
      };

      const makeFormData = () => {
        const next = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          next.append(key, String(value ?? ""));
        });
        appendImageAssetsToFormData(next, selectedImages, "indexed");
        return next;
      };

      let res = null;
      let data = {};

      if (selectedImages.length === 0) {
        res = await fetch(`${API_URL}/maintenance-requests`, {
          method: "POST",
          headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => ({}));
      } else {
        res = await fetch(`${API_URL}/maintenance-requests`, {
          method: "POST",
          headers: getAuthHeaders(token),
          body: makeFormData(),
        });
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        setError(getApiErrorMessage(res.status, data, "Failed to submit maintenance request."));
        return;
      }

      setSubmittedType(selectedTypeName);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setSubmitted(true);
      }, 1800);
    } catch (_error) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickImages = async () => {
    const internalRequester = INTERNAL_ROLE_IDS.includes(normalizeRoleId(requesterRoleId));
    setError("");
    if (selectedImages.length >= MAX_IMAGE_ATTACHMENTS) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (internalRequester) {
        setFieldErrors((prev) => ({
          ...prev,
          images: "Photo library access is required to attach evidence images.",
        }));
      }
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
    let imageError = "";
    for (const asset of result.assets) {
      if (next.length >= MAX_IMAGE_ATTACHMENTS) break;
      const validation = validateImageAsset(asset);
      if (!validation.valid) {
        imageError = validation.message;
        setError(validation.message);
        continue;
      }
      next.push(asset);
    }

    setFieldErrors((prev) => ({
      ...prev,
      images: imageError,
    }));
    setSelectedImages(next.slice(0, MAX_IMAGE_ATTACHMENTS));
  };

  const removeSelectedImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setFieldErrors((prev) => ({
      ...prev,
      images: "",
    }));
  };

  const handleNew = () => {
    setSelectedTypeId(null);
    setSelectedTypeName("");
    setLocation("");
    setDescription("");
    setError("");
    setFieldErrors({});
    setSubmitted(false);
    setSubmittedType("");
    setSelectedImages([]);
  };

  const roleId = normalizeRoleId(requesterRoleId);
  const isInternalRequester = INTERNAL_ROLE_IDS.includes(roleId);
  const copy = getRoleCopy(roleId);
  const requesterName = buildDisplayName(requesterInfo, user);
  const officeLabel = buildOfficeLabel(requesterInfo, user);
  const positionLabel = buildPositionLabel(requesterInfo, user);
  const contactLabel = buildContactLabel(requesterInfo, user);
  const roleLabel = getRoleLabel(roleId, "User");
  const requestDateLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const pickerLabel = isInternalRequester
    ? selectedImages.length === 0
      ? copy.uploadButtonLabel
      : "ADD MORE"
    : selectedImages.length === 0
      ? "Choose Files"
      : "Add File";
  const locationPlaceholder = isInternalRequester
    ? "e.g. Records Office, 2nd floor, Admin Building"
    : "e.g. Room 204, Admin Building";
  const descriptionPlaceholder = isInternalRequester
    ? "Explain the issue, what was observed, operational impact, and any urgency notes for the maintenance team."
    : "Describe the issue...";

  if (submitted) {
    return (
      <WaitingScreen
        submittedType={submittedType}
        onNewRequest={handleNew}
        onGoHome={onSuccess}
        requesterRoleId={roleId}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Toast visible={showToast} message="Request submitted successfully!" legacy={!isInternalRequester} />
      <ScreenHeader title={copy.headerTitle} subtitle={copy.headerSubtitle} onBack={onBack} />

      <ScrollView
        style={isInternalRequester ? styles.root : styles.legacyRoot}
        contentContainerStyle={isInternalRequester ? styles.scroll : styles.legacyScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={isInternalRequester ? false : true}
      >
        <View style={isInternalRequester ? styles.body : styles.legacyBody}>
          {error ? (
            <View style={isInternalRequester ? styles.errorBox : styles.legacyErrorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isInternalRequester ? (
            <>
              <Text style={styles.legacyLabel}>Maintenance Type *</Text>
              {loadingTypes ? (
                <ActivityIndicator color={R.steel} style={{ marginVertical: 16 }} />
              ) : (
                <View style={styles.legacyTypeGrid}>
                  {maintenanceTypes.map((type) => {
                    const label =
                      type?.name || type?.type_name || type?.maintenance_type || getMaintenanceTypeLabel(type);
                    const selected = selectedTypeId === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.legacyTypeCard, selected && styles.legacyTypeCardActive]}
                        onPress={() => {
                          setSelectedTypeId(type.id);
                          setSelectedTypeName(label);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.legacyTypeLabel, selected && styles.legacyTypeLabelActive]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.legacyLabel}>Location / Room *</Text>
              <TextInput
                style={styles.legacyInput}
                placeholder="e.g. Room 204, Admin Building"
                placeholderTextColor="#a0aec0"
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.legacyLabel}>Issue Description *</Text>
              <TextInput
                style={[styles.legacyInput, styles.legacyTextarea]}
                placeholder="Describe the issue..."
                placeholderTextColor="#a0aec0"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <Text style={styles.legacyLabel}>Images (Optional)</Text>
              <Text style={styles.legacyImageCount}>
                {selectedImages.length}/{MAX_IMAGE_ATTACHMENTS} images selected
              </Text>
              {selectedImages.length < MAX_IMAGE_ATTACHMENTS ? (
                <TouchableOpacity style={styles.legacyPickBtn} onPress={handlePickImages} activeOpacity={0.85}>
                  <Text style={styles.legacyPickBtnText}>{pickerLabel}</Text>
                </TouchableOpacity>
              ) : null}

              {selectedImages.length > 0 ? (
                <View style={styles.legacyThumbGrid}>
                  {selectedImages.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.legacyThumbWrap}>
                      <Image source={{ uri: asset.uri }} style={styles.legacyThumb} />
                      <TouchableOpacity
                        style={styles.legacyRemoveThumbBtn}
                        onPress={() => removeSelectedImage(index)}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.legacyRemoveThumbText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.legacyNoteBox}>
                <Text style={styles.legacyNoteText}>
                  Your request goes through Staff verification, Head approval, and Campus Director approval before final
                  scheduling.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.legacySubmitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.legacySubmitText}>SUBMIT REQUEST</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.internalHero}>
                <View style={styles.internalHeroAccent} />
                <Text style={styles.heroEyebrow}>{copy.heroEyebrow}</Text>
                <View style={styles.heroTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
                    <Text style={styles.heroText}>{copy.heroText}</Text>
                  </View>
                  <View
                    style={[
                      styles.heroRoleBadge,
                      roleId === ROLE_IDS.HEAD ? styles.heroRoleBadgeHead : styles.heroRoleBadgeStaff,
                    ]}
                  >
                    <Text style={styles.heroRoleBadgeText}>{roleLabel}</Text>
                  </View>
                </View>
                <View style={styles.heroChipRow}>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>SYNCED IDENTITY</Text>
                  </View>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>CAMPUS WORK ORDER</Text>
                  </View>
                </View>
              </View>

              <SectionCard
                eyebrow="Personnel Identity"
                title={copy.summaryTitle}
                helper={copy.summaryHelper}
                badgeLabel="READ ONLY"
              >
                <View style={styles.identityGrid}>
                  <IdentityField label="Requesting Personnel" value={requesterName} />
                  <IdentityField label="Role" value={roleLabel} />
                  <IdentityField label="Position" value={positionLabel} />
                  <IdentityField label="Office" value={officeLabel} />
                  <IdentityField label="Contact Number" value={contactLabel} />
                  <IdentityField label="Request Date" value={requestDateLabel} />
                </View>
              </SectionCard>

              <SectionCard eyebrow="Maintenance Type" title={copy.typeTitle} helper={copy.typeHelper}>
                {loadingTypes ? (
                  <ActivityIndicator color={C.steel} style={{ marginVertical: 16 }} />
                ) : maintenanceTypes.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No maintenance types available</Text>
                    <Text style={styles.emptyStateText}>
                      Please refresh or try again later when service categories are available.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.internalTypeGrid}>
                    {maintenanceTypes.map((type) => {
                      const label = getMaintenanceTypeLabel(type);
                      const selected = selectedTypeId === type.id;
                      return (
                        <TouchableOpacity
                          key={type.id}
                          style={[styles.internalTypeCard, selected && styles.internalTypeCardActive]}
                          onPress={() => {
                            setSelectedTypeId(type.id);
                            setSelectedTypeName(label);
                            setFieldErrors((prev) => ({ ...prev, type: "" }));
                          }}
                          activeOpacity={0.84}
                        >
                          <View style={[styles.typeInitialBadge, selected && styles.typeInitialBadgeActive]}>
                            <Text style={[styles.typeInitialText, selected && styles.typeInitialTextActive]}>
                              {getTypeInitials(label)}
                            </Text>
                          </View>
                          <Text style={[styles.internalTypeLabel, selected && styles.internalTypeLabelActive]}>
                            {label}
                          </Text>
                          <Text style={[styles.internalTypeMeta, selected && styles.internalTypeMetaActive]}>
                            {selected ? "Selected service lane" : "Tap to route this issue"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {fieldErrors.type ? <Text style={styles.fieldErrorText}>{fieldErrors.type}</Text> : null}
              </SectionCard>

              <SectionCard eyebrow="Service Location" title={copy.locationTitle} helper={copy.locationHelper}>
                <View style={styles.locationCallout}>
                  <View style={styles.locationCalloutBadge}>
                    <Text style={styles.locationCalloutBadgeText}>Dispatch Point</Text>
                  </View>
                  <Text style={styles.locationCalloutText}>
                    Include the building, floor, room, office, or facility zone so the maintenance team can route the
                    work order accurately.
                  </Text>
                </View>
                <Text style={styles.fieldLabel}>Specific Building / Room / Facility</Text>
                <TextInput
                  style={[styles.input, styles.inputInternal]}
                  placeholder={locationPlaceholder}
                  placeholderTextColor="#9BAABA"
                  value={location}
                  onChangeText={(value) => {
                    setLocation(value);
                    setFieldErrors((prev) => ({ ...prev, location: "" }));
                  }}
                />
                {fieldErrors.location ? <Text style={styles.fieldErrorText}>{fieldErrors.location}</Text> : null}
              </SectionCard>

              <SectionCard eyebrow="Issue Narrative" title={copy.descriptionTitle} helper={copy.descriptionHelper}>
                <Text style={styles.fieldLabel}>Operational Description</Text>
                <TextInput
                  style={[styles.input, styles.textarea, styles.textareaInternal]}
                  placeholder={descriptionPlaceholder}
                  placeholderTextColor="#9BAABA"
                  value={description}
                  onChangeText={(value) => {
                    setDescription(value);
                    setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                {fieldErrors.description ? <Text style={styles.fieldErrorText}>{fieldErrors.description}</Text> : null}
              </SectionCard>

              <SectionCard
                eyebrow="Evidence Upload"
                title={copy.evidenceTitle}
                helper={copy.evidenceHelper}
                badgeLabel={`${selectedImages.length}/${MAX_IMAGE_ATTACHMENTS}`}
              >
                <View style={styles.uploadHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uploadTitle}>Photo Documentation</Text>
                    <Text style={styles.uploadSubtitle}>
                      Use images for visual proof, damage reference, or site context.
                    </Text>
                  </View>
                  {selectedImages.length < MAX_IMAGE_ATTACHMENTS ? (
                    <TouchableOpacity
                      style={[styles.uploadBtn, styles.uploadBtnInternal]}
                      onPress={handlePickImages}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.uploadBtnText, styles.uploadBtnTextInternal]}>{pickerLabel}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {selectedImages.length > 0 ? (
                  <View style={styles.thumbGrid}>
                    {selectedImages.map((asset, index) => (
                      <View key={`${asset.uri}-${index}`} style={styles.thumbWrap}>
                        <Image source={{ uri: asset.uri }} style={styles.thumb} />
                        <TouchableOpacity
                          style={styles.removeThumbBtn}
                          onPress={() => removeSelectedImage(index)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.removeThumbText}>X</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyUploadBox}>
                    <Text style={styles.emptyUploadTitle}>No attachments selected</Text>
                    <Text style={styles.emptyUploadText}>
                      Add evidence images if the issue benefits from visual documentation.
                    </Text>
                  </View>
                )}
                {fieldErrors.images ? <Text style={styles.fieldErrorText}>{fieldErrors.images}</Text> : null}
              </SectionCard>

              <View style={[styles.workflowCard, styles.workflowCardInternal]}>
                <View style={styles.workflowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workflowEyebrow}>Approval Route</Text>
                    <Text style={styles.workflowTitle}>{copy.workflowTitle}</Text>
                  </View>
                  <View style={styles.workflowBadge}>
                    <Text style={styles.workflowBadgeText}>INTERNAL FLOW</Text>
                  </View>
                </View>
                <Text style={styles.workflowLead}>{copy.workflowLead}</Text>
                <View style={styles.workflowList}>
                  {copy.workflowSteps.map((step, index) => (
                    <WorkflowStep key={`${step}-${index}`} index={index} label={step} active={index === 0} />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, styles.submitBtnInternal, loading && { opacity: 0.72 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.86}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{copy.submitLabel}</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  legacyRoot: { flex: 1, backgroundColor: R.bg },
  legacyScroll: { paddingBottom: 40 },
  legacyBody: { padding: 18 },
  legacyToast: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: R.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: R.gold,
    elevation: 10,
  },
  legacyErrorBox: {
    backgroundColor: R.dangerBg,
    borderLeftWidth: 4,
    borderLeftColor: R.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  legacyLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: R.navy,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  legacyTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legacyTypeCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: R.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: R.border,
    alignItems: "center",
    elevation: 1,
  },
  legacyTypeCardActive: { backgroundColor: R.navy, borderColor: R.navy },
  legacyTypeLabel: { fontSize: 13, fontWeight: "700", color: R.navy },
  legacyTypeLabelActive: { color: "#fff" },
  legacyInput: {
    backgroundColor: R.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: R.navy,
    borderWidth: 1.5,
    borderColor: R.border,
  },
  legacyTextarea: { height: 120, paddingTop: 12 },
  legacyNoteBox: {
    backgroundColor: R.warnBg,
    borderLeftWidth: 4,
    borderLeftColor: R.gold,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  legacyNoteText: { color: R.warn, fontSize: 12, lineHeight: 18 },
  legacyImageCount: { color: R.textMute, fontSize: 12, marginBottom: 8 },
  legacyPickBtn: {
    alignSelf: "flex-start",
    backgroundColor: R.surface,
    borderWidth: 1.5,
    borderColor: R.steel,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  legacyPickBtnText: { color: R.steel, fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  legacyThumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  legacyThumbWrap: {
    width: 82,
    height: 82,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: R.border,
    backgroundColor: R.surface,
  },
  legacyThumb: { width: "100%", height: "100%" },
  legacyRemoveThumbBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(11,31,58,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  legacyRemoveThumbText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  legacySubmitBtn: {
    backgroundColor: R.navy,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 22,
    elevation: 5,
  },
  legacySubmitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  legacyWaitRoot: {
    flex: 1,
    backgroundColor: R.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  legacyWaitBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: R.navy,
    borderWidth: 3,
    borderColor: R.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  legacyWaitBadgeText: { fontSize: 28, color: R.gold, fontWeight: "900" },
  legacyWaitOrg: {
    fontSize: 10,
    fontWeight: "900",
    color: R.textMute,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  legacyWaitTitle: { fontSize: 22, fontWeight: "900", color: R.navy, marginBottom: 6 },
  legacyWaitSub: { fontSize: 13, color: R.textMute, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  legacyWaitSubStrong: { color: R.steel, fontWeight: "800" },
  legacyWaitCard: {
    width: "100%",
    backgroundColor: R.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: R.border,
    marginBottom: 20,
  },
  legacyWaitCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: R.textMute,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  legacyStepRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  legacyStepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: R.bg,
    borderWidth: 1.5,
    borderColor: R.border,
    alignItems: "center",
    justifyContent: "center",
  },
  legacyStepNumActive: { backgroundColor: R.navy, borderColor: R.navy },
  legacyStepNumText: { fontSize: 11, fontWeight: "800", color: R.textMute },
  legacyStepNumTextActive: { color: R.gold },
  legacyStepLabel: { fontSize: 13, color: R.textMute, flex: 1 },
  legacyStepLabelActive: { color: R.navy, fontWeight: "700" },
  legacyNewBtn: {
    width: "100%",
    backgroundColor: R.navy,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  legacyNewBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  legacyHomeBtn: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: R.border,
    backgroundColor: R.surface,
  },
  legacyHomeBtnText: { color: R.navy, fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 52 },
  body: { padding: 18, gap: 14 },
  toast: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
    elevation: 10,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  errorBox: {
    backgroundColor: C.dangerBg,
    borderLeftWidth: 4,
    borderLeftColor: C.danger,
    borderRadius: 14,
    padding: 14,
  },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600", lineHeight: 19 },
  internalHero: {
    backgroundColor: C.navy,
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  internalHeroAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: C.gold,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#AFC0D6",
    textTransform: "uppercase",
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  heroTopRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  heroTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", marginBottom: 6 },
  heroText: { fontSize: 13, lineHeight: 19, color: "#C1D0DF" },
  heroRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroRoleBadgeHead: { backgroundColor: "rgba(201,168,76,0.14)", borderColor: "rgba(201,168,76,0.34)" },
  heroRoleBadgeStaff: { backgroundColor: "rgba(58,133,87,0.14)", borderColor: "rgba(58,133,87,0.34)" },
  heroRoleBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  heroChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  heroChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroChipText: { color: "#C7D4E2", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  requesterHero: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  requesterHeroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: C.steel,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  requesterHeroTitle: { fontSize: 22, fontWeight: "900", color: C.navy, marginBottom: 6 },
  requesterHeroText: { fontSize: 13, lineHeight: 19, color: C.slate },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 8 },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMute,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: C.navy },
  sectionHelper: { fontSize: 13, lineHeight: 19, color: C.slate, marginBottom: 14 },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: "800", color: C.steel, letterSpacing: 0.9 },
  identityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  identityField: {
    width: "48%",
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  identityLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMute,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 5,
  },
  identityValue: { fontSize: 13, fontWeight: "700", color: C.navy, lineHeight: 18 },
  emptyStateCard: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyStateTitle: { fontSize: 15, fontWeight: "800", color: C.navy, marginBottom: 4, textAlign: "center" },
  emptyStateText: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 18 },
  internalTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  internalTypeCard: {
    width: "48%",
    backgroundColor: C.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    minHeight: 126,
  },
  internalTypeCardActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
    elevation: 3,
  },
  typeInitialBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.steelSoft,
    marginBottom: 12,
  },
  typeInitialBadgeActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  typeInitialText: { fontSize: 13, fontWeight: "900", color: C.steel },
  typeInitialTextActive: { color: "#FFFFFF" },
  internalTypeLabel: { fontSize: 14, fontWeight: "800", color: C.navy, lineHeight: 18, marginBottom: 6 },
  internalTypeLabelActive: { color: "#FFFFFF" },
  internalTypeMeta: { fontSize: 12, color: C.textMute, lineHeight: 17 },
  internalTypeMetaActive: { color: "#C5D0DD" },
  requesterTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  requesterTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  requesterTypeChipActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  requesterTypeLabel: { fontSize: 13, fontWeight: "700", color: C.navy },
  requesterTypeLabelActive: { color: "#FFFFFF" },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.navy,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: C.navy,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  inputInternal: {
    backgroundColor: "#F8FBFD",
  },
  locationCallout: {
    backgroundColor: "#F8FBFD",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 12,
  },
  locationCalloutBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,168,76,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  locationCalloutBadgeText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  locationCalloutText: {
    color: C.slate,
    fontSize: 12,
    lineHeight: 18,
  },
  textarea: {
    minHeight: 132,
    paddingTop: 14,
  },
  textareaInternal: {
    minHeight: 154,
  },
  uploadHeaderRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 },
  uploadTitle: { fontSize: 14, fontWeight: "800", color: C.navy, marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: C.textMute, lineHeight: 17 },
  uploadBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.steel,
  },
  uploadBtnInternal: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  uploadBtnText: { color: C.steel, fontSize: 12, fontWeight: "800", letterSpacing: 0.9 },
  uploadBtnTextInternal: { color: "#FFFFFF" },
  thumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  thumbWrap: {
    width: 86,
    height: 86,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
  },
  thumb: { width: "100%", height: "100%" },
  removeThumbBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(11,31,58,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeThumbText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  emptyUploadBox: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: "dashed",
    backgroundColor: C.surfaceAlt,
  },
  emptyUploadTitle: { fontSize: 14, fontWeight: "800", color: C.navy, marginBottom: 4 },
  emptyUploadText: { fontSize: 12, color: C.textMute, lineHeight: 17 },
  fieldErrorText: {
    marginTop: 10,
    color: C.danger,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  workflowCard: {
    backgroundColor: C.warnBg,
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
  },
  workflowCardInternal: {
    backgroundColor: C.infoBg,
    borderLeftColor: C.steel,
  },
  workflowTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 },
  workflowEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMute,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  workflowTitle: { fontSize: 18, fontWeight: "900", color: C.navy },
  workflowBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  workflowBadgeText: { fontSize: 10, fontWeight: "800", color: C.steel, letterSpacing: 0.8 },
  workflowLead: { fontSize: 13, lineHeight: 19, color: C.slate, marginBottom: 14 },
  workflowList: { gap: 10 },
  workflowStepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  workflowStepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
  },
  workflowStepIndexActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  workflowStepIndexText: { fontSize: 11, fontWeight: "800", color: C.textMute },
  workflowStepIndexTextActive: { color: C.gold },
  workflowStepLabel: { flex: 1, fontSize: 13, color: C.slate, lineHeight: 18 },
  workflowStepLabelActive: { color: C.navy, fontWeight: "700" },
  submitBtn: {
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 4,
  },
  submitBtnInternal: {
    backgroundColor: C.steel,
  },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 1.6 },
  waitRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  waitBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: C.navy,
    borderWidth: 3,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  waitBadgeText: { fontSize: 28, color: C.gold, fontWeight: "900" },
  waitEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: C.textMute,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  waitTitle: { fontSize: 24, fontWeight: "900", color: C.navy, marginBottom: 6, textAlign: "center" },
  waitSub: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  waitSubStrong: { color: C.steel, fontWeight: "800" },
  waitCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  waitCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMute,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  waitStepRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  waitStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  waitStepDotActive: { backgroundColor: C.navy, borderColor: C.navy },
  waitStepText: { fontSize: 11, fontWeight: "800", color: C.textMute },
  waitStepTextActive: { color: C.gold },
  waitStepLabel: { fontSize: 13, color: C.textMute, flex: 1, lineHeight: 18 },
  waitStepLabelActive: { color: C.navy, fontWeight: "700" },
  primaryActionBtn: {
    width: "100%",
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 1.4 },
  secondaryActionBtn: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  secondaryActionText: { color: C.navy, fontSize: 13, fontWeight: "800", letterSpacing: 1.4 },
});
