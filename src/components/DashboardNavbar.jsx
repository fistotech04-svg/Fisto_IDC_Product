import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FistoLogo from '../assets/logo/Fisto_logo.png';
import { Bell, User } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function DashboardNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'My Flipbooks', path: '/my-flipbooks' },
    { name: 'Help', path: '#' },
    { name: 'Contact Us', path: '#' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <>
    <nav className="w-full bg-white h-[8vh] px-8 flex items-center justify-between z-50 fixed top-0 left-0 border-b border-gray-100">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link to="/home">
           <img src={FistoLogo} alt="FIST-O" className="h-10 w-auto object-contain" />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="hidden lg:flex items-center gap-12">
        {navLinks.map((link) => {
          const isActive = currentPath === link.path || (link.name === 'Home' && currentPath === '/');
          return (
            <Link 
                key={link.name} 
                to={link.path} 
                className={`text-[14px] font-medium transition-colors relative pb-1 ${
                  isActive 
                  ? 'text-[#4c5add] font-semibold' 
                  : 'text-gray-500 hover:text-gray-900'
                }`}
            >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4c5add] rounded-full"></span>
                )}
            </Link>
          );
        })}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
         {/* Notification */}
         <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <Bell size={20} className="text-gray-700" />
         </button>

         {/* Profile */}
         <button 
           onClick={() => setIsProfileModalOpen(true)}
           className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
         >
             <User size={20} className="text-black" strokeWidth={2.5} />
         </button>
      </div>
    </nav>
    <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
}
