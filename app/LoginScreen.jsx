import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
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

import { API_URL } from '../api';
import { normalizeRoleId } from "./constants/roles";
import { registerForPushNotificationsAsync } from '../hooks/usePushNotifications';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ onLoginSuccess, onSignUp, onNavigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const { request, signIn, verifyToken } = useGoogleAuth();

  const handleGoogleVerify = async (idToken) => {
    try {
      const { status, data } = await verifyToken(idToken);
      if (status === 200) {
        if (data.status === 'authenticated') {
          const normalizedUser = { ...data.user, role_id: normalizeRoleId(data.user?.role_id) };
          await AsyncStorage.setItem("token", data.token);
          await AsyncStorage.setItem("authToken", data.token);
          await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
          await registerForPushNotificationsAsync(data.token);
          onLoginSuccess && onLoginSuccess(normalizedUser);
        } else if (data.status === 'registration_required') {
          onNavigate && onNavigate('SignUp', { googleData: data.google_data });
        } else {
          setError(data.message || "Google authentication failed.");
        }
      } else if (status === 409) {
        onNavigate && onNavigate('GoogleDuplicate', { accounts: data.accounts, googleData: data.google_data });
      } else {
        setError(data.message || "Google authentication failed.");
      }
    } catch (_err) {
      setError("Cannot connect to server. Check your connection.");
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signIn();
      if (result?.type === 'success') {
        const idToken = result.params?.id_token || result.authentication?.idToken;
        if (idToken) {
          await handleGoogleVerify(idToken);
        } else {
          setError("Google Sign-In failed: no token received.");
        }
      } else if (result?.type !== 'cancel' && result?.type !== 'dismiss') {
        setError("Google Sign-In was not completed.");
      }
    } catch (_err) {
      setError("Google Sign-In failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

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
        const normalizedUser = {
          ...data.user,
          role_id: normalizeRoleId(data?.user?.role_id),
        };
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
        await registerForPushNotificationsAsync(data.token);
        onLoginSuccess && onLoginSuccess(normalizedUser);
      } else {
        setError(data.message || "Login failed. Please try again.");
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
              <View style={styles.fieldIcon}><Ionicons name="person" size={18} color="#fff" /></View>
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
              <View style={styles.fieldIcon}><Ionicons name="lock-closed" size={18} color="#fff" /></View>
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#7aa5b5" /></TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[styles.googleBtn, (googleLoading || !request) && { opacity: 0.6 }]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <>
                  <Svg width="20" height="20" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
                    <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                    <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
                  </Svg>
                  <Text style={styles.googleBtnText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

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
          <Text style={styles.signupText}>Do not have an account yet?</Text>
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
  cardBody: { paddingTop: 68, paddingHorizontal: 24, paddingBottom: 16, alignItems: "center" },
  cardTitle: { fontSize: 22, fontWeight: "700", color: NAVY_DARK, marginBottom: 20, letterSpacing: 0.5 },
  cardTitleTeal: { color: TEAL },
  errorBox: {
    backgroundColor: "#fff0f0", borderLeftWidth: 4, borderLeftColor: "#ef4444",
    borderRadius: 10, padding: 10, marginBottom: 12, width: "100%",
  },
  errorText: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },
  field: { flexDirection: "row", alignItems: "center", marginBottom: 12, width: "100%", gap: 10 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  inputPill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: TEAL_FIELD, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#1a3050", padding: 0 },
  divider: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { marginHorizontal: 12, fontSize: 11, color: "#8a99b5", fontWeight: "700", letterSpacing: 1 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dadce0",
    borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12,
    width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  googleBtnText: { color: "#3c4043", fontSize: 14, fontWeight: "500", letterSpacing: 0.25 },
  cardFooter: {
    backgroundColor: NAVY, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    marginTop: 0, padding: 16, overflow: "hidden",
  },
  footerAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: GOLD },
  loginBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  signupText: { marginTop: 20, fontSize: 13, color: "#7a8aaa", fontStyle: "italic", textAlign: "center" },
  signupLink: { color: NAVY, fontWeight: "700", fontStyle: "normal", textDecorationLine: "underline" },
  version: { marginTop: 12, fontSize: 10, color: "#b0bdd4", letterSpacing: 1, textAlign: "center" },
});




