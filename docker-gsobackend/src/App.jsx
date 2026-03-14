import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loginpage from "./Loginpage"; // Ensure correct import path
import Dashboard from "./Dashboard"; // Ensure correct import path
import Maintenace from "./Maintenance";
import Carpentry from "./Carpentry";
import Janitorial from "./Janitorial";
import Electrical from "./Electrical";
import AirConditioning from "./AirConditioning";
import Notifications from "./Notifications";
import Schedules from "./Schedules";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Loginpage />} />
        <Route path="/loginpage" element={<Loginpage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/maintenance" element={<Maintenace />} />
        <Route path="/janitorial" element={<Janitorial />} />
        <Route path="/carpentry" element={<Carpentry />} />
        <Route path="/electrical" element={<Electrical />} />
        <Route path="/airconditioning" element={<AirConditioning />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/schedules" element={<Schedules />} />
      </Routes>
    </Router>
  );
}

export default App;