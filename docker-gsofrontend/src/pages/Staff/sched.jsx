import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { StaffSidebar, MENU_ITEMS as STAFF_MENU_ITEMS } from '../../components/StaffSidebar';
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

// Header
const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => {
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
        Staff
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
          {STAFF_MENU_ITEMS.map((item) => (
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

// Calendar Header
const CalendarHeader = memo(({ currentDate, prevMonth, nextMonth }) => {
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="flex justify-between items-center mb-4 px-2">
      <button
        onClick={prevMonth}
        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
      >
        <Icon path="M15 19l-7-7 7-7" className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-gray-800">{monthName} {year}</h3>
      <button
        onClick={nextMonth}
        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
      >
        <Icon path="M9 5l7 7-7 7" className="w-5 h-5" />
      </button>
    </div>
  );
});

// Event Form
const EventForm = memo(({ newEvent, setNewEvent, handleAddEvent, closeForm }) => (
  <div className="p-4 border-b border-gray-200 bg-gray-50">
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Event title"
        className="border p-2 rounded flex-grow text-sm"
        value={newEvent.title}
        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
      />
      <input
        type="date"
        className="border p-2 rounded text-sm"
        value={newEvent.date}
        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
      />
      <input
        type="time"
        className="border p-2 rounded text-sm"
        value={newEvent.time}
        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
      />
      <select
        className="border p-2 rounded text-sm"
        value={newEvent.color}
        onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
      >
        <option value="bg-blue-200">Blue</option>
        <option value="bg-green-200">Green</option>
        <option value="bg-pink-200">Pink</option>
        <option value="bg-yellow-200">Yellow</option>
        <option value="bg-purple-200">Purple</option>
      </select>
      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        <button
          onClick={handleAddEvent}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm flex-grow sm:flex-grow-0"
        >
          Save
        </button>
        <button
          onClick={closeForm}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm flex-grow sm:flex-grow-0"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
));

// Dashboard Content
const DashboardContent = memo(() => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", color: "bg-blue-200" });
  const [showForm, setShowForm] = useState(false);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      setEvents([...events, { id: events.length + 1, ...newEvent }]);
      setNewEvent({ title: "", date: "", time: "", color: "bg-blue-200" });
      setShowForm(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const formatDate = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const generateCalendarDays = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<td key={`empty-${i}`} className="p-2 border border-gray-100 text-gray-300"></td>);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(day);
      const dayEvents = events.filter(event => event.date === date);
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      days.push(
        <td key={day} className={`p-2 border border-gray-100 align-top h-24 md:h-32 relative ${isToday ? 'bg-blue-50' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center text-gray-700">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="overflow-y-auto max-h-20">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`${event.color} p-1 mb-1 rounded text-xs overflow-hidden`}
                title={`${event.title} - ${event.time}`}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-gray-600">{event.time}</div>
              </div>
            ))}
          </div>
        </td>
      );
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  let week = [];

  for (let i = 0; i < calendarDays.length; i++) {
    week.push(calendarDays[i]);
    if ((i + 1) % 7 === 0 || i === calendarDays.length - 1) {
      if (i === calendarDays.length - 1 && week.length < 7) {
        const remainingCells = 7 - week.length;
        for (let j = 0; j < remainingCells; j++) {
          week.push(<td key={`empty-end-${j}`} className="p-2 border border-gray-100 text-gray-300"></td>);
        }
      }
      weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
      week = [];
    }
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
      <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">
          Schedules
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors flex items-center gap-2"
        >
          <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {showForm && (
        <EventForm
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          handleAddEvent={handleAddEvent}
          closeForm={() => setShowForm(false)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200 mb-4">
        <CalendarHeader
          currentDate={currentDate}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
        />
        <div className="p-2 sm:p-4 overflow-x-auto">
          <div className="min-w-[768px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <th key={day} className="border border-gray-100 p-2 text-sm font-semibold text-gray-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{weeks}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h3 className="text-lg font-bold mb-3 text-gray-800">Upcoming Events</h3>
        <div className="space-y-2">
          {events
            .filter(event => new Date(`${event.date}T${event.time}`) >= new Date())
            .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
            .slice(0, 3)
            .map(event => (
              <div
                key={event.id}
                className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div className={`w-4 h-4 rounded-full ${event.color} mr-3`}></div>
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </div>
                </div>
              </div>
            ))}
          {events.filter(event => new Date(`${event.date}T${event.time}`) >= new Date()).length === 0 && (
            <div className="text-center text-gray-500 py-4">No upcoming events.</div>
          )}
        </div>
      </div>
    </main>
  );
});

// Main Component
const StaffSchedules = () => {
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
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={STAFF_MENU_ITEMS}
          onLogout={async () => {
            try {
              const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
              await fetch(`${API_BASE_URL}/logout`, {
                method: "POST",
                headers: {
                  "Accept": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              });
            } catch (err) {
              console.error(err);
            } finally {
              localStorage.removeItem("authToken");
              localStorage.removeItem("user");
              sessionStorage.removeItem("authToken");
              sessionStorage.removeItem("user");
              navigate("/loginpage", { replace: true });
            }
          }}
        />
        <DashboardContent />
      </div>
    </div>
  );
};

export default StaffSchedules;