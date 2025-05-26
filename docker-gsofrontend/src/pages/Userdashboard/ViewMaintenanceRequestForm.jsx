import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

// Reducer for sidebar state management
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

const ViewMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [requestDetails, setRequestDetails] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [sidebarState, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true, 
  });

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Invalid request ID");
        return;
      }
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/maintenance-requests/list-with-details`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");
        // Find the request with the matching request_id
        const request = (Array.isArray(data) ? data : data.data || []).find(
          (req) => String(req.request_id) === String(id)
        );
        if (!request) throw new Error("Request not found");
        setRequestDetails(request);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchData();
  }, [id, token, API_BASE_URL]);

  // List of fields to display and their labels with better organization
  const fieldsToDisplay = [
    { key: "date_requested", label: "Date Requested", category: "basic" },
    { key: "details", label: "Request Details", category: "basic" },
    { key: "requesting_personnel", label: "Requesting Personnel", category: "requester" },
    { key: "position", label: "Position", category: "requester" },
    { key: "requesting_office", label: "Office", category: "requester" },
    { key: "contact_number", label: "Contact Number", category: "requester" },
    { key: "status", label: "Status", category: "status" },
    { key: "priority_number", label: "Priority Level", category: "status" },
    { key: "maintenance_type", label: "Maintenance Type", category: "status" },
    { key: "date_received", label: "Date Received", category: "processing" },
    { key: "time_received", label: "Time Received", category: "processing" },
    { key: "remarks", label: "Remarks", category: "processing" },
    { key: "verified_by", label: "Verified By", category: "approval" },
    { key: "approved_by_1", label: "Approved By (1st Level)", category: "approval" },
    { key: "approved_by_2", label: "Approved By (2nd Level)", category: "approval" },
  ];

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (statusLower.includes("approved")) return "bg-green-100 text-green-800 border-green-200";
    if (statusLower.includes("completed")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (statusLower.includes("rejected")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getPriorityColor = (priority) => {
    if (!priority) return "bg-gray-100 text-gray-600";
    const priorityNum = parseInt(priority);
    if (priorityNum <= 2) return "bg-red-100 text-red-800 border-red-200";
    if (priorityNum <= 4) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const formatFieldValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    
    if (key === "status") {
      return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(value)}`}>
          {value}
        </span>
      );
    }
    
    if (key === "priority_number") {
      return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(value)}`}>
          Priority {value}
        </span>
      );
    }
    
    if (key === "details" || key === "remarks") {
      return <div className="whitespace-pre-wrap break-words">{value}</div>;
    }
    
    return value;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-lg border-b border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight">
              ManageIT
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200">User</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          title="User"
        />

        <main className="flex-1 overflow-auto">
          <div className="min-h-full p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      Maintenance Request Details
                    </h1>
                    <p className="text-slate-600">
                      Request ID: <span className="font-semibold text-slate-900">#{id}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/maintenance")}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start shadow-sm">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold">Error</h3>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-4 text-slate-600 font-medium">Loading request details...</p>
                </div>
              )}

              {/* Request Details */}
              {!isLoading && requestDetails && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {fieldsToDisplay.map(({ key, label, category }) => (
                      <div 
                        key={key} 
                        className={`space-y-2 ${key === 'details' || key === 'remarks' ? 'lg:col-span-2' : ''}`}
                      >
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          {label}
                        </label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
                          <div className="text-slate-900 w-full">
                            {key === "requesting_personnel"
                              ? requestDetails.requesting_personnel || "N/A"
                              : formatFieldValue(key, requestDetails[key])
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                      <div className="text-sm text-slate-500">
                        Last updated: {new Date().toLocaleDateString()}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate("/maintenance")}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Requests
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewMaintenanceRequestForm;