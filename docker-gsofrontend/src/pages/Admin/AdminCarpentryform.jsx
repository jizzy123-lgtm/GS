import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AdminCarpentryform = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // State for form inputs
  const [date_requested, setDateRequested] = useState("");
  const [details, setSpecificDetails] = useState("");
  const [requesting_personnel, setRequestingPersonnel] = useState("");
  const [position, setPosition] = useState("");
  const [requesting_office, setRequestingOffice] = useState("");
  const [contact_number, setContactNumber] = useState("");
  const [date_received, setDateReceived] = useState("");
  const [time_received, setTimeReceived] = useState("");
  const [priority_number, setPriorityNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [approved_by_1, setVerifiedByName] = useState("");
  const [approved_by_2, setVerifiedByPosition] = useState("");

  // State for handling errors and loading
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for success message
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch request details when component mounts
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch request details");
        }

        const data = await response.json();
        const requestDetails = data.data;

        if (!requestDetails) {
          throw new Error("Request details not found");
        }

        setDateRequested(requestDetails.date_requested || "");
        setSpecificDetails(requestDetails.details || "");
        setRequestingPersonnel(requestDetails.requesting_personnel || "");
        setPosition(requestDetails.position || "");
        setRequestingOffice(requestDetails.requesting_office || "");
        setContactNumber(requestDetails.contact_number || "");
        setDateReceived(requestDetails.date_received || "");
        setTimeReceived(requestDetails.time_received || "");
        setPriorityNumber(requestDetails.priority_number || "");
        setRemarks(requestDetails.remarks || "");
        setVerifiedByName(requestDetails.verified_by_name || "");
        setVerifiedByPosition(requestDetails.verified_by_position || "");
      } catch (error) {
        console.error("Error fetching request details:", error);
        setError(error.message);
      }
    };

    fetchRequestDetails();
  }, [id, token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!date_requested || !details || !requesting_personnel || !position || 
        !requesting_office || !contact_number || !date_received || !time_received || 
        !priority_number || !remarks || !approved_by_1 || !approve_by_2) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      // Make API request to your backend
      const response = await fetch(`${API_BASE_URL}/maintenance-requests/${id}/review`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          date_requested,
          details,
          requesting_personnel,
          position,
          requesting_office,
          contact_number,
          date_received,
          time_received,
          priority_number,
          remarks,
          approved_by: `${approved_by_1} - ${approved_by_2}`
        }),
        mode: 'cors'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request submission failed");
      }

      // Show success message
      setSuccessMessage("Request submitted successfully!");

      // Navigate back to maintenance page after a short delay
      setTimeout(() => {
        navigate('/adminmaintenance');
      }, 3000); // 3 seconds delay

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
        <p className="text-sm md:text-base text-center mb-6 md:mb-8">
          User Request Slip (Carpentry Section) <br className="hidden sm:block" />
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 text-green-500 p-3 rounded-lg mb-4 text-sm">
            {successMessage}
          </div>
        )}

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          {/* Date Requested */}
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

          {/* Specific Details */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Specific Details (Situations/Condition/Circumstances):
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              rows="3"
              value={details}
              onChange={(e) => setSpecificDetails(e.target.value)}
            ></textarea>
          </div>

          {/* Requesting Personnel */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Requesting Personnel (Fullname):
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={requesting_personnel}
              onChange={(e) => setRequestingPersonnel(e.target.value)}
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Position:
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          {/* Requesting Office */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Requesting Office (College/Department/Unit):
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={requesting_office}
              onChange={(e) => setRequestingOffice(e.target.value)}
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Contact Number:
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={contact_number}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>

          {/* Date Received */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Date Received:
            </label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={date_received}
              onChange={(e) => setDateReceived(e.target.value)}
            />
          </div>

          {/* Time Received */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Time Received:
            </label>
            <input 
              type="time" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={time_received}
              onChange={(e) => setTimeReceived(e.target.value)}
            />
          </div>

          {/* Priority Number */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Priority Number:
            </label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={priority_number}
              onChange={(e) => setPriorityNumber(e.target.value)}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Remarks:
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            ></textarea>
          </div>

          {/* Verified By */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Verified By (Head):
              </label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={approved_by_1}
                onChange={(e) => setVerifiedByName(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Verified By (Head):
              </label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={approved_by_2}
                onChange={(e) => setVerifiedByPosition(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <button 
              type="button" 
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
              onClick={() => navigate('/adminmaintenance')}
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
      </div>
    </div>
  );
};

export default AdminCarpentryform;