import SchedulePage from '../Schedules/SchedulePage';
import { HeadSidebar, HEAD_MENU_ITEMS } from '../../components/HeadSidebar';

const HeadSchedules = () => (
  <SchedulePage
    SidebarComponent={HeadSidebar}
    menuItems={HEAD_MENU_ITEMS}
    title="Head"
  />
);

export default HeadSchedules;
