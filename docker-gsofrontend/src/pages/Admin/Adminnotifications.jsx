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
      <div className="relative">
        <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-white">Admin</div>
    </div>
    <div className="flex items-center gap-4 md:hidden">
      <button onClick={onToggleMobileMenu} className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors">
        <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
      </button>
    </div>
  </header>
));

const AdminNotifications = () => {
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
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
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     Promise.all([fetchUsers(), fetchNotifications()]).catch(console.error);
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

  // Extract name from message: "John Doe registered an account..."
  const resolveUserFromMessage = (message) => {
    if (!message || !users.length) return null;

    // Extract everything before "registered"
    const match = message.match(/^(.+?)\s+registered\b/i);
    const extractedName = match?.[1]?.trim().toLowerCase() ?? null;
    if (!extractedName) return null;

    // Match against first_name + last_name combinations
    const normalize = (str) => str?.toLowerCase().trim() ?? '';

    // Try: "firstname lastname" exact
    let user = users.find(u => {
      const fullName1 = `${normalize(u.first_name)} ${normalize(u.last_name)}`;
      const fullName2 = `${normalize(u.last_name)} ${normalize(u.first_name)}`;
      const username = normalize(u.username);
      return fullName1 === extractedName || fullName2 === extractedName || username === extractedName;
    });

    // Try partial match
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

    // user_id on notification = admin (recipient), so match by message name instead
    const userId = resolveUserFromMessage(notif.message);

    if (userId) {
       navigate(`/adminuserrequestsform/${userId}`);
    } else {
      alert('Could not find the user linked to this notification.');
    }
    setProcessingId(null)
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 overflow-y-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-b mb-4 pb-3">
            Notifications
          </h2>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No notifications found.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => (
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