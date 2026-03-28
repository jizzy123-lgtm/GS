export async function performLogout(navigate) {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  try {
    if (token) {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Logout API failed:", response.status, errorText);
      } else {
        const data = await response.json().catch(() => null);
        const message = data?.message || "Logged out";
        console.log("Logout response:", message);
        if (message) {
          // optional: short-lived UI feedback (toast fallback)
          window.alert(message);
        }
      }
    }
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    if (navigate) {
      navigate("/loginpage", { replace: true });
    }
  }
}
