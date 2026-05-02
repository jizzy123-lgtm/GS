import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loginpage from "./pages/LoginScreen/Loginpage"; 
import Dashboard from "./pages/Userdashboard/Dashboard"; 
import Maintenace from "./pages/Maintenance/Maintenance";
import Carpentry from "./pages/Maintenance/Carpentry";
import Janitorial from "./pages/Maintenance/Janitorial";
import Electrical from "./pages/Maintenance/Electrical";
import AirConditioning from "./pages/Maintenance/AirConditioning";
import Notifications from "./pages/Userdashboard/Notifications";
import Schedules from "./pages/Userdashboard/Schedules";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Signuppage from "./pages/SignupScreen/Signuppage";
import Adminnotifications from "./pages/Admin/Adminnotifications";
import AdminSchedules from "./pages/Admin/AdminSchedules";
import AdminMaintenance from "./pages/Admin/AdminMaintenance";
import Requests from "./pages/Admin/Requests";
import AdminJanitorial from "./pages/Admin/adminMaintenance/AdminJanitorial";
import AdminElectrical from "./pages/Admin/adminMaintenance/AdminElectrical";
import AdminCarpentry from "./pages/Admin/adminMaintenance/AdminCarpentry";
import AdminAirconditioning from "./pages/Admin/adminMaintenance/AdminAirconditioning";
import AdminCarpentryform from "./pages/Admin/AdminCarpentryform";
import StaffDashboard from "./pages/Staff/StaffDashboard.jsx";
import StaffRequests from "./pages/Staff/StaffRequests.jsx";
import StaffSlipRequests from "./pages/Staff/StaffSlipRequests.jsx";
import UserRequests from "./pages/Staff/UserRequests.jsx";
import AdminUserRequests from "./pages/Admin/AdminUserRequests.jsx";
import AdminUserRequestsForm from "./pages/Admin/AdminUserRequestsForm.jsx";
import StaffMaintenanceRequestForm from "./pages/Staff/StaffMaintenanceRequestForm.jsx";
import HeadDashboard from "./pages/Head/HeadDashboard.jsx";
import HeadMaintenance from "./pages/Head/headmaintenance/HeadMaintenance.jsx";
import HeadJanitorial from "./pages/Head/headmaintenance/HeadJanitorial.jsx";
import HeadCarpentry from "./pages/Head/headmaintenance/HeadCarpentry.jsx";
import HeadElectrical from "./pages/Head/headmaintenance/HeadElectrical.jsx";
import HeadAirconditioning from "./pages/Head/headmaintenance/HeadAirconditioning.jsx";
import StaffMaintenance from "./pages/Staff/StaffMaintenance/StaffMaintenance.jsx";
import StaffJanitorial from "./pages/Staff/StaffMaintenance/StaffJanitorial.jsx";
import StaffElectrical from "./pages/Staff/StaffMaintenance/StaffElectrical.jsx";
import StaffCarpentry from "./pages/Staff/StaffMaintenance/StaffCarpentry.jsx";
import StaffAirconditioning from "./pages/Staff/StaffMaintenance/StaffAirconditioning.jsx";
import HeadRequests from "./pages/Head/HeadRequests.jsx";
import HeadMaintenanceRequestForm from "./pages/Head/HeadMaintenanceRequestForm.jsx";
import RequestStatus from "./pages/Userdashboard/RequestStatus.jsx";
import ViewMaintenanceRequestForm from "./pages/Userdashboard/ViewMaintenanceRequestForm.jsx";
import UserFeedback from "./pages/Userdashboard/UserFeedback.jsx";
import Profile from "./pages/Userdashboard/Profile.jsx";
import UserChangePass from "./pages/Userdashboard/UserChangePass.jsx";
import Report from "./pages/Staff/Report.jsx";

function App() {
  const token = localStorage.getItem('token'); // Retrieve token from localStorage

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Loginpage />} />
        <Route path="/loginpage" element={<Loginpage />} />
        <Route path="/signuppage" element={<Signuppage />} />

        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/requeststatus" element={<RequestStatus />} />
        <Route path="/viewmaintenancerequestform/:id" element={<ViewMaintenanceRequestForm />} />
        <Route path="/userfeedback/:id" element={<UserFeedback token={token}/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/userchangepass" element={<UserChangePass/>} />

        {/* Maintenance Routes */}
        <Route path="/maintenance" element={<Maintenace />} />
        <Route path="/janitorial" element={<Janitorial token={token} />} />
        <Route path="/carpentry" element={<Carpentry />} />
        <Route path="/electrical" element={<Electrical />} />
        <Route path="/airconditioning" element={<AirConditioning />} />

        {/* Admin Routes */}
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/adminnotifications" element={<Adminnotifications />} />
        <Route path="/adminschedules" element={<AdminSchedules />} />
        <Route path="/adminmaintenance" element={<AdminMaintenance />} />
        <Route path="/requests" element={<Requests token={token} />} />
        <Route path="/adminjanitorial" element={<AdminJanitorial token={token} />} />
        <Route path="/adminelectrical" element={<AdminElectrical token={token} />} />
        <Route path="/admincarpentry" element={<AdminCarpentry token={token} />} />
        <Route path="/adminairconditioning" element={<AdminAirconditioning token={token} />} />
        <Route path="/admincarpentryform/:id" element={<AdminCarpentryform token={token} />} />
        <Route path="/adminuserrequests" element={<AdminUserRequests token={token} />} />
        <Route path="/adminuserrequestsform/:id" element={<AdminUserRequestsForm token={token} />} />

        {/* Staff Routes */}
        <Route path="/staffdashboard" element={<StaffDashboard />} />
        <Route path="/staffrequests" element={<StaffRequests />} />
        <Route path="/staffsliprequests" element={<StaffSlipRequests token={token} />} />
        <Route path="/userrequests" element={<UserRequests />} />
        <Route path="/staffmaintenancerequestform/:id" element={<StaffMaintenanceRequestForm token={token} />} />
        <Route path="/staffmaintenance" element={<StaffMaintenance token={token} />} />
        <Route path="/staffjanitorial" element={<StaffJanitorial token={token} />} />
        <Route path="/staffelectrical" element={<StaffElectrical token={token} />} />
        <Route path="/staffcarpentry" element={<StaffCarpentry token={token} />} /> 
        <Route path="/staffairconditioning" element={<StaffAirconditioning token={token} />} />
        <Route path="/report" element={<Report token={token} />} />

        {/* Head Routes */}
        <Route path="/headdashboard" element={<HeadDashboard token={token} />} />
        <Route path="/headmaintenance" element={<HeadMaintenance token={token} />} />
        <Route path="/headjanitorial" element={<HeadJanitorial token={token} />} />
        <Route path="/headcarpentry" element={<HeadCarpentry token={token} />} />
        <Route path="/headelectrical" element={<HeadElectrical token={token} />} />
        <Route path="/headairconditioning" element={<HeadAirconditioning token={token} />} />
        <Route path="/headrequests" element={<HeadRequests token={token} />} />
        <Route path="/headmaintenancerequestform/:id" element={<HeadMaintenanceRequestForm token={token} />} />
      </Routes>
    </Router>
  );
}

export default App;