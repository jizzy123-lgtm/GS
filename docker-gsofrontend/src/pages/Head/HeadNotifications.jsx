import { useReducer, useEffect, useState, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { HeadSidebar, HEAD_MENU_ITEMS } from '../../components/HeadSidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

const getToken = () =>
  localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

const authHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

// ─── Filter Toggle ────────────────────────────────────────────────────────────
const FILTER_OPTIONS = ['All', 'Unread', 'Read'];

const FilterToggle = ({ active, onChange }) => (
  <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1 flex-shrink-0">
    {FILTER_OPTIONS.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
          active === opt
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => (
  <header className="bg-black text-white p-4 flex justify-between items-center relative">
    <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
    <div className="hidden md:block text-xl font-bold text-white">Head</div>
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
    <div className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
      isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    }`}>
      <nav className="py-2">
        {HEAD_MENU_ITEMS.map((item) => (
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
));

// ─── Dashboard Content ────────────────────────────────────────────────────────
const DashboardContent = memo(() => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [processingId, setProcessingId]   = useState(null);
  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // ← TANGTANG na ang markAllAsRead - mag-mark ra sa individual click
        const res    = await fetch(`${API_BASE_URL}/notifications`, { headers: authHeaders() });
        const data   = await res.json();
        const notifs = Array.isArray(data) ? data : data.data || [];
        const sorted = [...notifs].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNotifications(sorted);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // ─── Resolve the maintenance request ID from notification data ────────────
  const resolveMaintenanceRequestId = (notif) => {
    // Check all possible ID fields from the notification object
    const direct =
      notif.maintenance_request_id  ||
      notif.request_id              ||
      notif.related_id              ||
      notif.reference_id            ||
      notif.maintenance_id          ||
      notif.data?.id                ||
      notif.data?.maintenance_request_id ||
      notif.data?.request_id        ||
      notif.maintenance_request?.id;

    if (direct) return direct;

    // Last resort: extract first number from message
    const match = String(notif.message || '').match(/\b(\d+)\b/);
    return match ? match[1] : null;
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/markAsRead/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleClick = async (notif) => {
    if (processingId === notif.id) return;
    setProcessingId(notif.id);

    // Mark as read first
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    const requestId = resolveMaintenanceRequestId(notif);

    if (requestId) {
      // Navigate to the form - HeadMaintenanceRequestForm will handle the fetch
      navigate(`/headmaintenancerequestform/${requestId}`);
    } else {
      // Fallback: go to requests list if no ID found
      navigate('/headrequests');
      setProcessingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.message?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Read' && n.is_read) ||
      (filter === 'Unread' && !n.is_read);
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 mb-6 pb-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">
          Notifications
        </h2>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications…"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-gray-200 bg-white shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder:text-gray-400 transition"
          />
        </div>
        <FilterToggle active={filter} onChange={setFilter} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-gray-400 text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Loading notifications…</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-gray-400 text-center">
             <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-12 h-12 text-gray-200" />
            <p className="font-medium text-sm">No notifications found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotifications.map((notif) => (
              <li
                key={`notif-${notif.id}`}
                onClick={() => handleClick(notif)}
                className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer transition-colors
                  ${!notif.is_read ? 'bg-blue-50' : ''}
                  hover:bg-gray-50
                  ${processingId === notif.id ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <div>
                  <div className="font-semibold text-gray-800">{notif.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {fmtDate(notif.created_at)}
                  </div>
                </div>
                <div className="mt-2 md:mt-0 flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                    notif.is_read ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                  }`}>
                    {notif.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const HeadNotifications = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
      />
      <div className="flex flex-1 overflow-hidden">
        <HeadSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={HEAD_MENU_ITEMS}
          onLogout={async () => {
            try {
              const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
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
        <DashboardContent />
      </div>
    </div>
  );
};

export default HeadNotifications;