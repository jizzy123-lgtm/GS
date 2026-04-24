import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

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

const MENU_ITEMS = [
  { 
    text: "Dashboard",
    to: "/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
  },
  {
    text: "Notifications",
    to: "/notifications",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
  },
  {
    text: "Schedules",
    to: "/schedules",
    icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01"
  },
  {
    text: "Settings",
    to: "/settings",
    icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
  },
 
  {
    text: "Logout",
    to: "/loginpage",
    icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
  }
];

// Components
const Icon = memo(({ path, className }) => (
  <svg 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d={path} 
    />
  </svg>
));

const DashboardCard = memo(({ item, onClick }) => (
  <div
    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <Icon 
        path={CARD_ICONS[item]} 
        className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors"
      />
      <h3 className="text-lg md:text-xl font-bold text-gray-800">
        {item}
      </h3>
    </div>
  </div>
));
const SidebarItem = memo(({ item, isSidebarCollapsed }) => (
  <NavLink
    to={item.to}
    className={({ isActive }) => 
      `flex items-center p-2 rounded-lg hover:bg-gray-700 transition-all group relative ${
        isActive ? 'bg-gray-800' : ''
      }`}
  >
    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center"> 
      <Icon 
        path={item.icon} 
        className="w-full h-full transition-transform hover:scale-110" 
      />
    </div>
    <span className={`ml-3 transition-all duration-300 ${
      !isSidebarCollapsed ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0 overflow-hidden'
    }`}>
      {item.text}
    </span>
    
    {isSidebarCollapsed && (
      <span className="absolute left-full ml-2 px-2 py-1 text-sm bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        {item.text}
      </span>
    )}
  </NavLink>
));

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
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">
        ManageIT 
      </span>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {MENU_ITEMS.map((item) => (
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
          Created By Bantilan & Friends
        </div>
      </div>
    </header>
  );
});
const Sidebar = memo(({ 
  isSidebarCollapsed, 
  onToggleSidebar 
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

        <h2 className={`text-sm md:text-base font-bold mb-4 transition-opacity ${
          !isSidebarCollapsed ? 'opacity-100' : 'opacity-0'
        }`}>
          USER
        </h2>

        <nav className="space-y-2">
          {MENU_ITEMS.map((item) => (
            <SidebarItem
              key={item.text}
              item={item}
              isSidebarCollapsed={isSidebarCollapsed}
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

const DashboardContent = memo(({ onCardClick }) => (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
        Notifications
      </h2>
  
      <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
        {/* Mobile/Tablet View (Stacked Cards) */}
        <div className="lg:hidden space-y-4 p-2 sm:p-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border-2 border-gray-100 rounded-lg p-4 space-y-3 divide-y divide-gray-100">
              <div className="flex justify-between items-center pb-2">
                <span className="text-sm font-semibold">Date Requested:</span>
                <span className="text-sm text-gray-900 font-medium">-</span>
              </div>
              <div className="flex justify-between items-center pt-2 pb-2">
                <span className="text-sm font-semibold">Requesting Office:</span>
                <span className="text-sm text-gray-900 font-medium">-</span>
              </div>
              <div className="flex justify-between items-center pt-2 pb-2">
                <span className="text-sm font-semibold">Requesting Personnel:</span>
                <span className="text-sm text-gray-900 font-medium">-</span>
              </div>
              <div className="flex justify-between items-center pt-2 pb-2">
                <span className="text-sm font-semibold">Type:</span>
                <span className="text-sm text-gray-900 font-medium">-</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold">Status:</span>
                <span className="bg-red-500 text-white px-3 py-1 text-xs rounded-full font-medium shadow-sm">
                  Pending
                </span>
              </div>
            </div>
          ))}
        </div>
  
        {/* Desktop View (Table) */}
        <table className="hidden lg:table w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
                Date Requested
              </th>
              <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
                Requesting Office
              </th>
              <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
                Requesting Personnel
              </th>
              <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
                Type
              </th>
              <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400"
              >
                <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">-</td>
                <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">-</td>
                <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">-</td>
                <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">-</td>
                <td className="text-sm p-3 text-center">
                <span className="inline-block bg-red-500 text-white px-3 py-1 text-sm rounded-full font-medium shadow-sm">
                  Pending
                </span>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  ));
// Main Component
const Notifications = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });

  const handleNavigation = useCallback((item) => {
    if (item === 'Maintenance') navigate('/maintenance');
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
        
        <DashboardContent onCardClick={handleNavigation} />
      </div>
    </div>
  );
};

export default Notifications;