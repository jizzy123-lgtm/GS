import { useState, useEffect, useReducer, useCallback } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Icon from "../../components/Icon";


const maintenanceTypeMap = {
  1: "Janitorial",
  2: "Carpentry",
  3: "Electrical",
  4: "Air-Conditioning",
};

const roleMap = {
  1: "Admin",
  2: "Head",
  3: "Staff",
  4: "User",
};

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
  { text: "Dashboard", to: "/staffdashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/adminnotifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/adminschedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "User Requests", to: "/userrequests", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  { text: "Requests", to: "/StaffSlipRequests", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 1 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01" },
  { text: "Reports", to: "/report", icon: "M13 17V9 M18 17V5 M3 3v16a2 2 0 0 0 2 2h16 M8 17v-3" },
  { text: "Settings", to: "/settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }
];

const StaffViewMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const [requestDetails, setRequestDetails] = useState({});
  const [userNames, setUserNames] = useState({});
  const [currentUser, setCurrentUser] = useState({ id: "", full_name: "", role: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  const fetchUserInfoById = async (userId, authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/fullname`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user details");
      return data.full_name || "Unknown User";
    } catch (err) {
      console.error("Error fetching user details:", err);
      return "Unknown User";
    }
  };

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/userWithRole`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch current user");

      setCurrentUser({
        id: data.id,
        full_name: data.full_name,
        role: data.role_id,
      });
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
      fetchCurrentUser(authToken);
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

        const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");

        const request = data.data || data;
        setRequestDetails(request);

        const approvalFields = ["verified_by", "approved_by_1", "approved_by_2"];
        const namesMap = {};

        await Promise.all(
          approvalFields.map(async (field) => {
            const userId = request[field];
            if (userId) {
              const name = await fetchUserInfoById(userId, token);
              namesMap[field] = name;
            }
          })
        );

        setUserNames(namesMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchData();
  }, [id, token, API_BASE_URL]);

  const filteredEntries = Object.entries(requestDetails).filter(
    ([key]) => key !== "created_at" && key !== "updated_at"
  );

  // Add the handleLogout function
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    navigate("/loginpage");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>

        <div className="hidden md:block text-xl font-bold text-white">
          Staff
        </div>

        {/* Add Logout button to header */}
        <button
          onClick={handleLogout}
          className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>

        {/* ...existing mobile menu button... */}
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
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={MENU_ITEMS}
          title="Staff"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white p-3 md:p-4 lg:p-5 shadow-lg rounded-lg w-full max-w-sm md:max-w-md lg:max-w-xl transition-all duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
                Maintenance Request <br className="hidden sm:block" />
              </h2>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4 md:space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <>
                    {filteredEntries.map(([key, value]) => {
                      let displayValue = value;
                      let displayLabel = key.replace(/_/g, " ").toUpperCase(); // default

                      if (key === "maintenance_type_id") {
                        displayValue = maintenanceTypeMap[value] || `Unknown Type (${value})`;
                        displayLabel = "MAINTENANCE TYPE";
                      } else if (["verified_by", "approved_by_1", "approved_by_2"].includes(key)) {
                        displayValue = userNames[key] || "N/A";

                        // Custom labels
                        if (key === "verified_by") displayLabel = "VERIFIED BY";
                        else if (key === "approved_by_1") displayLabel = "APPROVED BY 1ST HEAD";
                        else if (key === "approved_by_2") displayLabel = "APPROVED BY 2ND HEAD";
                      }

                      return (
                        <div key={key}>
                          <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                            {displayLabel}:
                          </label>
                          <p className="border border-gray-300 rounded-lg px-4 py-2 md:py-3 bg-gray-100">
                            {displayValue || "N/A"}
                          </p>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Back Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between mt-6">
                <button
                  type="button"
                  className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  onClick={() => navigate("/staffsliprequests")}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffViewMaintenanceRequestForm;