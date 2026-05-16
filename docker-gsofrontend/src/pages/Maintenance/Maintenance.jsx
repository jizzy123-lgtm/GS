import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from '../../components/Sidebar';
import Icon from '../../components/Icon';
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

// Constants
const CARD_ICONS = {
  Janitorial: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6",
  Carpentry: "M15 12l-8.373 8.373a1 1 0 1 1-3-3L12 9 M18 15l4-4 M21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
  Electrical: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  AirConditioning: "M10 20l-1.25-2.5L6 18 M10 4L8.75 6.5 6 6 M14 20l1.25-2.5L18 18 M14 4l1.25 2.5L18 6 M17 21l-3-6h-4 M17 3l-3 6 1.5 3 M2 12h6.5L10 9 M20 10l-1.5 2 1.5 2 M22 12h-6.5L14 15 M4 10l1.5 2L4 14 M7 21l3-6-1.5-3 M7 3l3 6h4",
  Default: "M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076.091-2.264.071-2.95.904l-.171.213-2.247 2.81a.75.75 0 0 1-1.157.02L7.5 12.339V14.01a.75.75 0 0 1-.22.53l-3.276 3.277a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 0-1.06l3.277-3.276a.75.75 0 0 1 .53-.22h1.672l2.836-2.268a.75.75 0 0 1 .933-.02l2.133 2.133c.71-.71.665-1.777.74-2.736a4.5 4.5 0 0 1 6.336-4.486.75.75 0 0 1 .14 1.743l-3.277 3.276a.75.75 0 1 0 1.06 1.06l3.277-3.276a.75.75 0 0 1 .869-.14c.26.113.513.245.75.394Z"
};

const DashboardCard = memo(({ item, onClick }) => (
  <div
    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col items-center justify-center text-center"
    onClick={onClick}
  >
    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
      <Icon 
        path={item.icon} 
        className="w-10 h-10 text-blue-600"
      />
    </div>
    <h3 className="text-xl font-black text-gray-800 leading-tight">
      {item.text}
    </h3>
    <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Request Service</p>
  </div>
));

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
     <header className="bg-black text-white p-4 flex justify-between items-center relative z-40">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">
        ManageIT 
      </span>

      <div className="hidden md:block text-xl font-bold text-white">
        {userTitle}
      </div>

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

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {SIDEBAR_MENU_ITEMS.map((item) => (
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
  );
});

const DashboardContent = memo(({ cards, onCardClick, loading }) => (
  <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-white/95 backdrop-blur-sm">
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">
          Corrective Maintenance
        </h2>
        <p className="text-gray-500 mt-2 font-medium">Select a service category to submit your request.</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((item) => (
            <DashboardCard
              key={item.id}
              item={item}
              onClick={() => onCardClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  </main>
));

const Maintenance = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/maintenance-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
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
      setServices(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          menuItems={SIDEBAR_MENU_ITEMS}
          onLogout={handleLogout}
        />
        
        <DashboardContent 
          cards={services} 
          onCardClick={handleNavigation} 
          loading={loading}
        />
        
      </div>
    </div>
  );
};

export default Maintenance;