import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { API_URL } from "../api";

const WEB_GOOGLE_CLIENT_ID =
  "589903356257-b0mgbp39ujot1288nng0csudvcr19bun.apps.googleusercontent.com";

GoogleSignin.configure({
  // This library expects the Web OAuth client ID here so it can issue an ID token for the backend.
  webClientId: WEB_GOOGLE_CLIENT_ID,
});

export async function clearGoogleSession() {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    // Ignore "not signed in" style cases; we only need the next sign-in to show the chooser.
    console.log("[useGoogleAuth] clearGoogleSession:", error?.message, error?.code);
  }
}

export function useGoogleAuth() {
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await clearGoogleSession();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      return { type: "success", data: { idToken } };
    } catch (error) {
      console.log("[useGoogleAuth] signIn error:", error?.message, error?.code, JSON.stringify(error));
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { type: "cancelled" };
      }
      return { type: "error", error: { message: error?.message, code: error?.code } };
    }
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

  return { signIn, verifyToken };
}
