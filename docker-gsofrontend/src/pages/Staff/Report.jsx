import React, { useState, useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { StaffSidebar, MENU_ITEMS } from "../../components/StaffSidebar"; // Add this import
import Icon from "../../components/Icon";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// sidebar reducer
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const maintenanceTypeMap = {
  1: "Janitorial",
  2: "Carpentry",
  3: "Electrical",
  4: "AirConditioning",
};

// Helper functions for date filtering
const getStartOfWeek = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getEndOfWeek = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() + (day === 0 ? 0 : 7 - day);
  newDate.setDate(diff);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const getStartOfMonth = (date) => {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getEndOfMonth = (date) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + 1);
  newDate.setDate(0);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const getStartOfYear = (date) => {
  const newDate = new Date(date);
  newDate.setMonth(0, 1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getEndOfYear = (date) => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + 1);
  newDate.setMonth(0, 0);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const DateSelector = ({ dateFilter, setDateFilter, dateRange, setDateRange }) => {
  const currentDate = new Date();
  
  const handleDateRangeChange = (e) => {
    const newDateRange = e.target.value;
    setDateRange(newDateRange);
    
    switch (newDateRange) {
      case "week":
        setDateFilter({
          start: getStartOfWeek(currentDate),
          end: getEndOfWeek(currentDate)
        });
        break;
      case "month":
        setDateFilter({
          start: getStartOfMonth(currentDate),
          end: getEndOfMonth(currentDate)
        });
        break;
      case "year":
        setDateFilter({
          start: getStartOfYear(currentDate),
          end: getEndOfYear(currentDate)
        });
        break;
      case "custom":
        // Initialize with current date for custom range
        setDateFilter({
          start: new Date(currentDate),
          end: new Date(currentDate)
        });
        break;
      case "all":
      default:
        setDateFilter(null);
        break;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleCustomStartDateChange = (e) => {
    const newStartDateStr = e.target.value;
    if (!newStartDateStr) return;
    
    const newStartDate = new Date(newStartDateStr);
    newStartDate.setHours(0, 0, 0, 0);
    
    setDateFilter(prev => ({
      ...prev,
      start: newStartDate
    }));
  };

  const handleCustomEndDateChange = (e) => {
    const newEndDateStr = e.target.value;
    if (!newEndDateStr) return;
    
    const newEndDate = new Date(newEndDateStr);
    newEndDate.setHours(23, 59, 59, 999);
    
    setDateFilter(prev => ({
      ...prev,
      end: newEndDate
    }));
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-4">
      <div className="flex items-center">
        <label htmlFor="dateRange" className="mr-2 font-medium text-gray-700">View by:</label>
        <select
          id="dateRange"
          value={dateRange}
          onChange={handleDateRangeChange}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
      
      {dateRange === "custom" && (
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center">
            <label htmlFor="startDate" className="mr-2 font-medium text-gray-700">From:</label>
            <input
              type="date"
              id="startDate"
              value={dateFilter?.start ? formatDate(dateFilter.start) : ""}
              onChange={handleCustomStartDateChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="endDate" className="mr-2 font-medium text-gray-700">To:</label>
            <input
              type="date"
              id="endDate"
              value={dateFilter?.end ? formatDate(dateFilter.end) : ""}
              onChange={handleCustomEndDateChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const BarChartComponent = ({ requests }) => {
  // Count by maintenance type and status
  const countByTypeAndStatus = () => {
    const counts = {};
    
    // Initialize counts for each maintenance type and status
    Object.values(maintenanceTypeMap).forEach(type => {
      counts[type] = {
        Pending: 0,
        Approved: 0,
        Disapproved: 0,
        Done: 0
      };
    });
    
    // Count requests
    requests.forEach(request => {
      const type = maintenanceTypeMap[request.maintenance_type_id] || "Unknown";
      const status = request.status;
      
      if (counts[type] && counts[type][status] !== undefined) {
        counts[type][status]++;
      }
    });
    
    return counts;
  };
  
  const counts = countByTypeAndStatus();
  const maintenanceTypes = Object.values(maintenanceTypeMap);
  
  // Prepare data for Chart.js
  const data = {
    labels: maintenanceTypes,
    datasets: [
      {
        label: 'Pending',
        data: maintenanceTypes.map(type => counts[type]?.Pending || 0),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
      {
        label: 'Approved',
        data: maintenanceTypes.map(type => counts[type]?.Approved || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Disapproved',
        data: maintenanceTypes.map(type => counts[type]?.Disapproved || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Done',
        data: maintenanceTypes.map(type => counts[type]?.Done || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Maintenance Requests by Type and Status',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Only show integers
        },
        title: {
          display: true,
          text: 'Number of Requests',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Maintenance Type',
        },
      },
    },
  };

  return (
    <div className="h-96 w-full bg-white rounded-lg shadow p-4">
      <Bar data={data} options={options} />
    </div>
  );
};

// Component for table view for reference
const RequestsTable = ({ onRowClick, requests, showActions }) => (
  <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b-2 border-gray-200">
          <th className="p-3 text-left font-semibold">Requesting Personnel</th>
          <th className="p-3 text-left font-semibold">Requesting Office</th>
          <th className="p-3 text-left font-semibold">Maintenance Type</th>
          <th className="p-3 text-left font-semibold">Date</th>
          <th className="p-3 text-left font-semibold">Status</th>
          {showActions && <th className="p-3 text-left font-semibold">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {requests.length > 0 ? (
          requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400">
              <td className="p-3 font-medium">{request.requesting_personnel}</td>
              <td className="p-3">{request.requesting_office}</td>
              <td className="p-3">{maintenanceTypeMap[request.maintenance_type_id] || "Unknown"}</td>
              <td className="p-3">{request.created_at ? new Date(request.created_at).toLocaleDateString() : "N/A"}</td>
              <td className="p-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  request.status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : request.status === "Approved"
                    ? "bg-green-100 text-green-800"
                    : request.status === "Done"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {request.status}
                </span>
              </td>
              {showActions && (
                <td className="p-3">
                  <button
                    onClick={() => onRowClick(request.id, request.status)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Review
                  </button>
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={showActions ? 6 : 5} className="p-3 text-center">
              No maintenance requests found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
const UserRequestAnalysis = ({ requests }) => {
  // Group requests by user and analyze them
  const analyzeUserRequests = () => {
    const userRequests = {};
    
    requests.forEach(request => {
      const user = request.requesting_personnel;
      const type = maintenanceTypeMap[request.maintenance_type_id] || "Unknown";
      
      if (!userRequests[user]) {
        userRequests[user] = {
          totalRequests: 0,
          byType: {},
          byStatus: {
            Pending: 0,
            Approved: 0,
            Disapproved: 0,
            Done: 0
          },
          office: request.requesting_office
        };
      }
      
      // Increment total requests
      userRequests[user].totalRequests++;
      
      // Count by type
      if (!userRequests[user].byType[type]) {
        userRequests[user].byType[type] = 0;
      }
      userRequests[user].byType[type]++;
      
      // Count by status
      userRequests[user].byStatus[request.status]++;
    });
    
    // Convert to array and sort by most requests
    const sortedUsers = Object.entries(userRequests)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalRequests - a.totalRequests);
    
    return sortedUsers;
  };
  
  // Use useMemo to recalculate users when requests change
  const users = useMemo(() => analyzeUserRequests(), [requests]);
  
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalRequests');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState("chart");
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const [selectedOffices, setSelectedOffices] = useState([]);
  const searchRef = useRef(null);

  // Extract all unique offices for the dropdown
  const offices = useMemo(() => {
    const officeSet = new Set();
    users.forEach(user => {
      if (user.office) {
        officeSet.add(user.office);
      }
    });
    return Array.from(officeSet).sort();
  }, [users]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowOfficeDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  // Filter and sort users based on selected offices and search term
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        // If no offices are selected, show all users
        const officeMatch = selectedOffices.length === 0 || selectedOffices.includes(user.office);
        
        // Match search term across name or office
        const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.office.toLowerCase().includes(searchTerm.toLowerCase());
        
        return officeMatch && searchMatch;
      })
      .sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        
        if (sortBy === 'name') {
          return multiplier * a.name.localeCompare(b.name);
        } else if (sortBy === 'office') {
          return multiplier * a.office.localeCompare(b.office);
        } else {
          return multiplier * (a[sortBy] - b[sortBy]);
        }
      });
  }, [users, selectedOffices, searchTerm, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  // Handle clicking on a bar in the chart
  const handleChartClick = (_, elements) => {
    if (elements && elements.length > 0) {
      // Get the index of the clicked bar
      const index = elements[0].index;
      // Get the user name from the chart data
      const userName = chartData.labels[index];
      // Find the user in our filtered users
      const user = filteredUsers.find(u => u.name === userName);
      
      if (user) {
        // Set the selected user
        setSelectedUser(user);
        // Switch to table view to show the user's requests
        setViewMode("table");
        // Also set as expanded user for the table view
        setExpandedUser(user.name);
      }
    }
  };

  // Toggle office selection in the multi-select dropdown
  const toggleOfficeSelection = (office) => {
    setSelectedOffices(prevSelected => {
      if (prevSelected.includes(office)) {
        return prevSelected.filter(o => o !== office);
      } else {
        return [...prevSelected, office];
      }
    });
  };

  // Clear all selected offices
  const clearOfficeSelection = () => {
    setSelectedOffices([]);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-300">↕</span>;
    return sortDirection === 'asc' ? 
      <span className="ml-1 text-blue-500">↑</span> : 
      <span className="ml-1 text-blue-500">↓</span>;
  };

  // Prepare data for chart visualization
  const prepareChartData = () => {
    // Take top 10 users for the chart
    const topUsers = filteredUsers.slice(0, 10);
    
    return {
      labels: topUsers.map(user => user.name),
      datasets: [
        {
          label: 'Pending',
          data: topUsers.map(user => user.byStatus.Pending),
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
        },
        {
          label: 'Approved',
          data: topUsers.map(user => user.byStatus.Approved),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Disapproved',
          data: topUsers.map(user => user.byStatus.Disapproved),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Done',
          data: topUsers.map(user => user.byStatus.Done),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Memoize chart data to avoid unnecessary recalculations
  const chartData = useMemo(() => prepareChartData(), [filteredUsers]);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: selectedOffices.length > 0 
          ? `Top 10 Users by Request Status (Selected Offices: ${selectedOffices.length})` 
          : 'Top 10 Users by Request Status (All Offices)',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          footer: (tooltipItems) => {
            return 'Click to view detailed requests';
          },
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          precision: 0, // Only show integers
        },
        title: {
          display: true,
          text: 'Number of Requests',
        },
      },
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Users',
        },
      },
    },
    onClick: handleChartClick
  };

  // Filter requests for the selected user
  const userRequests = useMemo(() => {
    return selectedUser 
      ? requests.filter(req => req.requesting_personnel === selectedUser.name)
      : [];
  }, [requests, selectedUser]);

  // Clear selected user when returning to chart view
  const handleViewModeChange = (mode) => {
    if (mode === 'chart') {
      setSelectedUser(null);
    }
    setViewMode(mode);
  };

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    return offices.filter(office => 
      office.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offices, searchTerm]);

  // Log when requests change to help debug
  useEffect(() => {
    console.log("Requests updated:", requests.length);
    console.log("Users found:", users.length);
    console.log("Selected offices:", selectedOffices);
  }, [requests, users, selectedOffices]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">User Request Analysis</h3>
        
        {/* View modes toggle */}
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => handleViewModeChange("chart")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              viewMode === "chart" 
                ? "bg-blue-50 text-blue-700 border-blue-300" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Chart View
          </button>
          <button
            onClick={() => handleViewModeChange("table")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
              viewMode === "table" 
                ? "bg-blue-50 text-blue-700 border-blue-300" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Table View
          </button>
        </div>
      </div>
      
      {/* Search and multi-select office filter */}
      <div className="mb-4 relative" ref={searchRef}>
        <div className="flex items-center mb-2">
          <div className="flex-1 mr-2">
            <input
              type="text"
              placeholder="Search users or offices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg w-full p-2"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowOfficeDropdown(!showOfficeDropdown)}
              className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
            >
              <span className="mr-2">Office Filter</span>
              <span className={`text-blue-600 ${selectedOffices.length > 0 ? 'font-bold' : ''}`}>
                {selectedOffices.length > 0 ? `(${selectedOffices.length})` : ''}
              </span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Showing selected offices as chips */}
        {selectedOffices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedOffices.map((office, index) => (
              <div 
                key={index} 
                className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm"
              >
                <span className="mr-1">{office}</span>
                <button 
                  onClick={() => toggleOfficeSelection(office)}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={clearOfficeSelection}
              className="text-sm text-gray-500 hover:text-red-500 underline"
            >
              Clear All
            </button>
          </div>
        )}
        
        {/* Office dropdown multi-select */}
        {showOfficeDropdown && offices.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2 flex justify-between items-center text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
              <span>Select Offices to Display</span>
              <span>{selectedOffices.length} of {offices.length} selected</span>
            </div>
            
            {filteredOffices.length > 0 ? (
              filteredOffices.map((office, index) => (
                <div 
                  key={index}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-t border-gray-100 flex items-center"
                  onClick={() => toggleOfficeSelection(office)}
                >
                  <input
                    type="checkbox"
                    checked={selectedOffices.includes(office)}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  <span className="mr-2 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  {office}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">No offices found</div>
            )}
            
            {/* Actions at the bottom of dropdown */}
            <div className="p-2 border-t border-gray-200 bg-gray-50 sticky bottom-0 flex justify-between">
              <button
                onClick={clearOfficeSelection}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  // Select all visible offices
                  setSelectedOffices(filteredOffices);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select All Visible
              </button>
              <button
                onClick={() => setShowOfficeDropdown(false)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Selected user notice */}
      {selectedUser && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-medium">Viewing requests for: <span className="font-bold">{selectedUser.name}</span></p>
            <p className="text-sm text-gray-600">From {selectedUser.office} • {selectedUser.totalRequests} total requests</p>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(null);
              setExpandedUser(null);
            }}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
          >
            Clear Filter
          </button>
        </div>
      )}
      
      {/* Office selection notice if active */}
      {selectedOffices.length > 0 && !selectedUser && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-medium">Filtering by <span className="font-bold">{selectedOffices.length}</span> selected offices</p>
            <p className="text-sm text-gray-600">
              {selectedOffices.length <= 3 
                ? selectedOffices.join(', ')
                : `${selectedOffices.slice(0, 2).join(', ')} and ${selectedOffices.length - 2} more...`}
            </p>
          </div>
          <button 
            onClick={clearOfficeSelection}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
          >
            Clear Offices
          </button>
        </div>
      )}
      
      {/* Chart View */}
      {viewMode === "chart" && !selectedUser && (
        <div className="h-96 w-full bg-white rounded-lg shadow p-4 mb-6">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
      
      {/* Table View */}
      {(viewMode === "table" || selectedUser) && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th 
                  className="p-3 text-left font-semibold cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  User <SortIcon field="name" />
                </th>
                <th 
                  className="p-3 text-left font-semibold cursor-pointer"
                  onClick={() => handleSort('office')}
                >
                  Office <SortIcon field="office" />
                </th>
                <th 
                  className="p-3 text-left font-semibold cursor-pointer"
                  onClick={() => handleSort('totalRequests')}
                >
                  Total Requests <SortIcon field="totalRequests" />
                </th>
                <th className="p-3 text-left font-semibold">Status Breakdown</th>
                <th className="p-3 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {selectedUser ? (
                // If a user is selected, show only that user
                <React.Fragment>
                  <tr className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-3 font-medium">{selectedUser.name}</td>
                    <td className="p-3">{selectedUser.office}</td>
                    <td className="p-3">{selectedUser.totalRequests}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        {selectedUser.byStatus.Pending > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {selectedUser.byStatus.Pending} Pending
                          </span>
                        )}
                        {selectedUser.byStatus.Approved > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {selectedUser.byStatus.Approved} Approved
                          </span>
                        )}
                        {selectedUser.byStatus.Disapproved > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            {selectedUser.byStatus.Disapproved} Disapproved
                          </span>
                        )}
                        {selectedUser.byStatus.Done > 0 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {selectedUser.byStatus.Done} Done
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setExpandedUser(expandedUser === selectedUser.name ? null : selectedUser.name)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {expandedUser === selectedUser.name ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedUser === selectedUser.name && (
                    <tr>
                      <td colSpan="5" className="p-4 bg-gray-50">
                        <div className="p-3 border rounded-lg border-gray-200 bg-white">
                          <h4 className="font-bold mb-2">Request Details for {selectedUser.name}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-gray-700 mb-2">By Type</h5>
                              <ul className="list-disc list-inside">
                                {Object.entries(selectedUser.byType).map(([type, count]) => (
                                  <li key={type} className="mb-1">
                                    {type}: <span className="font-medium">{count}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-700 mb-2">By Status</h5>
                              <ul className="list-disc list-inside">
                                <li className="mb-1">
                                  Pending: <span className="font-medium">{selectedUser.byStatus.Pending}</span>
                                </li>
                                <li className="mb-1">
                                  Approved: <span className="font-medium">{selectedUser.byStatus.Approved}</span>
                                </li>
                                <li className="mb-1">
                                  Disapproved: <span className="font-medium">{selectedUser.byStatus.Disapproved}</span>
                                </li>
                                <li className="mb-1">
                                  Done: <span className="font-medium">{selectedUser.byStatus.Done}</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                           
                          
                          {/* User request table */}
                          <div className="mt-4">
                            <h5 className="font-semibold text-gray-700 mb-2">All Requests</h5>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="p-2 text-left text-sm">Type</th>
                                    <th className="p-2 text-left text-sm">Status</th>
                                    <th className="p-2 text-left text-sm">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userRequests.length > 0 ? (
                                    userRequests
                                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                      .map((req, i) => (
                                        <tr key={i} className="border-b border-gray-200">
                                          <td className="p-2 text-sm">
                                            {maintenanceTypeMap[req.maintenance_type_id] || "Unknown"}
                                          </td>
                                          <td className="p-2 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                              req.status === "Pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : req.status === "Approved"
                                                ? "bg-green-100 text-green-800"
                                                : req.status === "Done"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-red-100 text-red-800"
                                            }`}>
                                              {req.status}
                                            </span>
                                          </td>
                                          <td className="p-2 text-sm">
                                            {req.created_at ? new Date(req.created_at).toLocaleDateString() : "N/A"}
                                          </td>
                                        </tr>
                                      ))
                                  ) : (
                                    <tr>
                                      <td colSpan="3" className="p-2 text-center text-sm">
                                        No requests found for this user
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ) : (
                // Otherwise show all filtered users
                filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="p-3 font-medium">{user.name}</td>
                        <td className="p-3">{user.office}</td>
                        <td className="p-3">{user.totalRequests}</td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            {user.byStatus.Pending > 0 && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                {user.byStatus.Pending} Pending
                              </span>
                            )}
                            {user.byStatus.Approved > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {user.byStatus.Approved} Approved
                              </span>
                            )}
                            {user.byStatus.Disapproved > 0 && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                {user.byStatus.Disapproved} Disapproved
                              </span>
                            )}
                            {user.byStatus.Done > 0 && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                {user.byStatus.Done} Done
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setExpandedUser(expandedUser === user.name ? null : user.name);
                              // If expanding, also set as selected user
                              if (expandedUser !== user.name) {
                                setSelectedUser(user);
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {expandedUser === user.name ? 'Hide Details' : 'Show Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedUser === user.name && (
                        <tr>
                          <td colSpan="5" className="p-4 bg-gray-50">
                            <div className="p-3 border rounded-lg border-gray-200 bg-white">
                              <h4 className="font-bold mb-2">Request Details for {user.name}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="font-semibold text-gray-700 mb-2">By Type</h5>
                                  <ul className="list-disc list-inside">
                                    {Object.entries(user.byType).map(([type, count]) => (
                                      <li key={type} className="mb-1">
                                        {type}: <span className="font-medium">{count}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-700 mb-2">By Status</h5>
                                  <ul className="list-disc list-inside">
                                    <li className="mb-1">
                                      Pending: <span className="font-medium">{user.byStatus.Pending}</span>
                                    </li>
                                    <li className="mb-1">
                                      Approved: <span className="font-medium">{user.byStatus.Approved}</span>
                                    </li>
                                    <li className="mb-1">
                                      Disapproved: <span className="font-medium">{user.byStatus.Disapproved}</span>
                                    </li>
                                    <li className="mb-1">
                                      Done: <span className="font-medium">{user.byStatus.Done}</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              
                              {/* User request table */}
                              <div className="mt-4">
                                <h5 className="font-semibold text-gray-700 mb-2">Recent Requests</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="p-2 text-left text-sm">Type</th>
                                        <th className="p-2 text-left text-sm">Status</th>
                                        <th className="p-2 text-left text-sm">Date</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {requests
                                        .filter(req => req.requesting_personnel === user.name)
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .slice(0, 5) // Show only the 5 most recent by default
                                        .map((req, i) => (
                                          <tr key={i} className="border-b border-gray-200">
                                            <td className="p-2 text-sm">
                                              {maintenanceTypeMap[req.maintenance_type_id] || "Unknown"}
                                            </td>
                                            <td className="p-2 text-sm">
                                              <span className={`px-2 py-1 rounded-full text-xs ${
                                                req.status === "Pending"
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : req.status === "Approved"
                                                  ? "bg-green-100 text-green-800"
                                                  : req.status === "Done"
                                                  ? "bg-purple-100 text-purple-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}>
                                                {req.status}
                                              </span>
                                            </td>
                                            <td className="p-2 text-sm">
                                              {req.created_at ? new Date(req.created_at).toLocaleDateString() : "N/A"}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* View all requests button */}
                                {requests.filter(req => req.requesting_personnel === user.name).length > 5 && (
                                  <div className="mt-2 text-center">
                                    <button
                                      onClick={() => setSelectedUser(user)}
                                      className="text-blue-500 hover:text-blue-700 text-sm"
                                    >
                                      View all {requests.filter(req => req.requesting_personnel === user.name).length} requests
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center">
                      No users found matching your search criteria
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Stats summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Avg. Requests Per User</p>
          <p className="text-2xl font-bold">
            {users.length > 0 
              ? (users.reduce((sum, user) => sum + user.totalRequests, 0) / users.length).toFixed(1) 
              : 0}
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700">Most Active User</p>
          <p className="text-2xl font-bold">
            {users.length > 0 
              ? `${users[0].name} (${users[0].totalRequests})` 
              : 'None'}
          </p>
        </div>
      </div>
    </div>
  );
};

const Report = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const [viewMode, setViewMode] = useState("chart"); // 'chart' or 'table'
  const [dateFilter, setDateFilter] = useState(null);
  const [dateRange, setDateRange] = useState("all");
  const [activeSection, setActiveSection] = useState("overview"); // 'overview' or 'users'

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      navigate("/loginpage");
      return;
    }

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/maintenance-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : data;
        setRequests(list);
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token, navigate]);

  const handleRowClick = useCallback(
    (id, status) => {
      if (status === "Pending") {
        navigate(`/staffmaintenancerequestform/${id}`);
      } else {
        navigate(`/viewmaintenancerequestform/${id}`);
      }
    },
    [navigate]
  );

  // Apply filters (status and date)
  const filteredRequests = requests.filter((request) => {
    // Status filter
    const statusMatch = selectedTab === "All" ? true : request.status === selectedTab;
    
    // Date filter
    let dateMatch = true;
    if (dateFilter && dateFilter.start && dateFilter.end && request.created_at) {
      const requestDate = new Date(request.created_at);
      dateMatch = requestDate >= dateFilter.start && requestDate <= dateFilter.end;
    }
    
    return statusMatch && dateMatch;
  });

  const showActions = true;

  if (loading) return <div className="p-4 flex justify-center items-center h-screen">Loading requests...</div>;

  // Safely format date for display
  const formatDateSafely = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Staff</div>
        <button
          onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white"
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        <div
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-2">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700"
                onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
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

      <div className="flex flex-1 overflow-auto">
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={MENU_ITEMS}
          title="STAFF"
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Maintenance Requests
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveSection("overview")}
                className={`px-4 py-2 rounded-lg ${
                  activeSection === "overview" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveSection("users")}
                className={`px-4 py-2 rounded-lg ${
                  activeSection === "users" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                User Analysis
              </button>
            </div>
          </div>

          {/* Date Filter */}
          <DateSelector 
            dateFilter={dateFilter} 
            setDateFilter={setDateFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />

          {activeSection === "overview" ? (
            <>
              {/* Status Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {["All", "Pending", "Approved", "Disapproved", "Done"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-4 py-2 font-semibold rounded-md ${
                      selectedTab === tab
                        ? tab === "All"
                          ? "bg-blue-500 text-white" 
                          : tab === "Pending"
                          ? "bg-yellow-500 text-white"
                          : tab === "Approved"
                          ? "bg-green-500 text-white"
                          : tab === "Done"
                          ? "bg-purple-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-transparent text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Display date range info if filtering */}
              {dateFilter && dateFilter.start && dateFilter.end && (
                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    Viewing requests from {formatDateSafely(dateFilter.start)} to {formatDateSafely(dateFilter.end)}
                  </p>
                </div>
              )}

              {/* View modes toggle */}
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => setViewMode("chart")}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                      viewMode === "chart" 
                        ? "bg-blue-50 text-blue-700 border-blue-300" 
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Chart View
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                      viewMode === "table" 
                        ? "bg-blue-50 text-blue-700 border-blue-300" 
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Table View
                  </button>
                </div>
              </div>

              {/* View modes */}
              {viewMode === "chart" ? (
                <BarChartComponent requests={filteredRequests} />
              ) : (
                <RequestsTable
                  onRowClick={handleRowClick}
                  requests={filteredRequests}
                  showActions={showActions}
                />
              )}

              {/* Request count summary */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <p className="text-gray-500 font-medium">Total Filtered Requests</p>
                  <p className="text-3xl font-bold">{filteredRequests.length}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
                  <p className="text-yellow-700 font-medium">Pending</p>
                  <p className="text-3xl font-bold">{filteredRequests.filter(r => r.status === "Pending").length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
                  <p className="text-green-700 font-medium">Approved</p>
                  <p className="text-3xl font-bold">{filteredRequests.filter(r => r.status === "Approved").length}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
                  <p className="text-red-700 font-medium">Disapproved</p>
                  <p className="text-3xl font-bold">{filteredRequests.filter(r => r.status === "Disapproved").length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
                  <p className="text-purple-700 font-medium">Done</p>
                  <p className="text-3xl font-bold">{filteredRequests.filter(r => r.status === "Done").length}</p>
                </div>
              </div>
            </>
          ) : (
            // User analysis section
            <UserRequestAnalysis requests={filteredRequests} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Report;