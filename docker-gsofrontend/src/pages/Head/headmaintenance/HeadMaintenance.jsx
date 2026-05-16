import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../../components/Icon'; 
import {HeadSidebar, HEAD_MENU_ITEMS} from '../../../components/HeadSidebar'; 

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
  Default: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
};

// Components
const DashboardCard = memo(({ item, onClick, onDelete }) => (
  <div
    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
    onClick={onClick}
  >
    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-all"></div>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
        <Icon 
          path={item.icon} 
          className="w-8 h-8 text-blue-600"
        />
      </div>
      <h3 className="text-xl font-black text-gray-900 tracking-tight">
        {item.text}
      </h3>
    </div>

    {/* Delete button — visible on hover */}
    <button
      className="absolute top-4 right-4 p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-100"
      onClick={(e) => {
        e.stopPropagation(); // prevent card navigation
        onDelete();
      }}
      aria-label={`Delete ${item.text}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    </button>
  </div>
));

const AddServiceCard = memo(({ onClick }) => (
  <div
    className="bg-gray-50/50 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center gap-4"
    onClick={onClick}
  >
    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-blue-200 transition-all">
      <svg
        className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </div>
    <h3 className="text-xl font-black text-gray-400 group-hover:text-blue-600 transition-colors">
      Add Service
    </h3>
  </div>
));

const AddServiceModal = memo(({ onConfirm, onCancel, isSubmitting }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm(name.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fadeIn">
        <h3 className="text-2xl font-black text-gray-900 mb-6">Create New Service</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Service Name</label>
            <input
              type="text"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-600 focus:bg-white transition-all outline-none text-gray-900 font-bold"
              placeholder="e.g. Plumbing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  );
});

const DeleteConfirmModal = memo(({ serviceName, onConfirm, onCancel, isSubmitting }) => (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
  >
    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-fadeIn">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Service</h3>
        <p className="text-gray-500 font-medium mb-6">
          Are you sure you want to delete <span className="text-gray-900 font-bold">"{serviceName}"</span>? This will remove it from all dashboards.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-all"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
));

const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu, onLogout }) => {
  const mobileMenuRef = useRef(null);
  
  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative z-40">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        <div className="hidden md:block text-xl font-bold">Head Portal</div>
      </div>
      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {HEAD_MENU_ITEMS.map((item) => {
            const isLogout = item.text === 'Logout';
            return isLogout ? (
              <button
                key={item.text}
                onClick={() => {
                  onCloseMobileMenu();
                  onLogout();
                }}
                className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-700 transition-colors text-left"
              >
                <Icon path={item.icon} className="w-5 h-5 mr-3" />
                {item.text}
              </button>
            ) : (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
                onClick={onCloseMobileMenu}
              >
                <Icon path={item.icon} className="w-5 h-5 mr-3" />
                {item.text}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
});

// Main Component
const HeadMaintenance = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/maintenance-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
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
      setServices(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAddService = useCallback(async (name) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/maintenance-types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type_name: name, description: "Dynamic Service" })
      });
      if (!res.ok) throw new Error("Failed to add service");
      await fetchServices();
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [API_BASE_URL, fetchServices]);

  const handleDeleteService = useCallback(async () => {
    if (!serviceToDelete) return;
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/maintenance-types/${serviceToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete service");
      await fetchServices();
      setServiceToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [API_BASE_URL, fetchServices, serviceToDelete]);

  const handleNavigation = useCallback((item) => {
    // Navigate to a service detail or request form
    navigate(`/head-service/${item.id}`);
  }, [navigate]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <HeadSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={HEAD_MENU_ITEMS}
          title="Head"
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 lg:p-10 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                Corrective Maintenance
              </h2>
              <p className="text-gray-500 mt-2 font-medium">Manage available service categories for the entire system.</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((item) => (
                  <DashboardCard
                    key={item.id}
                    item={item}
                    onClick={() => handleNavigation(item)}
                    onDelete={() => setServiceToDelete(item)}
                  />
                ))}
                <AddServiceCard onClick={() => setIsAddModalOpen(true)} />
              </div>
            )}
          </div>
        </main>

      </div>

      {isAddModalOpen && (
        <AddServiceModal
          onConfirm={handleAddService}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {serviceToDelete && (
        <DeleteConfirmModal
          serviceName={serviceToDelete.text}
          onConfirm={handleDeleteService}
          onCancel={() => setServiceToDelete(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default HeadMaintenance;