import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';

const Editor = () => {
  // Auto Save Preferences
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => {
    // Priority: Local Storage -> User Data (if available) -> Default True
    const stored = localStorage.getItem('isAutoSaveEnabled');
    if (stored !== null) return JSON.parse(stored);
    
    // Fallback: Default true (Effect will sync with backend)
    return true;
  });

  // Sync state with backend on mount
  useEffect(() => {
      const fetchSettings = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const res = await axios.get(`${backendUrl}/api/usersetting/get-settings`, {
                    params: { emailId: user.emailId }
                });
                
                if (res.data && res.data.isAutoSaveEnabled !== undefined) {
                    setIsAutoSaveEnabled(res.data.isAutoSaveEnabled);
                    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(res.data.isAutoSaveEnabled));
                }
            } catch (err) {
                console.error("Failed to fetch user settings", err);
            }
        }
      };
      fetchSettings();
  }, []);

  const toggleAutoSave = async (value) => {
    setIsAutoSaveEnabled(value);
    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(value));
    
    // Sync with Backend
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            
            await axios.post(`${backendUrl}/api/usersetting/update-autosave`, {
                emailId: user.emailId,
                isAutoSaveEnabled: value
            });
        }
    } catch (error) {
        console.error("Failed to sync auto-save preference:", error);
    }
  };

  const [exportHandler, setExportHandler] = useState(null);
  const [saveHandler, setSaveHandler] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Save Success State for Toast
  const [saveSuccessInfo, setSaveSuccessInfo] = useState(null);

  const handleSaveSuccess = (info) => {
      setSaveSuccessInfo(info);
      setTimeout(() => {
          setSaveSuccessInfo(null);
      }, 3000);
  };

  const handleExport = () => {
    if (exportHandler) {
      exportHandler();
    } else {
      console.warn("Export handler is not attached.");
    }
  };

  const handleSave = () => {
    if (saveHandler) {
      saveHandler();
    } else {
      console.warn("Save handler is not attached.");
    }
  };

  // Memoize context to prevent unnecessary child re-renders
  const contextValue = React.useMemo(() => ({ 
    setExportHandler, 
    setSaveHandler,
    setHasUnsavedChanges, // Expose setter to MainEditor
    triggerSaveSuccess: handleSaveSuccess,
    isAutoSaveEnabled // Expose to MainEditor for internal logic
  }), [isAutoSaveEnabled]);

  return (
    <div className="flex flex-col h-screen">
      <Navbar 
        onExport={handleExport} 
        onSave={handleSave} 
        hasUnsavedChanges={hasUnsavedChanges}
        saveSuccessInfo={saveSuccessInfo}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
      />
      <div className="flex-1 overflow-hidden">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
};

export default Editor;