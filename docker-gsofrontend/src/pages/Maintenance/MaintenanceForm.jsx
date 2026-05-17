import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { Sidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from "../../components/Sidebar";
import Icon from "../../components/Icon";

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR": return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU": return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU": return { ...state, isMobileMenuOpen: false };
    default: return state;
  }
};

const MaintenanceForm = () => {
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
      setTimeout(() => navigate("/dashboard"), 2000);
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
        <div className="hidden md:block text-xl font-bold">User Portal</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={SIDEBAR_MENU_ITEMS}
          onLogout={() => navigate("/loginpage")}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-3xl font-black text-center mb-8 text-gray-900 leading-tight">
              Maintenance Request Slip<br />
              <span className="text-blue-600 text-2xl">({serviceName})</span>
            </h2>

            {status.error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold">{status.error}</div>}
            {status.success && <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 font-bold">{status.success}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Date Requested</label>
                <input type="date" readOnly className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-gray-400 font-bold" value={formData.date_requested} />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Request Narrative / Details</label>
                <textarea
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-600 focus:bg-white transition-all outline-none text-gray-900 min-h-[120px] font-medium"
                  placeholder="Describe the issue in detail..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                />
              </div>

              {/* User Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <h3 className="font-medium text-gray-700 mb-3">User Information</h3>

                {/* Requesting Personnel */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requesting Personnel:
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                    value={displayName}
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
                  onClick={() => navigate(-1)}
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
        </main>
      </div>

      {status.showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-4">Confirm Request</h3>
            <p className="text-gray-600 mb-6 font-medium">Are you sure you want to submit this request for <strong>{serviceName}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setStatus(prev => ({ ...prev, showConfirmation: false }))} className="flex-1 bg-gray-100 font-bold py-3 rounded-2xl">Wait, no</button>
              <button onClick={handleConfirmedSubmit} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl">Yes, submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceForm;
