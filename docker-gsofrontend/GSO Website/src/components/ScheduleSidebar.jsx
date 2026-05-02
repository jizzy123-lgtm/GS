import React, { memo } from 'react';

const SCHEDULE_ITEMS = ['Team Meeting', 'Project Deadline', 'System Maintenance'];

const ScheduleSidebar = memo(() => (
  <aside className="hidden lg:block lg:w-1/4 bg-white/90 p-4 border-l backdrop-blur-sm">
    <h2 className="text-xl font-bold mb-4 text-gray-800">Reminders</h2>
    <div className="space-y-3">
      {SCHEDULE_ITEMS.map((event) => (
        <div 
          key={event} 
          className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative"
        >
          <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full animate-pulse" />
          <p className="text-sm text-gray-700 pl-4 font-medium"></p>
          <span className="text-xs text-gray-400 pl-4"></span>
        </div>
      ))}
    </div>
  </aside>
));

export default ScheduleSidebar;