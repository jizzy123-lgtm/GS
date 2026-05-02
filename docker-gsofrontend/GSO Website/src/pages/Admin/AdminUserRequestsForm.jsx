import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminUserRequestsForm() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [token, setToken] = useState("");

  // Retrieve token from storage
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage"); // Redirect to login if token is missing
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/pending-approvals`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("Fetched Data:", data); // Debugging log

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user data");
        }

        // If the API returns an array, take the first item
        if (Array.isArray(data) && data.length > 0) {
          setUserData(data[0]); // Take the first user from the array
        } else {
          setUserData(data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token, API_BASE_URL]);

  // Function to map role_id to role name
  const getRoleName = (role_id) => {
    const roleMap = {
      1: "Admin",
      2: "Head",
      3: "Staff",
      4: "User",
    };
    return roleMap[role_id] || "Unknown"; // Return the role name or "Unknown" if not found
  };

  // Function to update account status
  const updateAccountStatus = async (status) => {
    if (!userData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userData.id}/updateAccountStatus`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_status: status }),
      });

      const result = await response.json();
      console.log(`Updated Status to ${status}:`, result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to update status");
      }

      setStatusMessage(`User status updated to ${status}`);
      setUserData({ ...userData, account_status: status });
    } catch (err) {
      console.error("Error updating status:", err);
      setStatusMessage("Failed to update status");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100">
      <h1 className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 mb-20">
        JOSE RIZAL MEMORIAL STATE UNIVERSITY
        <br />
        GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
      </h1>

      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-white shadow-lg rounded-xl p-6 sm:p-8 md:p-10 border border-gray-200 transition-all duration-300">
        <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-6">
          USER DETAILS
        </h2>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {statusMessage && <div className="bg-blue-50 text-blue-500 p-3 rounded-lg mb-4 text-sm">{statusMessage}</div>}

        {isLoading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          userData && (
            <div className="space-y-5 sm:space-y-6">
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Full Name: {userData.full_name}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Username: {userData.username}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Email: {userData.email}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Office: {userData.office}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Position: {userData.position}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Contact Number: {userData.contact_number}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Role: {getRoleName(userData.role_id)}</div>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">Status: {userData.account_status}</div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => updateAccountStatus("Approved")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateAccountStatus("Disapproved")}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition"
                >
                  Disapprove
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminUserRequestsForm;
