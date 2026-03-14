import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StaffSidebar } from "../../components/StaffSidebar"; 

// Reducer for sidebar state management
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, isSidebarCollapsed: action.payload };
    default:
      return state;
  }
};

const FeedbackReview = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // id here is the feedback id
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [feedbackDetails, setFeedbackDetails] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [sidebarState, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true, 
    isMobileMenuOpen: false,
  });

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Invalid maintenance request ID");
        return;
      }
      try {
        setIsLoading(true);
        // Fetch feedback(s) for this maintenance request
        const response = await fetch(`${API_BASE_URL}/feedbacks/request/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        // If only one feedback per request:
        const feedback = Array.isArray(data)
          ? data[0]
          : Array.isArray(data.data)
            ? data.data[0]
            : data.data || data;
        if (!feedback) throw new Error("Feedback not found for this request");
        setFeedbackDetails(feedback);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchData();
  }, [id, token, API_BASE_URL]);

  // List of fields to display and their labels with better organization
  const fieldsToDisplay = [
    { key: "date", label: "Feedback Date", category: "basic" },
    { key: "request_date", label: "Request Date", category: "basic" },
    { key: "maintenance_request_id", label: "Maintenance Request ID", category: "basic" },
    { key: "client_type", label: "Client Type", category: "client" },
    { key: "sex", label: "Gender", category: "client" },
    { key: "age", label: "Age", category: "client" },
    { key: "region", label: "Region", category: "client" },
    { key: "email", label: "Email", category: "client" },
    { key: "service_type", label: "Service Type", category: "service" },
    { key: "office_visited", label: "Office Visited", category: "service" },
    { key: "service_availed", label: "Service Availed", category: "service" },
    { key: "cc1", label: "CC1 Rating", category: "ratings" },
    { key: "cc2", label: "CC2 Rating", category: "ratings" },
    { key: "cc3", label: "CC3 Rating", category: "ratings" },
    { key: "sqd0", label: "SQD0 Rating", category: "ratings" },
    { key: "sqd1", label: "SQD1 Rating", category: "ratings" },
    { key: "sqd2", label: "SQD2 Rating", category: "ratings" },
    { key: "sqd3", label: "SQD3 Rating", category: "ratings" },
    { key: "sqd4", label: "SQD4 Rating", category: "ratings" },
    { key: "sqd5", label: "SQD5 Rating", category: "ratings" },
    { key: "sqd6", label: "SQD6 Rating", category: "ratings" },
    { key: "sqd7", label: "SQD7 Rating", category: "ratings" },
    { key: "sqd8", label: "SQD8 Rating", category: "ratings" },
    { key: "suggestions", label: "Suggestions", category: "feedback" },
  ];

  const getClientTypeColor = (clientType) => {
    if (!clientType) return "bg-gray-100 text-gray-600";
    const typeLower = clientType.toLowerCase();
    if (typeLower.includes("student")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (typeLower.includes("faculty")) return "bg-green-100 text-green-800 border-green-200";
    if (typeLower.includes("staff")) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getRatingColor = (rating) => {
    if (!rating) return "bg-gray-100 text-gray-600";
    const ratingNum = parseInt(rating);
    if (ratingNum >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (ratingNum >= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const formatFieldValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "N/A";

    if (key === "client_type") {
      return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getClientTypeColor(value)}`}>
          {value}
        </span>
      );
    }

    if (key.startsWith("cc") || key.startsWith("sqd")) {
      return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRatingColor(value)}`}>
          {value}/5
        </span>
      );
    }

    if (key === "suggestions") {
      return <div className="whitespace-pre-wrap break-words">{value}</div>;
    }

    if (key === "maintenance_request_id") {
      return `#${value}`;
    }

    return value;
  };

  const calculateAverageRating = () => {
    if (!feedbackDetails) return 0;
    const ratingFields = ['cc1', 'cc2', 'cc3', 'sqd0', 'sqd1', 'sqd2', 'sqd3', 'sqd4', 'sqd5', 'sqd6', 'sqd7', 'sqd8'];
    const ratings = ratingFields.map(field => parseInt(feedbackDetails[field]) || 0);
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-lg border-b border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-xl md:text-2xl font-extrabold">ManageIT</span>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="hidden md:block text-xl font-bold">Staff</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Staff Sidebar */}
        <StaffSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        />

        <main className="flex-1 overflow-auto">
          <div className="min-h-full p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      Feedback Details
                    </h1>
                    <p className="text-slate-600">
                      Feedback ID: <span className="font-semibold text-slate-900">#{id}</span>
                    </p>
                  </div>
                  {/* Average Rating Display */}
                  {feedbackDetails && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {calculateAverageRating()}/5
                      </div>
                      <div className="text-sm text-slate-600">Average Rating</div>
                    </div>
                  )}           
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start shadow-sm">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold">Error</h3>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-4 text-slate-600 font-medium">Loading feedback details...</p>
                </div>
              )}

              {/* Feedback Details */}
              {!isLoading && feedbackDetails && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {fieldsToDisplay.map(({ key, label, category }) => (
                      <div
                        key={key}
                        className={`space-y-2 ${key === 'suggestions' ? 'lg:col-span-2' : ''}`}
                      >
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          {label}
                        </label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
                          <div className="text-slate-900 w-full">
                            {formatFieldValue(key, feedbackDetails[key])}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                      <div className="text-sm text-slate-500">
                        Created: {feedbackDetails.created_at ? new Date(feedbackDetails.created_at).toLocaleDateString() : 'N/A'}
                        {feedbackDetails.updated_at && feedbackDetails.updated_at !== feedbackDetails.created_at && (
                          <span> • Updated: {new Date(feedbackDetails.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-5 py-2 rounded-lg transition"
                          onClick={() => navigate('/Report')}
                        >
                          Back to Feedbacks
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FeedbackReview;