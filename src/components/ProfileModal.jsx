import React, { useEffect, useState } from 'react';
import { X, Crown } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, isAutoSaveEnabled, onToggleAutoSave }) {
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@example.com' });

  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.name || parsedUser.emailId?.split('@')[0] || 'User',
            email: parsedUser.emailId || 'No Email'
          });
        } catch (e) {
            console.error("Failed to parse user data", e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible Backdrop to handle click-outside */}
      <div className="fixed inset-0 z-[55] cursor-default" onClick={onClose}></div>

      {/* Popup Card */}
      <div className="fixed top-[8vh] right-8 z-[60] w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-6 animate-in hover:animate-none fade-in slide-in-from-top-2 duration-200">
      
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3 w-full">
                Profile
                <span className="flex-1 h-[1px] bg-gray-100 rounded-full mt-0.5"></span>
            </h2>
            <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-3"
            >
                <X size={18} />
            </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1760&auto=format&fit=crop" 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{user.name}</h3>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
        </div>

        <div className="h-[1px] w-full bg-gray-50 mb-5"></div>

        {/* Plan Info */}
        <div className="flex items-center justify-between gap-2 mb-6 px-1">
            <div className="flex items-center gap-2">
                <Crown size={20} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-gray-700">Your Current Plan - </span>
            </div>
            <div className="px-3 py-1 rounded bg-gradient-to-r from-green-500 to-green-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Free
            </div>
        </div>

        {/* Auto Save Toggle */}
        <div className="flex items-center justify-between mb-6 px-1">
            <span className="text-sm font-semibold text-gray-700">Auto Save</span>
            <button 
                onClick={() => onToggleAutoSave(!isAutoSaveEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${isAutoSaveEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                title={isAutoSaveEnabled ? "Disable Auto Save" : "Enable Auto Save"}
            >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isAutoSaveEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
        </div>

        {/* Subscribe Button */}
        <button className="w-full bg-black text-white text-sm font-bold py-3.5 rounded-xl hover:bg-zinc-800 transition-colors shadow-lg">
            399/- Subscribe Now
        </button>

      </div>
    </>
  );
}
