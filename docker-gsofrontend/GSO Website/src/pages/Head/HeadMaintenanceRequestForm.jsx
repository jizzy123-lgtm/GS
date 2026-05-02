import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const HeadMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const HEAD1_ID = 8;
  const HEAD2_ID = 9;

  const roleMap = {
    1: "Admin",
    2: "Head",
    3: "Staff",
    4: "User",
  };

  const [currentUser, setCurrentUser] = useState({ id: "", full_name: "", role: "" });
  const [requestDetails, setRequestDetails] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  const [date_received, setDateReceived] = useState("");
  const [time_received, setTimeReceived] = useState("");
  const [priority_number, setPriorityNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [approvedByName, setApprovedByName] = useState("");
  const [approvedById, setApprovedById] = useState("");
  const [head1Input, setHead1Input] = useState("");
  const [head2Input, setHead2Input] = useState("");
  const [approvedBy1, setApprovedBy1] = useState(null);
  const [userNames, setUserNames] = useState({});

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

  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/idfullname`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user details");

      return {
        id: data.user_id || null,
        full_name: data.full_name || "Unknown User",
      };
    } catch (err) {
      console.error("Error fetching user details:", err);
      return { id: null, full_name: "Unknown User" };
    }
  };

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

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) {
        setError("Invalid request ID");
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/headpov/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");

        const responseData = data.data || data;
        setRequestDetails(responseData);

        setDateReceived((prev) => prev || responseData.date_received || new Date().toISOString().split("T")[0]);
        setTimeReceived((prev) => prev || responseData.time_received || new Date().toTimeString().slice(0, 5));
        setPriorityNumber(responseData.priority_number || "");
        setRemarks(responseData.remarks || "");
        setApprovedBy1(responseData.approved_by_1 || null); // Set approved_by_1 directly

        const userInfo = await fetchUserInfo(token);
        setApprovedByName(userInfo.full_name);
        setApprovedById(userInfo.id);
      } catch (err) {
        console.error("Error fetching request details:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchRequestDetails();
  }, [id, token, API_BASE_URL]);

  useEffect(() => {
    const fetchUserNames = async () => {
      if (!token || !requestDetails) return;

      const fieldsToFetch = ["verified_by", "approved_by_1"];
      const namesMap = {};

      await Promise.all(
        fieldsToFetch.map(async (field) => {
          const userId = requestDetails[field];
          if (userId) {
            const name = await fetchUserInfoById(userId, token);
            namesMap[field] = name;
          }
        })
      );

      setUserNames(namesMap);
    };

    fetchUserNames();
  }, [token, requestDetails]);

  const formatTimeTo24Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}:${minutes}:00`;
  };

  const handleDecision = async (e, action) => {
    e.preventDefault();

    if (action === "deny" && !remarks.trim()) {
      setError("Remarks are required to deny the request.");
      return;
    }

    if (approvedById === HEAD2_ID && !approvedBy1) {
      setError("You cannot approve this request until Head 1 has approved it.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const formattedTime = formatTimeTo24Hour(time_received);

      const endpoint =
        action === "deny"
          ? `${API_BASE_URL}/maintenance-requests/${id}/disapprove`
          : `${API_BASE_URL}/maintenance-requests/${id}/approve`;

      const payload = {
        id,
        date_received,
        time_received: formattedTime,
        priority_number,
        remarks,
        approved_by: approvedById,
        ...(action === "deny" && { status: "denied" }),
      };

      if (approvedById === HEAD1_ID) {
        payload.verified_by_head = approvedById;
      } else if (approvedById === HEAD2_ID && requestDetails.verified_by_head) {
        payload.verified_by_supervisor = approvedById;
      }

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

      navigate("/headmaintenance");
    } catch (err) {
      setError(err.message || "An error occurred during request submission");
    } finally {
      setIsLoading(false);
    }
  };

  const isHead1Verified = Boolean(requestDetails.verified_by_head);
  const isHead2Verified = Boolean(requestDetails.verified_by_supervisor);

  const isFullyApproved = isHead1Verified && isHead2Verified;
  const alreadyApproved =
    (approvedById === HEAD1_ID && isHead1Verified) ||
    (approvedById === HEAD2_ID && isHead2Verified);

  const buttonText = isFullyApproved
    ? "Already Fully Approved"
    : alreadyApproved
    ? "Already Approved"
    : "Approve";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>
        <div className="hidden md:block text-right text-white text-sm">
          <div className="font-semibold capitalize">
            {roleMap[currentUser.role] || "Unknown Role"}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 md:p-8 lg:p-10 shadow-lg rounded-lg w-full max-w-md md:max-w-xl lg:max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
              JOSE RIZAL MEMORIAL STATE UNIVERSITY <br className="hidden sm:block" />
              GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
            </h2>
            <p className="text-sm md:text-base text-center mb-6 md:mb-8">
              User Request Slip (Head Approval)
            </p>

            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="space-y-4 md:space-y-6">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading request details...</p>
              ) : (
                <>
                  {Object.entries(requestDetails).map(([key, value]) => {
                    let displayValue = value;
                    let displayLabel = key.replace(/_/g, " ").toUpperCase();

                    if (["verified_by", "approved_by_1"].includes(key)) {
                      displayValue = userNames[key] || "N/A";
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

            {!isLoading && (
              <form className="space-y-4 md:space-y-6 mt-6" onSubmit={(e) => handleDecision(e, "approve")}>
                {approvedById === HEAD1_ID && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Approved by Head</label>
                    <input
                      type="text"
                      value={head1Input}
                      onChange={(e) => setHead1Input(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Optional remarks or name"
                    />
                  </div>
                )}

                {approvedById === HEAD2_ID && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Approved by Supervisor</label>
                    <input
                      type="text"
                      value={head2Input}
                      onChange={(e) => setHead2Input(e.target.value)}
                      disabled={!approvedBy1}
                      className={`w-full border border-gray-300 rounded px-3 py-2 ${!approvedBy1 ? "bg-gray-100" : ""}`}
                      placeholder="Optional remarks or name"
                    />
                    {!approvedBy1 && (
                      <p className="text-red-500 text-sm mt-1">Waiting for Head 1 approval.</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full text-white py-2 rounded-lg ${
                    alreadyApproved || (approvedById === HEAD2_ID && !approvedBy1)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                  disabled={alreadyApproved || (approvedById === HEAD2_ID && !approvedBy1)}
                >
                  {buttonText}
                </button>

                <button
                  type="button"
                  className="w-full bg-red-500 text-white py-2 rounded-lg mt-2"
                  onClick={(e) => handleDecision(e, "deny")}
                >
                  Deny
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HeadMaintenanceRequestForm;
