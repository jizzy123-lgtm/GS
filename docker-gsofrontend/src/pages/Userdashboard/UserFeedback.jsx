import { useState, useEffect, useReducer, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar, MENU_ITEMS } from "../../components/Sidebar";

// --- Header component (copied from Dashboard.jsx) ---
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

const Header = ({ 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  onCloseMobileMenu,
  userTitle = "User"
}) => {
  const mobileMenuRef = useRef(null);
  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex justify-between items-center relative shadow-lg">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        ManageIT
      </span>
      <div className="hidden md:block text-xl font-semibold text-white">
        {userTitle}
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <button 
          onClick={onToggleMobileMenu}
          className="p-2 hover:bg-slate-700 rounded-lg border-2 border-white/20 transition-all duration-200 hover:border-white/40"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl z-30 transition-all duration-300 ease-out overflow-hidden border border-slate-700/50 ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {MENU_ITEMS.map((item) => (
            <a
              key={item.text}
              href={item.to}
              className="flex items-center px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors"
              onClick={onCloseMobileMenu}
            >
              {item.icon && <span className="w-5 h-5 mr-3">{/* icon here if needed */}</span>}
              {item.text}
            </a>
          ))}
        </nav>
        <div className="text-center py-2 text-xs text-slate-400 border-t border-slate-700">
          Created By Bantilan & Friends
        </div>
      </div>
    </header>
  );
};

