import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StaffSidebar } from "../../components/StaffSidebar"; 

// Reducer for sidebar state management
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, isSidebarCollapsed: action.payload };
    default:
      return state;
  }
};

const StaffViewMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [requestDetails, setRequestDetails] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [sidebarState, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true, 
    isMobileMenuOpen: false,
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

  const handleMarkAsDone = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(
        `${API_BASE_URL}/maintenance-requests/${id}/mark-done`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to mark as done");
      // Optionally, refresh the request details or navigate away
      setRequestDetails({ ...requestDetails, status: "Completed" });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
            <span className="text-xl md:text-2xl font-extrabold">ManageIT</span>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="hidden md:block text-xl font-bold">Staff</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Staff Sidebar */}
        <StaffSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
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

                  {/* Comments Section */}
                  {Array.isArray(requestDetails.comments) && (
                    <div className="px-6 pb-6">
                      <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Comments
                      </label>
                      {requestDetails.comments.length > 0 ? (
                        <div className="space-y-2">
                          {requestDetails.comments.map((c) => (
                            <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded">
                              <div className="text-slate-900">{c.comment}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                By: {c.user} ({c.role}) on {c.date} {c.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 text-sm">No comments</div>
                      )}
                    </div>
                  )}

                  {/* Action Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                      <div className="text-sm text-slate-500">
                        Last updated: {new Date().toLocaleDateString()}
                      </div>
                      <div className="flex gap-3">
                        {/* Mark as Done Button */}
                        {requestDetails.priority_number && requestDetails.status?.toLowerCase() === "approved" && (
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition"
                            onClick={handleMarkAsDone}
                            disabled={isLoading}
                          >
                            Mark as Done
                          </button>
                        )}
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

export default StaffViewMaintenanceRequestForm;