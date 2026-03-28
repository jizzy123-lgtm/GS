import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // State for form inputs
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [positionId, setPositionId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState("");

  // State for API data
  const [roles, setRoles] = useState([]);
  const [offices, setOffices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // State for handling errors and loading
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [contactWarning, setContactWarning] = useState(""); 

  // Memoize suffix options to prevent recreation on every render
  const suffixOptions = useMemo(() => [
    { label: "Suffix (Optional)", value: "", disabled: true },
    { label: "Jr.", value: "Jr." },
    { label: "Sr.", value: "Sr." },
    { label: "III", value: "III" },
    { label: "IV", value: "IV" },
    { label: "V", value: "V" },

  ], []);

  // Fetch dropdown data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true);

        // Fetch all common data in one request
        const response = await fetch(`${API_BASE_URL}/common-datas`);
        const data = await response.json();

        // Format the data for select dropdowns
        setRoles([
          { label: "Select Role", value: "", disabled: true },
          ...data.roles.map(role => ({ label: role.role_name, value: role.id }))
        ]);
        setPositions([
          { label: "Select Position", value: "", disabled: true },
          ...data.positions.map(position => ({ label: position.name, value: position.id }))
        ]);
        setOffices([
          { label: "Select Office", value: "", disabled: true },
          ...data.offices.map(office => ({ label: office.name, value: office.id }))
        ]);
        console.log(data.offices);
      } catch (err) {
        setError("Failed to load form data. Please refresh the page.");
        console.error("Error fetching data:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Form validation
    if (!lastName || !firstName || !username || !positionId || !officeId || !contactNumber || !password || !passwordConfirmation || !roleId) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate contact number format
    if (!/^09\d{9}$/.test(contactNumber)) {
      setError('Contact number must start with "09" and be exactly 11 digits.');
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // API request
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          last_name: lastName,
          first_name: firstName,
          middle_name: middleName,
          suffix,
          username,
          email,
          position_id: positionId,
          office_id: officeId,
          contact_number: contactNumber,
          password,
          password_confirmation: passwordConfirmation,
          role_id: roleId
        }),
        mode: 'cors'
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from the backend
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          throw new Error(errorMessages.join('\n'));
        }
        throw new Error(data.message || "Signup failed");
      }

      navigate('/loginpage');

    } catch (err) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  }, [lastName, firstName, username, positionId, officeId, contactNumber, password, passwordConfirmation, roleId, middleName, suffix, email, API_BASE_URL, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  // Memoized Icon components to prevent recreation
  const UserIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ), []);

  const MailIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  ), []);

  const PhoneIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ), []);

  const BuildingIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ), []);

  const BriefcaseIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
    </svg>
  ), []);

  const ShieldIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ), []);

  const EyeIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ), []);

  const EyeOffIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m7.071-7.071L21 3m-2.929 2.929L12 12" />
    </svg>
  ), []);

  const ChevronDownIcon = useMemo(() => () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ), []);

  // Memoized Input component for consistent styling
  const InputField = useMemo(() => ({ icon: Icon, type = "text", placeholder, value, onChange, maxLength, required = false }) => (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
        <Icon />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                 hover:border-slate-300 transition-all duration-200 text-sm"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        required={required}
      />
    </div>
  ), []);

  // Memoized Select component for consistent styling
  const SelectField = useMemo(() => ({ icon: Icon, value, onChange, options, required = false }) => (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10">
        <Icon />
      </div>
      <select
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                 hover:border-slate-300 transition-all duration-200 appearance-none cursor-pointer text-sm"
        required={required}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
            className={option.disabled ? "text-slate-400" : "text-slate-700"}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <ChevronDownIcon />
      </div>
    </div>
  ), [ChevronDownIcon]);

  // 1. Detect if selected office starts with "College of"
  const isCollegeOffice = useMemo(() => {
    const selectedOffice = offices.find(o => String(o.value) === String(officeId));
    return selectedOffice && selectedOffice.label && selectedOffice.label.startsWith("College of");
  }, [officeId, offices]);

  // 2. Auto-set/reset roleId when office changes
  useEffect(() => {
    if (isCollegeOffice) {
      setRoleId("4");
    } else if (roleId === "4") {
      setRoleId(""); // Reset if user moves away from college office
    }
    // eslint-disable-next-line
  }, [isCollegeOffice, officeId]);

  // 3. Filter roles for the select field
  const filteredRoles = useMemo(() => {
    if (isCollegeOffice) {
      // Only show Requester (id: 4)
      const requester = roles.find(r => String(r.value) === "4");
      return requester ? [{ ...requester, disabled: false }] : [];
    }
    return roles;
  }, [isCollegeOffice, roles]);

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Jose Rizal Memorial State University
          </h1>
          <p className="text-slate-600 text-sm">
            General Service Office Management System
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl px-6 py-4">
            <div className="text-center text-white">
              <h2 className="text-xl font-bold mb-1">Create Account</h2>
              <p className="text-blue-100 text-sm">Fill in your details below</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-200">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField
                      icon={UserIcon}
                      placeholder="First Name *"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <InputField
                      icon={UserIcon}
                      placeholder="Last Name *"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField
                      icon={UserIcon}
                      placeholder="Middle Initial"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      maxLength="1"
                    />
                    <SelectField
                      icon={UserIcon}
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      options={suffixOptions}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-200">
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField
                      icon={UserIcon}
                      placeholder="Username *"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <InputField
                      icon={MailIcon}
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <InputField
                    icon={PhoneIcon}
                    placeholder="Contact Number *"
                    value={contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ""); // Only allow digits
                      setContactNumber(val);
                      if (!val.startsWith("09")) {
                        setContactWarning('Contact number must start with "09".');
                      } else if (val.length > 11) {
                        setContactWarning("Contact number must be exactly 11 digits.");
                      } else {
                        setContactWarning("");
                      }
                    }}
                    maxLength={11}
                    required
                  />
                  {contactWarning && (
                    <div className="text-red-500 text-xs mt-1">{contactWarning}</div>
                  )}
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-200">
                  Work Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SelectField
                      icon={BuildingIcon}
                      value={officeId}
                      onChange={(e) => setOfficeId(e.target.value)}
                      options={offices}
                      required
                    />
                    <SelectField
                      icon={BriefcaseIcon}
                      value={positionId}
                      onChange={(e) => setPositionId(e.target.value)}
                      options={positions}
                      required
                    />
                  </div>
                  <SelectField
                    icon={ShieldIcon}
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    options={filteredRoles}
                    required
                    disabled={isCollegeOffice}
                  />
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-200">
                  Security
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
                        <ShieldIcon />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password * (min. 6 chars)"
                        className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                 hover:border-slate-300 transition-all duration-200 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>

                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
                        <ShieldIcon />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password *"
                        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                 hover:border-slate-300 transition-all duration-200 text-sm"
                        value={passwordConfirmation}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                           text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg 
                           focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
                           transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-sm">
                Already have an account? 
                <button 
                  onClick={() => navigate('/loginpage')}
                  className="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-colors duration-200 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;