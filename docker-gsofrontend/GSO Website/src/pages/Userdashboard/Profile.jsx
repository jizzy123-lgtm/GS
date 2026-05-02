import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Icon from '../../components/Icon';
import Sidebar from '../../components/Sidebar';

const MENU_ITEMS = [
  { text: "Profile", to: "/profile", icon: "M11.5 15H7a4 4 0 0 0-4 4v2 M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z M10 3a4 4 0 1 1 0 8a4 4 0 0 1 0-8z" },
  { text: "Dashboard", to: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/schedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "Request Status", to: "/requeststatus", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 1 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01" },
  { text: "User Feedback", to: "/userfeedback", icon: "M20 11V7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4zM8 7h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7z" },
  { text: "Settings", to: "/settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }
];

// Reducer for sidebar state
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const UserProfile = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });
  const mobileMenuRef = useRef(null);

  const handleToggleMobileMenu = () => dispatch({ type: 'TOGGLE_MOBILE_MENU' });
  const handleCloseMobileMenu = () => dispatch({ type: 'CLOSE_MOBILE_MENU' });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        handleCloseMobileMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Define roles
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
  
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    position: "",
    office: "",
    contact_number: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  const [status, setStatus] = useState({
    isFetchingUserDetails: false,
    isUpdatingProfile: false,
    error: null,
    success: null
  });
  
  const [token, setToken] = useState("");
  
  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  // Authentication check and token retrieval
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    if (!authToken) {
      setStatus(prev => ({
        ...prev,
        error: "Unauthorized: Please log in to continue",
        isFetchingUserDetails: false
      }));
      
      // Show error briefly before redirecting
      const timer = setTimeout(() => navigate("/loginpage"), 2000);
      return () => clearTimeout(timer);
    }
    
    setToken(authToken);
  }, [navigate]);

  // Fetch user details
  useEffect(() => {
    if (!token) return;
    
    const fetchUserDetails = async () => {
      try {
        setStatus(prev => ({ ...prev, isFetchingUserDetails: true }));
        
        const response = await fetch(`${API_BASE_URL}/profile/userInfos`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user details");
        }

        // Update form with user details, including role_id
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
        
        // Also update edit form data
        setEditFormData(prev => ({
          ...prev,
          full_name: data.full_name || "",
          position: data.position || "",
          office: data.office || "",
          contact_number: data.contact_number || "",
          username: data.username || "",
          email: data.email || ""
        }));
      } catch (err) {
        console.error("Error fetching user details:", err);
        setStatus(prev => ({
          ...prev,
          error: err.message || "Failed to fetch user details"
        }));
      } finally {
        setStatus(prev => ({ 
          ...prev, 
          isFetchingUserDetails: false,
          success: null
        }));
      }
    };

    fetchUserDetails();
  }, [token, API_BASE_URL]);
  
  // Get role label based on role_id
  const getRoleLabel = (role_id) => {
    const role = roles.find(r => r.value === Number(role_id));
    return role ? role.label : "Unknown Role";
  };
  
  // Handle input change for edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle toggle for edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset password fields when entering edit mode
      setEditFormData(prev => ({
        ...prev,
        password: "",
        password_confirmation: ""
      }));
      setShowPasswordFields(false);
    }
  };
  
  // Handle toggle for password fields
  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (!showPasswordFields) {
      // Reset password fields when showing them
      setEditFormData(prev => ({
        ...prev,
        password: "",
        password_confirmation: ""
      }));
    }
  };
  
  // Submit updated profile
  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setStatus(prev => ({ 
        ...prev, 
        isUpdatingProfile: true,
        error: null,
        success: null
      }));
      
      // Prepare request body based on whether password is being updated
      const requestBody = {
        full_name: editFormData.full_name,
        contact_number: editFormData.contact_number,
        office: editFormData.office,
        position: editFormData.position,
        email: editFormData.email,
        username: editFormData.username
      };
      
      // Add password fields if they're being updated
      if (showPasswordFields && editFormData.password) {
        requestBody.password = editFormData.password;
        requestBody.password_confirmation = editFormData.password_confirmation;
      }
      
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }
      
      setStatus(prev => ({
        ...prev,
        success: "Profile updated successfully"
      }));
      
      // Exit edit mode
      setIsEditing(false);
      
      // Refresh user details
      refreshUserDetails();
      
    } catch (err) {
      console.error("Error updating profile:", err);
      setStatus(prev => ({
        ...prev,
        error: err.message || "Failed to update profile"
      }));
    } finally {
      setStatus(prev => ({ ...prev, isUpdatingProfile: false }));
    }
  };
  
  // Refresh user details with current token
  const refreshUserDetails = () => {
    const currentToken = token;
    setToken("");
    setTimeout(() => setToken(currentToken), 10);
  };
  
  // Navigate to password change page
  const navigateToChangePassword = () => {
    navigate('/change-password');
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>

        <div className="hidden md:block text-xl font-bold text-white">
          User
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={handleToggleMobileMenu}
            className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
            aria-label="Toggle menu"
            aria-expanded={state.isMobileMenuOpen}
          >
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
          </button>
        </div>

        <div
          ref={mobileMenuRef}
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="py-2">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
                onClick={handleCloseMobileMenu}
              >
                <Icon path={item.icon} className="w-5 h-5 mr-3" />
                {item.text}
              </NavLink>
            ))}
          </nav>
          <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
            Created By Bantilan & Friends
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          title="User"
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
              <div className="md:flex">
                <div className="p-8 w-full">
                  <div className="flex justify-between items-center mb-6">
                    <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">User Profile</div>
                    {/* {status.isFetchingUserDetails ? (
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
                    )} */}
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
                  
                  {status.success ? (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            {status.success}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="relative">
                    {!isEditing ? (
                      <>
                        <div className="flex items-center justify-center mb-6">
                          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-3xl text-indigo-500 font-medium">
                              {formData.requesting_personnel ? formData.requesting_personnel.charAt(0) : "U"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h1 className="text-2xl font-bold text-center text-gray-900">
                            {formData.requesting_personnel || "User Name"}
                          </h1>
                          <p className="text-gray-500 text-center">{formData.position || "Position"}</p>
                          <p className="text-indigo-500 text-center font-medium mt-1">
                            {getRoleLabel(formData.role_id)}
                          </p>
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
                            onClick={toggleEditMode}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={status.isFetchingUserDetails}
                          >
                            Edit Profile
                          </button>
                          
                          <button
                            onClick={refreshUserDetails}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={status.isFetchingUserDetails}
                          >
                            {status.isFetchingUserDetails ? "Refreshing..." : "Refresh Profile"}
                          </button>
                          
                          {/* <button
                            onClick={navigateToChangePassword}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Change Password
                          </button> */}
                        </div>
                      </>
                    ) : (
                      <form onSubmit={updateProfile}>
                        <div className="flex items-center justify-center mb-6">
                          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-3xl text-indigo-500 font-medium">
                              {editFormData.full_name ? editFormData.full_name.charAt(0) : "U"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="mb-4">
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="full_name"
                              id="full_name"
                              value={editFormData.full_name}
                              onChange={handleEditInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                              Username
                            </label>
                            <input
                              type="text"
                              name="username"
                              id="username"
                              value={editFormData.username}
                              onChange={handleEditInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={editFormData.email}
                              onChange={handleEditInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                              Position
                            </label>
                            <input
                              type="text"
                              name="position"
                              id="position"
                              value={editFormData.position}
                              onChange={handleEditInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="office" className="block text-sm font-medium text-gray-700">
                              Office
                            </label>
                            <input
                              type="text"
                              name="office"
                              id="office"
                              value={editFormData.office}
                              onChange={handleEditInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                              Contact Number
                            </label>
                            <input
                              type="text"
                              name="contact_number"
                              id="contact_number"
                              value={editFormData.contact_number}
                              onChange={handleEditInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <button
                              type="button"
                              onClick={togglePasswordFields}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                            >
                              {showPasswordFields ? "Hide Password Fields" : "Update Password"}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {showPasswordFields ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                )}
                              </svg>
                            </button>
                          </div>
                          
                          {showPasswordFields && (
                            <>
                              <div className="mb-4">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                  New Password
                                </label>
                                <input
                                  type="password"
                                  name="password"
                                  id="password"
                                  value={editFormData.password}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                              </div>
                              
                              <div className="mb-4">
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                  Confirm New Password
                                </label>
                                <input
                                  type="password"
                                  name="password_confirmation"
                                  id="password_confirmation"
                                  value={editFormData.password_confirmation}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                              </div>
                              
                              {editFormData.password && editFormData.password !== editFormData.password_confirmation && (
                                <div className="text-red-500 text-sm mb-4">
                                  Passwords do not match
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className="mt-8 space-y-4">
                          <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={
                              status.isUpdatingProfile || 
                              (showPasswordFields && 
                               editFormData.password && 
                               editFormData.password !== editFormData.password_confirmation)
                            }
                          >
                            {status.isUpdatingProfile ? "Saving..." : "Save Changes"}
                          </button>
                          
                          <button
                            type="button"
                            onClick={toggleEditMode}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;