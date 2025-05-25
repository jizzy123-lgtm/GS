import { useState, useReducer, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { AdminSidebar, MENU_ITEMS as ADMIN_MENU_ITEMS } from '../../components/AdminSidebar'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Custom Hooks
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

// Reducer
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const Header = memo(({ 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  onCloseMobileMenu 
}) => {
  const mobileMenuRef = useRef(null);
  
  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex justify-between items-center relative shadow-md">
      <div className="flex items-center">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-blue-800 hover:bg-blue-700 p-2 rounded-full transition-colors cursor-pointer">
            <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-5 h-5" />
          </div>
          <div className="flex items-center text-sm">
            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">A</div>
            <span className="hidden lg:inline">Admin User</span>
          </div>
        </div>
        
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-blue-800 rounded-lg border border-blue-400 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-64 bg-blue-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">A</div>
            <div>
              <div className="font-medium">Admin User</div>
              <div className="text-xs text-blue-300">Administrator</div>
            </div>
          </div>
        </div>
        <nav className="py-2">
          {ADMIN_MENU_ITEMS.map((item) => (
            <NavLink
              key={item.text}
              to={item.to}
              className={({ isActive }) => `flex items-center px-4 py-3 text-sm hover:bg-blue-700 transition-colors ${isActive ? 'bg-blue-700' : ''}`}
              onClick={onCloseMobileMenu}
            >
              <Icon path={item.icon} className="w-5 h-5 mr-3" />
              {item.text}
            </NavLink>
          ))}
        </nav>
        <div className="text-center py-3 text-xs text-blue-300 border-t border-blue-700">
          Created By Bantilan & Friends
        </div>
      </div>
    </header>
  );
});

