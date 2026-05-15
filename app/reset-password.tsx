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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../api";

const NAVY = "#1a2472";
const TEAL_FIELD = "#d4eaf0";
const CREAM = "#f5f7fa";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async () => {
    setError("");
    setMessage("");
    
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        setMessage(data.message || "Password has been successfully updated.");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "Failed to reset password. The token may be invalid or expired.");
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
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Create New Password</Text>
            <Text style={styles.cardDesc}>
              Please enter your new password below. Make sure it&apos;s at least 8 characters long.
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

            {!message && (
              <>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                  </View>
                  <View style={styles.inputPill}>
                    <TextInput
                      style={styles.input}
                      placeholder="New Password"
                      placeholderTextColor="#7aa5b5"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#7aa5b5" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                  </View>
                  <View style={styles.inputPill}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#7aa5b5"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.cardFooter}>
            {message ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.replace('/')}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>BACK TO LOGIN</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>RESET PASSWORD</Text>
                )}
              </TouchableOpacity>
            )}
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
  card: {
    width: "100%", maxWidth: 360, backgroundColor: "#fff",
    borderRadius: 28,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 30, elevation: 5, overflow: "visible",
  },
  cardBody: { paddingTop: 30, paddingHorizontal: 24, paddingBottom: 8, alignItems: "center" },
  cardTitle: { fontSize: 22, fontWeight: "700", color: NAVY, marginBottom: 10, letterSpacing: 0.5, textAlign: "center" },
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
  actionBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
});
