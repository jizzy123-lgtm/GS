import { memo, useState, useEffect, useContext, createContext, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// Notification Context
const AdminNotificationContext = createContext();

// Admin Notification Provider Component
const AdminNotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/unreadCount`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();

      // Handle different possible response formats
      const count = typeof data === 'number' ? data : 
                   data.count !== undefined ? data.count : 
                   data.unreadCount !== undefined ? data.unreadCount :
                   data.unread_count !== undefined ? data.unread_count :
                   data.data !== undefined ? data.data : 0;
      
      setUnreadCount(Math.max(0, count));
    } catch (err) {
      console.error('Failed to fetch admin notification count:', err);
      setError(err.message);
      setUnreadCount(0); // Reset to 0 on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Optional: Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Function to manually refresh count (useful after reading notifications)
  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Function to decrement count when a notification is marked as read
  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  // Function to increment count when a new notification arrives
  const incrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount(prev => prev + amount);
  }, []);

  const value = {
    unreadCount,
    loading,
    error,
    refreshUnreadCount,
    decrementUnreadCount,
    incrementUnreadCount
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

// Custom hook to use admin notifications
const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
};

// Admin Notification Badge Component
const AdminNotificationBadge = memo(({ className = "" }) => {
  const { unreadCount, loading, error } = useAdminNotifications();

  if (loading) {
    return (
      <span className={`animate-pulse bg-gray-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${className}`}>
        •
      </span>
    );
  }

  if (error || unreadCount === 0) {
    return null;
  }

  return (
    <span className={`bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-bold px-1 animate-pulse ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
});

// Constants - Updated to include notification badge for Notifications menu item
const MENU_ITEMS = [
  { text: "Dashboard", to: "/admindashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/adminnotifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", showBadge: true },
  { text: "Schedules", to: "/adminschedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 1 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "User Requests", to: "/adminuserrequests", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }
];

// Icon component to render SVG paths
const Icon = ({ path, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={1.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// SidebarItem component - Updated to show notification badge
const AdminSidebarItem = memo(({ item, isSidebarCollapsed, onLogout }) => {
  const isLogout = item.text === 'Logout';
  const showNotificationBadge = item.showBadge && item.text === 'Notifications';

  const content = (
    <>
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center relative group">
        <Icon 
          path={item.icon} 
          className="w-full h-full transition-transform hover:scale-110" 
        />
        {/* Notification badge for collapsed sidebar */}
        {showNotificationBadge && isSidebarCollapsed && (
          <AdminNotificationBadge className="absolute -top-1 -right-1" />
        )}
        {isSidebarCollapsed && (
          <span className="absolute left-full ml-2 px-2 py-1 text-sm bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none whitespace-nowrap z-50">
            {item.text}
          </span>
        )}
      </div>
      <span className={`ml-3 transition-all duration-300 flex items-center justify-between flex-1 ${
        !isSidebarCollapsed ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0 overflow-hidden'
      }`}>
        <span>{item.text}</span>
        {/* Notification badge for expanded sidebar */}
        {showNotificationBadge && !isSidebarCollapsed && (
          <AdminNotificationBadge />
        )}
      </span>
    </>
  );

  return isLogout ? (
    <button
      onClick={onLogout}
      className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-all group w-full text-left"
    >
      {content}
    </button>
  ) : (
    <NavLink
      to={item.to}
      className={({ isActive }) => 
        `flex items-center p-2 rounded-lg hover:bg-gray-700 transition-all group relative ${
          isActive ? 'bg-gray-800' : ''
        }`}
    >
      {content}
    </NavLink>
  );
});

// AdminSidebar component - Updated to use AdminNotificationProvider
const AdminSidebar = memo(({ 
  isSidebarCollapsed, 
  onToggleSidebar,
  menuItems = MENU_ITEMS, 
  onLogout,
}) => (
  <aside className={`hidden md:block bg-gray-900 text-white transition-[width] duration-300 ease-in-out relative h-full z-20 ${
    isSidebarCollapsed ? 'w-16' : 'w-64'
  }`}>
    <div className="p-4 flex flex-col justify-between h-full">
      <div>
        <button
          onClick={onToggleSidebar}
          className="w-full bg-gray-900 text-white p-2 rounded-lg border-2 border-white transition-colors mb-4 text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSidebarCollapsed ? '☰' : 'Collapse'}
        </button>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <AdminSidebarItem
              key={item.text}
              item={item}
              isSidebarCollapsed={isSidebarCollapsed}
              onLogout={onLogout} 
            />
          ))}
        </nav>
      </div>

      <div className={`text-center text-xs md:text-sm text-gray-400 transition-opacity ${
        !isSidebarCollapsed ? 'opacity-100' : 'opacity-0'
      }`}>
        Created By Bantilan & Friends
      </div>
    </div>
  </aside>
));

// Main Demo Component - Updated to include AdminNotificationProvider
const AdminSidebarDemo = () => {
  const navigate = useNavigate(); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      if (!token) {
        throw new Error("No token found");
      }

      console.log("Calling logout API with token:", token); 

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, { 
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");

      navigate("/loginpage", { replace: true });
    } catch (err) {
      console.error(err.message || "An error occurred during logout");
    }
  };
  
  return (
    <AdminNotificationProvider>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar 
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          menuItems={MENU_ITEMS}
          onLogout={handleLogout}
        />
        {/* Demo content area */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
              <p className="text-gray-600 mb-4">
                The notification count is automatically fetched from the API and displayed on the Notifications menu item.
              </p>
              <AdminNotificationStatus />
            </div>
          </div>
        </div>
      </div>
    </AdminNotificationProvider>
  );
};

// Component to show admin notification status (for demo purposes)
const AdminNotificationStatus = () => {
  const { unreadCount, loading, error, refreshUnreadCount } = useAdminNotifications();

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-2">Admin Notification Status</h3>
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Unread Count:</span>{' '}
          {loading ? (
            <span className="text-gray-500">Loading...</span>
          ) : error ? (
            <span className="text-red-500">Error: {error}</span>
          ) : (
            <span className="text-blue-600 font-bold">{unreadCount}</span>
          )}
        </p>
        <button
          onClick={refreshUnreadCount}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Count'}
        </button>
      </div>
    </div>
  );
};

// Export the main component for demo purposes
export default AdminSidebarDemo;

// Also export individual components for use in other parts of the application
export { AdminSidebar, MENU_ITEMS, AdminNotificationProvider, useAdminNotifications, AdminNotificationBadge };