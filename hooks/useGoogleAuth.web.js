import * as WebBrowser from "expo-web-browser";
import { useAuthRequest } from "expo-auth-session/providers/google";
import { makeRedirectUri, ResponseType } from "expo-auth-session";
import { API_URL } from "../api";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "1741820025-imh5hvtn6rbl3qb57lur8tfueqd8um91.apps.googleusercontent.com";

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri();

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
