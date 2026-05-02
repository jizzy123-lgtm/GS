import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";

const maintenanceTypeMap = {
  1: "Janitorial",
  2: "Carpentry",
  3: "Electrical",
  4: "Air-Conditioning",
};

const roleMap = {
  1: "Admin",
  2: "Head",
  3: "Staff",
  4: "User",
};

const ViewMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [requestDetails, setRequestDetails] = useState({});
  const [userNames, setUserNames] = useState({});
  const [currentUser, setCurrentUser] = useState({ id: "", full_name: "", role: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  const fetchUserInfoById = async (userId, authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/fullname`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user details");
      return data.full_name || "Unknown User";
    } catch (err) {
      console.error("Error fetching user details:", err);
      return "Unknown User";
    }
  };

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/userWithRole`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch current user");

      setCurrentUser({
        id: data.id,
        full_name: data.full_name,
        role: data.role_id,
      });
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
      fetchCurrentUser(authToken);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Invalid request ID");
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");

        const request = data.data || data;
        setRequestDetails(request);

        const approvalFields = ["verified_by", "approved_by_1", "approved_by_2"];
        const namesMap = {};

        await Promise.all(
          approvalFields.map(async (field) => {
            const userId = request[field];
            if (userId) {
              const name = await fetchUserInfoById(userId, token);
              namesMap[field] = name;
            }
          })
        );

        setUserNames(namesMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchData();
  }, [id, token, API_BASE_URL]);

  const filteredEntries = Object.entries(requestDetails).filter(
    ([key]) => key !== "created_at" && key !== "updated_at"
  );
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>
        <div className="hidden md:block text-xl font-bold text-white">
          {roleMap[currentUser.role] || "Unknown Role"}
        </div>
      </header>
  
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white p-3 md:p-4 lg:p-5 shadow-lg rounded-lg w-full max-w-sm md:max-w-md lg:max-w-xl transition-all duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
              Maintenance Request <br className="hidden sm:block" />
              </h2>

  
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
  
              <div className="space-y-4 md:space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <>
                    {filteredEntries.map(([key, value]) => {
                      let displayValue = value;
                      let displayLabel = key.replace(/_/g, " ").toUpperCase(); // default
  
                      if (key === "maintenance_type_id") {
                        displayValue = maintenanceTypeMap[value] || `Unknown Type (${value})`;
                        displayLabel = "MAINTENANCE TYPE";
                      } else if (["verified_by", "approved_by_1", "approved_by_2"].includes(key)) {
                        displayValue = userNames[key] || "N/A";
  
                        // Custom labels
                        if (key === "verified_by") displayLabel = "VERIFIED BY";
                        else if (key === "approved_by_1") displayLabel = "APPROVED BY 1ST HEAD";
                        else if (key === "approved_by_2") displayLabel = "APPROVED BY 2ND HEAD";
                      }
  
                      return (
                        <div key={key}>
                          <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                            {displayLabel}:
                          </label>
                          <p className="border border-gray-300 rounded-lg px-4 py-2 md:py-3 bg-gray-100">
                            {displayValue || "N/A"}
                          </p>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
  
              {/* Back Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between mt-6">
                <button
                  type="button"
                  className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  onClick={() => navigate("/maintenance")}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewMaintenanceRequestForm;
