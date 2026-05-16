import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { StaffSidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from '../../components/StaffSidebar';
import Icon from '../../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Reducer for sidebar state management
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

const Header = ({ onToggleMobileMenu }) => (
  <header className="bg-black text-white p-4 flex justify-between items-center relative z-50">
    <div className="flex items-center gap-4">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden md:block text-xl font-bold text-white">Staff</div>
      <button
        onClick={onToggleMobileMenu}
        className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
      >
        <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
      </button>
    </div>
  </header>
);

const DashboardContent = memo(({ onCardClick, requests }) => (
  <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
      Maintenance Requests
    </h2>

    {requests.length === 0 ? (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-200">
        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium text-lg">No requests found in this category.</p>
      </div>
    ) : (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile View */}
        <div className="lg:hidden space-y-4 p-4">
          {requests.map((request, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white hover:border-blue-300 transition-colors shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date Requested</p>
                  <p className="text-sm font-semibold text-gray-900">{request.date_requested}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  request.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {request.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personnel</p>
                <p className="text-sm font-medium text-gray-800">{request.requesting_personnel}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Office</p>
                <p className="text-sm font-medium text-gray-800">{request.requesting_office}</p>
              </div>
              <button 
                onClick={() => onCardClick(request.request_id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md"
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Personnel</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Office</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request, index) => (
                <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{request.date_requested}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{request.requesting_personnel}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{request.requesting_office}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{request.maintenance_type || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onCardClick(request.request_id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-sm active:scale-95 group-hover:shadow-md"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </main>
));

const StaffRequests = ({ token }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });
  const [requests, setRequests] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/common-datas`, {
          headers: { Authorization: `Bearer ${token}` }
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
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/maintenance-requests/list-with-details`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const handleRequestClick = useCallback((id) => {
    navigate(`/staffviewmaintenancerequestform/${id}`);
  }, [navigate]);

  const filteredRequests = requests.filter(req => {
    if (selectedTab === "Pending") return req.status === "Pending";
    if (selectedTab === "Verified") return req.status === "Verified";
    if (selectedTab === "Approved") return req.status === "Approved";
    if (selectedTab === "Scheduled") return req.status === "Scheduled";
    return req.status === selectedTab;
  });

  if (loading && requests.length === 0) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <Header
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        isMobileMenuOpen={state.isMobileMenuOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={SIDEBAR_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            navigate("/loginpage");
          }}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b px-4 md:px-8 py-3 md:py-4 shadow-sm z-10">
            <div className="flex space-x-2 md:space-x-4 overflow-x-auto pb-1 scrollbar-hide">
              {statuses
                .filter(s => s.name !== "Onhold" && s.name !== "On hold")
                .map((status) => (
                <button
                  key={status.id}
                  onClick={() => setSelectedTab(status.name)}
                  className={`px-4 md:px-6 py-2 text-xs md:text-sm font-black rounded-xl transition-all whitespace-nowrap ${
                    selectedTab === status.name
                      ? "bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-600 ring-offset-2"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {status.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <DashboardContent onCardClick={handleRequestClick} requests={filteredRequests} />
        </div>
      </div>
    </div>
  );
};

export default StaffRequests;