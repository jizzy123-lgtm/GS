import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HeadSidebar, HEAD_MENU_ITEMS } from "../../components/HeadSidebar"; 

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    default:
      return state;
  }
};

const HeadMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Sidebar state
  const [sidebarState, sidebarDispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const HEAD1_ID = 8;
  const HEAD2_ID = 9;

  const [currentUser, setCurrentUser] = useState({
    id: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    suffix: "",
    role: "",
  });
  const [requestDetails, setRequestDetails] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  const [date_received, setDateReceived] = useState("");
  const [time_received, setTimeReceived] = useState("");
  const [priority_number, setPriorityNumber] = useState("");
  const [comment, setComment] = useState("");
  const [approvedByName, setApprovedByName] = useState("");
  const [approvedById, setApprovedById] = useState("");
  const [head1Input, setHead1Input] = useState("");
  const [head2Input, setHead2Input] = useState("");
  const [approvedBy1, setApprovedBy1] = useState(null);

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/idfullname`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch current user");

      setCurrentUser({
        id: data.user_id || "",
        last_name: data.last_name || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        suffix: data.suffix || "",
        role: data.role_id || "",
      });
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const getCurrentUserDisplayName = () => {
    if (!currentUser.last_name && !currentUser.first_name) return "Unknown User";
    let name = `${currentUser.last_name}, ${currentUser.first_name}`;
    if (currentUser.middle_name) name += ` ${currentUser.middle_name.charAt(0)}.`;
    if (currentUser.suffix) name += ` ${currentUser.suffix}`;
    return name.trim();
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
        headers:
         {
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
        setComment("");
        setApprovedBy1(responseData.approved_by_1 || null);

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

  const formatTimeTo24Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}:${minutes}:00`;
  };

  const handleDecision = async (e, action) => {
    e.preventDefault();

    if (action === "deny" && !comment.trim()) {
      setError("Comment is required to deny the request.");
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
          : `${API_BASE_URL}/maintenance-requests/${id}/approve-head`;

      const payload = {
        id,
        date_received,
        time_received: formattedTime,
        priority_number,
        comment,
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

      navigate("/headrequests");
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
            <div className="hidden md:block text-xl font-bold">Head</div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <HeadSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => sidebarDispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={HEAD_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />
        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-2xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-center mb-4">
                User Request Slip (Head Approval)
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
                        value={requestDetails.date_requested ? 
                          new Date(requestDetails.date_requested).toLocaleDateString() : "N/A"}
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
                        value={requestDetails.requesting_personnel || "N/A"}
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
                        value={requestDetails.position || "N/A"}
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
                        value={requestDetails.requesting_office || "N/A"}
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
                        value={requestDetails.maintenance_type || "N/A"}
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
                        value={requestDetails.status || "N/A"}
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
                        value={requestDetails.contact_number || "N/A"}
                        disabled
                      />
                    </div>
                    {/* Only show Approved By 1 if present */}
                    {requestDetails.approved_by_1 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Approved By Head:
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                          value={requestDetails.approved_by_1}
                          disabled
                        />
                      </div>
                    )}
                    {/* Only show Verified By if present */}
                    {requestDetails.verified_by && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Verified By:
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                          value={requestDetails.verified_by}
                          disabled
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Date Received:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.date_received || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Time Received:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.time_received || "N/A"}
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
                      value={requestDetails.details || "N/A"}
                      disabled
                    />
                  </div>
                  <div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Staff Comments:
                      </label>
                      {Array.isArray(requestDetails.comments) && requestDetails.comments.length > 0 ? (
                        <div className="space-y-2">
                          {requestDetails.comments.map((c) => (
                            <div key={c.id} className="p-2 bg-gray-100 rounded">
                              <div className="text-sm text-gray-800">{c.comment}</div>
                              <div className="text-xs text-gray-500">
                                By: {c.user} ({c.role}) on {c.date} {c.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                          rows="2"
                          value="No comments"
                          disabled
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Required Section */}
              {!isLoading && (
                <form className="space-y-4" onSubmit={(e) => handleDecision(e, "approve")}>
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Action Required</h3>

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
                      <label className="block font-medium text-gray-700 mb-1">Approved by Campus Director</label>
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Approved by Head:
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                      value={getCurrentUserDisplayName()}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700">Comment:</label>
                    <textarea
                      className="w-full border rounded-lg px-4 py-2"
                      rows={4}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Enter any comments..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={alreadyApproved || (approvedById === HEAD2_ID && !approvedBy1)}
                      className={`flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors`}
                    >
                      {buttonText}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDecision(e, "deny")}
                      disabled={alreadyApproved || (approvedById === HEAD2_ID && !approvedBy1)}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      Deny
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

export default HeadMaintenanceRequestForm;
