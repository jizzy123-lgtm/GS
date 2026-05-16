import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StaffSidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from "../../components/StaffSidebar"; 
import Icon from "../../components/Icon";

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

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: "",
    scheduled_time: "",
    assigned_staff: "",
    scheduled_notes: ""
  });

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityNumber, setPriorityNumber] = useState("");

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  const fetchData = async () => {
    if (!id || !token) return;
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
      if (request.priority_number) setPriorityNumber(request.priority_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handleMarkAsDone = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}/mark-done`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to mark as done");
      }
      navigate("/staffsliprequests");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPriority = async () => {
    if (!priorityNumber) {
      setError("Please enter a priority number.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}/assign-priority`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ priority_number: priorityNumber }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign priority");
      }
      setShowPriorityModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignSchedule = async () => {
    if (!scheduleData.scheduled_date || !scheduleData.scheduled_time || !scheduleData.assigned_staff) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}/assign-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(scheduleData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign schedule");
      }
      setShowScheduleModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldsToDisplay = [
    { key: "date_requested", label: "Date Requested", category: "basic" },
    { key: "details", label: "Request Details", category: "basic" },
    { key: "requesting_personnel", label: "Requesting Personnel", category: "requester" },
    { key: "position", label: "Position", category: "requester" },
    { key: "requesting_office", label: "Office", category: "requester" },
    { key: "contact_number", label: "Contact Number", category: "requester" },
    { key: "status", label: "Status", category: "status" },
    { key: "priority_number", label: "Priority Number", category: "status" },
    { key: "maintenance_type", label: "Maintenance Type", category: "status" },
    { key: "verified_by", label: "Verified By", category: "approval" },
    { key: "approved_by_1", label: "Approved By (Head)", category: "approval" },
    { key: "approved_by_2", label: "Approved By (Director)", category: "approval" },
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <header className="bg-black text-white p-4 shadow-lg z-50">
        <div className="flex justify-between items-center">
          <span className="text-xl md:text-2xl font-black tracking-tighter">ManageIT</span>
          <div className="text-xl font-bold">Staff</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <StaffSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={SIDEBAR_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            navigate("/loginpage");
          }}
        />

        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {requestDetails ? (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-blue-600 p-8 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-black mb-1 tracking-tight">Request Details</h1>
                      <p className="text-blue-100 font-bold opacity-80 uppercase tracking-widest text-xs">ID: #{id}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg ${getStatusColor(requestDetails.status)}`}>
                      {requestDetails.status}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {fieldsToDisplay.map(({ key, label }) => (
                      <div key={key} className={key === 'details' ? 'md:col-span-2' : ''}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>
                        <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold">
                          {requestDetails[key] || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions Area */}
                  <div className="mt-12 pt-8 border-t-2 border-slate-50 flex flex-wrap gap-4 justify-end">
                    {/* Priority Assignment Button (Director Approved but no Priority yet) */}
                    {requestDetails.status === "Pending" && requestDetails.approved_by_2 && !requestDetails.priority_number && (
                      <button 
                        onClick={() => setShowPriorityModal(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center gap-2"
                      >
                        <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-5 h-5" />
                        Assign Priority
                      </button>
                    )}

                    {/* Scheduling Button (Approved requests) */}
                    {requestDetails.status === "Approved" && (
                      <button 
                        onClick={() => setShowScheduleModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center gap-2"
                      >
                        <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-5 h-5" />
                        Set Schedule
                      </button>
                    )}

                    {/* Completion Button (Scheduled requests) */}
                    {requestDetails.status === "Scheduled" && (
                      <button 
                        onClick={handleMarkAsDone}
                        className="bg-green-600 hover:bg-green-700 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center gap-2"
                      >
                        <Icon path="M5 13l4 4L19 7" className="w-5 h-5" />
                        Mark as Completed
                      </button>
                    )}

                    <button 
                      onClick={() => navigate(-1)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-black px-8 py-4 rounded-2xl transition-all active:scale-95"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-bold">Loading request details...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-orange-500 h-2" />
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Assign Priority Number</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">Please enter the priority level or number for this request to proceed to approval.</p>
              <input 
                type="text" 
                placeholder="e.g., P1, 101, Urgent"
                className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-orange-500 transition-colors font-bold text-lg"
                value={priorityNumber}
                onChange={(e) => setPriorityNumber(e.target.value)}
              />
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowPriorityModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignPriority}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black hover:bg-orange-600 transition-all active:scale-95 shadow-lg"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-blue-600 h-2" />
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tight">Assign Schedule</h3>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-lg mb-4 text-center border border-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Scheduled Date</label>
                  <input 
                    type="date" 
                    className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 transition-colors font-bold"
                    value={scheduleData.scheduled_date}
                    onChange={(e) => setScheduleData({...scheduleData, scheduled_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Scheduled Time</label>
                  <input 
                    type="time" 
                    className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 transition-colors font-bold"
                    value={scheduleData.scheduled_time}
                    onChange={(e) => setScheduleData({...scheduleData, scheduled_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Assigned Staff ID</label>
                  <input 
                    type="number" 
                    placeholder="Enter Staff ID"
                    className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 transition-colors font-bold"
                    value={scheduleData.assigned_staff}
                    onChange={(e) => setScheduleData({...scheduleData, assigned_staff: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Internal Notes</label>
                  <textarea 
                    placeholder="Notes for the team..."
                    className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500 transition-colors h-28 font-medium"
                    value={scheduleData.scheduled_notes}
                    onChange={(e) => setScheduleData({...scheduleData, scheduled_notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignSchedule}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffViewMaintenanceRequestForm;