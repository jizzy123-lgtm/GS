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
          className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
        >
          Save
        </button>
        <button
          onClick={closeForm}
          className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors text-sm font-bold shadow-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
));

// Dashboard Content
const DashboardContent = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", location: "", notes: "", color: "bg-blue-200" });
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedEvent]);

  const fetchEvents = useCallback(async () => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/schedule-events`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        const mappedEvents = data.data.map((event, index) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time.slice(0, 5),
          location: event.location,
          notes: event.notes,
          assigned_office: event.assigned_office,
          creator: event.creator,
          color: [
            "bg-blue-100 text-blue-800 border-blue-200",
            "bg-green-100 text-green-800 border-green-200",
            "bg-purple-100 text-purple-800 border-purple-200",
            "bg-pink-100 text-pink-800 border-pink-200",
            "bg-yellow-100 text-yellow-800 border-yellow-200"
          ][index % 5]
        }));
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert("Please fill in title, date, and time.");
      return;
    }

    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/schedule-events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          location: newEvent.location,
          notes: newEvent.notes,
          // You could add maintenance_request_id here if selected
        }),
      });

      if (response.ok) {
        setNewEvent({ title: "", date: "", time: "", location: "", notes: "", color: "bg-blue-200" });
        setShowForm(false);
        fetchEvents(); // Refresh list from server
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to save event.");
      }
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Cannot connect to server.");
    } finally {
      setLoading(false);
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
      days.push(<td key={`empty-${i}`} className="p-1 sm:p-2 border border-gray-100 bg-gray-50/50"></td>);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(day);
      const dayEvents = events.filter(event => event.date === date);
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      days.push(
        <td 
          key={day} 
          onClick={() => {
            if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]);
          }}
          className={`p-1 sm:p-2 border border-gray-100 align-top h-24 md:h-32 relative group transition-colors hover:bg-gray-50 cursor-pointer pointer-events-auto ${isToday ? 'bg-blue-50/50' : ''}`}
        >
          <div className="flex justify-between items-start mb-1 pointer-events-none">
            <span className={`text-xs sm:text-sm font-bold ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-500'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[70px] md:max-h-[90px] scrollbar-hide relative z-10">
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                className={`${event.color} px-1.5 py-1 rounded border border-transparent hover:border-current transition-all cursor-pointer flex items-center gap-1 group/item relative z-20`}
                title={`${event.title} - ${event.time}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span className="text-[10px] md:text-xs font-semibold truncate leading-none">{event.title}</span>
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
        const remaining = 7 - week.length;
        for (let j = 0; j < remaining; j++) {
          week.push(<td key={`empty-end-${j}`} className="p-1 sm:p-2 border border-gray-100 bg-gray-50/50"></td>);
        }
      }
      weeks.push(<tr key={`week-${weeks.length}`} className="divide-x divide-gray-100">{week}</tr>);
      week = [];
    }
  }

  return (
    <>
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Schedules</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
        >
          <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {showForm && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <EventForm
            newEvent={newEvent}
            setNewEvent={setNewEvent}
            handleAddEvent={handleAddEvent}
            closeForm={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <CalendarHeader
          currentDate={currentDate}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
        />
        <div className="p-2 sm:p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse table-fixed border-hidden">
              <thead>
                <tr className="bg-gray-50/50 border-y border-gray-100">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <th key={day} className="w-[14.28%] p-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">{weeks}</tbody>
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
                onClick={() => setSelectedEvent(event)}
                className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98]"
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

    {selectedEvent && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        />
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300 relative z-10">
          <div className={`${selectedEvent.color || 'bg-pink-100'} px-6 py-4 flex justify-between items-center`}>
            <h3 className="text-lg font-bold text-gray-800">Event Details</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          <div className="p-8 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Event Title</label>
              <p className="text-2xl font-black text-gray-900">{selectedEvent.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</label>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-tight">
                    {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long' })}
                  </p>
                  <p className="text-sm font-bold text-gray-500 tracking-wide">
                    {new Date(selectedEvent.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Time</label>
                <p className="font-bold text-gray-700">{selectedEvent.time}</p>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="bg-[#1f2937] hover:bg-black text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
};

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