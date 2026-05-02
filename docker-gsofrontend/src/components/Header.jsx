import { memo, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useClickOutside } from "../../hooks/useClickOutside"; // Fixed import path
import Icon from "../ui/Icon"; // Fixed import path

const Header = memo(({ 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  onCloseMobileMenu,
  menuItems = [], // Accept menu items as a prop
  userTitle = "User",
  brandTitle = "ManageIT", // Allow customization of the brand title
  footerText = "Created By Bantilan & Friends", // Allow customization of footer text
}) => {
  const mobileMenuRef = useRef(null);

  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">
        {brandTitle}
      </span>

      <div className="hidden md:block text-xl font-bold text-white">
        {userTitle}
      </div>

      <div className="flex items-center gap-4 md:hidden">
        <button 
          onClick={onToggleMobileMenu}
          className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.text}
              to={item.to}
              className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
              onClick={onCloseMobileMenu}
            >
              <Icon path={item.icon} className="w-5 h-5 mr-3" />
              {item.text}
            </NavLink>
          ))}
        </nav>
        <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
          {footerText}
        </div>
      </div>
    </header>
  );
});

export default Header;
