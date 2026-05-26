import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleFonts = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
);

function GoogleSignInButton({ onSuccess, onError, isLoading }) {
  const login = useGoogleLogin({
    onSuccess,
    onError,
    flow: "auth-code",
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Sign in with Google
    </button>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectByRole = (user) => {
    switch (user?.role_id?.toString()) {
      case "1": return navigate("/admindashboard");
      case "2": return navigate("/headdashboard");
      case "3": return navigate("/staffdashboard");
      case "4": return navigate("/dashboard");
      case "5": return navigate("/campusdirectordashboard");
      default:  return navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
        mode: "cors",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      if (!data.token) throw new Error("Missing token in response");

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("authToken", data.token);
      if (data.user) storage.setItem("user", JSON.stringify(data.user));
      redirectByRole(data.user);
    } catch (err) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ code }) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code }),
        mode: "cors",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google login failed");
      if (!data.token) throw new Error("Missing token in response");

      sessionStorage.setItem("authToken", data.token);
      if (data.user) sessionStorage.setItem("user", JSON.stringify(data.user));
      redirectByRole(data.user);
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed. Please try again.");
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ height: "100vh", width: "100vw", background: "#f7f5f0", display: "flex", padding: "0", overflow: "hidden" }}>
        <GoogleFonts />

        <div style={{ width: "100vw", height: "100vh", position: "relative", display: "flex" }}>

          {/* Top Bar */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 10, background: "rgba(13,31,78,0.85)", display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px" }}>
            <img src="/JrmsuLOGO_circle.png" alt="JRMSU Logo" style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "2px", textTransform: "uppercase" }}>
              Jose Rizal Memorial State University
            </div>
          </div>

          {/* SVG Background */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <rect width="900" height="620" fill="#f7f5f0"/>
            <path d="M-20,80 C60,40 160,20 280,60 C400,100 460,30 560,50 C660,70 740,20 820,30 L900,10 L900,0 L-20,0 Z" fill="#0d1f4e" opacity="0.06"/>
            <path d="M-30,140 C80,80 200,60 340,110 C480,160 540,90 660,100 C760,108 840,70 920,80 L920,0 L-30,0 Z" fill="#0d1f4e" opacity="0.04"/>
            <path d="M-20,310 C100,240 200,200 340,230 C480,260 560,190 700,210 C800,225 860,190 930,200 L930,620 L-20,620 Z" fill="#0d1f4e" opacity="0.97"/>
            <path d="M-20,340 C80,280 180,250 320,275 C460,300 540,235 670,250 C780,263 850,225 940,235 L940,620 L-20,620 Z" fill="#0a1a40" opacity="0.6"/>
            <path d="M-20,290 C120,250 220,270 360,245 C500,220 580,280 720,265 C820,253 870,275 950,260 L950,290 C870,305 820,283 720,295 C580,310 500,250 360,275 C220,300 120,280 -20,320 Z" fill="#1a3060" opacity="0.5"/>
            <path d="M-20,360 C60,355 160,368 260,355 C380,340 460,370 600,358 C720,347 800,365 940,352 L940,375 C800,388 720,370 600,382 C460,395 380,365 260,378 C160,390 60,377 -20,382 Z" fill="#0a1a40" opacity="0.3"/>
            <path d="M0,440 C100,420 200,445 330,432 C460,419 540,448 680,435 C790,424 860,442 930,430 L930,620 L0,620 Z" fill="#071228" opacity="0.3"/>
            <ellipse cx="90" cy="460" rx="55" ry="18" fill="#1a3a6e" opacity="0.25" transform="rotate(-8,90,460)"/>
            <ellipse cx="310" cy="490" rx="80" ry="14" fill="#0d1f4e" opacity="0.2" transform="rotate(5,310,490)"/>
            <ellipse cx="550" cy="470" rx="60" ry="12" fill="#1a3a6e" opacity="0.18" transform="rotate(-4,550,470)"/>
            <circle cx="130" cy="180" r="60" fill="#1a3060" opacity="0.08"/>
            <circle cx="130" cy="180" r="40" fill="#1a3060" opacity="0.08"/>
            <circle cx="700" cy="80" r="90" fill="#0d1f4e" opacity="0.05"/>
            <circle cx="700" cy="80" r="55" fill="#0d1f4e" opacity="0.04"/>
          </svg>

          {/* Left Branding Panel */}
          <div style={{ width: "40%", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 36px 48px 44px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "140px", fontWeight: 700, color: "#ffffff", letterSpacing: "8px", lineHeight: 1, textShadow: "0 4px 6px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.8), 2px 2px 0px rgba(0,0,0,0.7)" }}>
                GSO
              </div>
              <div style={{ fontSize: "35px", letterSpacing: "3px", textTransform: "uppercase", color: "#ffffff", lineHeight: 1.6, fontWeight: 700, textShadow: "0 4px 6px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.8), 2px 2px 0px rgba(0,0,0,0.7)", marginTop: "8px" }}>
                General Service Office<br/>Management System
              </div>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginTop: "12px", textAlign: "center" }}>
              "Serving with excellence,<br/>one stroke at a time."
            </div>
          </div>

          {/* Right Panel — overflowY:auto so card never gets clipped by the top bar */}
          <div style={{ flex: 1, position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px 32px 32px", overflowY: "auto" }}>

            <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 border border-gray-200 mb-4">
              <h3 className="text-center text-xl font-medium text-gray-800 mb-6">Login Screen</h3>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border-l-4 border-red-500">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="w-full outline-none text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full outline-none text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={togglePasswordVisibility} className="focus:outline-none text-gray-400 hover:text-gray-600 transition-colors duration-200">
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: "#0d1f4e" }}>
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-medium py-2.5 rounded-lg text-sm transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed mt-6"
                  style={{ background: "#0d1f4e" }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </div>
                  ) : "Sign in"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google Button */}
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  isLoading={isLoading}
                />
              </form>

              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <Link to="/signuppage" className="text-sm font-medium hover:underline" style={{ color: "#0d1f4e" }}>
                  Create account
                </Link>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 pb-2">--2.0--</div>
            <div className="text-center text-xs text-gray-500 pb-4">
              © {new Date().getFullYear()} Jose Rizal Memorial State University. All rights reserved.
            </div>

          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;