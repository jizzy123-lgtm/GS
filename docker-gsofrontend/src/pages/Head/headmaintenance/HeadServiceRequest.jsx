import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const HeadServiceRequest = () => {
  const navigate = useNavigate();
  const { typeId } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [date_requested, setDateRequested] = useState("");
  const [details, setSpecificDetails] = useState("");
  const [requesting_personnel, setRequestingPersonnel] = useState("");
  const [position, setPosition] = useState("");
  const [requesting_office, setRequestingOffice] = useState("");
  const [contact_number, setContactNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUserDetails, setIsFetchingUserDetails] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [token, setToken] = useState("");
  const [serviceName, setServiceName] = useState("Service");

  // Store IDs for submission
  const [userIds, setUserIds] = useState({
    user_id: "",
    position_id: "",
    office_id: "",
  });

  const fetchServiceDetails = useCallback(async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/maintenance-types/${typeId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServiceName(data.type_name);
      }
    } catch (err) { console.error(err); }
  }, [typeId, API_BASE_URL]);

  useEffect(() => {
    const authToken =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      setError("Unauthorized: Please log in.");
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }
    setToken(authToken);
    fetchServiceDetails(authToken);

    const fetchUserDetails = async () => {
      try {
        setIsFetchingUserDetails(true);
        const response = await fetch(`${API_BASE_URL}/users/reqInfo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch user details");

        const fullName = [
          data.first_name,
          data.middle_name,
          data.last_name,
          data.suffix,
        ]
          .filter(Boolean)
          .join(" ");

        const positionName = data.position_id?.name || "";
        const officeName = data.office_id?.name || "";

        setUserIds({
          user_id: data.user_id || "",
          position_id: data.position_id?.id || "",
          office_id: data.office_id?.id || "",
        });

        setRequestingPersonnel(fullName);
        setPosition(positionName);
        setRequestingOffice(officeName);
        setContactNumber(data.contact_number || "");
      } catch (err) {
        setError(err.message || "Failed to fetch user details");
      } finally {
        setIsFetchingUserDetails(false);
      }
    };

    fetchUserDetails();
  }, [API_BASE_URL, navigate, fetchServiceDetails]);

  useEffect(() => {
    if (!date_requested) {
      setDateRequested(new Date().toISOString().split("T")[0]);
    }
  }, [date_requested]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Unauthorized: Please log in.");
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }
    if (!date_requested || !details) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        date_requested,
        details,
        contact_number,
        requesting_personnel: parseInt(userIds.user_id, 10),
        position_id: parseInt(userIds.position_id, 10),
        requesting_office: parseInt(userIds.office_id, 10),
        maintenance_type_id: parseInt(typeId, 10),
      };

      const response = await fetch(`${API_BASE_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Request submission failed");
      }

      setSuccessMessage("Request submitted successfully!");
      setTimeout(() => navigate("/headmaintenance"), 2000);
    } catch (err) {
      setError(err.message || "An error occurred during request submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 md:p-8 lg:p-10 shadow-lg rounded-lg w-full max-w-md md:max-w-xl lg:max-w-2xl transition-all duration-300">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY <br className="hidden sm:block" />
          GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
        </h2>
        <p className="text-sm md:text-base text-center mb-6 md:mb-8 font-medium text-gray-500">
          Maintenance Request Slip ({serviceName} Section)
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-6 text-red-700 font-bold animate-pulse">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl mb-6 text-green-700 font-bold">
            {successMessage}
          </div>
        )}

        {isFetchingUserDetails ? (
          <p className="text-center text-gray-500">Loading user details...</p>
        ) : (
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Date Requested:
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={date_requested}
                onChange={(e) => setDateRequested(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Specific Details (Situations/Condition/Circumstances):
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows="3"
                value={details}
                onChange={(e) => setSpecificDetails(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Requesting Personnel (Fullname):
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 md:py-3 transition-all"
                value={requesting_personnel}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Position:
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 md:py-3 transition-all"
                value={position}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Requesting Office (College/Department/Unit):
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 md:py-3 transition-all"
                value={requesting_office}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Contact Number:
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 md:py-3 transition-all"
                value={contact_number}
                disabled
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
              <button
                type="button"
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
                onClick={() => navigate("/headmaintenance")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HeadServiceRequest;