import { useReducer, useCallback, memo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import Icon from '../../components/Icon';
import { AdminSidebar, MENU_ITEMS as ADMIN_MENU_ITEMS } from '../../components/AdminSidebar';

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

// Card icons
const CARD_ICONS = {
  Janitorial: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6",
  Carpentry: "M15 12l-8.373 8.373a1 1 0 1 1-3-3L12 9 M18 15l4-4 M21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
  Electrical: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  AirConditioning: "M10 20l-1.25-2.5L6 18 M10 4L8.75 6.5 6 6 M14 20l1.25-2.5L18 18 M14 4l1.25 2.5L18 6 M17 21l-3-6h-4 M17 3l-3 6 1.5 3 M2 12h6.5L10 9 M20 10l-1.5 2 1.5 2 M22 12h-6.5L14 15 M4 10l1.5 2L4 14 M7 21l3-6-1.5-3 M7 3l3 6h4",
  Plumbing: "M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076.091-2.264.071-2.95.904l-.171.213-2.247 2.81a.75.75 0 0 1-1.157.02L7.5 12.339V14.01a.75.75 0 0 1-.22.53l-3.276 3.277a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 0-1.06l3.277-3.276a.75.75 0 0 1 .53-.22h1.672l2.836-2.268a.75.75 0 0 1 .933-.02l2.133 2.133c.71-.71.665-1.777.74-2.736a4.5 4.5 0 0 1 6.336-4.486.75.75 0 0 1 .14 1.743l-3.277 3.276a.75.75 0 1 0 1.06 1.06l3.277-3.276a.75.75 0 0 1 .869-.14c.26.113.513.245.75.394Z",
  Finance: "M12 6V4m0 2a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m-6 8a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4",
  Default: "M13 10V3L4 14h7v7l9-11h-7z"
};

const DashboardCard = memo(({ item, onClick }) => (
  <div
    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <Icon
        path={item.icon}
        className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors"
      />
      <h3 className="text-lg md:text-xl font-bold text-gray-800">
        {item.text}
      </h3>
    </div>
  </div>
));

const AdminMaintenance = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/maintenance-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        const mapped = list.map(s => {
          let iconKey = "Default";
          const name = s.type_name.toLowerCase();
          if (name.includes("janitorial")) iconKey = "Janitorial";
          else if (name.includes("carpentry")) iconKey = "Carpentry";
          else if (name.includes("electrical")) iconKey = "Electrical";
          else if (name.includes("conditioning")) iconKey = "AirConditioning";
          else if (name.includes("plumbing")) iconKey = "Plumbing";
          else if (name.includes("finance")) iconKey = "Finance";
          
          return {
            id: s.id,
            text: s.type_name,
            icon: CARD_ICONS[iconKey] || CARD_ICONS.Default
          };
        });
        setServices(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleNavigation = useCallback((item) => {
    const hardcoded = {
      'Janitorial': '/adminJanitorial',
      'Carpentry': '/adminCarpentry',
      'Electrical': '/adminElectrical',
      'Air-Conditioning': '/adminAirconditioning'
    };
    const target = hardcoded[item.text] || `/admin-maintenance-form/${item.id}`;
    navigate(target);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      navigate("/loginpage", { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative z-40">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>
        <div className="hidden md:block text-xl font-bold">Admin</div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>

        {state.isMobileMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 overflow-hidden">
            <nav className="py-2">
              {ADMIN_MENU_ITEMS.map((item) => (
                <button
                  key={item.text}
                  onClick={() => {
                    if (item.text === "Logout") handleLogout();
                    else navigate(item.to);
                    dispatch({ type: "CLOSE_MOBILE_MENU" });
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-700 transition-colors text-white text-left"
                >
                  <Icon path={item.icon} className="w-5 h-5 mr-3" />
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={ADMIN_MENU_ITEMS}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-white/95 backdrop-blur-sm">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-6 pb-4">
            Corrective Maintenance
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((item) => (
                <DashboardCard
                  key={item.id}
                  item={item}
                  onClick={() => handleNavigation(item)}
                />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default AdminMaintenance;