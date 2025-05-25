import { memo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// Constants
const MENU_ITEMS = [
  { text: "Dashboard", to: "/staffdashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/staffnotifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/staffschedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "User Requests", to: "/userrequests", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"},
  { text: "Requests", to: "/StaffSlipRequests", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 1 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01"},
  { text: "Reports", to: "/report", icon: "M13 17V9 M18 17V5 M3 3v16a2 2 0 0 0 2 2h16 M8 17v-3"},
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

// SidebarItem component
const SidebarItem = memo(({ item, isSidebarCollapsed, onLogout }) => {
  const isLogout = item.text === 'Logout';

  const content = (
    <>
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center relative group">
        <Icon 
          path={item.icon} 
          className="w-full h-full transition-transform hover:scale-110" 
        />
        {isSidebarCollapsed && (
          <span className="absolute left-full ml-2 px-2 py-1 text-sm bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            {item.text}
          </span>
        )}
      </div>
      <span className={`ml-3 transition-all duration-300 ${
        !isSidebarCollapsed ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0 overflow-hidden'
      }`}>
        {item.text}
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

const StaffSidebarDemo = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate(); 

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
    <div className="flex h-screen bg-gray-100">
      <StaffSidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        menuItems={MENU_ITEMS}
        onLogout={handleLogout}
      />
    </div>
  );
};

// Sidebar component
const StaffSidebar = memo(({ 
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
            <SidebarItem
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
        Staff Portal - Bantilan & Friends
      </div>
    </div>
  </aside>
));

// Export the main component for demo purposes
export default StaffSidebarDemo;

// Also export individual components for use in other parts of the application
export { StaffSidebar, MENU_ITEMS };