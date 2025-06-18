import { useState, useEffect, useReducer, useRef } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import Icon from "../../components/Icon";
import { StaffSidebar, MENU_ITEMS } from "../../components/StaffSidebar"; 

// Reducer for sidebar and mobile menu state
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const StaffMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isMobileMenuOpen: false,
  });
  const mobileMenuRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // State for reference data
  const [offices, setOffices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);

  // State for request details
  const [requestDetails, setRequestDetails] = useState({});
  const [enhancedRequestDetails, setEnhancedRequestDetails] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState("");

  // State for PUT method inputs
  const [date_received, setDateReceived] = useState("");
  const [time_received, setTimeReceived] = useState("");
  const [priority_number, setPriorityNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [verifiedByName, setVerifiedByName] = useState("");
  const [verifiedById, setVerifiedById] = useState("");

  const [currentUser, setCurrentUser] = useState({ id: "", full_name: "" });
  const [isGeneratingPriority, setIsGeneratingPriority] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        dispatch({ type: "CLOSE_MOBILE_MENU" });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Retrieve token from storage
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  // Function to fetch user name parts by ID
  const fetchUserNameParts = async (userId) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/fullname`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch user data: ${res.status}`);
    }

    const userData = await res.json();

    // Expecting userData to have last_name, first_name, middle_name, suffix
    if (
      userData &&
      (userData.last_name || userData.first_name)
    ) {
      return {
        last_name: userData.last_name || "",
        first_name: userData.first_name || "",
        middle_name: userData.middle_name || "",
        suffix: userData.suffix || "",
      };
    } else if (userData.data) {
      // Fallback for different format
      const d = userData.data;
      return {
        last_name: d.last_name || "",
        first_name: d.first_name || "",
        middle_name: d.middle_name || "",
        suffix: d.suffix || "",
      };
    } else {
      // Generic fallback
      return {
        last_name: "",
        first_name: `User ${userId}`,
        middle_name: "",
        suffix: "",
      };
    }
  };

  // Generate priority number using backend API
  const generatePriorityNumberFromAPI = async (maintenanceTypeId) => {
    if (!maintenanceTypeId) return "";
    try {
      setIsGeneratingPriority(true);
      const res = await fetch(`${API_BASE_URL}/generate-priority-number/${maintenanceTypeId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.priority_number) {
        return data.priority_number;
      }
      throw new Error(data.message || "Failed to generate priority number");
    } catch (err) {
      console.error("Error generating priority number from API:", err);
      setError("Failed to generate priority number");
      return "";
    } finally {
      setIsGeneratingPriority(false);
    }
  };

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!token) return;

      try {
        // Fetch statuses
        const statusesRes = await fetch(`${API_BASE_URL}/statuses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusesData = await statusesRes.json();
        console.log("Statuses API Response:", statusesData);
        setStatuses(Array.isArray(statusesData.data) ? statusesData.data : 
                   Array.isArray(statusesData) ? statusesData : []);

        // Fetch offices
        const officesRes = await fetch(`${API_BASE_URL}/offices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const officesData = await officesRes.json();
        console.log("Offices API Response:", officesData);
        setOffices(Array.isArray(officesData.data) ? officesData.data : 
                  Array.isArray(officesData) ? officesData : []);

        // Fetch maintenance types
        const maintenanceTypesRes = await fetch(`${API_BASE_URL}/maintenance-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const maintenanceTypesData = await maintenanceTypesRes.json();
        console.log("Maintenance Types API Response:", maintenanceTypesData);
        setMaintenanceTypes(Array.isArray(maintenanceTypesData.data) ? maintenanceTypesData.data : 
                           Array.isArray(maintenanceTypesData) ? maintenanceTypesData : []);

        // Fetch positions
        const positionsRes = await fetch(`${API_BASE_URL}/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const positionsData = await positionsRes.json();
        console.log("Positions API Response:", positionsData);
        setPositions(Array.isArray(positionsData.data) ? positionsData.data : 
                    Array.isArray(positionsData) ? positionsData : []);
      } catch (err) {
        console.error("Error fetching reference data:", err);
        setError("Failed to load reference data. Please refresh the page.");
      }
    };

    fetchReferenceData();
  }, [token, API_BASE_URL]);

  // Fetch the user's full name and ID
  const fetchUserInfo = async (authToken) => {
    try {
      console.log("Fetching current user info from:", `${API_BASE_URL}/users/idfullname`);
      const response = await fetch(`${API_BASE_URL}/users/idfullname`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Accept": "application/json",
        },
      });
      const data = await response.json();
      console.log("Fetched user info response:", data);
      if (!response.ok) throw new Error(data.message || "Failed to fetch user details");
      // Return all name parts and user_id
      return {
        id: data.user_id || null,
        last_name: data.last_name || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        suffix: data.suffix || "",
      };
    } catch (err) {
      console.error("Error fetching user details:", err);
      return { id: null, last_name: "", first_name: "", middle_name: "", suffix: "" };
    }
  };

  // Enhanced function to find reference data by ID
  const findReferenceData = (dataArray, id, fallbackName = "Unknown") => {
    if (!Array.isArray(dataArray) || !id) return fallbackName;
    
    const item = dataArray.find(item => {
      // Handle different possible ID field names
      return item.id === id || item.status_id === id || item.type_id === id || 
             item.office_id === id || item.position_id === id;
    });
    
    if (!item) return `${fallbackName} (ID: ${id})`;
    
    // Handle different possible name field names
    return item.name || item.type_name || item.status_name || 
           item.office_name || item.position_name || `${fallbackName} (ID: ${id})`;
  };

  // Enhance request details with reference data
  const enhanceRequestDetails = async (request) => {
    try {
      console.log("Request to enhance:", request);
      console.log("Available statuses:", statuses);
      console.log("Available maintenance types:", maintenanceTypes);
      console.log("Available offices:", offices);
      console.log("Available positions:", positions);

      // Find office name
      const office_name = findReferenceData(offices, request.requesting_office, "Unknown Office");
      
      // Find maintenance type name
      const maintenance_type_name = findReferenceData(maintenanceTypes, request.maintenance_type_id, "Unknown Type");
      
      // Find status name
      const status_name = findReferenceData(statuses, request.status_id, "Unknown Status");
      
      // Find position name
      const position_name = findReferenceData(positions, request.position_id, "Unknown Position");
      
      // Fetch personnel name parts
      const personnelNameParts = await fetchUserNameParts(request.requesting_personnel);

      // Create enhanced request object
      const enhanced = {
        ...request,
        office_name,
        maintenance_type_name,
        status_name,
        position_name,
        personnel_last_name: personnelNameParts.last_name,
        personnel_first_name: personnelNameParts.first_name,
        personnel_middle_name: personnelNameParts.middle_name,
        personnel_suffix: personnelNameParts.suffix,
      };
      
      console.log("Enhanced request:", enhanced);
      return enhanced;
    } catch (err) {
      console.error("Error enhancing request details:", err);
      return {
        ...request,
        office_name: "Error loading office",
        maintenance_type_name: "Error loading type",
        status_name: "Error loading status",
        position_name: "Error loading position",
        personnel_fullname: "Error loading personnel"
      };
    }
  };

  // Fetch request details when component mounts
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id || !token) {
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/staffpov/${id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");
        
        const requestData = data.data || data;
        setRequestDetails(requestData);
        
        // Set form values immediately
        setDateReceived(requestData.date_received || new Date().toISOString().split("T")[0]);
        setTimeReceived(requestData.time_received || new Date().toTimeString().slice(0, 5));
        setRemarks(requestData.remarks || "");

        // Fetch user info (gets user_id from token)
        const userInfo = await fetchUserInfo(token);
        setVerifiedById(userInfo.id);

        if (userInfo.id) {
          // Format: Last Name, First Name M. Suffix
          let formattedName = `${userInfo.last_name}, ${userInfo.first_name}`;
          if (userInfo.middle_name) {
            formattedName += ` ${userInfo.middle_name.charAt(0)}.`;
          }
          if (userInfo.suffix) {
            formattedName += ` ${userInfo.suffix}`;
          }
          setVerifiedByName(formattedName.trim());
        } else {
          setVerifiedByName("Unknown User");
        }

        setCurrentUser(userInfo);
      } catch (err) {
        console.error("Error fetching request details:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [id, token, API_BASE_URL]);

  // Enhance request details when reference data is loaded
  useEffect(() => {
    const enhanceWhenReady = async () => {
      if (requestDetails && Object.keys(requestDetails).length > 0 && 
          statuses.length > 0 && maintenanceTypes.length > 0 && 
          offices.length > 0 && positions.length > 0) {
        try {
          const enhanced = await enhanceRequestDetails(requestDetails);
          setEnhancedRequestDetails(enhanced);
        } catch (err) {
          console.error("Error enhancing request details:", err);
        }
      }
    };

    enhanceWhenReady();
  }, [requestDetails, statuses, maintenanceTypes, offices, positions, token]);

  // Auto-generate priority number when enhanced request details are available
  useEffect(() => {
    const generatePriority = async () => {
      if (
        enhancedRequestDetails &&
        Object.keys(enhancedRequestDetails).length > 0 &&
        !priority_number &&
        enhancedRequestDetails.approved_by_2 &&
        enhancedRequestDetails.maintenance_type_id
      ) {
        try {
          const generatedCode = await generatePriorityNumberFromAPI(enhancedRequestDetails.maintenance_type_id);
          setPriorityNumber(generatedCode);
        } catch (err) {
          console.error("Error auto-generating priority code:", err);
        }
      }
    };

    generatePriority();
  }, [enhancedRequestDetails, priority_number]);

  const formatTimeTo24Hour = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`;
  };

  const [markAs, setMarkAs] = useState("");

  const handleapprove = async (e, action) => {
    e.preventDefault();
    if (action === "deny" && !remarks.trim()) {
      setError("Remarks are required to deny the request.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const formattedTime = formatTimeTo24Hour(time_received);

      // Check if approved_by_2 is NOT null or undefined
      if (
        enhancedRequestDetails &&
        (enhancedRequestDetails.approved_by_2 !== null && enhancedRequestDetails.approved_by_2 !== undefined)
      ) {
        // Use assign-priority endpoint
        const endpoint = `${API_BASE_URL}/maintenance-requests/${id}/assign-priority`;
        const payload = {
          priority_number,
          remarks,
          verified_by: verifiedById,
        };
        console.log("Submitting assign-priority payload:", payload);

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Assign priority failed");

        // After assigning priority, process "Mark as" if selected
        if (markAs === "urgent") {
          await handleMarkUrgent();
        } else if (markAs === "onhold") {
          await handleMarkOnhold();
        }

        navigate("/staffsliprequests");
        return;
      }

      // Default: verify or deny
      const endpoint =
        action === "deny"
          ? `${API_BASE_URL}/maintenance-requests/${id}/deny`
          : `${API_BASE_URL}/maintenance-requests/${id}/verify`;
      const payload = {
        date_received,
        time_received: formattedTime,
        priority_number,
        remarks,
        verified_by: verifiedById,
        ...(action === "deny" && { status: "denied" }),
      };
      console.log("Submitting payload to backend:", payload);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request submission failed");

      // After verification, process "Mark as" if selected
      if (markAs === "urgent") {
        await handleMarkUrgent();
      } else if (markAs === "onhold") {
        await handleMarkOnhold();
      }

      navigate("/staffsliprequests");
    } catch (err) {
      setError(err.message || "An error occurred during request submission");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually regenerate priority code
  const handleRegeneratePriority = async () => {
    if (
      enhancedRequestDetails &&
      Object.keys(enhancedRequestDetails).length > 0 &&
      enhancedRequestDetails.maintenance_type_id
    ) {
      try {
        const generatedCode = await generatePriorityNumberFromAPI(enhancedRequestDetails.maintenance_type_id);
        setPriorityNumber(generatedCode);
      } catch (err) {
        console.error("Error regenerating priority code:", err);
        setError("Failed to regenerate priority code");
      }
    }
  };

  // Function to get the details to display
  const getDisplayDetails = () => {
    return Object.keys(enhancedRequestDetails).length > 0 ? enhancedRequestDetails : requestDetails;
  };

  const [sidebarState, sidebarDispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "TOGGLE_SIDEBAR":
          return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
        default:
          return state;
      }
    },
    { isSidebarCollapsed: true }
  );

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    navigate("/loginpage");
  };

  // Count maintenance requests by type ID from the /forPriority endpoint
  useEffect(() => {
    if (!token || maintenanceTypes.length === 0) return;
    const fetchAndCountTypes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/forPriority`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const requests = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const typeNameCounts = {};
        requests.forEach(req => {
          const typeName = req.maintenance_type;
          if (typeName) {
            typeNameCounts[typeName] = (typeNameCounts[typeName] || 0) + 1;
          }
        });
        maintenanceTypes.forEach(type => {
          if (!(type.type_name in typeNameCounts)) {
            typeNameCounts[type.type_name] = 0;
          }
        });
        setMaintenanceTypeCounts(typeNameCounts); 
        console.log("Maintenance type counts from /forPriority:", typeNameCounts);
      } catch (err) {
        console.error("Error counting maintenance types from /forPriority:", err);
      }
    };
    fetchAndCountTypes();
  }, [token, API_BASE_URL, maintenanceTypes]);

  const [maintenanceTypeCounts, setMaintenanceTypeCounts] = useState({});

  const handleMarkUrgent = async () => {
  try {
    setIsLoading(true);
    setError("");
    const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}/mark-urgent`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ remarks }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to mark as urgent");
  } catch (err) {
    setError(err.message || "An error occurred while marking as urgent");
  } finally {
    setIsLoading(false);
  }
};

// Mark as Onhold handler
const handleMarkOnhold = async () => {
  try {
    setIsLoading(true);
    setError("");
    const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}/mark-onhold`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ remarks }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to mark as onhold");
  } catch (err) {
    setError(err.message || "An error occurred while marking as onhold");
  } finally {
    setIsLoading(false);
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
          ref={mobileMenuRef}
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
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => sidebarDispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={MENU_ITEMS}
          title="STAFF"
          onLogout={handleLogout} 
        />
        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-2xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-center mb-4">
                Maintenance Request Slip
              </h2>

              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Request Details Section */}
              {!isLoading && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Request Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Request Date:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={getDisplayDetails().date_requested ? 
                          new Date(getDisplayDetails().date_requested).toLocaleDateString() : "N/A"}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Personnel Name:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={
                          getDisplayDetails().personnel_last_name
                            ? `${getDisplayDetails().personnel_last_name}, ${getDisplayDetails().personnel_first_name}${getDisplayDetails().personnel_middle_name ? " " + getDisplayDetails().personnel_middle_name.charAt(0) + "." : ""}${getDisplayDetails().personnel_suffix ? " " + getDisplayDetails().personnel_suffix : ""}`
                            : (getDisplayDetails().requesting_personnel ? `User ID: ${getDisplayDetails().requesting_personnel}` : "N/A")
                        }
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Position:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={getDisplayDetails().position_name || 
                               (getDisplayDetails().position_id ? `Position ID: ${getDisplayDetails().position_id}` : "N/A")}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Office:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={getDisplayDetails().office_name || 
                               (getDisplayDetails().requesting_office ? `Office ID: ${getDisplayDetails().requesting_office}` : "N/A")}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Maintenance Type:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={getDisplayDetails().maintenance_type_name || 
                               (getDisplayDetails().maintenance_type_id ? `Type ID: ${getDisplayDetails().maintenance_type_id}` : "N/A")}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Status:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={getDisplayDetails().status_name || 
                               (getDisplayDetails().status_id ? `Status ID: ${getDisplayDetails().status_id}` : "N/A")}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contact Number:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={getDisplayDetails().contact_number || "N/A"}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Description:
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                      rows="4"
                      value={getDisplayDetails().details || "N/A"}
                      disabled
                    />
                  </div>
                </div>
              )}

              {/* Form Section */}
              {!isLoading && (
                <form className="space-y-4" onSubmit={(e) => handleapprove(e, "approve")}>
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Action Required</h3>
                  
                  <div>
                    <label className="block font-semibold text-gray-700">Date Received:</label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-4 py-2"
                      value={date_received}
                      onChange={(e) => setDateReceived(e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Time Received:</label>
                    <input
                      type="time"
                      className="w-full border rounded-lg px-4 py-2"
                      value={time_received}
                      onChange={(e) => setTimeReceived(e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">
                      Priority Number:
                      {isGeneratingPriority && (
                        <span className="text-sm text-blue-600 ml-2">(Generating...)</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className={`flex-1 border rounded-lg px-4 py-2 ${
                          getDisplayDetails().approved_by_2 === null || getDisplayDetails().approved_by_2 === undefined
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : ""
                        }`}
                        value={priority_number}
                        onChange={(e) => setPriorityNumber(e.target.value)}
                        disabled={getDisplayDetails().approved_by_2 === null || getDisplayDetails().approved_by_2 === undefined}
                        placeholder="Auto-generated based on request details"
                      />
                      {getDisplayDetails().approved_by_2 && (
                        <button
                          type="button"
                          onClick={handleRegeneratePriority}
                          disabled={isGeneratingPriority}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isGeneratingPriority ? "..." : "Regenerate"}
                        </button>
                      )}
                    </div>
                    {getDisplayDetails().approved_by_2 === null || getDisplayDetails().approved_by_2 === undefined ? (
                      <p className="text-sm text-gray-500 mt-1">
                        Priority number will be generated after the request is approved by the Campus Director.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700">Verified By:</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-2 bg-gray-100"
                      value={verifiedByName}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700">Remarks:</label>
                    <textarea
                      className="w-full border rounded-lg px-4 py-2"
                      rows="4"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter any remarks..."
                    />
                  </div>

                  {/* Mark as Dropdown Section */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Mark as:</label>
                    <select
                      className="w-full border rounded-lg px-4 py-2"
                      value={markAs}
                      onChange={(e) => setMarkAs(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      <option value="urgent">Urgent</option>
                      <option value="onhold">Onhold</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose a status to mark this request as Urgent or Onhold. This will be applied after verification.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {isLoading ? "Processing..." : "Verify Request"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => handleapprove(e, "deny")}
                      disabled={isLoading}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {isLoading ? "Processing..." : "Deny Request"}
                    </button>
                  </div>

                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => navigate("/staffsliprequests")}
                      className="text-gray-600 hover:text-gray-800 font-semibold underline"
                    >
                      Back to Requests
                    </button>
                  </div>
                </form>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-gray-600">Loading request details...</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffMaintenanceRequestForm;