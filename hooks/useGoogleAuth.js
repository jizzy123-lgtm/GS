import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { API_URL } from "../api";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "1059104622372-mmnfjrd4v7rfhu8qnatic7rjarpl4vme.apps.googleusercontent.com", 
    webClientId: "1059104622372-mmnfjrd4v7rfhu8qnatic7rjarpl4vme.apps.googleusercontent.com",
  });

  const signIn = async () => {
    return await promptAsync();
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

  return { request, response, signIn, verifyToken };
}
