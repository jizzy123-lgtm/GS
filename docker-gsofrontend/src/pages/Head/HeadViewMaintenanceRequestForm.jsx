import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HeadSidebar, HEAD_MENU_ITEMS } from "../../components/HeadSidebar";
import Icon from "../../components/Icon";

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    default:
      return state;
  }
};

const HeadViewMaintenanceRequestForm = () => {
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
    { key: "approved_by_1", label: "Approved By (Head)", category: "approval" },
    { key: "approved_by_2", label: "Approved By (Campus Director)", category: "approval" },
  ];

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (statusLower.includes("verified")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (statusLower.includes("approved")) return "bg-green-100 text-green-800 border-green-200";
    if (statusLower.includes("scheduled")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (statusLower.includes("completed") || statusLower.includes("done")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (statusLower.includes("rejected") || statusLower.includes("denied") || statusLower.includes("disapproved")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
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
        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-800 border-blue-100">
          Priority {value}
        </span>
      );
    }
    if (key === "details") {
      return <div className="whitespace-pre-wrap break-words">{value}</div>;
    }
    return value;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Head</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <HeadSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={HEAD_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />

        <main className="flex-1 overflow-auto bg-white/95 backdrop-blur-sm p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Request Details</h1>
                <p className="text-gray-500 font-medium">Request ID: <span className="text-gray-900">#{id}</span></p>
              </div>
              <button 
                onClick={() => navigate("/headrequests")}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
              >
                Back to List
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-sm">
                <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 mr-3 text-red-500" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-medium tracking-wide">Fetching details...</p>
              </div>
            )}

            {!isLoading && requestDetails && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
                  {fieldsToDisplay.map(({ key, label }) => (
                    <div key={key} className={`${key === 'details' ? 'md:col-span-2' : ''} space-y-1.5`}>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {label}
                      </label>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 min-h-[48px] flex items-center">
                        <div className="text-gray-800 font-medium w-full">
                          {formatFieldValue(key, requestDetails[key])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {Array.isArray(requestDetails.comments) && (
                  <div className="px-6 md:px-8 pb-8">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Staff & Admin Comments
                    </label>
                    {requestDetails.comments.length > 0 ? (
                      <div className="space-y-3">
                        {requestDetails.comments.map((c) => (
                          <div key={c.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl shadow-sm">
                            <div className="text-gray-800 font-medium">{c.comment}</div>
                            <div className="text-xs text-gray-500 mt-2 flex items-center">
                              <span className="font-bold text-gray-600">{c.user}</span>
                              <span className="mx-2">•</span>
                              <span className="italic">{c.role}</span>
                              <span className="mx-2">•</span>
                              <span>{c.date} at {c.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-sm py-4 bg-gray-50 rounded-xl text-center border border-dashed border-gray-200">
                        No comments available for this request.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HeadViewMaintenanceRequestForm;
