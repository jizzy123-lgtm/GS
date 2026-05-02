import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";

import { API_URL } from '../../api';

const C = {
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
};

const SUFFIXES = ["Jr.", "Sr.", "III", "IV", "V"];
const REQUESTER_ROLE_ID = 4;

function isRoleActive(role) {
  if (!role) return false;

  if (typeof role.is_active !== "undefined") {
    return role.is_active === true || String(role.is_active) === "1";
  }

  if (typeof role.active !== "undefined") {
    return role.active === true || String(role.active) === "1";
  }

  if (typeof role.status !== "undefined") {
    const status = String(role.status).toLowerCase();
    return status === "active" || status === "1";
  }

  return true;
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DropdownField({ label, value, options, onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dropdownBtn,
          open && styles.inputFocused,
          disabled && styles.dropdownBtnDisabled,
        ]}
        onPress={() => { if (!disabled) setOpen(!open); }}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text
          style={[
            styles.dropdownText,
            !value && { color: "#a0aec0" },
            disabled && styles.dropdownTextDisabled,
          ]}
          numberOfLines={1}
        >
          {value || label}
        </Text>
        <Text style={styles.dropdownArrow}>{open ? "^" : "v"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {options.length === 0 ? (
            <View style={[styles.dropdownItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.dropdownItemText}>No options available</Text>
            </View>
          ) : (
            options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dropdownItem,
                  value === opt && styles.dropdownItemActive,
                  i === options.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function SignUpScreen({ onBack }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", middle_initial: "", suffix: "",
    username: "", email: "", contact_number: "",
    office_id: null, position_id: null, role_id: null,
    password: "", password_confirmation: "",
  });
  const [offices, setOffices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingCommonData, setLoadingCommonData] = useState(true);
  const [commonDataError, setCommonDataError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectedOffice = useMemo(
    () => offices.find(o => o.id === form.office_id),
    [offices, form.office_id]
  );
  const isCollegeOffice = !!selectedOffice?.name?.startsWith("College of");

  const activeRoles = useMemo(() => roles.filter(isRoleActive), [roles]);
  const visibleRoles = useMemo(() => {
    if (isCollegeOffice) {
      return activeRoles.filter(r => Number(r.id) === REQUESTER_ROLE_ID);
    }
    return activeRoles;
  }, [activeRoles, isCollegeOffice]);

  const roleLabelById = (id) => roles.find(r => r.id === id)?.role_name || "";

  const loadCommonData = async () => {
    setLoadingCommonData(true);
    setCommonDataError("");

    try {
      const res = await fetch(`${API_URL}/common-datas`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load registration options.");
      }

      const payload = data?.data || data;
      const mappedOffices = (Array.isArray(payload?.offices) ? payload.offices : [])
        .map(o => ({ id: Number(o.id), name: o.name || o.office_name || "" }))
        .filter(o => Number.isFinite(o.id) && o.name);

      const mappedPositions = (Array.isArray(payload?.positions) ? payload.positions : [])
        .map(p => ({ id: Number(p.id), name: p.name || p.position_name || "" }))
        .filter(p => Number.isFinite(p.id) && p.name);

      const mappedRoles = (Array.isArray(payload?.roles) ? payload.roles : [])
        .map(r => ({
          id: Number(r.id),
          role_name: r.role_name || r.name || "",
          is_active: r.is_active,
          active: r.active,
          status: r.status,
        }))
        .filter(r => Number.isFinite(r.id) && r.role_name);

      setOffices(mappedOffices);
      setPositions(mappedPositions);
      setRoles(mappedRoles);
    } catch (e) {
      setCommonDataError(e.message || "Unable to load registration options.");
    } finally {
      setLoadingCommonData(false);
    }
  };

  useEffect(() => {
    loadCommonData();
  }, []);

  useEffect(() => {
    if (isCollegeOffice && form.role_id !== REQUESTER_ROLE_ID) {
      set("role_id", REQUESTER_ROLE_ID);
    }
  }, [isCollegeOffice, form.role_id]);

  const handleOfficeSelect = (officeName) => {
    const office = offices.find(o => o.name === officeName);
    const officeId = office?.id || null;
    const officeIsCollege = !!office?.name?.startsWith("College of");

    setForm(prev => ({
      ...prev,
      office_id: officeId,
      role_id: officeIsCollege
        ? REQUESTER_ROLE_ID
        : (prev.role_id === REQUESTER_ROLE_ID ? null : prev.role_id),
    }));
  };

  const handleSignUp = async () => {
    setError("");

    const trimmedFirst = form.first_name.trim();
    const trimmedLast = form.last_name.trim();
    const trimmedUser = form.username.trim();
    const trimmedEmail = form.email.trim();
    const trimmedContact = form.contact_number.trim();
    const finalRoleId = isCollegeOffice ? REQUESTER_ROLE_ID : form.role_id;

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!trimmedFirst) { setError("First name is required."); return; }
    if (!trimmedLast) { setError("Last name is required."); return; }
    if (!trimmedUser) { setError("Username is required."); return; }
    if (!trimmedContact) { setError("Contact number is required."); return; }
    if (!/^09\d{9}$/.test(trimmedContact)) {
      setError("Contact number must start with 09 and be exactly 11 digits.");
      return;
    }
    if (!form.office_id) { setError("Please select an office."); return; }
    if (!form.position_id) { setError("Please select a position."); return; }
    if (!finalRoleId) { setError("Please select a role."); return; }
    if (!form.password) { setError("Password is required."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError("Password must contain at least 1 number and 1 special character (e.g. MyPass1!).");
      return;
    }

    if (form.password !== form.password_confirmation) { setError("Passwords do not match."); return; }

    const payload = {
      last_name: trimmedLast,
      first_name: trimmedFirst,
      middle_name: form.middle_initial.trim(),
      suffix: form.suffix,
      username: trimmedUser,
      email: trimmedEmail,
      position_id: form.position_id,
      office_id: form.office_id,
      contact_number: trimmedContact,
      password: form.password,
      password_confirmation: form.password_confirmation,
      role_id: finalRoleId,
    };

    if (!payload.middle_name) delete payload.middle_name;
    if (!payload.suffix) delete payload.suffix;
    if (!payload.email) delete payload.email;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        if (data.errors) {
          setError(Object.values(data.errors).flat().join("\n"));
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (_e) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successRoot}>
        <View style={styles.topBar} />
        <View style={styles.successContent}>
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>✓</Text>
          </View>
          <Text style={styles.successOrg}>GSU GATEWAY</Text>
          <Text style={styles.successTitle}>Registration Submitted!</Text>
          <Text style={styles.successSub}>
            Your account is pending admin approval. You will be notified via email once approved.
          </Text>
          <View style={styles.successCard}>
            <Text style={styles.successCardTitle}>What happens next?</Text>
            <Text style={styles.successCardItem}>Waiting for approval...</Text>

          </View>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Check your spam folder if you do not receive an email.
            </Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={onBack} activeOpacity={0.85}>
            <Text style={styles.submitText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topBar} />
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Login</Text>
            </TouchableOpacity>
            <Text style={styles.headerOrg}>JOSE RIZAL MEMORIAL STATE UNIVERSITY</Text>
            <Text style={styles.headerSubOrg}>General Services Office Management System</Text>
          </View>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerTitleSub}>Fill in your details below</Text>
          </View>
        </View>

        <View style={styles.body}>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Personal Information */}
          <SectionHeader title="Personal Information" />
          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput style={styles.input} placeholder="First Name *" placeholderTextColor="#a0aec0"
                value={form.first_name} onChangeText={v => set("first_name", v)} />
            </View>
            <View style={styles.half}>
              <TextInput style={styles.input} placeholder="Last Name *" placeholderTextColor="#a0aec0"
                value={form.last_name} onChangeText={v => set("last_name", v)} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput style={styles.input} placeholder="Middle Initial" placeholderTextColor="#a0aec0"
                value={form.middle_initial} onChangeText={v => set("middle_initial", v)} maxLength={2} />
            </View>
            <View style={styles.half}>
              <DropdownField label="Suffix (Optional)" value={form.suffix}
                options={SUFFIXES} onSelect={v => set("suffix", v)} />
            </View>
          </View>

          {/* Account Information */}
          <SectionHeader title="Account Information" />
          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput style={styles.input} placeholder="Username *" placeholderTextColor="#a0aec0"
                value={form.username} onChangeText={v => set("username", v)} autoCapitalize="none" />
            </View>
            <View style={styles.half}>
              <TextInput style={styles.input} placeholder="Email Address (for notifications)" placeholderTextColor="#a0aec0"
                value={form.email} onChangeText={v => set("email", v)}
                keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <View style={[styles.hintBox, { marginBottom: 16 }]}>
            <Text style={styles.hintText}>
              Your email will be used to receive important updates about your maintenance requests.
            </Text>
          </View>
          <TextInput style={styles.input} placeholder="Contact Number *" placeholderTextColor="#a0aec0"
            value={form.contact_number} onChangeText={v => set("contact_number", v)} keyboardType="phone-pad" maxLength={11} />

          {/* Work Information */}
          <SectionHeader title="Work Information" />

          {commonDataError ? (
            <View style={styles.warnBox}>
              <Text style={styles.warnText}>{commonDataError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadCommonData} activeOpacity={0.85}>
                <Text style={styles.retryBtnText}>Retry Loading Options</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {loadingCommonData ? (
            <ActivityIndicator color={C.steel} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <DropdownField
                label="Select Office"
                value={selectedOffice?.name || ""}
                options={offices.map(o => o.name)}
                onSelect={handleOfficeSelect}
              />
              <DropdownField
                label="Select Position"
                value={positions.find(p => p.id === form.position_id)?.name || ""}
                options={positions.map(p => p.name)}
                onSelect={v => set("position_id", positions.find(p => p.name === v)?.id)}
              />
              <DropdownField
                label={isCollegeOffice ? "Role locked to Requester" : "Select Role"}
                value={roleLabelById(form.role_id) || (isCollegeOffice && form.role_id === REQUESTER_ROLE_ID ? "Requester" : "")}
                options={visibleRoles.map(r => r.role_name)}
                onSelect={v => set("role_id", visibleRoles.find(r => r.role_name === v)?.id)}
                disabled={isCollegeOffice}
              />
            </>
          )}

          {/* Security */}
          <SectionHeader title="Security" />

          {/* Password hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Password must be at least 8 characters and include a number and a special character (e.g. MyPass1!)
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <View style={styles.passwordRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Password *" placeholderTextColor="#a0aec0"
                  value={form.password} onChangeText={v => set("password", v)}
                  secureTextEntry={!showPassword} autoCapitalize="none" />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeText}>{showPassword ? "  " : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.half}>
              <View style={styles.passwordRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Confirm Password *" placeholderTextColor="#a0aec0"
                  value={form.password_confirmation} onChangeText={v => set("password_confirmation", v)}
                  secureTextEntry={!showConfirm} autoCapitalize="none" />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                  <Text style={styles.eyeText}>{showConfirm ? "  " : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, (loading || loadingCommonData) && { opacity: 0.7 }]}
            onPress={handleSignUp} disabled={loading || loadingCommonData} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={onBack}>
            <Text style={styles.loginLinkText}>
              Already have an account?{" "}
              <Text style={{ color: C.steel, textDecorationLine: "underline" }}>Sign in here</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  topBar: { height: 4, backgroundColor: C.gold },
  header: { backgroundColor: C.navy },
  headerInner: { paddingHorizontal: 20, paddingTop: 14 },
  backBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 12 },
  backText: { color: "#8A9FC0", fontSize: 12, fontWeight: "700" },
  headerOrg: { color: "#fff", fontSize: 14, fontWeight: "800", textAlign: "center" },
  headerSubOrg: { color: "#6A85A8", fontSize: 11, textAlign: "center", marginTop: 3 },
  headerTitleBox: { backgroundColor: C.steel, paddingVertical: 16, alignItems: "center", marginTop: 14 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerTitleSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 },

  body: { padding: 16 },
  errorBox: { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },
  warnBox: { backgroundColor: "#EEF2FF", borderLeftWidth: 4, borderLeftColor: C.steel, borderRadius: 10, padding: 12, marginBottom: 10 },
  warnText: { color: C.steel, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  retryBtn: { alignSelf: "flex-start", backgroundColor: C.steel, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  retryBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 },
  sectionAccent: { width: 4, height: 16, backgroundColor: C.gold, borderRadius: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.navy, textTransform: "uppercase", letterSpacing: 1 },

  row: { flexDirection: "row", gap: 10, marginBottom: 0 },
  half: { flex: 1 },

  input: {
    backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: C.navy, borderWidth: 1.5, borderColor: C.border, marginBottom: 10,
  },
  inputFocused: { borderColor: C.steel },

  dropdownWrap: { marginBottom: 10 },
  dropdownBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 },
  dropdownBtnDisabled: { backgroundColor: "#F7F9FC", borderColor: "#CBD5E1" },
  dropdownText: { fontSize: 13, color: C.navy, flex: 1 },
  dropdownTextDisabled: { color: "#64748B" },
  dropdownArrow: { fontSize: 9, color: C.textMute, marginLeft: 6 },
  dropdownList: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.steel, borderRadius: 8, marginTop: 4, overflow: "hidden" },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  dropdownItemActive: { backgroundColor: "#EEF2FF" },
  dropdownItemText: { fontSize: 13, color: C.textMute },
  dropdownItemTextActive: { color: C.navy, fontWeight: "800" },

  hintBox: { backgroundColor: "#EEF2FF", borderLeftWidth: 4, borderLeftColor: C.steel, borderRadius: 8, padding: 10, marginBottom: 10 },
  hintText: { color: C.steel, fontSize: 11, lineHeight: 17 },

  passwordRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 11, backgroundColor: C.surface, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  eyeText: { fontSize: 14 },

  noteBox: { backgroundColor: "#FEF3E2", borderLeftWidth: 4, borderLeftColor: C.gold, borderRadius: 8, padding: 12, marginBottom: 16 },
  noteText: { color: C.warn, fontSize: 12, lineHeight: 18 },

  submitBtn: { backgroundColor: C.steel, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 20, elevation: 4 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },

  loginLink: { alignItems: "center", marginTop: 14 },
  loginLinkText: { color: C.textMute, fontSize: 13 },

  successRoot: { flex: 1, backgroundColor: C.bg },
  successContent: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  successBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.navy, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successBadgeText: { fontSize: 28, color: C.gold, fontWeight: "900" },
  successOrg: { fontSize: 10, fontWeight: "900", color: C.textMute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: "900", color: C.navy, marginBottom: 8 },
  successSub: { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  successCard: { width: "100%", backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  successCardTitle: { fontSize: 11, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  successCardItem: { fontSize: 13, color: C.navy, lineHeight: 22, fontWeight: "600" },
});

