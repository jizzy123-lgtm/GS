import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../../components/Icon'; 
import ScheduleSidebar from '../../../components/ScheduleSidebar'; 
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

const DEFAULT_SERVICES = [
  { text: 'Janitorial', icon: CARD_ICONS.Janitorial },
  { text: 'Carpentry', icon: CARD_ICONS.Carpentry },
  { text: 'Electrical', icon: CARD_ICONS.Electrical },
  { text: 'Air-Conditioning', icon: CARD_ICONS.AirConditioning },
];

const loadServices = () => {
  try {
    const saved = localStorage.getItem('maintenance_services');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEFAULT_SERVICES;
};

// Components
const DashboardCard = memo(({ item, onClick, onDelete }) => (
  <div
    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
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

    {/* Delete button — visible on hover */}
    <button
      className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
      onClick={(e) => {
        e.stopPropagation(); // prevent card navigation
        onDelete();
      }}
      aria-label={`Delete ${item.text}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
));

const AddServiceCard = memo(({ onClick }) => (
  <div
    className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group flex items-center gap-3"
    onClick={onClick}
  >
    <svg
      className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <h3 className="text-lg md:text-xl font-bold text-gray-400 group-hover:text-blue-500 transition-colors">
      Add Service
    </h3>
  </div>
));

const AddServiceModal = memo(({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm(name.trim());
    setName('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Service</h3>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Service name (e.g. Plumbing)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors font-semibold disabled:opacity-40"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

const DeleteConfirmModal = memo(({ serviceName, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
  >
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Delete Service</h3>
      </div>
      <p className="text-gray-600 mb-5 text-sm">
        Are you sure you want to delete <span className="font-semibold text-gray-900">"{serviceName}"</span>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
));

const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => {
  const mobileMenuRef = useRef(null);
  
  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        <div className="ml-auto text-xl font-bold text-white">Head</div>
      </div>
      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {HEAD_MENU_ITEMS.map((item) => (
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

// Main Component
const HeadMaintenance = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const [services, setServices] = useState(loadServices);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null); // holds the service name to delete

  useEffect(() => {
  localStorage.setItem('maintenance_services', JSON.stringify(services));
}, [services]);

  const handleAddService = useCallback((name) => {
    setServices(prev => [...prev, { text: name, icon: CARD_ICONS.Default }]);
    setIsAddModalOpen(false);
  }, []);

  const handleDeleteService = useCallback(() => {
    setServices(prev => prev.filter(s => s.text !== serviceToDelete));
    setServiceToDelete(null);
  }, [serviceToDelete]);

  const handleNavigation = useCallback((item) => {
  // I-convert ang service name para sa URL (e.g. "Air-Conditioning" → "air-conditioning")
  const slug = item.text.toLowerCase().replace(/\s+/g, '-');
  navigate(`/head-service/${slug}`);
}, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
      />

      <div className="flex flex-1 overflow-hidden">
        <HeadSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={HEAD_MENU_ITEMS}
          title="Head"
        />

        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
            Corrective Maintenance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {services.map((item) => (
              <DashboardCard
                key={item.text}
                item={item}
                onClick={() => handleNavigation(item)}
                onDelete={() => setServiceToDelete(item.text)}
              />
            ))}
            <AddServiceCard onClick={() => setIsAddModalOpen(true)} />
          </div>
        </main>

        <ScheduleSidebar />
      </div>

      {isAddModalOpen && (
        <AddServiceModal
          onConfirm={handleAddService}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}

      {serviceToDelete && (
        <DeleteConfirmModal
          serviceName={serviceToDelete}
          onConfirm={handleDeleteService}
          onCancel={() => setServiceToDelete(null)}
        />
      )}
    </div>
  );
};

export default HeadMaintenance;