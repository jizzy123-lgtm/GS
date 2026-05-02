import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { StaffSidebar, MENU_ITEMS as STAFF_SIDEBAR_MENU_ITEMS } from '../../components/StaffSidebar';
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
const MENU_ITEMS = STAFF_SIDEBAR_MENU_ITEMS;

const CARD_ICONS = {
  Maintenance: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
  Transportation: "M18.92 6.01C18.72 5.4 18.17 5 17.54 5H6.46c-.63 0-1.18.4-1.38 1.01L3 11v7a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-7l-2.08-4.99ZM6.85 7h10.3l1.37 3.3c.11.26.18.53.18.8V12H5v-.9c0-.27.06-.54.18-.8L6.85 7ZM6 14a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm12 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  Reservation: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  Janitorial: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6",
  Carpentry: "M15 12l-8.373 8.373a1 1 0 1 1-3-3L12 9 M18 15l4-4 M21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
  Electrical: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  AirConditioning: "M10 20l-1.25-2.5L6 18 M10 4L8.75 6.5 6 6 M14 20l1.25-2.5L18 18 M14 4l1.25 2.5L18 6 M17 21l-3-6h-4 M17 3l-3 6 1.5 3 M2 12h6.5L10 9 M20 10l-1.5 2 1.5 2 M22 12h-6.5L14 15 M4 10l1.5 2L4 14 M7 21l3-6-1.5-3 M7 3l3 6h4"
};

const CORRECTIVE_MAINTENANCE_CARDS = [
  { text: 'Janitorial', icon: CARD_ICONS.Janitorial },
  { text: 'Carpentry', icon: CARD_ICONS.Carpentry },
  { text: 'Electrical', icon: CARD_ICONS.Electrical },
  { text: 'Air-Conditioning', icon: CARD_ICONS.AirConditioning }
];

const DASHBOARD_CARDS = [
  { text: 'Corrective Maintenance', icon: CARD_ICONS.Maintenance, isDropdown: true },
  //{ text: 'Transportation', icon: CARD_ICONS.Transportation },
  //{ text: 'Reservation', icon: CARD_ICONS.Reservation }
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
          key={item.text}
          className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer 
                     transition-colors border-b border-gray-100 last:border-b-0
                     md:px-4 md:py-3 
                     touch-manipulation select-none"
          onClick={() => onItemClick(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onItemClick(item);
            }
          }}
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
  // Move the ref here to wrap both button and dropdown
  const dropdownWrapperRef = useRef(null);

  // Only use click outside if this is a dropdown card
  if (item.isDropdown) {
    useClickOutside(dropdownWrapperRef, () => {
      if (isDropdownOpen) onToggleDropdown();
    });

    return (
      <div className="relative" ref={dropdownWrapperRef}>
        <div
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md active:shadow-lg transition-all duration-200 
                     cursor-pointer group touch-manipulation select-none
                     md:p-6"
          onClick={onToggleDropdown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleDropdown();
            }
          }}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Icon 
                path={item.icon} 
                className="w-9 h-9 text-blue-600 group-hover:text-blue-700 group-active:text-blue-800 
                           transition-colors flex-shrink-0
                           md:w-8 md:h-8"
              />
              <h3 className="text-xl font-bold text-gray-800 leading-tight
                             md:text-lg md:text-xl">
                {item.text}
              </h3>
            </div>
            <Icon 
              path={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
              className="w-6 h-6 text-gray-500 transition-transform flex-shrink-0
                         md:w-5 md:h-5"
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
                 cursor-pointer group touch-manipulation select-none
                 md:p-6"
      onClick={onClick}
      onTouchStart={() => {}}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <Icon 
          path={item.icon} 
          className="w-9 h-9 text-blue-600 group-hover:text-blue-700 group-active:text-blue-800 
                     transition-colors flex-shrink-0
                     md:w-8 md:h-8"
        />
        <h3 className="text-xl font-bold text-gray-800 leading-tight
                       md:text-lg md:text-xl">
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
  userTitle = "Staff"
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

      <div className="hidden md:block text-xl font-bold text-white">
        {userTitle}
      </div>
      
      <div className="flex items-center gap-4 md:hidden">
        <button 
          onClick={onToggleMobileMenu}
          className="p-3 hover:bg-gray-800 active:bg-gray-700 rounded-lg border-2 border-white 
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
  onMaintenanceItemClick 
}) => (
  <main className="flex-1 p-4 overflow-hidden bg-white/95 backdrop-blur-sm
                   md:p-6">
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
          dropdownItems={item.isDropdown ? CORRECTIVE_MAINTENANCE_CARDS : undefined}
          onDropdownItemClick={item.isDropdown ? onMaintenanceItemClick : undefined}
        />
      ))}
    </div>
  </main>
));

// Main Component
const StaffDashboard = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
    isMaintenanceDropdownOpen: false
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) {
      navigate("/loginpage", { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      if (!token) {
        throw new Error("No token found");
      }

      console.log("Calling logout API with token:", token);

      const response = await fetch(`${API_BASE_URL}/logout`, {
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

  const handleNavigation = useCallback((item) => {
    switch (item.text) {
      case 'Corrective Maintenance':
        // Toggle dropdown open/close
        dispatch({ type: 'TOGGLE_MAINTENANCE_DROPDOWN' });
        break;
      case 'Transportation':
        navigate('/transportation');
        break;
      case 'Reservation':
        navigate('/reservation');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleMaintenanceItemClick = useCallback((item) => {
    // Close the dropdown first
    dispatch({ type: 'CLOSE_MAINTENANCE_DROPDOWN' });
    
    // Navigate based on the maintenance type - using staff routes
    switch (item.text) {
      case 'Janitorial':
        navigate('/staffjanitorial');
        break;
      case 'Carpentry':
        navigate('/staffcarpentry');
        break;
      case 'Electrical':
        navigate('/staffelectrical');
        break;
      case 'Air-Conditioning':
        navigate('/staffairconditioning');
        break;
      default:
        break;
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        userTitle="Staff" 
      />

      <div className="flex flex-1 overflow-hidden">
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          onLogout={handleLogout}
        />
        
        <DashboardContent 
          onCardClick={handleNavigation}
          isMaintenanceDropdownOpen={state.isMaintenanceDropdownOpen}
          onToggleMaintenanceDropdown={() => dispatch({ type: 'TOGGLE_MAINTENANCE_DROPDOWN' })}
          onMaintenanceItemClick={handleMaintenanceItemClick}
        />
      </div>
    </div>
  );
};

export default StaffDashboard;