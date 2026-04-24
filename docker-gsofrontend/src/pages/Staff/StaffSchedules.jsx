import SchedulePage from '../Schedules/SchedulePage';
import { StaffSidebar, MENU_ITEMS as STAFF_MENU_ITEMS } from '../../components/StaffSidebar';

const StaffSchedules = () => (
  <SchedulePage
    SidebarComponent={StaffSidebar}
    menuItems={STAFF_MENU_ITEMS}
    title="Staff"
  />
);

export default StaffSchedules;
