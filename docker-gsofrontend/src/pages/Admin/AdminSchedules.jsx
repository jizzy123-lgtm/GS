import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar, MENU_ITEMS } from '../../components/AdminSidebar';
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
    default:
      return state;
  }
};

const Header = memo(({ 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  onCloseMobileMenu 
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

      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        {/* Move Admin label here */}
        <div className="hidden md:block text-xl font-bold text-white ml-4">
          Admin
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
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
          Created By Bantilan & Friends
        </div>
      </div>
    </header>
  );
});

// Calendar Components
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

const EventForm = memo(({ newEvent, setNewEvent, handleAddEvent, closeForm }) => (
  <div className="p-4 border-b border-gray-200 bg-gray-50">
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Event title"
        className="border p-2 rounded flex-grow text-sm"
        value={newEvent.title}
        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
      />
      <input
        type="date"
        className="border p-2 rounded text-sm"
        value={newEvent.date}
        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
      />
      <input
        type="time"
        className="border p-2 rounded text-sm"
        value={newEvent.time}
        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
      />
      <select
        className="border p-2 rounded text-sm"
        value={newEvent.color}
        onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
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
const DashboardContent = memo(() => {
     // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", color: "bg-blue-200" });
  const [showForm, setShowForm] = useState(false);

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

  // Add new event
  const handleAddEvent = async () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      try {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/schedule-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            title: newEvent.title,
            date: newEvent.date,
            time: newEvent.time,
            color: newEvent.color
          })
        });

        if (response.ok) {
          await fetchEvents(); // Refresh from DB
          setNewEvent({ title: "", date: "", time: "", color: "bg-blue-200" });
          setShowForm(false);
        } else {
          const errorData = await response.json();
          alert(`Failed to save event: ${errorData.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Error saving event:", err);
        alert("Network error. Could not save event.");
      }
    } else {
      alert("Please fill in the title, date, and time.");
    }
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Format date for event lookup
  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Generate weeks for the calendar
  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<td key={`empty-${i}`} className="p-2 border border-gray-100 text-gray-300"></td>);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(day);
      const dayEvents = events.filter(event => event.date === date);
      const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
      
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
            {dayEvents.length > 0 && (
              <span className="text-xs bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center text-gray-700 md:hidden">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 mt-1 px-1 relative z-10">
            {dayEvents.map(event => (
              <button
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                className={`${event.color} w-full py-1 rounded flex items-center justify-center text-[10px] md:text-[11px] font-bold text-gray-800 px-1 truncate shadow-sm hover:brightness-95 transition-all cursor-pointer border border-black/5 relative z-20`}
                title={`${event.title} - ${event.time}`}
              >
                {event.title}
              </button>
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
  
  // Arrange days into weeks
  for (let i = 0; i < calendarDays.length; i++) {
    week.push(calendarDays[i]);
    
    if ((i + 1) % 7 === 0 || i === calendarDays.length - 1) {
      // Fill in remaining cells of the last week
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
    <>
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 overflow-y-auto">
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
              <tbody>
                {weeks}
              </tbody>
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
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-all group"
              >
                <div className={`w-4 h-4 rounded-full ${event.color} mr-3 group-hover:scale-110 transition-transform`}></div>
                <div className="flex-1">
                  <div className="font-medium group-hover:text-blue-600 transition-colors">{event.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </div>
                </div>
                <Icon path="M9 5l7 7-7 7" className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
              </button>
            ))}
          {events.filter(event => new Date(`${event.date}T${event.time}`) >= new Date()).length === 0 && (
            <div className="text-center text-gray-500 py-4">No upcoming events.</div>
          )}
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300 relative z-10">
              <div className="bg-pink-100 px-6 py-4 flex justify-between items-center">
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
      </div>
    </main>
  </>
);
});

// Main Component
const AdminSchedules = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true, // true means collapsed by default
    isMobileMenuOpen: false
  });

  const handleNavigation = useCallback((item) => {
    if (item === 'Maintenance') navigate('/maintenance');
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
      />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
        />
        <DashboardContent />
      </div>
    </div>
  );
};

export default AdminSchedules;