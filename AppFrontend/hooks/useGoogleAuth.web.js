import * as WebBrowser from "expo-web-browser";
import { useAuthRequest } from "expo-auth-session/providers/google";
import { makeRedirectUri, ResponseType } from "expo-auth-session";
import { API_URL } from "../api";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "589903356257-b0mgbp39ujot1288nng0csudvcr19bun.apps.googleusercontent.com";

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri();
  console.log("[useGoogleAuth.web] redirectUri:", redirectUri);
  console.log("[useGoogleAuth.web] clientId:", CLIENT_ID);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      usePKCE: false,
      responseType: ResponseType.IdToken,
    }
  );

  const signIn = async () => {
    const result = await promptAsync();
    console.log("[useGoogleAuth.web] signIn result:", JSON.stringify(result));
    return result;
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
