import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const SidebarItem = memo(({ item, isSidebarCollapsed }) => (
  <NavLink
    to={item.to}
    className={({ isActive }) => 
      `flex items-center p-2 rounded-lg hover:bg-gray-700 transition-all group relative ${
        isActive ? 'bg-gray-800' : ''
      }`}
  >
    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center relative group"> 
      <Icon 
        path={item.icon} 
        className="w-full h-full transition-transform hover:scale-110" 
      />
      {isSidebarCollapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 text-sm bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
          {item.text}
        </span>
      )}
    </div>
    <span className={`ml-3 transition-all duration-300 ${
      !isSidebarCollapsed ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0 overflow-hidden'
    }`}>
      {item.text}
    </span>
  </NavLink>
));

const Sidebar = memo(({ 
  isSidebarCollapsed, 
  onToggleSidebar,
  menuItems = [], // Default to an empty array if menuItems is not passed
}) => (
  <aside className={`hidden md:block bg-gray-900 text-white transition-[width] duration-300 ease-in-out relative h-full z-20 ${
    isSidebarCollapsed ? 'w-16' : 'w-64'
  }`}>
    <div className="p-4 flex flex-col justify-between h-full">
      <div>
        <button
          onClick={onToggleSidebar}
          className="w-full bg-gray-900 text-white p-2 rounded-lg border-2 border-white transition-colors mb-4 text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSidebarCollapsed ? '☰' : 'Collapse'}
        </button>

        <nav className="space-y-2">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <SidebarItem
                key={item.text}
                item={item}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            ))
          ) : (
            <div className="text-gray-400">No items available</div>
          )}
        </nav>
      </div>

      <div className={`text-center text-xs md:text-sm text-gray-400 transition-opacity ${
        !isSidebarCollapsed ? 'opacity-100' : 'opacity-0'
      }`}>
        Created By Bantilan & Friends
      </div>
    </div>
  </aside>
));

export default Sidebar;
