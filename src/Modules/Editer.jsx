import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Editor = () => {
  const [exportHandler, setExportHandler] = useState(null);

  const handleExport = () => {
    if (exportHandler) {
      exportHandler();
    } else {
      console.warn("Export handler is not attached. MainEditor may not be mounted or failed to register.");
      // Optional: alert for user visibility if console isn't checked
      // alert("Export is not ready. Please try again in a moment."); 
    }
  };

  // Memoize context to prevent unnecessary child re-renders
  const contextValue = React.useMemo(() => ({ setExportHandler }), []);

  return (
    <div className="flex flex-col h-screen">
      <Navbar onExport={handleExport} />
      <div className="flex-1 overflow-hidden">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
};

export default Editor;