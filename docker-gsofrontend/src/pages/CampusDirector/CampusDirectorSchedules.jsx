import SchedulePage from '../Schedules/SchedulePage';
import { CampusDirectorSidebar, MENU_ITEMS as CAMPUS_DIRECTOR_MENU_ITEMS } from '../../components/CampusDirectorSidebar';

const CampusDirectorSchedules = () => (
  <SchedulePage
    SidebarComponent={CampusDirectorSidebar}
    menuItems={CAMPUS_DIRECTOR_MENU_ITEMS}
    title="Campus Director"
  />
);

export default CampusDirectorSchedules;
