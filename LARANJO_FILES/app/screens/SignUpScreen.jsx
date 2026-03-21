import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";

const C = {
  navy:     "#0B1F3A",
  steel:    "#1E4D8C",
  gold:     "#C9A84C",
  bg:       "#F0F2F5",
  surface:  "#FFFFFF",
  border:   "#DDE3EC",
  textMute: "#8A9BB0",
  danger:   "#9B1C1C",
  dangerBg: "#FEE8E8",
  warn:     "#B45C10",
};

const SUFFIXES  = ["Jr.", "Sr.", "II", "III", "IV"];

const OFFICES = [
  "College of Engineering",
  "College of Maritime Education",
  "College of Nursing and Allied Health Sciences",
  "School of Midwifery",
  "College of Teacher Education",
  "College of Business Administration",
  "College of Computer Studies",
  "College of Liberal Arts Mathematics and Sciences",
];

const POSITIONS = [
  "Faculty",
  "Staff",
  "Department Head",
  "Dean",
  "Director",
];

const ROLES = [
  { key: "faculty", label: "Faculty" },
  { key: "staff",   label: "Staff" },
];

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DropdownField({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity
        style={[styles.input, styles.dropdownBtn, open && styles.inputFocused]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, !value && { color: "#a0aec0" }]} numberOfLines={1}>
          {value || label}
        </Text>
        <Text style={styles.dropdownArrow}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {options.map((opt, i) => (
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
          ))}
        </View>
      )}
    </View>
  );
}

export default function SignUpScreen({ onBack }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", middle_initial: "", suffix: "",
    username: "", email: "", contact_number: "",
    office: "", position: "", role: "",
    password: "", password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [submitted,    setSubmitted]    = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSignUp = async () => {
    setError("");
    if (!form.first_name.trim())     { setError("First name is required."); return; }
    if (!form.last_name.trim())      { setError("Last name is required."); return; }
    if (!form.username.trim())       { setError("Username is required."); return; }
    if (!form.email.trim())          { setError("Email address is required."); return; }
    if (!form.contact_number.trim()) { setError("Contact number is required."); return; }
    if (!form.office)                { setError("Please select an office."); return; }
    if (!form.position)              { setError("Please select a position."); return; }
    if (!form.role)                  { setError("Please select a role."); return; }
    if (!form.password)              { setError("Password is required."); return; }
    if (form.password.length < 8)   { setError("Password must be at least 8 characters."); return; }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError("Password must contain at least 1 number and 1 special character (e.g. MyPass1!).");
      return;
    }

    if (form.password !== form.password_confirmation) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        if (data.errors) {
          const first = Object.values(data.errors)[0];
          setError(Array.isArray(first) ? first[0] : first);
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (e) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────
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
            <Text style={styles.successCardItem}>1.  An Admin will review your registration.</Text>
            <Text style={styles.successCardItem}>2.  You will receive an email once approved.</Text>
            <Text style={styles.successCardItem}>3.  Log in and start using GSU Gateway.</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Check your spam folder if you don't receive an email.
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
              <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#a0aec0"
                value={form.email} onChangeText={v => set("email", v)}
                keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <TextInput style={styles.input} placeholder="Contact Number *" placeholderTextColor="#a0aec0"
            value={form.contact_number} onChangeText={v => set("contact_number", v)} keyboardType="phone-pad" />

          {/* Work Information */}
          <SectionHeader title="Work Information" />
          <DropdownField label="Select Office" value={form.office}
            options={OFFICES} onSelect={v => set("office", v)} />
          <DropdownField label="Select Position" value={form.position}
            options={POSITIONS} onSelect={v => set("position", v)} />
          <DropdownField
            label="Select Role"
            value={form.role ? ROLES.find(r => r.key === form.role)?.label : ""}
            options={ROLES.map(r => r.label)}
            onSelect={v => set("role", ROLES.find(r => r.label === v)?.key || "")}
          />

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
                  <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
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
                  <Text style={styles.eyeText}>{showConfirm ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
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
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  topBar:         { height: 4, backgroundColor: C.gold },
  header:         { backgroundColor: C.navy },
  headerInner:    { paddingHorizontal: 20, paddingTop: 14 },
  backBtn:        { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 12 },
  backText:       { color: "#8A9FC0", fontSize: 12, fontWeight: "700" },
  headerOrg:      { color: "#fff", fontSize: 14, fontWeight: "800", textAlign: "center" },
  headerSubOrg:   { color: "#6A85A8", fontSize: 11, textAlign: "center", marginTop: 3 },
  headerTitleBox: { backgroundColor: C.steel, paddingVertical: 16, alignItems: "center", marginTop: 14 },
  headerTitle:    { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerTitleSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 },

  body:      { padding: 16 },
  errorBox:  { backgroundColor: C.dangerBg, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: C.danger, fontSize: 13, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 },
  sectionAccent: { width: 4, height: 16, backgroundColor: C.gold, borderRadius: 2 },
  sectionTitle:  { fontSize: 12, fontWeight: "800", color: C.navy, textTransform: "uppercase", letterSpacing: 1 },

  row:  { flexDirection: "row", gap: 10, marginBottom: 0 },
  half: { flex: 1 },

  input: {
    backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: C.navy, borderWidth: 1.5, borderColor: C.border, marginBottom: 10,
  },
  inputFocused: { borderColor: C.steel },

  dropdownWrap:           { marginBottom: 10 },
  dropdownBtn:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 },
  dropdownText:           { fontSize: 13, color: C.navy, flex: 1 },
  dropdownArrow:          { fontSize: 9, color: C.textMute, marginLeft: 6 },
  dropdownList:           { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.steel, borderRadius: 8, marginTop: 4, overflow: "hidden" },
  dropdownItem:           { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  dropdownItemActive:     { backgroundColor: "#EEF2FF" },
  dropdownItemText:       { fontSize: 13, color: C.textMute },
  dropdownItemTextActive: { color: C.navy, fontWeight: "800" },

  hintBox:  { backgroundColor: "#EEF2FF", borderLeftWidth: 4, borderLeftColor: C.steel, borderRadius: 8, padding: 10, marginBottom: 10 },
  hintText: { color: C.steel, fontSize: 11, lineHeight: 17 },

  passwordRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyeBtn:      { paddingHorizontal: 10, paddingVertical: 11, backgroundColor: C.surface, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  eyeText:     { fontSize: 14 },

  noteBox:  { backgroundColor: "#FEF3E2", borderLeftWidth: 4, borderLeftColor: C.gold, borderRadius: 8, padding: 12, marginBottom: 16 },
  noteText: { color: C.warn, fontSize: 12, lineHeight: 18 },

  submitBtn:  { backgroundColor: C.steel, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 20, elevation: 4 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },

  loginLink:     { alignItems: "center", marginTop: 14 },
  loginLinkText: { color: C.textMute, fontSize: 13 },

  successRoot:      { flex: 1, backgroundColor: C.bg },
  successContent:   { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  successBadge:     { width: 72, height: 72, borderRadius: 36, backgroundColor: C.navy, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successBadgeText: { fontSize: 28, color: C.gold, fontWeight: "900" },
  successOrg:       { fontSize: 10, fontWeight: "900", color: C.textMute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  successTitle:     { fontSize: 22, fontWeight: "900", color: C.navy, marginBottom: 8 },
  successSub:       { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  successCard:      { width: "100%", backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  successCardTitle: { fontSize: 11, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  successCardItem:  { fontSize: 13, color: C.navy, lineHeight: 22, fontWeight: "600" },
});