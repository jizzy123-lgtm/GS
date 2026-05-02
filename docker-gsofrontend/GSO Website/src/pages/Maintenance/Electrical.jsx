import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Icon from "../../components/Icon";

// Reducer for sidebar state
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const MENU_ITEMS = [
  { text: "Profile", to: "/profile", icon: "M11.5 15H7a4 4 0 0 0-4 4v2 M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z M10 3a4 4 0 1 1 0 8a4 4 0 0 1 0-8z"},
  { text: "Dashboard", to: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/schedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "Request Status", to: "/requeststatus", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 1 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01" },
  { text: "User Feedback", to: "/userfeedback", icon: "M20 11V7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4zM8 7h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7z" },
  { text: "Settings", to: "/settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" },
];

const Electrical = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const mobileMenuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
      dispatch({ type: "CLOSE_MOBILE_MENU" });
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Form input states
  const [formData, setFormData] = useState({
    date_requested: "",
    details: "",
    requesting_personnel: "",
    position: "",
    requesting_office: "",
    contact_number: "",
  });

  // UI state management
  const [status, setStatus] = useState({
    isLoading: false,
    isFetchingUserDetails: true,
    error: "",
    success: "",
    touched: {}, // Track which fields have been touched for validation
    isSubmitting: false,
    showConfirmation: false,
    fieldErrors: {}, // Track specific field errors
  });

  const [token, setToken] = useState("");

  // Update form data with a single function
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Mark field as touched for validation
    if (!status.touched[field]) {
      setStatus(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: true }
      }));
    }
    
    // Clear field error if value is valid
    if (status.fieldErrors[field]) {
      if ((field === 'details' && value.length >= 10) || 
          (field !== 'details' && value)) {
        setStatus(prev => ({
          ...prev,
          fieldErrors: {
            ...prev.fieldErrors,
            [field]: ""
          }
        }));
      }
    }
  };

  const markAllFieldsTouched = () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    
    setStatus(prev => ({
      ...prev,
      touched: allTouched
    }));
  };

  // Check form validity
  const validateForm = () => {
    const fieldErrors = {};
    
    if (!formData.date_requested) fieldErrors.date_requested = "Date is required";
    if (!formData.details) fieldErrors.details = "Details are required";
    else if (formData.details.length < 10) {
      fieldErrors.details = "Please provide more detailed information (at least 10 characters)";
    }
    
    // Update the field errors in state
    setStatus(prev => ({
      ...prev,
      fieldErrors
    }));
    
    return {
      isValid: Object.keys(fieldErrors).length === 0,
      fieldErrors
    };
  };

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
        
        const response = await fetch(`${API_BASE_URL}/users/reqInfo`, {
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

        // Update form with user details
        setFormData(prev => ({
          ...prev,
          requesting_personnel: data.full_name || "",
          position: data.position || "",
          requesting_office: data.office || "",
          contact_number: data.contact_number || "",
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

    fetchUserDetails();
  }, [token, API_BASE_URL]);

  // Set current date when component mounts
  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, date_requested: currentDate }));
  }, []);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (status.error) {
      const timer = setTimeout(() => {
        setStatus(prev => ({ ...prev, error: "" }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.error]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    markAllFieldsTouched();
    
    // Validate form
    const { isValid, fieldErrors } = validateForm();
    if (!isValid) {
      // Display the first error in the general error message
      setStatus(prev => ({
        ...prev,
        error: Object.values(fieldErrors)[0]
      }));
      return;
    }

    // Show confirmation
    setStatus(prev => ({ ...prev, showConfirmation: true }));
  };

  // Submit the form after confirmation
  const handleConfirmedSubmit = useCallback(async () => {
    if (!token) {
      setStatus(prev => ({
        ...prev,
        error: "Unauthorized: Please log in",
        showConfirmation: false
      }));
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }

    try {
      setStatus(prev => ({
        ...prev,
        isSubmitting: true,
        error: "",
        success: ""
      }));

      // API request
      const response = await fetch(`${API_BASE_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          maintenance_type_id: 3,  // 3 is for Electrical
        }),
        mode: "cors",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in");
        } else {
          throw new Error(data.message || "Request submission failed");
        }
      }

      // Success!
      setStatus(prev => ({
        ...prev,
        success: "Request submitted successfully!",
        showConfirmation: false
      }));

      // Navigate after success
      const timer = setTimeout(() => {
        navigate("/maintenance");
      }, 3000);
      return () => clearTimeout(timer);
      
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        error: err.message || "An error occurred during submission",
        showConfirmation: false
      }));
    } finally {
      setStatus(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [token, formData, navigate, API_BASE_URL]);

  // Form input feedback indicators - now considers fieldErrors
  const getInputClasses = (field) => {
    const baseClasses = "w-full border rounded-lg px-4 py-2 md:py-3 transition-all";
    
    // Show error state if field has a specific error
    if (status.fieldErrors[field]) {
      return `${baseClasses} border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50`;
    }
    
    // Otherwise show normal validation state
    const touchedClasses = status.touched[field] ? 
      (field === 'details' && formData[field].length < 10) || !formData[field] ? 
        "border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400" : 
        "border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" : 
      "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    
    return `${baseClasses} ${touchedClasses}`;
  };

  // Render loading state
  if (status.isFetchingUserDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading user details...</p>
        </div>
      </div>
    );
  }
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
            onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
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
            state.isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-2">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
                onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
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
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={MENU_ITEMS}
          title="User"
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white p-3 md:p-4 lg:p-5 shadow-lg rounded-lg w-full max-w-sm md:max-w-md lg:max-w-xl transition-all duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
                User Request Slip <br className="hidden sm:block" />
                (Electrical Section)
              </h2>
  
              {/* Feedback Messages */}
              {status.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{status.error}</span>
                </div>
              )}
  
              {status.success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{status.success}</span>
                </div>
              )}
  
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                {/* Date Requested */}
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Date Requested:
                    {status.fieldErrors.date_requested && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className={getInputClasses('date_requested')}
                      value={formData.date_requested}
                      onChange={(e) => updateFormData('date_requested', e.target.value)}
                    />
                    {status.fieldErrors.date_requested && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {status.fieldErrors.date_requested && (
                    <p className="text-sm text-red-500 mt-1">
                      {status.fieldErrors.date_requested}
                    </p>
                  )}
                </div>
  
                {/* Specific Details */}
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Specific Details (Situations/Condition/Circumstances):
                    {status.fieldErrors.details && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      className={getInputClasses('details')}
                      rows="3"
                      value={formData.details}
                      onChange={(e) => updateFormData('details', e.target.value)}
                      placeholder="Please provide detailed information about your request"
                    ></textarea>
                    {status.fieldErrors.details && (
                      <div className="absolute right-3 top-3 text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {status.fieldErrors.details ? (
                    <p className="text-sm text-red-500 mt-1">
                      {status.fieldErrors.details}
                    </p>
                  ) : status.touched.details && formData.details.length < 10 ? (
                    <p className="text-sm text-red-500 mt-1">
                      Please provide more detailed information ({formData.details.length}/10 characters minimum)
                    </p>
                  ) : null}
                </div>
  
                {/* User Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3">User Information</h3>
                  
                  {/* Requesting Personnel */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requesting Personnel:
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                      value={formData.requesting_personnel}
                      readOnly
                      disabled
                    />
                  </div>
  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                        value={formData.position}
                        readOnly
                        disabled
                      />
                    </div>
  
                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                        value={formData.contact_number}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
  
                  {/* Requesting Office */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requesting Office:
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                      value={formData.requesting_office}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
  
                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between mt-6">
                  <button
                    type="button"
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    onClick={() => navigate("/maintenance")}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    disabled={status.isSubmitting}
                  >
                    {status.isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
  
            {/* Confirmation Modal */}
            {status.showConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full animate-fadeIn">
                  <h3 className="text-lg font-bold mb-4">Confirm Submission</h3>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to submit this electrical service request?
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <p className="text-sm font-medium">Request Details:</p>
                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Date:</span> {formData.date_requested}</p>
                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Description:</span> {formData.details}</p>
                  </div>
                  <div className="flex space-x-3 justify-end">
                  <button
                      type="button"
                      onClick={() => setStatus(prev => ({ ...prev, showConfirmation: false }))}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      disabled={status.isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      onClick={handleConfirmedSubmit}
                      disabled={status.isSubmitting}
                    >
                      {status.isSubmitting ? "Submitting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Electrical;