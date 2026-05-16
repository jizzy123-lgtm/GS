import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
// Replace Sidebar import with CampusDirectorSidebar
import { CampusDirectorSidebar } from '../../components/CampusDirectorSidebar';
import Icon from '../../components/Icon';

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
    case 'TOGGLE_MAINTENANCE_DROPDOWN':
      return { ...state, isMaintenanceDropdownOpen: !state.isMaintenanceDropdownOpen };
    case 'CLOSE_MAINTENANCE_DROPDOWN':
      return { ...state, isMaintenanceDropdownOpen: false };
    default:
      return state;
  }
};

// Constants
const MENU_ITEMS = [
  { text: "Dashboard", to: "/campusdirectordashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/campusdirectornotifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/campusdirectorschedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "Requests", to: "/campusdirectorrequests", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01"},
  { text: "Settings", to: "/settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }
];

const CARD_ICONS = {
  Maintenance: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
  Reservation: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  Janitorial: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6",
  Carpentry: "M15 12l-8.373 8.373a1 1 0 1 1-3-3L12 9 M18 15l4-4 M21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
  Electrical: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  AirConditioning: "M10 20l-1.25-2.5L6 18 M10 4L8.75 6.5 6 6 M14 20l1.25-2.5L18 18 M14 4l1.25 2.5L18 6 M17 21l-3-6h-4 M17 3l-3 6 1.5 3 M2 12h6.5L10 9 M20 10l-1.5 2 1.5 2 M22 12h-6.5L14 15 M4 10l1.5 2L4 14 M7 21l3-6-1.5-3 M7 3l3 6h4",
  Default: "M13 10V3L4 14h7v7l9-11h-7z"
};

const DASHBOARD_CARDS = [
  { text: 'Corrective Maintenance', icon: CARD_ICONS.Maintenance, isDropdown: true }
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

  if (item.isDropdown) {
    useClickOutside(dropdownWrapperRef, () => {
      if (isDropdownOpen) onToggleDropdown();
    });

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

const DashboardContent = memo(({ 
  onCardClick,
  isMaintenanceDropdownOpen,
  onToggleMaintenanceDropdown,
  maintenanceServices,
  onMaintenanceItemClick
}) => (
  <main className="flex-1 p-6 overflow-hidden bg-white/95 backdrop-blur-sm">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
        Dashboard
      </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
const CampusDirectorDashboard = () => {
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/maintenance-types`, {
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

  const handleNavigation = useCallback((item) => {
    if (item.text === "Corrective Maintenance") {
      dispatch({ type: 'TOGGLE_MAINTENANCE_DROPDOWN' });
    } else if (item.to) {
      navigate(item.to);
    }
  }, [navigate]);

  const handleMaintenanceItemClick = useCallback((item) => {
    dispatch({ type: 'CLOSE_MAINTENANCE_DROPDOWN' });
    navigate('/campusdirectorrequests'); // Director goes to the requests list
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      if (token) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/loginpage", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative z-40">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT 
        </span>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
            className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          >
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
          </button>
        </div>

        <div
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="py-2">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.text}
                onClick={() => {
                  dispatch({ type: "CLOSE_MOBILE_MENU" });
                  if (item.text === "Logout") handleLogout();
                  else navigate(item.to);
                }}
                className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-700 transition-colors text-white text-left"
              >
                <Icon path={item.icon} className="w-5 h-5 mr-3" />
                {item.text}
              </button>
            ))}
          </nav>
          <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
            Created By Bantilan & Friends
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <CampusDirectorSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
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

export default CampusDirectorDashboard;