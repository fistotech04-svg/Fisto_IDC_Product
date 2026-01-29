// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo/Fisto_logo.png';
import { User, Share2, Save, Download } from 'lucide-react';
import ProfileModal from './ProfileModal';


const Navbar = ({ onExport, onSave, hasUnsavedChanges, saveSuccessInfo, isAutoSaveEnabled, onToggleAutoSave }) => {
  const [secondsSinceSave, setSecondsSinceSave] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  // Helper to determine if a link is active
  const isActive = (path) => {
    if (path === '/editor') return location.pathname === '/editor';
    if (path === '/editor/threed_editor') return location.pathname.includes('threed_editor');
    return location.pathname === path;
  };

  // Common styles
  const baseLinkStyle = "text-gray-900 hover:text-gray-600 font-medium text-sm transition-colors relative pb-0.5 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-black after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left";
  const activeLinkStyle = "text-[#373d8a] font-medium text-sm transition-colors relative pb-0.5 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-[#373d8a] after:scale-x-100 after:transition-transform after:duration-300 after:origin-left";

  // Timer: Run only when unsaved changes exist
  useEffect(() => {
    let interval;
    if (hasUnsavedChanges) {
        interval = setInterval(() => {
            setSecondsSinceSave(prev => prev + 1);
        }, 1000);
    } else {
        setSecondsSinceSave(0);
    }
    return () => clearInterval(interval);
  }, [hasUnsavedChanges]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Check if we are in 3D Editor
  const isThreedEditor = location.pathname.includes('threed_editor');

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

          {isAutoSaveEnabled && (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-gray-900 font-medium text-sm">
                Saved :
                </span>
                <span className="text-blue-600 font-medium text-sm">
                {formatTime(secondsSinceSave)} ago
                </span>
            </div>
          )}
        </div>

        {/* Center Section - Navigation Links */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-10">
          <Link
            to="/home"
            className={isActive('/home') ? activeLinkStyle : baseLinkStyle}
          >
            Home
          </Link>
          <Link
            to="/customized"
            className={isActive('/customized') ? activeLinkStyle : baseLinkStyle}
          >
            Customize
          </Link>
          <Link
            to="/editor"
            className={isActive('/editor') ? activeLinkStyle : baseLinkStyle}
          >
            Editor
          </Link>
          <Link
            to="/editor/threed_editor"
            className={isActive('/editor/threed_editor') ? activeLinkStyle : baseLinkStyle}
          >
            3D Editor
          </Link>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end relative">
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
            className={`p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 ${isThreedEditor ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            title="Share"
            disabled={isThreedEditor}
          >
            <Share2 size={20} />
          </button>
          
          {/* Save & Toast Container */}
          <div className="relative">
              <button 
                onClick={onSave}
                disabled={!hasUnsavedChanges}
                className={`p-2.5 rounded-lg transition-all relative
                  ${hasUnsavedChanges 
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer ring-1 ring-amber-200' 
                      : 'bg-[#F2FDF8] text-green-600 cursor-default opacity-80 ring-1 ring-green-300'
                  }`}
                title={hasUnsavedChanges ? "You have unsaved changes" : "All changes saved"}
              >
                <Save size={20} />
              </button>
              
              {/* Success Toast Popup */}
              {saveSuccessInfo && (
                                  <div className="absolute top-full right-0 mt-2 w-52 z-[60] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-[#5CBC49] rounded-lg shadow-lg p-2.5 text-white relative">
                    {/* Arrow pointing up */}
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#5CBC49] rotate-45 transform"></div>
                    
                    <div className="flex flex-col gap-1 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="bg-white rounded-full p-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5CBC49" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="font-bold text-sm leading-tight">Saved Successfully</span>
                      </div>
                      
                      <div className="h-px bg-white/20 w-full my-0.5"></div>
                      
                      <div className="text-[10px] font-medium text-white/90 truncate">
                        {saveSuccessInfo.name} - {saveSuccessInfo.folder}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Export */}
          <button 
            onClick={onExport}
            disabled={isThreedEditor}
            className={`bg-black text-white rounded-lg flex items-center justify-center transition-colors px-5 py-2.5 ml-1 ${
              isThreedEditor 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : 'hover:bg-gray-800'
            }`}
            style={{ gap: '0.5rem' }}
          >
            <Download size={18} />
            <span className="font-medium text-sm">Export</span>
          </button>
        </div>
      </nav>

      {/* Render Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={onToggleAutoSave}
      />
    </>
  );
};

export default Navbar;