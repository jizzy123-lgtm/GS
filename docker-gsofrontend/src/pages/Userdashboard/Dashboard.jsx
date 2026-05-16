import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from '../../components/Sidebar';
import Icon from '../../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Custom Hooks
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
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
    case 'TOGGLE_MAINTENANCE_DROPDOWN':
      return { ...state, isMaintenanceDropdownOpen: !state.isMaintenanceDropdownOpen };
    case 'CLOSE_MAINTENANCE_DROPDOWN':
      return { ...state, isMaintenanceDropdownOpen: false };
    default:
      return state;
  }
};

// Constants
const MENU_ITEMS = SIDEBAR_MENU_ITEMS;

const CARD_ICONS = {
  Transportation: "M18.92 6.01C18.72 5.4 18.17 5 17.54 5H6.46c-.63 0-1.18.4-1.38 1.01L3 11v7a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-7l-2.08-4.99ZM6.85 7h10.3l1.37 3.3c.11.26.18.53.18.8V12H5v-.9c0-.27.06-.54.18-.8L6.85 7ZM6 14a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm12 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  Reservation: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  Janitorial: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6",
  Carpentry: "M15 12l-8.373 8.373a1 1 0 1 1-3-3L12 9 M18 15l4-4 M21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
  Electrical: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  AirConditioning: "M10 20l-1.25-2.5L6 18 M10 4L8.75 6.5 6 6 M14 20l1.25-2.5L18 18 M14 4l1.25 2.5L18 6 M17 21l-3-6h-4 M17 3l-3 6 1.5 3 M2 12h6.5L10 9 M20 10l-1.5 2 1.5 2 M22 12h-6.5L14 15 M4 10l1.5 2L4 14 M7 21l3-6-1.5-3 M7 3l3 6h4",
  Plumbing: "M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076.091-2.264.071-2.95.904l-.171.213-2.247 2.81a.75.75 0 0 1-1.157.02L7.5 12.339V14.01a.75.75 0 0 1-.22.53l-3.276 3.277a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 0-1.06l3.277-3.276a.75.75 0 0 1 .53-.22h1.672l2.836-2.268a.75.75 0 0 1 .933-.02l2.133 2.133c.71-.71.665-1.777.74-2.736a4.5 4.5 0 0 1 6.336-4.486.75.75 0 0 1 .14 1.743l-3.277 3.276a.75.75 0 1 0 1.06 1.06l3.277-3.276a.75.75 0 0 1 .869-.14c.26.113.513.245.75.394Z",
  Finance: "M12 6V4m0 2a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m-6 8a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4",
  Default: "M13 10V3L4 14h7v7l9-11h-7z",
  Maintenance: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z"
};

const DASHBOARD_CARDS = [
  { text: 'Corrective Maintenance', icon: CARD_ICONS.Maintenance, isDropdown: true },
  { text: 'Request Status', icon: CARD_ICONS.Reservation, isDropdown: false, to: '/requeststatus' }
];

// Dropdown Menu Component
const DropdownMenu = memo(({ isOpen, items, onItemClick }) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden
                 md:shadow-xl md:border-gray-300"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer 
                     transition-colors border-b border-gray-100 last:border-b-0
                     md:px-4 md:py-3 
                     touch-manipulation select-none"
          onClick={() => onItemClick(item)}
          role="button"
          tabIndex={0}
        >
          <Icon 
            path={item.icon} 
            className="w-7 h-7 text-blue-600 flex-shrink-0
                       md:w-6 md:h-6"
          />
          <span className="text-gray-800 font-medium text-base leading-tight
                           md:text-sm">
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
});

const DashboardCard = memo(({ item, onClick, isDropdownOpen, onToggleDropdown, dropdownItems, onDropdownItemClick }) => {
  const dropdownWrapperRef = useRef(null);

  useClickOutside(dropdownWrapperRef, () => {
    if (item.isDropdown && isDropdownOpen) onToggleDropdown();
  });

  if (item.isDropdown) {
    return (
      <div className="relative" ref={dropdownWrapperRef}>
        <div
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md active:shadow-lg transition-all duration-200 
                     cursor-pointer group touch-manipulation select-none"
          onClick={onToggleDropdown}
          role="button"
          tabIndex={0}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Icon 
                path={item.icon} 
                className="w-9 h-9 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0"
              />
              <h3 className="text-xl font-bold text-gray-800 leading-tight">
                {item.text}
              </h3>
            </div>
            <Icon 
              path={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
              className="w-6 h-6 text-gray-500 transition-transform flex-shrink-0"
            />
          </div>
        </div>
        
        <DropdownMenu
          isOpen={isDropdownOpen}
          items={dropdownItems}
          onItemClick={onDropdownItemClick}
        />
      </div>
    );
  }

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md active:shadow-lg transition-all duration-200 
                 cursor-pointer group touch-manipulation select-none"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        <Icon 
          path={item.icon} 
          className="w-9 h-9 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0"
        />
        <h3 className="text-xl font-bold text-gray-800 leading-tight">
          {item.text}
        </h3>
      </div>
    </div>
  );
});

