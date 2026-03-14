import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://<backend-ip>:<backend-port>/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password }),
      });

      if (response.ok) {
        navigate("/dashboard");
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100">
      {/* Title */}
      <h1 className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 mb-20">
        JOSE RIZAL MEMORIAL STATE UNIVERSITY
        <br />
        GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
      </h1>

     {/* Responsive Login Container */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-white shadow-lg rounded-xl p-6 sm:p-8 md:p-10 
                    border border-gray-200 transition-all duration-300">
        
        {/* Responsive Form Title */}
        <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-6">
          LOGIN ACCOUNT
        </h2>

        {/* Input Fields Container */}
        <div className="space-y-5 sm:space-y-6">
          {/* User ID Input */}
          <div className="flex items-center border-2 border-gray-200 rounded-lg p-3 sm:p-3.5 hover:border-green-500 
                         transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <input
              type="text"
              placeholder="Enter User ID"
              className="w-full outline-none text-sm sm:text-base"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center border-2 border-gray-200 rounded-lg p-3 sm:p-3.5 hover:border-green-500 
                         transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>

            <input
              type="password"
              placeholder="Enter Password"
              className="w-full outline-none text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Responsive Checkbox and Links */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <input type="checkbox" id="rememberMe" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <label htmlFor="rememberMe" className="text-sm sm:text-base text-gray-600">Remember Me</label>
          </div>
          <div className="flex space-x-2 sm:space-x-3">
            <a href="#" className="text-xs sm:text-sm text-red-500 hover:text-red-600">Reset Password</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="text-xs sm:text-sm text-red-500 hover:text-red-600">Retrieve ID</a>
          </div>
        </div>
       {/* Responsive Login Button */}
        <button
        onClick={() => navigate('/dashboard')}
          className="w-full mt-6 sm:mt-7 bg-green-500 hover:bg-green-600 text-white 
                  py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors duration-300"
        >
          LOGIN
        </button>

       </div>
    </div>
  );
}

export default LoginPage;
