import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Editor = () => {
  const [exportHandler, setExportHandler] = useState(null);
  const [saveHandler, setSaveHandler] = useState(null);

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
  const contextValue = React.useMemo(() => ({ setExportHandler, setSaveHandler }), []);

  return (
    <div className="flex flex-col h-screen">
      <Navbar onExport={handleExport} onSave={handleSave} />
      <div className="flex-1 overflow-hidden">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
};

export default Editor;