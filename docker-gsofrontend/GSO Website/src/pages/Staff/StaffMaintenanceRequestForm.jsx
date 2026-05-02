import { useState, useEffect, useReducer, useRef } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import Icon from "../../components/Icon";

// Reducer for sidebar and mobile menu state
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

// Constants for menu items
const MENU_ITEMS = [
  { text: "Dashboard", to: "/staffdashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/adminnotifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/adminschedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "User Requests", to: "/userrequests", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"},
  { text: "Requests", to: "/StaffSlipRequests", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 1 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01"},
  { text: "Reports", to: "/report", icon: "M13 17V9 M18 17V5 M3 3v16a2 2 0 0 0 2 2h16 M8 17v-3"},
  { text: "Settings", to: "/settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }
];

const StaffMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isMobileMenuOpen: false,
  });
  const mobileMenuRef = useRef(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        dispatch({ type: "CLOSE_MOBILE_MENU" });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // State for request details
  const [requestDetails, setRequestDetails] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  // State for PUT method inputs
  const [date_received, setDateReceived] = useState("");
  const [time_received, setTimeReceived] = useState("");
  const [priority_number, setPriorityNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [verifiedByName, setVerifiedByName] = useState("");
  const [verifiedById, setVerifiedById] = useState("");

  // Retrieve token from storage
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  // Fetch the user's full name
  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/idfullname`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Accept": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user details");
      return {
        id: data.user_id || null,
        full_name: data.full_name || "Unknown User",
      };
    } catch (err) {
      console.error("Error fetching user details:", err);
      return { id: null, full_name: "Unknown User" };
    }
  };

  // Fetch request details when component mounts
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) {
        setError("Invalid request ID");
        return;
      }
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/staffpov/${id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");
        setRequestDetails(data.data || data);
        setDateReceived(data.data?.date_received || new Date().toISOString().split("T")[0]);
        setTimeReceived(data.data?.time_received || new Date().toTimeString().slice(0, 5));
        setPriorityNumber(data.data?.priority_number || "");
        setRemarks(data.data?.remarks || "");

        // Fetch user info
        const userInfo = await fetchUserInfo(token);
        setVerifiedByName(userInfo.full_name);
        setVerifiedById(userInfo.id);
      } catch (err) {
        console.error("Error fetching request details:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchRequestDetails();
  }, [id, token, API_BASE_URL]);

  const formatTimeTo24Hour = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`;
  };

  const handleapprove = async (e, action) => {
    e.preventDefault();
    if (action === "deny" && !remarks.trim()) {
      setError("Remarks are required to deny the request.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const formattedTime = formatTimeTo24Hour(time_received);
      const endpoint =
        action === "deny"
          ? `${API_BASE_URL}/maintenance-requests/${id}/deny`
          : `${API_BASE_URL}/maintenance-requests/${id}/verify`;
      const payload = {
        date_received,
        time_received: formattedTime,
        priority_number,
        remarks,
        verified_by: verifiedById,
        ...(action === "deny" && { status: "denied" }),
      };
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request submission failed");
      navigate("/staffmaintenance");
    } catch (err) {
      setError(err.message || "An error occurred during request submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Staff</div>
        <button
          onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white"
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
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
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700"
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

      <div className="flex flex-1 overflow-auto">
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-2xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
                JOSE RIZAL MEMORIAL STATE UNIVERSITY<br/>GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
              </h2>
              <p className="text-base text-center mb-6">
                User Request Slip (Carpentry Section)
              </p>

              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-center text-gray-500">Loading request details...</p>
                ) : (
                  Object.entries(requestDetails).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {key.replace(/_/g, " ").toUpperCase()}:
                      </label>
                      <p className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-100">
                        {value || "N/A"}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {!isLoading && (
                <form className="space-y-4 mt-6" onSubmit={(e) => handleapprove(e, "approve")}>
                  <div>
                    <label className="block font-semibold text-gray-700">Date Received:</label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-4 py-2"
                      value={date_received}
                      onChange={(e) => setDateReceived(e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Time Received:</label>
                    <input
                      type="time"
                      className="w-full border rounded-lg px-4 py-2"
                      value={time_received}
                      onChange={(e) => setTimeReceived(e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Priority Number:</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-4 py-2"
                      value={priority_number}
                      onChange={(e) => setPriorityNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Remarks:</label>
                    <textarea
                      className="w-full border rounded-lg px-4 py-2"
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Verified By:</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-2"
                      value={verifiedByName}
                      disabled
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-2 rounded-lg"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    className="w-full bg-red-500 text-white py-2 rounded-lg mt-2"
                    onClick={(e) => handleapprove(e, "deny")}
                  >
                    Deny
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffMaintenanceRequestForm;
