import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const HeadMaintenanceForm = ({
  maintenanceTypeId,
  sectionLabel,
  cancelPath = "/headmaintenance",
  afterSubmitPath = "/headmaintenance",
}) => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [formData, setFormData] = useState({
    date_requested: "",
    details: "",
    requesting_personnel: "",
    position: "",
    requesting_office: "",
    contact_number: "",
  });

  const [userIds, setUserIds] = useState({
    user_id: "",
    position_id: "",
    requesting_office: "",
  });

  const [status, setStatus] = useState({
    isLoading: false,
    isFetchingUserDetails: true,
    error: "",
    success: "",
    touched: {},
    isSubmitting: false,
    showConfirmation: false,
    fieldErrors: {},
  });

  const [token, setToken] = useState("");

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (!status.touched[field]) {
      setStatus((prev) => ({
        ...prev,
        touched: { ...prev.touched, [field]: true },
      }));
    }

    if (status.fieldErrors[field]) {
      if ((field === "details" && value.length >= 10) || (field !== "details" && value)) {
        setStatus((prev) => ({
          ...prev,
          fieldErrors: {
            ...prev.fieldErrors,
            [field]: "",
          },
        }));
      }
    }
  };

  const markAllFieldsTouched = () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});

    setStatus((prev) => ({
      ...prev,
      touched: allTouched,
    }));
  };

  const validateForm = () => {
    const fieldErrors = {};

    if (!formData.date_requested) fieldErrors.date_requested = "Date is required";

    if (!formData.details) fieldErrors.details = "Details are required";
    else if (formData.details.length < 10) {
      fieldErrors.details = "Please provide more detailed information (at least 10 characters)";
    }

    setStatus((prev) => ({
      ...prev,
      fieldErrors,
    }));

    return {
      isValid: Object.keys(fieldErrors).length === 0,
      fieldErrors,
    };
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (!authToken) {
      setStatus((prev) => ({
        ...prev,
        error: "Unauthorized: Please log in to continue",
        isFetchingUserDetails: false,
      }));
      const timer = setTimeout(() => navigate("/loginpage"), 2000);
      return () => clearTimeout(timer);
    }

    setToken(authToken);
  }, [navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchUserDetails = async () => {
      try {
        setStatus((prev) => ({ ...prev, isFetchingUserDetails: true }));

        const response = await fetch(`${API_BASE_URL}/users/reqInfo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user details");
        }

        setUserIds({
          user_id: data.user_id || "",
          position_id:
            typeof data.position_id === "object" && data.position_id !== null
              ? data.position_id.id || ""
              : data.position_id || "",
          requesting_office:
            typeof data.office_id === "object" && data.office_id !== null
              ? data.office_id.id || ""
              : data.office_id || "",
        });

        setFormData((prev) => ({
          ...prev,
          requesting_personnel: [data.last_name, data.first_name, data.middle_name, data.suffix]
            .filter(Boolean)
            .join(", "),
          position:
            data.position ||
            (typeof data.position_id === "object" && data.position_id !== null
              ? data.position_id.name || ""
              : data.position_id || ""),
          requesting_office:
            data.office ||
            (typeof data.office_id === "object" && data.office_id !== null
              ? data.office_id.name || ""
              : data.office_id || ""),
          contact_number: data.contact_number || "",
        }));
      } catch (err) {
        console.error("Error fetching user details:", err);
        setStatus((prev) => ({
          ...prev,
          error: err.message || "Failed to fetch user details",
        }));
      } finally {
        setStatus((prev) => ({ ...prev, isFetchingUserDetails: false }));
      }
    };

    fetchUserDetails();
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (!formData.date_requested) {
      const currentDate = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, date_requested: currentDate }));
    }
  }, [formData.date_requested]);

  useEffect(() => {
    if (status.error) {
      const timer = setTimeout(() => {
        setStatus((prev) => ({ ...prev, error: "" }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    markAllFieldsTouched();

    const { isValid, fieldErrors } = validateForm();
    if (!isValid) {
      setStatus((prev) => ({
        ...prev,
        error: Object.values(fieldErrors)[0],
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, showConfirmation: true }));
  };

  const handleConfirmedSubmit = useCallback(async () => {
    if (!token) {
      setStatus((prev) => ({
        ...prev,
        error: "Unauthorized: Please log in",
        showConfirmation: false,
      }));
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }

    try {
      setStatus((prev) => ({
        ...prev,
        isSubmitting: true,
        error: "",
        success: "",
      }));

      const requestData = {
        date_requested: formData.date_requested,
        details: formData.details,
        requesting_personnel: parseInt(userIds.user_id, 10),
        position_id: parseInt(userIds.position_id, 10),
        requesting_office: parseInt(userIds.requesting_office, 10),
        contact_number: formData.contact_number,
        maintenance_type_id: maintenanceTypeId,
      };

      const response = await fetch(`${API_BASE_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
        mode: "cors",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in");
        } else {
          throw new Error(data.message || "Request submission failed");
        }
      }

      setStatus((prev) => ({
        ...prev,
        success: "Request submitted successfully!",
        showConfirmation: false,
      }));

      const timer = setTimeout(() => {
        navigate(afterSubmitPath);
      }, 3000);
      return () => clearTimeout(timer);
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        error: err.message || "An error occurred during submission",
        showConfirmation: false,
      }));
    } finally {
      setStatus((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [token, formData, userIds, navigate, API_BASE_URL, maintenanceTypeId, afterSubmitPath]);

  const getInputClasses = (field) => {
    const baseClasses = "w-full border rounded-lg px-4 py-2 md:py-3 transition-all";

    if (status.fieldErrors[field]) {
      return `${baseClasses} border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50`;
    }

    const touchedClasses = status.touched[field]
      ? (field === "details" && formData[field].length < 10) || !formData[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400"
        : "border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    return `${baseClasses} ${touchedClasses}`;
  };

  if (status.isFetchingUserDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 md:p-8 lg:p-10 shadow-lg rounded-lg w-full max-w-md md:max-w-xl lg:max-w-2xl transition-all duration-300">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY <br className="hidden sm:block" />
          GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
        </h2>
        <p className="text-sm md:text-base text-center mb-6 md:mb-8">
          User Request Slip ({sectionLabel} Section) <br className="hidden sm:block" />
        </p>

        {status.error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{status.error}</span>
          </div>
        )}

        {status.success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{status.success}</span>
          </div>
        )}

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Date Requested:
              {status.fieldErrors.date_requested && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type="date"
                className={getInputClasses("date_requested")}
                value={formData.date_requested}
                onChange={(e) => updateFormData("date_requested", e.target.value)}
              />
            </div>
            {status.fieldErrors.date_requested && (
              <p className="text-sm text-red-500 mt-1">{status.fieldErrors.date_requested}</p>
            )}
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Specific Details (Situations/Condition/Circumstances):
              {status.fieldErrors.details && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              className={getInputClasses("details")}
              rows="3"
              value={formData.details}
              onChange={(e) => updateFormData("details", e.target.value)}
            ></textarea>
            {status.fieldErrors.details && (
              <p className="text-sm text-red-500 mt-1">{status.fieldErrors.details}</p>
            )}
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Requesting Personnel (Fullname):
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 bg-gray-100"
              value={formData.requesting_personnel}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Position:</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 bg-gray-100"
              value={formData.position}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Requesting Office (College/Department/Unit):
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 bg-gray-100"
              value={formData.requesting_office}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Contact Number:</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 bg-gray-100"
              value={formData.contact_number}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <button
              type="button"
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
              onClick={() => navigate(cancelPath)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
              disabled={status.isSubmitting}
            >
              {status.isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {status.showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full animate-fadeIn">
              <h3 className="text-lg font-bold mb-4">Confirm Submission</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to submit this {sectionLabel.toLowerCase()} service request?
              </p>
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium">Request Details:</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Date:</span> {formData.date_requested}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Description:</span> {formData.details}
                </p>
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => setStatus((prev) => ({ ...prev, showConfirmation: false }))}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={status.isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  onClick={handleConfirmedSubmit}
                  disabled={status.isSubmitting}
                >
                  {status.isSubmitting ? "Submitting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadMaintenanceForm;
