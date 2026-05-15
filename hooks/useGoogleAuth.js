import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { API_URL } from "../api";

GoogleSignin.configure({
  webClientId: "587332616051-4dgdole77al8f8b0j95ve6fba838ithe.apps.googleusercontent.com",
});

export function useGoogleAuth() {
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      return { type: "success", data: { idToken } };
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { type: "cancelled" };
      }
      return { type: "error", error };
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