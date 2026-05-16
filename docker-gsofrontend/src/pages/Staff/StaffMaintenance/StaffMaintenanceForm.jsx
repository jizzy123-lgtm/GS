import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { StaffSidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from "../../../../components/StaffSidebar";
import Icon from "../../../../components/Icon";

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR": return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU": return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU": return { ...state, isMobileMenuOpen: false };
    default: return state;
  }
};

const StaffMaintenanceForm = () => {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  
  const [serviceName, setServiceName] = useState("Loading...");
  const [formData, setFormData] = useState({
    date_requested: new Date().toISOString().split("T")[0],
    details: "",
    requesting_personnel: "",
    position_id: "",
    requesting_office: "",
    contact_number: "",
  });

  const [userIds, setUserIds] = useState({ user_id: "", position_id: "", requesting_office: "" });
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState({
    isLoading: false,
    isFetchingUserDetails: true,
    error: "",
    success: "",
    touched: {},
    isSubmitting: false,
    showConfirmation: false,
    fieldErrors: {},
  });

  const fetchServiceDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/maintenance-types/${typeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServiceName(data.type_name);
      }
    } catch (err) { console.error(err); }
  }, [typeId, API_BASE_URL]);

  const fetchUserDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/users/reqInfo`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch user details");

      setUserIds({
        user_id: data.user_id || "",
        position_id: data.position_id?.id || data.position_id || "",
        requesting_office: data.office_id?.id || data.office_id || "",
      });

      setFormData(prev => ({
        ...prev,
        position: data.position_id?.name || data.position_id || "",
        requesting_office: data.office_id?.name || data.office_id || "",
        contact_number: data.contact_number || "",
      }));

      setDisplayName([data.last_name, data.first_name, data.middle_name].filter(Boolean).join(", "));
    } catch (err) {
      setStatus(prev => ({ ...prev, error: err.message }));
    } finally {
      setStatus(prev => ({ ...prev, isFetchingUserDetails: false }));
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchServiceDetails();
    fetchUserDetails();
  }, [fetchServiceDetails, fetchUserDetails]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.details || formData.details.length < 10) {
      setStatus(prev => ({ ...prev, error: "Please provide detailed information (min 10 characters)" }));
      return;
    }
    setStatus(prev => ({ ...prev, showConfirmation: true }));
  };

  const handleConfirmedSubmit = async () => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    try {
      setStatus(prev => ({ ...prev, isSubmitting: true, error: "", success: "" }));
      const payload = {
        date_requested: formData.date_requested,
        details: formData.details,
        requesting_personnel: parseInt(userIds.user_id, 10),
        position_id: parseInt(userIds.position_id, 10),
        requesting_office: parseInt(userIds.requesting_office, 10),
        contact_number: formData.contact_number,
        maintenance_type_id: parseInt(typeId, 10),
      };

      const res = await fetch(`${API_BASE_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submission failed");
      setStatus(prev => ({ ...prev, success: "Request submitted successfully!", showConfirmation: false }));
      setTimeout(() => navigate("/staffdashboard"), 2000);
    } catch (err) {
      setStatus(prev => ({ ...prev, error: err.message, showConfirmation: false }));
    } finally {
      setStatus(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (status.isFetchingUserDetails) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative z-40">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Staff Portal</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={SIDEBAR_MENU_ITEMS}
          onLogout={() => navigate("/loginpage")}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-3xl font-black text-center mb-8 text-gray-900 leading-tight">
              Internal Request Log<br />
              <span className="text-indigo-600 text-2xl">({serviceName})</span>
            </h2>

            {status.error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold">{status.error}</div>}
            {status.success && <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 font-bold">{status.success}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Log Date</label>
                <input type="date" readOnly className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-gray-400 font-bold" value={formData.date_requested} />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Work Order Narrative / Details</label>
                <textarea
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-indigo-600 focus:bg-white transition-all outline-none text-gray-900 min-h-[120px] font-medium"
                  placeholder="Enter request details on behalf of the user..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100 space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Staff Submitter Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Logging Personnel</label>
                    <p className="font-bold text-gray-900">{displayName}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Assigned Office</label>
                    <p className="font-bold text-gray-900">{formData.requesting_office}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => navigate(-1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={status.isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {status.isSubmitting ? "Logging..." : "Log Request"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {status.showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-4">Confirm Internal Log</h3>
            <p className="text-gray-600 mb-6 font-medium">Log this request for <strong>{serviceName}</strong> into the system?</p>
            <div className="flex gap-3">
              <button onClick={() => setStatus(prev => ({ ...prev, showConfirmation: false }))} className="flex-1 bg-gray-100 font-bold py-3 rounded-2xl">Cancel</button>
              <button onClick={handleConfirmedSubmit} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl">Yes, log it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffMaintenanceForm;
