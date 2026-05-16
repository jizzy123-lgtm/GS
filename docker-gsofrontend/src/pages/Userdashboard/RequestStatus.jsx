import { useState, useReducer, useEffect, memo, useCallback, useRef } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { Sidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from "../../components/Sidebar";
import Icon from "../../components/Icon";

// --- Custom Hooks ---
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// --- Reducer ---
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MENU_ITEMS = SIDEBAR_MENU_ITEMS;

const Header = ({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu, userTitle = "User" }) => {
  const mobileMenuRef = useRef(null);

  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
      <div className="hidden md:block text-xl font-bold text-white">{userTitle}</div>
      <div className="flex items-center gap-4 md:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
      </div>
      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.text}
              to={item.to}
              className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
              onClick={onCloseMobileMenu}
            >
              <Icon path={item.icon} className="w-5 h-5 mr-3" />
              {item.text}
            </NavLink>
          ))}
        </nav>
        <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
          Created By Exverter
        </div>
      </div>
    </header>
  );
};

const StatusTable = ({ requests, selectedTab, onViewClick, onFeedbackClick }) => (
  <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b-2 border-gray-200">
          <th className="p-3 text-left font-semibold">Date Requested</th>
          <th className="p-3 text-left font-semibold">Requesting Personnel</th>
          <th className="p-3 text-left font-semibold">Position</th>
          <th className="p-3 text-left font-semibold">Office</th>
          <th className="p-3 text-left font-semibold">Maintenance Type</th>
          <th className="p-3 text-left font-semibold">Status</th>
          <th className="p-3 text-left font-semibold">Actions</th>
          {selectedTab === "Done" && (
            <th className="p-3 text-left font-semibold">Give Feedback</th>
          )}
        </tr>
      </thead>
      <tbody>
        {requests.length > 0 ? (
          requests.map((request) => (
            <tr key={request.request_id} className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400">
              <td className="p-3">{new Date(request.date_requested).toLocaleDateString()}</td>
              <td className="p-3 font-medium">{request.requesting_personnel || "N/A"}</td>
              <td className="p-3">{request.position || "N/A"}</td>
              <td className="p-3">{request.requesting_office || "N/A"}</td>
              <td className="p-3">{request.maintenance_type || "N/A"}</td>
              <td className="p-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  request.status?.toLowerCase().includes("pending")
                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                    : request.status?.toLowerCase().includes("verified")
                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                    : request.status?.toLowerCase().includes("scheduled")
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : request.status?.toLowerCase().includes("approved") || request.status?.toLowerCase().includes("done") || request.status?.toLowerCase().includes("completed")
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}>
                  {request.status}
                </span>
              </td>
              <td className="p-3">
                <button
                  onClick={() => onViewClick(request.request_id)}
                  className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600"
                >
                  View
                </button>
              </td>
              {selectedTab === "Done" && (
                <td className="p-3">
                  <button
                    onClick={() => onFeedbackClick(request.request_id)}
                    className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600"
                  >
                    Give Feedback
                  </button>
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={selectedTab === "Done" ? 8 : 7} className="p-3 text-center">
              No requests found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const RequestStatus = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [selectedTab, setSelectedTab] = useState(location.state?.tab || "Pending");
  const [userNameParts, setUserNameParts] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    suffix: "",
  });

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const handleLogout = useCallback(async () => {
    try {
      if (!token) throw new Error("No token found");
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        mode: "cors",
      });
      if (!response.ok) throw new Error("Failed to log out");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      navigate("/loginpage", { replace: true });
    } catch (err) {
      console.error(err.message || "An error occurred during logout");
    }
  }, [token, navigate]);

  // Fetch statuses from /common-datas (same as CampusDirectorRequests)
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/common-datas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };
    fetchReferenceData();
  }, [token]);

  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        navigate("/loginpage");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [userRes, reqRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/idfullname`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/maintenance-requests/list-with-details`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userRes.ok) throw new Error("Failed to fetch user info");
        if (!reqRes.ok) throw new Error("Failed to fetch maintenance requests");

        const userData = await userRes.json();
        const reqData = await reqRes.json();

        setUserNameParts({
          last_name: userData.last_name || "",
          first_name: userData.first_name || "",
          middle_name: userData.middle_name || "",
          suffix: userData.suffix || "",
        });

        const userId = userData.user_id;
        const list = Array.isArray(reqData.data) ? reqData.data : reqData;
        setRequests(
          list.filter((r) => String(r.requester_id) === String(userId))
        );
      } catch (err) {
        setError(err.message || "An error occurred while loading data.");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [token, navigate]);

  // Filtering logic — same as CampusDirectorRequests
  const filtered = requests.filter((r) => {
    const status = r.status?.trim();
    const statusLower = status?.toLowerCase();

    if (selectedTab === "Pending") {
      return statusLower === "pending" || statusLower === "verified";
    }
    if (selectedTab === "Scheduled") {
      return statusLower === "scheduled";
    }
    return statusLower === selectedTab.toLowerCase();
  });

  const handleViewClick = useCallback((id) => {
    navigate(`/viewmaintenancerequestform/${id}`);
  }, [navigate]);

  const handleFeedbackClick = useCallback((id) => {
    navigate(`/userfeedback/${id}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-screen bg-gray-50">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-600 font-medium">Loading request statuses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-screen bg-gray-50">
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start shadow-sm">
          <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold">Error</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
        onCloseMobileMenu={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
        userTitle="User"
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={MENU_ITEMS}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 border-b mb-4 pb-3">
            Request Status
          </h2>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 flex-wrap gap-y-2">
            {["Pending", "Scheduled", "Approved", "Disapproved", "Completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 font-semibold rounded-md transition-all ${
                  selectedTab === tab
                    ? tab === "Scheduled"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : tab === "Pending"
                      ? "bg-yellow-500 text-white shadow-lg shadow-yellow-200"
                      : tab === "Approved" || tab === "Completed"
                      ? "bg-green-600 text-white shadow-lg shadow-green-200"
                      : tab === "Disapproved"
                      ? "bg-red-600 text-white shadow-lg shadow-red-200"
                      : "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <StatusTable
            requests={filtered}
            selectedTab={selectedTab}
            onViewClick={handleViewClick}
            onFeedbackClick={handleFeedbackClick}
          />
        </main>
      </div>
    </div>
  );
};

export default RequestStatus;