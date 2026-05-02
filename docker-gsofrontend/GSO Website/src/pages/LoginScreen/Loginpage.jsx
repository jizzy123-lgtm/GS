import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // State for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // State for handling errors and loading
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Make API request to your backend
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          rememberMe,
        }),
        mode: "cors",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.token) {
        // Choose storage based on "Remember Me" option
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("authToken", data.token);

        // Store user data properly (assuming "data.user" contains user details)
        if (data.user) {
          storage.setItem("user", JSON.stringify(data.user));
        }

        // Handle navigation based on user role
        if (data.user?.role_id) {
          switch (data.user.role_id.toString()) {
            case "1":
              navigate("/admindashboard");
              break;
            case "2":
              navigate("/headdashboard");
              break;
            case "3":
              navigate("/staffdashboard");
              break;
            case "4":
              navigate("/dashboard");
              break;
            default:
              navigate("/dashboard");
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

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      
      {/* University Logo Placeholder - You can replace this with an actual logo */}
      <div className="mb-6">
      </div>

      {/* Title */}
      <h1 className="text-center font-semibold text-lg sm:text-xl md:text-2xl text-gray-800 mb-2">
        JOSE RIZAL MEMORIAL STATE UNIVERSITY
      </h1>
      <h2 className="text-center text-sm sm:text-base md:text-lg text-gray-600 mb-8">
        GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
      </h2>

      {/* Card Container with subtle shadow and refined border */}
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 border border-gray-200 mb-8">        
        <h3 className="text-center text-xl font-medium text-gray-800 mb-6">Login Screen</h3>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border-l-4 border-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
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

          {/* Password Input with Toggle */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
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
              
              {/* Password Toggle Button */}
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="focus:outline-none text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
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

          {/* Options Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="rememberMe" 
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>
            <div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                Forgot password?
              </a>
            </div>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm 
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      disabled:bg-blue-300 disabled:cursor-not-allowed mt-6"
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
        </form>

        {/* Signup Section */}
        <div className="mt-8 text-center">
          <span className="text-sm text-gray-600">Don't have an account? </span>
          <Link to="/signuppage" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
            Create account
          </Link>
        </div>

        {/* Additional Links */}
        <div className="mt-6 flex justify-center space-x-4 text-xs text-gray-500">
          <a href="#" className="hover:text-gray-700 hover:underline">Reset Password</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700 hover:underline">Retrieve ID</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700 hover:underline">Help</a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pb-6">
        © {new Date().getFullYear()} Jose Rizal Memorial State University. All rights reserved.
      </div>
    </div>
  );
}

export default LoginPage;