// --- Sidebar reducer logic (copied from Dashboard.jsx) ---
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UserFeedback = () => {
  // --- Sidebar/menu state ---
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });

  const [formData, setFormData] = useState({
    maintenance_request_id: "",
    client_type: "",
    service_type: "",
    date: "",
    sex: "",
    age: "",
    region: "",
    office_visited: "",
    service_availed: "",
    cc1: "",
    cc2: "",
    cc3: "",
    sqd: Array(9).fill(""),
    suggestions: "",
    email: "",
  });

  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const [requestDate, setRequestDate] = useState("");
  const [isRequestDateLoading, setIsRequestDateLoading] = useState(false);
  const [formError, setFormError] = useState(""); // Add this for error display

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      alert("You are not logged in.");
    } else {
      setToken(authToken);
    }
    if (id) {
      setFormData((prev) => ({ ...prev, maintenance_request_id: id }));
      setIsRequestDateLoading(true);
      fetch(`${API_BASE_URL}/maintenance-requests/${id}/request-date`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch request date");
          return res.json();
        })
        .then((data) => {
          if (data && data.request_date) {
            setRequestDate(data.request_date);
          }
        })
        .catch((err) => {
          console.error("Error fetching request date:", err);
        })
        .finally(() => {
          setIsRequestDateLoading(false);
        });
    }
  }, [id]);

  const handleInput = (e) => {
    setFormError(""); // Clear error on input
    const { name, value } = e.target;
    if (name.startsWith("sqd")) {
      const index = parseInt(name.slice(3));
      setFormData((prev) => {
        const updated = [...prev.sqd];
        updated[index] = value;
        return { ...prev, sqd: updated };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); // Clear previous errors

    if (isRequestDateLoading) {
      setFormError("Please wait, loading request date...");
      return;
    }
    if (!requestDate) {
      setFormError("Request date not loaded. Please try again later.");
      return;
    }
    if (!formData.client_type) {
      setFormError("Please select a client type.");
      return;
    }
    if (!formData.service_type) {
      setFormError("Please select a service type.");
      return;
    }
    if (!formData.date) {
      setFormError("Please select the date.");
      return;
    }
    if (!formData.sex) {
      setFormError("Please select your sex.");
      return;
    }
    if (!formData.age) {
      setFormError("Please enter your age.");
      return;
    }
    if (!formData.region) {
      setFormError("Please enter your region.");
      return;
    }
    if (!formData.office_visited) {
      setFormError("Please enter the office visited.");
      return;
    }
    if (!formData.service_availed) {
      setFormError("Please enter the service availed.");
      return;
    }
    if (!formData.cc1) {
      setFormError("Please answer the Citizen's Charter awareness question.");
      return;
    }
    if (!formData.cc2) {
      setFormError("Please answer the Citizen's Charter visibility question.");
      return;
    }
    if (!formData.cc3) {
      setFormError("Please answer the Citizen's Charter helpfulness question.");
      return;
    }
    // Check all Service Quality Dimensions
    for (let i = 0; i < 9; i++) {
      if (!formData.sqd[i]) {
        setFormError(`Please rate: "${sqdLabels[i]}"`);
        return;
      }
    }

    setIsSubmitting(true);

    if (!token) {
      setFormError("You are not logged in.");
      setIsSubmitting(false);
      return;
    }

    const cc1Options = {
      "1. I know what a CC is and I saw this office's CC.": 1,
      "2. I know what a CC is but I did NOT see this office's CC.": 2,
      "3. I know the CC only when I saw this office's CC.": 3,
      "4. I do not know what a CC is and I did not see one in this office.": 4,
    };

    const cc2Map = {
      "Easy to see": 1,
      "Somewhat visible": 2,
      "Not visible at all": 3,
      "N/A": 4,
    };

    const cc3Map = {
      "Helped very much": 1,
      "Somewhat helped": 2,
      "Did not help": 3,
      "N/A": 4,
    };

    // Convert ratings to integer (1-5), N/A as 0 or null
    const ratingToInt = (val) => {
      if (val === "N/A" || val === "" || val == null) return null;
      return parseInt(val, 10);
    };

    const payload = {
      maintenance_request_id: formData.maintenance_request_id,
      client_type: formData.client_type,
      service_type: formData.service_type,
      request_date: requestDate, // Use fetched request_date
      date: formData.date, // User input
      sex: formData.sex,
      region: formData.region || null,
      age: formData.age ? parseInt(formData.age, 10) : null,
      office_visited: formData.office_visited,
      service_availed: formData.service_availed,
      cc1: cc1Options[formData.cc1] ?? null,
      cc2: cc2Map[formData.cc2] ?? null,
      cc3: cc3Map[formData.cc3] ?? null,
      sqd0: ratingToInt(formData.sqd[0]),
      sqd1: ratingToInt(formData.sqd[1]),
      sqd2: ratingToInt(formData.sqd[2]),
      sqd3: ratingToInt(formData.sqd[3]),
      sqd4: ratingToInt(formData.sqd[4]),
      sqd5: ratingToInt(formData.sqd[5]),
      sqd6: ratingToInt(formData.sqd[6]),
      sqd7: ratingToInt(formData.sqd[7]),
      sqd8: ratingToInt(formData.sqd[8]),
      suggestions: formData.suggestions || null,
      email: formData.email || null,
    };

    // Log the payload before sending
    console.log("Submitting feedback payload:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `Failed to submit feedback. Server responded with status ${response.status}.`;
        try {
          const errorJson = await response.json();
          if (errorJson && errorJson.message) errorMsg = errorJson.message;
        } catch {
          // fallback to text if not JSON
          const errorText = await response.text();
          if (errorText) errorMsg = errorText;
        }
        setFormError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      setSubmitted(true);
      navigate("/requeststatus");

    } catch (error) {
      setFormError("There was an error submitting your feedback. Please try again.");
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ccOptions = [
    "1. I know what a CC is and I saw this office's CC.",
    "2. I know what a CC is but I did NOT see this office's CC.",
    "3. I know the CC only when I saw this office's CC.",
    "4. I do not know what a CC is and I did not see one in this office.",
  ];

  const sqdLabels = [
    "I am satisfied with the service that I availed.",
    "I spent a reasonable amount of time for my transaction.",
    "The office followed the transaction's requirements and steps based on the information provided.",
    "The steps (including payment) I needed to do for my transaction were easy and simple.",
    "I easily found information about my transaction from the office or its website.",
    "I paid a reasonable amount of fees for my transaction.",
    "I felt the office was fair to everyone, or 'walang palakasan', during my transaction.",
    "I was treated courteously by the staff, and (if asked for help) the staff was helpful.",
    "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.",
  ];

  const ratings = ["5", "4", "3", "2", "1", "N/A"];

  // Conditional rendering for the thank you message
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-green-100">Your feedback has been submitted successfully</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-slate-600 mb-6">We appreciate your valuable input and will use it to improve our services.</p>
            <button
              onClick={() => navigate("/requeststatus")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      if (!token) throw new Error("No token found");
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        mode: "cors",
      });
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      navigate("/loginpage", { replace: true });
    } catch (err) {
      console.error(err.message || "An error occurred during logout");
    }
  };

  // --- Main layout ---
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        userTitle="User"
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                  Client Satisfaction Measurement
                </h1>
                <p className="text-blue-200 text-sm mt-1 italic">
                  Help us serve you better!
                </p>
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 space-y-6">
                {/* Error Message */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start shadow-sm">
                    <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-semibold">Error</h3>
                      <p className="mt-1">{formError}</p>
                    </div>
                  </div>
                )}
                {/* Client Information Section */}
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">Client Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Client Type</label>
                      <select 
                        name="client_type" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select client type</option>
                        <option value="Citizen">Citizen</option>
                        <option value="Business">Business</option>
                        <option value="Government">Government</option>
                      </select>
                    </div>
                    {/* Maintenance Date Requested (request_date) */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Maintenance Date Requested</label>
                      <input
                        type="text"
                        value={requestDate ? requestDate : (isRequestDateLoading ? "Loading..." : "Not available")}
                        readOnly
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700 focus:ring-0 focus:border-slate-300 cursor-not-allowed"
                        placeholder="Maintenance date requested"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Service Type</label>
                      <select 
                        name="service_type" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select service type</option>
                        <option value="Internal">Internal</option>
                        <option value="External">External</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Date</label>
                      <input 
                        type="date" 
                        name="date" 
                        onChange={handleInput} 
                        value={formData.date}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Select date"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Sex</label>
                      <select 
                        name="sex" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Age</label>
                      <input 
                        name="age" 
                        type="number" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="Enter age"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Region</label>
                      <input 
                        name="region" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="Enter region"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Office Visited</label>
                      <input 
                        name="office_visited" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="Enter office visited"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Service Availed</label>
                      <input 
                        name="service_availed" 
                        onChange={handleInput} 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="Enter service availed"
                      />
                    </div>
                  </div>
                </div>

                {/* Citizen's Charter Section */}
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">Citizen's Charter (CC) Assessment</h3>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 text-sm mb-2">CC1: Awareness of Citizen's Charter</h4>
                      <div className="space-y-2">
                        {ccOptions.map((opt, i) => (
                          <label key={i} className="flex items-start space-x-2 p-2 rounded-md hover:bg-white transition-colors duration-200 cursor-pointer">
                            <input
                              type="radio"
                              name="cc1"
                              value={opt}
                              onChange={handleInput}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                              checked={formData.cc1 === opt}
                            />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 text-sm">CC2: How visible was the CC?</label>
                        <select 
                          name="cc2" 
                          onChange={handleInput} 
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select visibility</option>
                          <option value="Easy to see">Easy to see</option>
                          <option value="Somewhat visible">Somewhat visible</option>
                          <option value="Not visible at all">Not visible at all</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 text-sm">CC3: How much did it help?</label>
                        <select 
                          name="cc3" 
                          onChange={handleInput} 
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select helpfulness</option>
                          <option value="Helped very much">Helped very much</option>
                          <option value="Somewhat helped">Somewhat helped</option>
                          <option value="Did not help">Did not help</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Quality Dimensions */}
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-1">Service Quality Dimensions</h3>
                    <p className="text-sm text-slate-600">Please rate each statement based on your experience</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-7 gap-2 mb-3 text-center">
                        <div className="font-medium text-slate-700 text-left text-sm">Statement</div>
                        {ratings.map((rating, i) => (
                          <div key={i} className="font-medium text-slate-700 text-xs">
                            {rating === "N/A" ? "N/A" : `${rating}`}
                          </div>
                        ))}
                      </div>
                      
                      {sqdLabels.map((label, i) => (
                        <div key={i} className="grid grid-cols-7 gap-2 py-2 border-b border-slate-200 last:border-b-0 items-center">
                          <div className="text-sm text-slate-700 pr-2">{label}</div>
                          {ratings.map((rating, j) => (
                            <div key={j} className="flex justify-center">
                              <input
                                type="radio"
                                name={`sqd${i}`}
                                value={rating}
                                checked={formData.sqd[i] === rating}
                                onChange={handleInput}
                                className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">Additional Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block font-medium text-slate-700 text-sm">Suggestions for Improvement</label>
                      <textarea
                        name="suggestions"
                        value={formData.suggestions}
                        onChange={handleInput}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        rows="3"
                        placeholder="Please share any suggestions or comments to help us improve our services..."
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block font-medium text-slate-700 text-sm">Email Address (Optional)</label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInput}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="your.email@example.com"
                      />
                      <p className="text-xs text-slate-500">We may use this to follow up on your feedback</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserFeedback;