// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo/Fisto_logo.png';
import { User, Share2, Save, Download } from 'lucide-react';
import ProfileModal from './ProfileModal';

const Navbar = ({ onExport }) => {
  const [autoSaveTime, setAutoSaveTime] = useState('00:32');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auto-save timer
  const updateTime = useCallback(() => {
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setAutoSaveTime(`${minutes}:${seconds}`);
  }, []);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  return (
    <>
      <nav 
        className="bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-lg z-50 relative" 
        style={{ height: '8vh', minHeight: '60px' }}
      >
        {/* Left Section - Logo and Saved Status */}
        <div className="flex items-center gap-8 min-w-[200px]">
          <Link to="/" className="flex-shrink-0">
            <img 
              className="h-10 w-auto object-contain" 
              src={logo} 
              alt="FIST-O" 
            />
          </Link>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-gray-900 font-medium text-sm">
              Saved
            </span>
            <span className="text-blue-600 text-sm">
              {autoSaveTime} ago
            </span>
          </div>
        </div>

        {/* Center Section - Navigation Links */}
        <div className="flex items-center gap-10">
          {[
            { name: 'Home', path: '/home' },
            { name: 'Help', path: '#' },
            { name: 'Contact Us', path: '#' },
            { name: 'Settings', path: '/settings' }
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-gray-700 hover:text-black font-medium text-sm transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          {/* Profile */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Profile"
          >
            <User size={20} />
          </button>

          {/* Share */}
          <button 
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Share"
          >
            <Share2 size={20} />
          </button>
          
          {/* Save */}
          <button 
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Save Project"
          >
            <Save size={20} />
          </button>

          {/* Export */}
          <button 
            onClick={onExport}
            className="bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition-colors px-5 py-2.5 ml-1"
            style={{ gap: '0.5rem' }}
          >
            <Download size={18} />
            <span className="font-medium text-sm">Export</span>
          </button>
        </div>
      </nav>

      {/* Render Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;