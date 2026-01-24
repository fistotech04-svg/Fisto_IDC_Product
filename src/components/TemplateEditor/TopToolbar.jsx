// TopToolbar.jsx - Redesigned with Centered Page Name & Removed Right Controls
import React from 'react';
import {
  RotateCcw, FlipHorizontal, FlipVertical, Edit2, Undo2, Redo2, Minus, Plus
} from 'lucide-react';

const TopToolbar = ({
  pageName,
  isEditingPageName,
  setPageName,
  setIsEditingPageName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  handleZoom
}) => {
  return (
    <div 
      className="bg-white border-b border-gray-200 flex items-center justify-between px-[2vw]"
      style={{ height: '6vh', minHeight: '48px', flexShrink: 0 }}
    >
      {/* Left: Undo/Redo */}
      <div className="flex items-center w-1/4" style={{ gap: '0.5vw' }}>
        <div className="flex flex-col items-center cursor-pointer group" onClick={canUndo ? onUndo : undefined}>
            <button 
                disabled={!canUndo}
                className={`p-1 rounded ${canUndo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'}`}
            >
                <Undo2 size={16} />
            </button>
            <span className={`text-[10px] ${canUndo ? 'text-gray-600' : 'text-gray-300'}`}>Undo</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer group" onClick={canRedo ? onRedo : undefined}>
            <button 
                disabled={!canRedo}
                className={`p-1 rounded ${canRedo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'}`}
            >
                <Redo2 size={16} />
            </button>
            <span className={`text-[10px] ${canRedo ? 'text-gray-600' : 'text-gray-300'}`}>Redo</span>
        </div>
      </div>

      {/* Center: Page Name (Flipbook Name) */}
      <div className="flex items-center justify-center flex-1">
        {isEditingPageName ? (
          <input
            type="text"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            onBlur={() => setIsEditingPageName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingPageName(false)}
            className="border-b border-blue-500 text-gray-900 font-medium text-center focus:outline-none"
            style={{ fontSize: '1vw', minFontSize: '14px', width: '20vw' }}
            autoFocus
          />
        ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingPageName(true)}>
                <span 
                    className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                    style={{ fontSize: '1vw', minFontSize: '14px' }}
                >
                    {pageName || 'Name of the page'}
                </span>
                <Edit2 size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
            </div>
        )}
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center justify-end w-1/4">
        <div className="flex items-center bg-gray-100 rounded-lg p-1" style={{ gap: '0.5vw' }}>
            <button 
                onClick={() => handleZoom && handleZoom(zoom - 10)}
                className="p-1 hover:bg-white rounded shadow-sm transition-colors text-gray-600"
            >
                <Minus size={14} />
            </button>
            <span className="font-medium text-gray-700 w-12 text-center" style={{ fontSize: '0.8vw', minFontSize: '12px' }}>
                {Math.round(zoom)}%
            </span>
            <button 
                onClick={() => handleZoom && handleZoom(zoom + 10)}
                className="p-1 hover:bg-white rounded shadow-sm transition-colors text-gray-600"
            >
                <Plus size={14} />
            </button>
            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
            <button 
                onClick={() => handleZoom && handleZoom(60)}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 px-1"
            >
                Reset
            </button>
        </div>
      </div>
    </div>
  );
};

// Helper for Zoom Level Display (1x = 100%) 
// Actually, 'zoom' prop is passed (e.g. 100).
// Let's use it directly in render.

export default TopToolbar;