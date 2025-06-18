import { useState, useReducer, useEffect, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {StaffSidebar,MENU_ITEMS }from "../../components/StaffSidebar"; 
import Icon from "../../components/Icon";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// sidebar reducer
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
              <tr
                key={`${request.requester_id}-${request.date_requested}-${request.details}`}
                className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400"
              >
                <td className="p-3">{new Date(request.date_requested).toLocaleDateString()}</td>
                <td className="p-3 font-medium">{request.personnel_fullname || "Unknown Personnel"}</td>
                <td className="p-3">{request.position_name || "Unknown Position"}</td>
                <td className="p-3">{request.office_name || "Unknown Office"}</td>
                <td className="p-3">{request.maintenance_type_name || "Unknown Type"}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    request.status_name === "Pending" || request.status_id === 1
                      ? "bg-yellow-100 text-yellow-800"
                      : request.status_name === "Approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {request.status_name}
                  </span>
                </td>
                <td className="p-3">{request.contact_number}</td>
                {showActions && (
                  <td className="p-3">
                    <button
                      onClick={() =>
                        onRowClick(
                          request.request_id,
                          request.status_name,
                          request.approved_by_2,
                          request.priority_number 
                        )
                      }
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

const StaffSlipRequests = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true, 
    isMobileMenuOpen: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [statuses, setStatuses] = useState([]);
  const [offices, setOffices] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showAllTab, setShowAllTab] = useState(false);

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");


  // Fetch reference data (statuses, offices, maintenance types, positions) from /common-datas
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!token) return;

      try {
        // Fetch all reference data in one request
        const res = await fetch(`${API_BASE_URL}/common-datas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
        setOffices(Array.isArray(data.offices) ? data.offices : []);
        setPositions(Array.isArray(data.positions) ? data.positions : []);
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };

    fetchReferenceData();
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/loginpage");
      return;
    }

    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Use the new API endpoint
        const res = await fetch(`${API_BASE_URL}/maintenance-requests/list-with-details`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);

        // Enhance requests if needed (here, the API already provides names)
        const enhancedRequests = list.map((request) => ({
          ...request,
          date_requested: request.date_requested,
          personnel_fullname: request.requesting_personnel,
          position_name: request.position,
          office_name: request.requesting_office,
          maintenance_type_name: request.maintenance_type,
          status_name: request.status,
          contact_number: request.contact_number,
          verified_by: request.verified_by,
          approved_by_2: request.approved_by_2, 
        }));

        setRequests(enhancedRequests);
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token, navigate]);

  const handleRowClick = useCallback(
    (id, status, approved_by_2, priority_number) => {
      const isPending = status === "Pending" || status === 1;
      const isApprovedBy2 = approved_by_2 !== null && approved_by_2 !== undefined;
      const hasPriority = priority_number !== null && priority_number !== undefined;
      if (hasPriority) {
        navigate(`/staffviewmaintenancerequestform/${id}`);
      } else if (isPending || isApprovedBy2) {
        navigate(`/staffmaintenancerequestform/${id}`);
      } else {
        navigate(`/staffviewmaintenancerequestform/${id}`);
      }
    },
    [navigate]
  );

  // Sort requests so that "Urgent" status requests appear first
  const sortUrgentFirst = (arr) => {
    return [...arr].sort((a, b) => {
      const aUrgent = a.status_name?.toLowerCase() === "urgent";
      const bUrgent = b.status_name?.toLowerCase() === "urgent";
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });
  };

  const filtered = sortUrgentFirst(requests.filter((r) => {
  if (selectedTab === "Verified") {
    return (
      (r.priority_number === null || r.priority_number === undefined) &&
      r.approved_by_2 !== null && r.approved_by_2 !== undefined
    );
  }

  if (selectedTab === "Approved") {
    return r.priority_number !== null && r.priority_number !== undefined;
  }

  // Only show requests with status_name "Completed" (case-insensitive) for the Completed tab
  if (selectedTab.toLowerCase() === "completed") {
    return r.status_name && r.status_name.toLowerCase() === "completed";
  }

  if (r.verified_by !== null && r.verified_by !== undefined) return false;

  if (selectedTab === "Pending") {
    return (r.status_id === 1 || r.status_name?.toLowerCase() === "pending") && (r.approved_by_2 === null || r.approved_by_2 === undefined);
  }

  // For other tabs, match by status name and make sure not approved_by_2
  return r.status_name === selectedTab && (r.approved_by_2 === null || r.approved_by_2 === undefined);
}));

  // Helper to check if there are any "Urgent" or "Onhold" requests being displayed in the current tab
  const hasStatus = (statusName) =>
    filtered.some(
      (r) => r.status_name?.toLowerCase() === statusName.toLowerCase()
    );

  const showActions = true;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    window.location.href = "/loginpage"; // or use navigate("/loginpage");
  };

  if (loading) return <div className="p-4">Loading requests...</div>;

  // Hardcode the Verified tab after Pending, and Approved at the end
const getTabs = (statuses) => {
  const pendingIdx = statuses.findIndex(s => s.name?.toLowerCase() === "pending");
  const approvedIdx = statuses.findIndex(s => s.name?.toLowerCase() === "approved");

  // Remove Approved from the list
  let reordered = statuses.filter((s, idx) => idx !== approvedIdx);

  // Insert Verified after Pending
  if (pendingIdx !== -1) {
    reordered.splice(pendingIdx + 1, 0, { id: "verified", name: "Verified" });
  } else {
    reordered.unshift({ id: "verified", name: "Verified" });
  }

  // Add Approved at the end
  if (approvedIdx !== -1) {
    reordered.push(statuses[approvedIdx]);
  }

  return reordered;
};

const tabs = getTabs(statuses);

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
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={MENU_ITEMS}
          title="STAFF"
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 border-b mb-4 pb-3">
            Maintenance Requests
          </h2>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            {tabs.map((status) => {
              const isUrgent = status.name?.toLowerCase() === "urgent";
              const isOnhold = status.name?.toLowerCase() === "onhold" || status.name?.toLowerCase() === "on hold";
              const showDot =
                (isUrgent && hasStatus("Urgent")) ||
                (isOnhold && hasStatus("Onhold"));

              return (
                <button
                  key={status.id}
                  onClick={() => { setSelectedTab(status.name); setShowAllTab(false); }}
                  className={`relative px-4 py-2 font-semibold rounded-md ${
                    (selectedTab === status.name && !showAllTab) ||
                    (selectedTab === "Pending" && !showAllTab && (status.id === 1 || status.name?.toLowerCase() === "pending"))
                      ? status.name === "Pending" || status.id === 1
                        ? "bg-yellow-500 text-white"
                        : status.name === "Approved"
                        ? "bg-green-500 text-white"
                        : status.name === "Verified"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-transparent text-gray-700"
                  }`}
                >
                  {status.name}
                  {showDot && (
                    <span
                      className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"
                      title="There are urgent/onhold requests"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <RequestsTable
  onRowClick={(id, status, approved_by_2, priority_number) =>
    handleRowClick(id, status, approved_by_2, priority_number)
  }
  requests={filtered}
  showActions={showActions}
/>
        </main>
      </div>
    </div>
  );
};

export default StaffSlipRequests;