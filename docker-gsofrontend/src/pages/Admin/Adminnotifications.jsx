import { useReducer, useEffect, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { AdminSidebar, MENU_ITEMS as ADMIN_MENU_ITEMS } from '../../components/AdminSidebar';

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

const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu, unreadCount }) => (
  <header className="bg-black text-white p-4 flex justify-between items-center relative">
    <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
    <div className="hidden md:flex items-center gap-4">
      <div className="text-xl font-bold text-white">Admin</div>
    </div>
    <div className="flex items-center gap-4 md:hidden">
      <button onClick={onToggleMobileMenu} className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors">
        <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
      </button>
    </div>
  </header>
));
// ─── Filter Toggle ────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Unread', 'Read'];

const FilterToggle = ({ active, onChange }) => (
  <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1 flex-shrink-0">
    {FILTERS.map((opt) => (
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

const AdminNotifications = () => {
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const fetchUsers = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE_URL}/users-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : data.data || [];
      setUsers(usersArray);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchNotifications = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const notifs = Array.isArray(data) ? data : data.data || [];
      const sorted = [...notifs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(sorted);

      const hasUnread = sorted.some(n => !n.is_read);
      if (hasUnread) {
        await fetch(`${API_BASE_URL}/notifications/markAllAsRead`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchNotifications()]);
  }, []);

  const markAsRead = async (id) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/markAsRead/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const resolveUserFromMessage = (message) => {
    if (!message || !users.length) return null;

    const match = message.match(/^(.+?)\s+registered\b/i);
    const extractedName = match?.[1]?.trim().toLowerCase() ?? null;
    if (!extractedName) return null;

    const normalize = (str) => str?.toLowerCase().trim() ?? '';

    let user = users.find(u => {
      const fullName1 = `${normalize(u.first_name)} ${normalize(u.last_name)}`;
      const fullName2 = `${normalize(u.last_name)} ${normalize(u.first_name)}`;
      const username = normalize(u.username);
      return fullName1 === extractedName || fullName2 === extractedName || username === extractedName;
    });

    if (!user) {
      user = users.find(u => {
        const fullName1 = `${normalize(u.first_name)} ${normalize(u.last_name)}`;
        const username = normalize(u.username);
        return fullName1.includes(extractedName) || extractedName.includes(normalize(u.first_name)) || username.includes(extractedName);
      });
    }

    return user?.user_id ?? user?.id ?? null;
  };

  const handleClick = async (notif) => {
    if (processingId === notif.id) return;
    setProcessingId(notif.id);

    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    const msg = notif.message?.toLowerCase() || '';
    if (msg.includes('welcome to gso system') || msg.includes('account approved')) {
      setProcessingId(null);
      return;
    }

    const userId = resolveUserFromMessage(notif.message);

    if (userId) {
      navigate(`/adminuserrequestsform/${userId}`, { state: { from: '/adminnotifications' } });
    } else {
      alert('Could not find the user linked to this notification.');
      setProcessingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
  const matchesSearch = n.message?.toLowerCase().includes(search.toLowerCase());
  const matchesFilter =
    filter === 'All' ? true :
    filter === 'Unread' ? !n.is_read :
    n.is_read;
  return matchesSearch && matchesFilter;
});

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        unreadCount={unreadCount}
      />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={ADMIN_MENU_ITEMS}
          onLogout={() => {                          // ADD THIS
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 overflow-y-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-b mb-4 pb-3">
            Notifications
          </h2>

          {/* ── Search + Filter ────────────────────────────────────────────── */}
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
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <FilterToggle active={filter} onChange={setFilter} />
          </div>
          {/* ──────────────────────────────────────────────────────────────── */}

          <div className="bg-white rounded-lg shadow border border-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {search || filter !== 'all'
                  ? 'No notifications match your filter.'
                  : 'No notifications found.'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredNotifications.map((notif) => (
                  <li
                    key={notif.id}
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
                        {new Date(notif.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center gap-2">
                      <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                        notif.is_read ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {notif.is_read ? 'Read' : 'Unread'}
                      </span>
                      {processingId === notif.id && (
                        <span className="text-xs text-gray-400">Loading...</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminNotifications;