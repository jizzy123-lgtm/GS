import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://your-api-url-here";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Login failed");

      if (data.token) {
        // Save auth token for routes/components expecting either key
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("token", data.token);
        if (rememberMe) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("token");
        } else {
          sessionStorage.setItem("authToken", data.token);
          sessionStorage.setItem("token", data.token);
        }

        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        if (data.user?.role_id) {
          switch (data.user.role_id.toString()) {
            case "1": navigate("/admindashboard"); break;
            case "2": navigate("/headdashboard"); break;
            case "3": navigate("/staffdashboard"); break;
            case "4": navigate("/dashboard"); break;
            case "5": navigate("/campusdirectordashboard"); break;
            default: navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      } else {
        throw new Error("Missing token in response");
      }
    } catch (err) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
        <h1 className="text-center text-xl font-semibold text-slate-800 mb-1">JOSE RIZAL MEMORIAL STATE UNIVERSITY</h1>
        <p className="text-center text-sm text-slate-500 mb-6">GENERAL SERVICE OFFICE MANAGEMENT SYSTEM</p>

        <h2 className="text-lg font-medium text-slate-700 mb-4">Login</h2>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4">
            {error}
          </div>
        ) : null}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-slate-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
            autoComplete="username"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-slate-700">Password</label>
          <div className="flex gap-2 items-center">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full rounded-lg text-white font-medium py-2 ${isLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-4 text-sm text-center text-slate-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signuppage')}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Create account
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">--1.9--</p>
        <p className="text-xs text-gray-500 mt-1 text-center">© {new Date().getFullYear()} Jose Rizal Memorial State University. All rights reserved.</p>
      </div>
    </div>
  );
}
