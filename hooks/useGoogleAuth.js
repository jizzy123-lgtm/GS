import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { API_URL } from "../api";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const signIn = async () => {
    Alert.alert(
      "Google Sign-In",
      "Google Sign-In is only available in the production build. Please test using the web version (localhost:8081).",
      [{ text: "OK" }]
    );
    return { type: "cancel" };
  };

  const verifyToken = async (idToken) => {
    const res = await fetch(`${API_URL}/auth/google/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  return { request: true, response: null, signIn, verifyToken };
}
