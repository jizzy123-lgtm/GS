import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  // Roles mapping
  const roles = [
    { label: "Select Role", value: "", disabled: true },
    { label: "Admin", value: 1 },
    { label: "Head", value: 2 },
    { label: "Staff", value: 3 },
    { label: "Requester", value: 4 },
  ];

  // States
  const [formData, setFormData] = useState({
    requesting_personnel: "",
    position: "",
    requesting_office: "",
    contact_number: "",
    username: "",
    email: "",
    role_id: ""
  });
  
  const [status, setStatus] = useState({
    isFetchingUserDetails: false,
    error: null
  });
  
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  
  // API base URL
  const API_BASE_URL = "https://api.example.com";
  
  // Get role label from role_id
  const getRoleLabel = (roleId) => {
    const role = roles.find(role => role.value === roleId);
    return role ? role.label : "Unknown Role";
  };
  
  // Check for authentication token and fetch user details
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
      fetchUserDetails(authToken);
    }
  }, [navigate]);
  
  // Fetch user details with the provided token
  const fetchUserDetails = async (authToken) => {
    try {
      setStatus(prev => ({ ...prev, isFetchingUserDetails: true }));
      
      const response = await fetch(`${API_BASE_URL}/users/reqInfo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user details");
      }

      // Update form with user details including role_id instead of role
      setFormData(prev => ({
        ...prev,
        requesting_personnel: data.full_name || "",
        position: data.position || "",
        requesting_office: data.office || "",
        contact_number: data.contact_number || "",
        username: data.username || "",
        email: data.email || "",
        role_id: data.role_id || ""
      }));
    } catch (err) {
      console.error("Error fetching user details:", err);
      setStatus(prev => ({
        ...prev,
        error: err.message || "Failed to fetch user details"
      }));
    } finally {
      setStatus(prev => ({ ...prev, isFetchingUserDetails: false }));
    }
  };
  
  // Refresh user details with current token
  const refreshUserDetails = () => {
    fetchUserDetails(token);
  };
  
  // Navigate to password change page
  const navigateToChangePassword = () => {
    navigate('/change-password');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8 w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">User Profile</div>
              {status.isFetchingUserDetails ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                  Loading...
                </span>
              ) : status.error ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                  Error
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              )}
            </div>
            
            {status.error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {status.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="relative">
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-3xl text-indigo-500 font-medium">
                    {formData.requesting_personnel ? formData.requesting_personnel.charAt(0) : "U"}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-center text-gray-900">{formData.requesting_personnel || "User Name"}</h1>
                <p className="text-gray-500 text-center">{formData.position || "Position"}</p>
                <p className="text-indigo-500 text-center font-medium mt-1">{getRoleLabel(formData.role_id) || "Role"}</p>
              </div>
              
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="text-sm text-gray-900">{formData.username || "Not Available"}</dd>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{formData.email || "Not Available"}</dd>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">{formData.requesting_personnel || "Not Available"}</dd>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Position</dt>
                    <dd className="text-sm text-gray-900">{formData.position || "Not Available"}</dd>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="text-sm text-gray-900">{getRoleLabel(formData.role_id) || "Not Available"}</dd>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Office</dt>
                    <dd className="text-sm text-gray-900">{formData.requesting_office || "Not Available"}</dd>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                    <dd className="text-sm text-gray-900">{formData.contact_number || "Not Available"}</dd>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <button
                  onClick={refreshUserDetails}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={status.isFetchingUserDetails}
                >
                  {status.isFetchingUserDetails ? "Refreshing..." : "Refresh Profile"}
                </button>
                
                <button
                  onClick={navigateToChangePassword}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;