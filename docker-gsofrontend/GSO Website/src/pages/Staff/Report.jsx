import React from "react"; // Add this line
import { useState, useReducer, useEffect, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
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

const MENU_ITEMS = [
  { text: "Dashboard", to: "/staffdashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "Notifications", to: "/adminnotifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { text: "Schedules", to: "/adminschedules", icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01" },
  { text: "User Requests", to: "/userrequests", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"},
  { text: "Requests", to: "/StaffSlipRequests", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 1 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01"},
  { text: "Reports", to: "/report", icon: "M13 17V9 M18 17V5 M3 3v16a2 2 0 0 0 2 2h16 M8 17v-3"},
  { text: "Settings", to: "/settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  { text: "Logout", to: "/loginpage", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }
];

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
  
  const users = analyzeUserRequests();
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalRequests');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState("chart");

  // Filter and sort users
  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.office.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
  
  const chartData = prepareChartData();
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 Users by Request Status (Click on a bar to see user requests)',
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
  const userRequests = selectedUser 
    ? requests.filter(req => req.requesting_personnel === selectedUser.name)
    : [];

  // Clear selected user when returning to chart view
  const handleViewModeChange = (mode) => {
    if (mode === 'chart') {
      setSelectedUser(null);
    }
    setViewMode(mode);
  };

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
      
      {/* Search and filters */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users or offices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg w-full p-2"
        />
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
  const [selectedTab, setSelectedTab] = useState("Pending");
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
        <Sidebar
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