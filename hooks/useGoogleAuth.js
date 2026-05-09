import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session/providers/google";
import { API_URL } from "../api";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "1741820025-aesska7294cigjhu9m3dcnac31k7ocit.apps.googleusercontent.com";

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({
    scheme: "myapp",
    path: "redirect",
  });

  const [request, response, promptAsync] = useAuthRequest({
    clientId: CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    redirectUri,
  });

  if (request) {
    console.log("[GoogleAuth] redirectUri:", request.redirectUri);
  }

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