const StatusBadge = memo(({ status }) => {
  const statusConfig = {
    Pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    Approved: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'M5 13l4 4L19 7'
    },
    Rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: 'M6 18L18 6M6 6l12 12'
    },
    Disapproved: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: 'M6 18L18 6M6 6l12 12'
    }
  };

  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${config.bg} ${config.text}`}>
      <Icon path={config.icon} className="w-4 h-4 mr-1" />
      {status}
    </span>
  );
});

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <div className="text-lg text-gray-600">Loading requests...</div>
  </div>
);

const EmptyState = ({ searchTerm, statusFilter }) => {
  const isFiltered = searchTerm || statusFilter !== 'All Statuses';
  
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
      <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-12 h-12 text-gray-400 mb-3" />
      <div className="text-lg font-medium text-gray-600 mb-1">
        {isFiltered ? 'No matching requests found' : 'No pending requests'}
      </div>
      <p className="text-sm text-gray-500 text-center">
        {isFiltered 
          ? 'Try adjusting your search or filter criteria.'
          : 'When users register for accounts, their requests will appear here for approval.'
        }
      </p>
    </div>
  );
};

const UserRequestCard = memo(({ request, onRowClick }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-medium">
          {request.username ? request.username.charAt(0).toUpperCase() : "U"}
        </div>
        <div>
          <div className="font-medium text-gray-900">{request.username}</div>
          <div className="text-sm text-gray-500">{request.email}</div>
        </div>
      </div>
      <StatusBadge status={request.status} />
    </div>
    
    <div className="grid grid-cols-2 gap-y-2 text-sm border-t border-b border-gray-100 py-3">
      <div className="text-gray-500">Role:</div>
      <div className="text-gray-900 font-medium capitalize">{request.roleName || 'Loading role...'}</div>
      
      <div className="text-gray-500">Registration:</div>
      <div className="text-gray-900">{new Date(request.created_at).toLocaleDateString()}</div>
    </div>
    
    <button
      onClick={() => onRowClick(request.id)}
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
    >
      <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-5 h-5 mr-2" />
      Review Request
    </button>
  </div>
));

const UserRequestsTable = memo(({ 
  onRowClick, 
  requests, 
  isLoading, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter,
  accountStatuses 
}) => {
  // Filter requests based on search term and status
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = !searchTerm || 
        request.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.roleName && request.roleName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "" || String(request.status_id) === String(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage pending user registration requests</p>
        </div>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Requests</h1>
            <p className="text-gray-600 mt-1">Review and manage pending user registration requests</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <Icon 
                path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">All Statuses</option>
              {accountStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {filteredRequests.map((request) => (
              <UserRequestCard 
                key={request.id} 
                request={request} 
                onRowClick={onRowClick} 
              />
            ))}
          </div>
      
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left font-semibold text-gray-600 border-b">Username</th>
                  <th className="p-4 text-left font-semibold text-gray-600 border-b">Email</th>
                  <th className="p-4 text-left font-semibold text-gray-600 border-b">Role</th>
                  <th className="p-4 text-left font-semibold text-gray-600 border-b">Registration Date</th>
                  <th className="p-4 text-left font-semibold text-gray-600 border-b">Status</th>
                  <th className="p-4 text-left font-semibold text-gray-600 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-gray-50 ${index !== filteredRequests.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center font-medium mr-3">
                          {request.username ? request.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="font-medium text-gray-900">{request.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{request.email}</td>
                    <td className="p-4 capitalize text-gray-600">
                      {request.roleName || 'Loading role...'}
                    </td>
                    <td className="p-4 text-gray-600">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onRowClick(request.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-4 h-4 mr-2" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredRequests.length}</span> of <span className="font-medium">{requests.length}</span> requests
              </div>
              <div className="flex items-center space-x-2">
                <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <span className="bg-indigo-600 text-white rounded-md px-3 py-1 text-sm font-medium">1</span>
                <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
});

const AdminUserRequests = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const [requests, setRequests] = useState([]);
  const [roles, setRoles] = useState({});
  const [accountStatuses, setAccountStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  
  // New state for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Retrieve token from storage
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage"); // Redirect to login if token is missing
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  // Fetch account statuses from API
  const fetchAccountStatuses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accountStatuses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch account statuses: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log("Fetched account statuses:", data);

      // Extract statuses array from response
      const statusesArray = Array.isArray(data.statuses) ? data.statuses : [];
      console.log("Processed account statuses:", statusesArray);
      return statusesArray;
    } catch (error) {
      console.error("Error fetching account statuses:", error);
      return [];
    }
  };

  // Fetch all roles once to create a mapping dictionary
  const fetchAllRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch roles: ${response.status} ${response.statusText}`);
        return {};
      }

      const data = await response.json();
      console.log("Fetched all roles:", data);

      // Create a mapping of role ID to role name
      const roleMap = {};
      const rolesArray = Array.isArray(data) ? data : 
                        Array.isArray(data.data) ? data.data : [];
      
      rolesArray.forEach(role => {
        // Handle different role object structures
        const roleId = role.id || role.role_id;
        const roleName = role.role_name || role.name || 'Unknown';
        
        if (roleId) {
          roleMap[roleId] = roleName;
        }
      });

      console.log("Created role mapping:", roleMap);
      return roleMap;
    } catch (error) {
      console.error("Error fetching all roles:", error);
      return {};
    }
  };

  const fetchUserRequests = async () => {
    setLoading(true);
    try {
      // First fetch account statuses and roles in parallel
      const [roleMap, statusesArray] = await Promise.all([
        fetchAllRoles(),
        fetchAccountStatuses()
      ]);
      
      setRoles(roleMap);
      setAccountStatuses(statusesArray);
      
      // Then fetch user requests
      const response = await fetch(`${API_BASE_URL}/users-list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch requests: ${response.statusText}`);

      const data = await response.json();
      console.log("Fetched user requests data:", data);

      // Handle different response structures
      const extractedData = Array.isArray(data.data) ? data.data : 
                            Array.isArray(data) ? data : [];
      
      if (extractedData.length === 0) {
        console.log("No user requests found in response");
        setRequests([]);
        setLoading(false);
        return;
      }
      
      console.log(`Processing ${extractedData.length} user requests`);
      
      // Add role names to requests using our role mapping
      const requestsWithRoles = extractedData.map(request => {
        let roleName = null;
        if (request.role && typeof request.role === 'string') {
          roleName = request.role;
        } else if (request.role && typeof request.role === 'object' && request.role.name) {
          roleName = request.role.name;
        } else if (request.role_name) {
          roleName = request.role_name;
        } else if (request.role_id && roleMap[request.role_id]) {
          roleName = roleMap[request.role_id];
        }

        return {
          ...request,
          id: request.user_id, // <-- Use user_id as id
          roleName: roleName || 'Unknown Role'
        };
      });

      console.log("Processed user requests with roles:", requestsWithRoles);
      setRequests(requestsWithRoles);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserRequests();
    }
  }, [token]);

  const handleRowClick = useCallback((user_id) => {
    navigate(`/adminuserrequestsform/${user_id}`);
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
        onCloseMobileMenu={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
      />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={ADMIN_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />
        <UserRequestsTable 
          onRowClick={handleRowClick} 
          requests={requests} 
          isLoading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          accountStatuses={accountStatuses}
        />
      </div>
    </div>
  );
};

export default AdminUserRequests;