import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../api";

const NAVY = "#1a2472";
const TEAL = "#1a5c72";
const TEAL_FIELD = "#d4eaf0";
const CREAM = "#f5f7fa";

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ identifier: email }),
      });
      
      // We expect a 200 OK success message unconditionally as per backend spec
      if (response.ok) {
        setMessage("If an account exists, a password reset link has been sent.");
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to send reset link. Please try again.");
      }
    } catch (_err) {
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </TouchableOpacity>
        
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardDesc}>
              Enter your email or username and we will send you instructions on how to reset your password.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {message ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Ionicons name="mail" size={16} color="#fff" />
              </View>
              <View style={styles.inputPill}>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Username"
                  placeholderTextColor="#7aa5b5"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetBtnText}>SEND RESET LINK</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: NAVY,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  card: {
    width: "100%", maxWidth: 360, backgroundColor: "#fff",
    borderRadius: 28,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 30, elevation: 5, overflow: "visible",
  },
  cardBody: { paddingTop: 30, paddingHorizontal: 24, paddingBottom: 8, alignItems: "center" },
  cardTitle: { fontSize: 22, fontWeight: "700", color: NAVY, marginBottom: 10, letterSpacing: 0.5 },
  cardDesc: { fontSize: 13, color: "#7aa5b5", textAlign: "center", marginBottom: 20, lineHeight: 18 },
  errorBox: {
    backgroundColor: "#fff0f0", borderLeftWidth: 4, borderLeftColor: "#ef4444",
    borderRadius: 10, padding: 10, marginBottom: 12, width: "100%",
  },
  errorText: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },
  successBox: {
    backgroundColor: "#f0fdf4", borderLeftWidth: 4, borderLeftColor: "#22c55e",
    borderRadius: 10, padding: 10, marginBottom: 12, width: "100%",
  },
  successText: { color: "#166534", fontSize: 13, fontWeight: "600" },
  field: { flexDirection: "row", alignItems: "center", marginBottom: 12, width: "100%", gap: 10 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  inputPill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: TEAL_FIELD, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#1a3050", padding: 0 },
  cardFooter: {
    backgroundColor: NAVY, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    marginTop: 16, padding: 16, overflow: "hidden",
  },
  resetBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  resetBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
});