const Header = memo(({ 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  onCloseMobileMenu,
  userTitle = "User"
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
        <div className="hidden md:block text-xl font-bold text-white">
          {userTitle}
        </div>
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-3 hover:bg-gray-800 active:bg-gray-700 rounded-lg border-2 border-white 
                     transition-colors touch-manipulation"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 
                    transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.text}
              to={item.to}
              className="flex items-center px-4 py-4 text-sm hover:bg-gray-700 active:bg-gray-600 
                         transition-colors touch-manipulation"
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

const DashboardContent = memo(({ 
  onCardClick,
  isMaintenanceDropdownOpen,
  onToggleMaintenanceDropdown,
  maintenanceServices,
  onMaintenanceItemClick
}) => (
  <main className="flex-1 p-4 overflow-hidden bg-white/95 backdrop-blur-sm md:p-6">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
      Dashboard
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-4">
      {DASHBOARD_CARDS.map((item) => (
        <DashboardCard
          key={item.text}
          item={item}
          onClick={() => onCardClick(item)}
          isDropdownOpen={item.isDropdown ? isMaintenanceDropdownOpen : false}
          onToggleDropdown={item.isDropdown ? onToggleMaintenanceDropdown : undefined}
          dropdownItems={item.isDropdown ? maintenanceServices : undefined}
          onDropdownItemClick={item.isDropdown ? onMaintenanceItemClick : undefined}
        />
      ))}
    </div>
  </main>
));

// Main Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
    isMaintenanceDropdownOpen: false
  });

  const [maintenanceServices, setMaintenanceServices] = useState([]);

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/maintenance-types`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        const mapped = list.map(s => {
          let iconKey = "Default";
          if (s.type_name.toLowerCase().includes("janitorial")) iconKey = "Janitorial";
          else if (s.type_name.toLowerCase().includes("carpentry")) iconKey = "Carpentry";
          else if (s.type_name.toLowerCase().includes("electrical")) iconKey = "Electrical";
          else if (s.type_name.toLowerCase().includes("conditioning")) iconKey = "AirConditioning";
          
          return {
            id: s.id,
            text: s.type_name,
            icon: CARD_ICONS[iconKey] || CARD_ICONS.Default
          };
        });
        setMaintenanceServices(mapped);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) {
      navigate("/loginpage", { replace: true });
    } else {
      fetchServices();
    }
  }, [navigate, fetchServices]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      if (!token) return;
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      localStorage.clear();
      sessionStorage.clear();
      navigate("/loginpage", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigation = useCallback((item) => {
    if (item.text === 'Corrective Maintenance') {
      dispatch({ type: 'TOGGLE_MAINTENANCE_DROPDOWN' });
    } else if (item.to) {
      navigate(item.to);
    } else if (item.text) {
      navigate(`/${item.text.toLowerCase()}`);
    }
  }, [navigate]);

  const handleMaintenanceItemClick = useCallback((item) => {
    dispatch({ type: 'CLOSE_MAINTENANCE_DROPDOWN' });
    navigate(`/maintenance-form/${item.id}`);
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        userTitle="User" 
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          onLogout={handleLogout}
        />
        
        <DashboardContent 
          onCardClick={handleNavigation}
          isMaintenanceDropdownOpen={state.isMaintenanceDropdownOpen}
          onToggleMaintenanceDropdown={() => dispatch({ type: 'TOGGLE_MAINTENANCE_DROPDOWN' })}
          maintenanceServices={maintenanceServices}
          onMaintenanceItemClick={handleMaintenanceItemClick}
        />
      </div>
    </div>
  );
};

export default Dashboard;