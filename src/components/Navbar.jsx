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
        <div className="flex items-center gap-3">
          {/* Home Icon - Separate */}
          <Link
            to="/home"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </Link>

          {/* Navigation Group */}
          <div className="bg-gray-200 rounded-xl p-1.5 flex items-center gap-3">
            {/* Customized Button */}
            <Link
              to="/customized"
              className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
            >
              Customized
            </Link>

            {/* Editor Button (Active) */}
            <button className="bg-black text-white rounded-lg px-4 py-1.5 text-sm font-medium">
              Editor
            </button>

            {/* 3D Editor Button */}
            <Link
              to="/3d-editor"
              className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
            >
              3D Editor
            </Link>
          </div>
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