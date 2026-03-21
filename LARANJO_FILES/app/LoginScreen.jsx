import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";

export default function LoginScreen({ onLoginSuccess, onSignUp }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess && onLoginSuccess(data.user);
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
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

        {/* University Header */}
        <View style={styles.uniHeader}>
          <Text style={styles.uniName}>JOSE RIZAL MEMORIAL STATE UNIVERSITY</Text>
          <Text style={styles.uniSub}>General Services Office · Main Campus</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Seal bump */}
          <View style={styles.sealWrap}>
            <View style={styles.sealRing}>
              <Image
                source={require('../assets/images/jrmsu-seal.png')}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>
              GSU <Text style={styles.cardTitleTeal}>Gateway</Text>
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Username field */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Text style={styles.fieldIconText}>👤</Text>
              </View>
              <View style={styles.inputPill}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#7aa5b5"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Text style={styles.fieldIconText}>🔒</Text>
              </View>
              <View style={styles.inputPill}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#7aa5b5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {/* Footer button */}
          <View style={styles.cardFooter}>
            <View style={styles.footerAccent} />
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>LOGIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

      {/* Sign up */}
<View style={{ alignItems: "center", marginTop: 20 }}>
  <Text style={styles.signupText}>Don't have an account yet?</Text>
  <TouchableOpacity onPress={onSignUp}>
    <Text style={styles.signupLink}>Sign up now</Text>
  </TouchableOpacity>
</View> 

        {/* Version */}
        <Text style={styles.version}>
          GSU Gateway v1.9 · © {new Date().getFullYear()} JRMSU · All rights reserved
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const NAVY = "#1a2472";
const NAVY_DARK = "#0d1550";
const GOLD = "#f0c030";
const TEAL = "#1a5c72";
const TEAL_FIELD = "#d4eaf0";
const CREAM = "#f5f7fa";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  uniHeader: { alignItems: "center", marginBottom: 8 },
  uniName: {
    fontSize: 10, fontWeight: "700", color: NAVY,
    letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center",
  },
  uniSub: {
    fontSize: 9, color: "#8a99b5", letterSpacing: 1,
    textTransform: "uppercase", marginTop: 2, textAlign: "center",
  },
  card: {
    width: "100%", maxWidth: 360, backgroundColor: "#fff",
    borderRadius: 28, marginTop: 60,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.13, shadowRadius: 60, elevation: 10, overflow: "visible",
  },
  sealWrap: { position: "absolute", top: -54, alignSelf: "center", zIndex: 2 },
  sealRing: {
    width: 108, height: 108, borderRadius: 54, backgroundColor: NAVY,
    borderWidth: 5, borderColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 24, elevation: 8,
  },
  cardBody: { paddingTop: 68, paddingHorizontal: 24, paddingBottom: 8, alignItems: "center" },
  cardTitle: { fontSize: 22, fontWeight: "700", color: NAVY_DARK, marginBottom: 20, letterSpacing: 0.5 },
  cardTitleTeal: { color: TEAL },
  errorBox: {
    backgroundColor: "#fff0f0", borderLeftWidth: 4, borderLeftColor: "#ef4444",
    borderRadius: 10, padding: 10, marginBottom: 12, width: "100%",
  },
  errorText: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },
  field: { flexDirection: "row", alignItems: "center", marginBottom: 12, width: "100%", gap: 10 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  fieldIconText: { fontSize: 16 },
  inputPill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: TEAL_FIELD, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#1a3050", padding: 0 },
  eyeText: { fontSize: 16, color: "#7aa5b5" },
  cardFooter: {
    backgroundColor: NAVY, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    marginTop: 16, padding: 16, overflow: "hidden",
  },
  footerAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: GOLD },
  loginBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  signupText: { marginTop: 20, fontSize: 13, color: "#7a8aaa", fontStyle: "italic", textAlign: "center" },
  signupLink: { color: NAVY, fontWeight: "700", fontStyle: "normal", textDecorationLine: "underline" },
  version: { marginTop: 12, fontSize: 10, color: "#b0bdd4", letterSpacing: 1, textAlign: "center" },
});