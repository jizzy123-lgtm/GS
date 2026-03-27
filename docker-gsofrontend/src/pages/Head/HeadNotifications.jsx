import { useReducer, useEffect, useState, memo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../../components/Icon';
import { HeadSidebar, HEAD_MENU_ITEMS } from '../../components/HeadSidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

const getAuthToken = () =>
  localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

const authHeaders = (extra = {}) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
  ...extra,
});

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

const isMaintenanceNotif = (notif) =>
  notif.type === 'maintenance_request' ||
  /maintenance|repair|request/i.test(notif.message || '');

// ─── Status & Priority styles ─────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:     'bg-yellow-100 text-yellow-800 border border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
  completed:   'bg-green-100 text-green-800 border border-green-200',
  cancelled:   'bg-gray-100 text-gray-500 border border-gray-200',
};

const PRIORITY_META = {
  high:   { cls: 'bg-red-100 text-red-700 border border-red-200',       dot: 'bg-red-500',    label: 'High'   },
  medium: { cls: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-400',  label: 'Medium' },
  low:    { cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500',  label: 'Low'    },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const WrenchIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BellIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const Spinner = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ─── Maintenance Modal ────────────────────────────────────────────────────────
const MaintenanceModal = memo(({ request, onClose }) => {
  if (!request) return null;

  const priorityKey = (request.priority || 'low').toLowerCase();
  const statusKey   = (request.status   || 'pending').toLowerCase().replace(/\s+/g, '_');
  const pMeta       = PRIORITY_META[priorityKey] || PRIORITY_META.low;
  const sCls        = STATUS_STYLES[statusKey]   || STATUS_STYLES.pending;
  const statusLabel = (request.status || 'Pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const typeLabel = request.type
    ? request.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const fields = [
    { label: 'Type',          value: typeLabel },
    { label: 'Date Received', value: request.created_at ? fmtDate(request.created_at) : null },
    { label: 'Requested By',  value: request.requester_name },
    { label: 'Unit / Room',   value: request.unit },
    { label: 'Location',      value: request.location },
    { label: 'Category',      value: request.category },
    { label: 'Scheduled',     value: request.scheduled_date ? fmtDate(request.scheduled_date) : null },
  ].filter((f) => f.value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-in">

        {/* Top bar */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-xl">
              <WrenchIcon className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-gray-900">Maintenance Request</h2>
              {request.request_id && (
                <p className="text-xs font-mono text-gray-400 mt-0.5">#{request.request_id}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sCls}`}>
              {statusLabel}
            </span>
            {request.priority && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${pMeta.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`} />
                {pMeta.label} Priority
              </span>
            )}
          </div>

          {request.title && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Title</p>
              <p className="text-gray-900 font-semibold">{request.title}</p>
            </div>
          )}

          {request.description && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {fields.length > 0 && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
              {fields.map((f) => (
                <div key={f.label}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{f.label}</p>
                  <p className="text-gray-800 font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          )}

          {request.notes && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-gray-600 text-sm italic leading-relaxed">{request.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-in { animation: modal-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
    </div>
  );
});

// ─── Single notification row ──────────────────────────────────────────────────
const NotificationItem = memo(({ notif, onClickMaintenance }) => {
  const isMaint = isMaintenanceNotif(notif);

  const handleClick = () => { if (isMaint) onClickMaintenance(notif); };

  return (
    <li
      className={[
        'group flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 transition-colors duration-150',
        !notif.is_read ? 'border-l-4 border-blue-400 bg-blue-50/40' : 'border-l-4 border-transparent',
        isMaint ? 'hover:bg-orange-50 cursor-pointer' : 'hover:bg-gray-50',
      ].join(' ')}
      onClick={handleClick}
      role={isMaint ? 'button' : undefined}
      tabIndex={isMaint ? 0 : undefined}
      onKeyDown={isMaint ? (e) => e.key === 'Enter' && handleClick() : undefined}
      aria-label={isMaint ? `View maintenance request: ${notif.message}` : undefined}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${isMaint ? 'bg-orange-100' : 'bg-gray-100'}`}>
          {isMaint
            ? <WrenchIcon className="w-4 h-4 text-orange-500" />
            : <BellIcon   className="w-4 h-4 text-gray-400"   />
          }
        </div>

        <div className="min-w-0">
          <p className={`text-sm leading-snug break-words ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
            {notif.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">{fmtDate(notif.created_at)}</p>
          {isMaint && (
            <p className="mt-1 text-xs font-medium text-orange-500 flex items-center gap-1 group-hover:underline">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View request details
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-semibold ${
          notif.is_read ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notif.is_read ? 'Read' : 'Unread'}
        </span>
        {isMaint && (
          <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </li>
  );
});

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => (
  <header className="bg-black text-white p-4 flex justify-between items-center relative">
    <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
    <div className="hidden md:block text-xl font-bold text-white">Head</div>
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
    <div className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
      isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
    }`}>
      <nav className="py-2">
        {HEAD_MENU_ITEMS.map((item) => (
          <NavLink key={item.text} to={item.to}
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
));

// ─── Dashboard Content ────────────────────────────────────────────────────────
const DashboardContent = memo(() => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading]       = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/notifications/markAllAsRead`, {
      method: 'PUT',
      headers: authHeaders(),
    }).catch(() => {});

    fetch(`${API_BASE_URL}/notifications`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleMaintenanceClick = useCallback(async (notif) => {
    if (notif.maintenance_request && typeof notif.maintenance_request === 'object') {
      setSelectedRequest(notif.maintenance_request);
      return;
    }

    const requestId =
      notif.request_id ||
      notif.maintenance_request_id ||
      notif.related_id ||
      notif.reference_id;

    if (!requestId) {
      setSelectedRequest({
        title:       notif.title || 'Maintenance Request',
        description: notif.message,
        status:      notif.status || 'pending',
        created_at:  notif.created_at,
      });
      return;
    }

    setModalLoading(true);
    setSelectedRequest({});

    try {
      const res  = await fetch(`${API_BASE_URL}/maintenance-requests/${requestId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setSelectedRequest(data);
    } catch {
      setSelectedRequest({
        title:       'Maintenance Request',
        description: notif.message,
        status:      notif.status || 'pending',
        created_at:  notif.created_at,
      });
    } finally {
      setModalLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedRequest(null);
    setModalLoading(false);
  }, []);

  const unreadCount      = notifications.filter((n) => !n.is_read).length;
  const maintenanceCount = notifications.filter(isMaintenanceNotif).length;

  return (
    <>
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 mb-6 pb-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">
            Notifications
          </h2>
          {!loading && notifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {unreadCount} unread
                </span>
              )}
              {maintenanceCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                  🔧 {maintenanceCount} maintenance
                </span>
              )}
            </div>
          )}
        </div>

        {!loading && maintenanceCount > 0 && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tap a <strong className="font-bold mx-1">maintenance</strong> notification to view full request details.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
              <Spinner className="w-8 h-8 text-gray-300" />
              <span className="text-sm">Loading notifications…</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
              <BellIcon className="w-12 h-12 text-gray-200" />
              <p className="font-medium text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onClickMaintenance={handleMaintenanceClick}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Loading overlay */}
      {selectedRequest !== null && modalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Spinner className="w-8 h-8 text-orange-400" />
            <p className="text-sm text-gray-500 font-medium">Loading request details…</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedRequest !== null && !modalLoading && (
        <MaintenanceModal request={selectedRequest} onClose={closeModal} />
      )}
    </>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const HeadNotifications = () => {
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

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
        />
        <DashboardContent />
      </div>
    </div>
  );
};

export default HeadNotifications;