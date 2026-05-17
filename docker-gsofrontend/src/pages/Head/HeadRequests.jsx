import { useState, useReducer, useEffect, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Icon from "../../components/Icon";
import { HeadSidebar, HEAD_MENU_ITEMS } from "../../components/HeadSidebar"; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

const RequestsTable = ({ onRowClick, requests, showActions }) => (
  <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
    <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="p-3 text-left font-semibold">Date Requested</th>
            <th className="p-3 text-left font-semibold">Personnel Name</th>
            <th className="p-3 text-left font-semibold">Position</th>
            <th className="p-3 text-left font-semibold">Office</th>
            <th className="p-3 text-left font-semibold">Maintenance Type</th>
            <th className="p-3 text-left font-semibold">Status</th>
            <th className="p-3 text-left font-semibold">Contact Number</th>
            {showActions && <th className="p-3 text-left font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <tr key={request.request_id} className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400">
                <td className="p-3">{request.date_requested}</td>
                <td className="p-3">{request.requesting_personnel}</td>
                <td className="p-3">{request.position}</td>
                <td className="p-3">{request.requesting_office}</td>
                <td className="p-3">{request.maintenance_type}</td>
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
                <td className="p-3">{request.contact_number}</td>
                {showActions && (
                  <td className="p-3">
                    <button
                      onClick={() => onRowClick(request.request_id, request.status)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Review
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showActions ? 8 : 7} className="p-3 text-center">
                No maintenance requests found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </main>
);

const HeadRequests = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [statuses, setStatuses] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/common-datas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };
    fetchStatuses();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/users-list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = await res.json();
        const map = {};
        (Array.isArray(users.data) ? users.data : users).forEach(user => {
          map[user.user_id] = user;
        });
        setUsersMap(map);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/loginpage");
      return;
    }
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/maintenance-requests/list-with-details`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);

        // ── Sort: newest request first ─────────────────────────────────────
        const sorted = [...raw].sort((a, b) => {
          const dateA = new Date(a.created_at || a.date_requested || 0);
          const dateB = new Date(b.created_at || b.date_requested || 0);
          return dateB - dateA;
        });

        setRequests(sorted);
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    if (usersMap) fetchRequests();
  }, [token, navigate, usersMap]);

  const handleRowClick = useCallback(
    (id, status) => {
      const needsApproval =
        status === "Pending" ||
        status === "Verified" ||
        status?.toLowerCase() === "urgent" ||
        status?.toLowerCase() === "onhold" ||
        status?.toLowerCase() === "on hold";
      
      if (needsApproval) {
        navigate(`/headmaintenancerequestform/${id}`);
      } else {
        navigate(`/headviewmaintenancerequestform/${id}`);
      }
    },
    [navigate]
  );

  const filtered = requests.filter((r) => {
    if (selectedTab === "Pending") {
      return (r.status === "Pending" || r.status === "Verified") && !r.approved_by_1;
    }
    if (selectedTab === "Approved") {
      return r.status === "Approved" || (r.status === "Verified" && r.approved_by_1);
    }
    if (selectedTab.toLowerCase() === "urgent") {
      return r.status?.toLowerCase() === "urgent";
    }
    return r.status === selectedTab;
  });

  if (loading) return <div className="p-4">Loading requests...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Head</div>
        <button
          onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white"
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        <div
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-2">
            {HEAD_MENU_ITEMS.map((item) => (
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
            Created By Exverter
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-auto">
        <HeadSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={HEAD_MENU_ITEMS}
          onLogout={async () => {
            try {
              if (token) {
                await fetch(`${API_BASE_URL}/logout`, {
                  method: "POST",
                  headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                  },
                });
              }
            } catch (err) {
              console.error(err);
            } finally {
              localStorage.clear();
              sessionStorage.clear();
              navigate("/loginpage", { replace: true });
            }
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 border-b mb-4 pb-3">
            Maintenance Requests
          </h2>
          <div className="flex space-x-4 mb-6">
            {statuses
              .filter((status) => {
                const name = status.name?.toLowerCase();
                return name !== "onhold" && name !== "on hold" && name !== "verified";
              })
              .map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedTab(status.name)}
                className={`relative px-4 py-2 font-semibold rounded-md transition-colors ${
                  selectedTab === status.name
                    ? status.name === "Scheduled"
                      ? "bg-blue-500 text-white"
                      : status.name === "Pending" || status.name === "Verified"
                      ? "bg-yellow-500 text-white"
                      : status.name === "Approved" || status.name === "Done" || status.name === "Completed"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status.name}
              </button>
            ))}
          </div>
          <RequestsTable
            onRowClick={handleRowClick}
            requests={filtered}
            showActions={true}
          />
        </main>
      </div>
    </div>
  );
};

export default HeadRequests;