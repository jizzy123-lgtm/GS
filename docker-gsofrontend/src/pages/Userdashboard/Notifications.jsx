import { useReducer, useEffect, useState, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Sidebar, MENU_ITEMS } from '../../components/Sidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Reducer ──────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAuthToken = () =>
  localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

const authHeaders = (extra = {}) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
  ...extra,
});

// ─── Small components ─────────────────────────────────────────────────────────
const Spinner = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const BellIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

// ─── Filter Toggle ────────────────────────────────────────────────────────────
const FILTER_OPTIONS = ['All', 'Unread', 'Read'];

const FilterToggle = ({ active, onChange }) => (  //mao ni ang component para sa filter toggle buttons (All, Unread, Read). Ang active kay nag-indicate kung unsa nga filter ang active, ug onChange kay function nga i-call kung i-click ang button para ma-change ang active filter. Ang container kay flex nga may gap-1 para sa spacing, bg-gray-100 para sa background color, rounded-lg para sa rounded corners, p-1 para sa padding, ug flex-shrink-0 para dili siya mag-shrink kung gamay ang space. Ang buttons kay nag-loop sa FILTER_OPTIONS array, ug nag-set sa className base sa kung active ba siya or dili. Kung active siya, mag-apply og bg-white, text-gray-900, ug shadow-sm para ma-highlight siya. Kung dili active, mag-apply og text-gray-500 ug hover:text-gray-700 para ma-fade siya ug mag-change color on hover. */}
  <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1 flex-shrink-0"> {/* mao ni ang container sa filter toggle, nga nag-hold sa mga buttons. Ang flex-shrink-0 kay para dili siya mag-shrink kung gamay ang space. */}
    {FILTER_OPTIONS.map((opt) => (  //mao ni ang pag-loop sa mga filter options (All, Unread, Read) para mag-create og button para sa matag usa. Ang key kay opt (nga mao ang text sa button), onClick kay mag-call sa onChange function nga gihatag as prop, ug className kay nag-set sa style base sa kung active ba siya or dili. Kung active siya, mag-apply og bg-white, text-gray-900, ug shadow-sm para ma-highlight siya. Kung dili active, mag-apply og text-gray-500 ug hover:text-gray-700 para ma-fade siya ug mag-change color on hover. */}
      <button
        key={opt} //mao ni ang key para sa button, nga mao ang text sa filter option (All, Unread, Read). Ang key kay importante para sa React para ma-track ang mga elements sa list.
        onClick={() => onChange(opt)} //mao ni ang onClick handler para sa button, nga mag-call sa onChange function nga gihatag as prop, ug i-pass ang opt (nga mao ang text sa filter option) as argument. Ang onChange function kay mag-update sa active filter sa parent component.
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${ //mao ni ang className para sa button, nga nag-set sa padding, text size, font weight, rounded corners, transition, ug duration. Ang bg color, text color, ug shadow kay nag-depend sa kung active ba siya or dili. Kung active siya, mag-apply og bg-white, text-gray-900, ug shadow-sm para ma-highlight siya. Kung dili active, mag-apply og text-gray-500 ug hover:text-gray-700 para ma-fade siya ug mag-change color on hover. */}
          active === opt  //mao ni ang condition para sa active state, nga nag-check kung ang active filter kay equal sa opt (nga mao ang text sa filter option). Kung true, mag-apply og bg-white, text-gray-900, ug shadow-sm para ma-highlight siya. Kung false, mag-apply og text-gray-500 ug hover:text-gray-700 para ma-fade siya ug mag-change color on hover.
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {opt} 
      </button>
    ))}
  </div>
);

// ─── Dashboard Content ────────────────────────────────────────────────────────
const DashboardContent = memo(() => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

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

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.message?.toLowerCase().includes(searchQuery.toLowerCase()); //mao ni ang nag-check kung ang message sa notification kay nag-match sa search query, para ma-show lang siya kung nag-match. Ang toLowerCase kay para case-insensitive ang search.
    const matchesFilter =
      filter === 'All' ||                    //mao ang nag-check kung All ba ang filter, para ma-show tanan notifications regardless sa read status.
      (filter === 'Read' && n.is_read) ||   //mao ang nag-check kung gi-basa na ba ang notification, para ma-show lang siya sa Read filter.
      (filter === 'Unread' && !n.is_read);  //mao ang nag-check kung wala pa gi-basa ang notification, para ma-show lang siya sa Unread filter.
    return matchesSearch && matchesFilter;
  });

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/markAsRead/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleClick = async (notif) => {
    if (processingId === notif.id) return;
    setProcessingId(notif.id);

    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    const message = notif.message?.toLowerCase() || '';
    let tab = 'Pending';

    if (message.includes('approved')) tab = 'Approved';
    else if (message.includes('disapproved') || message.includes('rejected')) tab = 'Disapproved';
    else if (message.includes('completed')) tab = 'Completed';
    else if (message.includes('done')) tab = 'Done';

    navigate('/requeststatus', { state: { tab } });
    setProcessingId(null);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 mb-6 pb-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">
          Notifications
        </h2>
      </div>

      {/* ── Search Bar + Filter Toggle ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications…"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-gray-200 bg-white shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder:text-gray-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <FilterToggle active={filter} onChange={setFilter} />
      </div>
      {/* ──────────────────────────────────────────────────────────────────── */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
            <Spinner className="w-8 h-8 text-gray-300" />
            <span className="text-sm">Loading notifications…</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
            <BellIcon className="w-12 h-12 text-gray-200" />
            <p className="font-medium text-sm">
              {searchQuery || filter !== 'All'
                ? 'No notifications match your filters'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotifications.map((notif) => (
              <li
                key={`notif-${notif.id}`}
                onClick={() => handleClick(notif)}
                className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer transition-colors
                  ${!notif.is_read ? 'bg-blue-50' : ''}
                  hover:bg-gray-50
                  ${processingId === notif.id ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <div>
                  <div className="font-semibold text-gray-800">{notif.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 md:mt-0 flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                    notif.is_read ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                  }`}>
                    {notif.is_read ? 'Read' : 'Unread'}
                  </span>
                  {processingId === notif.id && (
                    <span className="text-xs text-gray-400">Loading...</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
});

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => (
  <header className="bg-black text-white p-4 flex justify-between items-center relative">
    <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
    <div className="hidden md:block text-xl font-bold text-white">User</div>
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
      isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    }`}>
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
        Created By Exverter
      </div>
    </div>
  </header>
));

// ─── Main Component ───────────────────────────────────────────────────────────
const Notifications = () => {
  const navigate = useNavigate();
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
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          onLogout={async () => {
            try {
              const token = getAuthToken();
              await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
            } catch (err) {
              console.error(err);
            } finally {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('user');
              navigate('/loginpage', { replace: true });
            }
          }}
        />
        <DashboardContent />
      </div>
    </div>
  );
};

export default Notifications;