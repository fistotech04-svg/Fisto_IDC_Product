// CanvasArea.jsx
import React from 'react';
import {
  Plus, Type, Square, Circle, Triangle, Minus,
  Image as ImageIcon, Copy, Trash2, X,
  ChevronDown, ChevronUp, Layers, RefreshCw
} from 'lucide-react';

const CanvasArea = ({
  wrapperRef,
  canvasContainerRef,
  canvasRef,
  activeObject,
  pages,
  currentPage,
  zoom,
  rotation,
  isLoading,
  setShowTemplateModal,
  addText,
  addShape,
  addImage,
  duplicateSelected,
  deleteSelected,
  clearCanvas,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  updatePropertiesFromObject,
  resetProperties
}) => {
  const CANVAS_WIDTH = 595;
  const CANVAS_HEIGHT = 842;

  return (
    <div
      ref={wrapperRef}
      className="flex-1 overflow-auto bg-slate-200 flex flex-col items-center py-6 relative min-h-0"
    >
      {/* Floating Action Bar */}
      <div className="bg-white rounded-xl shadow-lg px-3 py-2 mb-4 flex items-center gap-1 text-xs font-medium text-gray-600 flex-shrink-0 z-10">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-3 py-2 rounded-lg"
        >
          <Plus size={14} /> Template
        </button>
        
        <div className="w-px h-6 bg-gray-200" />
        
        <button
          onClick={() => addText()}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-3 py-2 rounded-lg"
          title="Add Text"
        >
          <Type size={14} /> Text
        </button>
        
        <div className="w-px h-6 bg-gray-200" />
        
        <button
          onClick={() => addShape('rect')}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-2 py-2 rounded-lg"
          title="Rectangle"
        >
          <Square size={14} />
        </button>
        <button
          onClick={() => addShape('circle')}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-2 py-2 rounded-lg"
          title="Circle"
        >
          <Circle size={14} />
        </button>
        <button
          onClick={() => addShape('triangle')}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-2 py-2 rounded-lg"
          title="Triangle"
        >
          <Triangle size={14} />
        </button>
        <button
          onClick={() => addShape('line')}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-2 py-2 rounded-lg"
          title="Line"
        >
          <Minus size={14} />
        </button>
        
        <div className="w-px h-6 bg-gray-200" />
        
        <label className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-3 py-2 rounded-lg cursor-pointer">
          <ImageIcon size={14} /> Image
          <input
            type="file"
            accept="image/*"
            onChange={addImage}
            className="hidden"
          />
        </label>
        
        <div className="w-px h-6 bg-gray-200" />
        
        <button
          onClick={duplicateSelected}
          disabled={!activeObject}
          className="flex items-center gap-1.5 hover:bg-gray-100 transition-colors px-2 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          title="Duplicate (Ctrl+D)"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={deleteSelected}
          disabled={!activeObject}
          className="flex items-center gap-1.5 hover:bg-red-50 hover:text-red-500 transition-colors px-2 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
        
        <div className="w-px h-6 bg-gray-200" />
        
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 hover:bg-orange-50 hover:text-orange-500 transition-colors px-3 py-2 rounded-lg"
          title="Clear Canvas"
        >
          <X size={14} /> Clear
        </button>
      </div>

      {/* Layer Controls */}
      {activeObject && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-1.5 flex items-center gap-1 z-10">
          <span className="text-xs text-gray-500 px-2">Layer:</span>
          <button
            onClick={sendToBack}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center"
            title="Send to Back (Ctrl+Shift+[)"
          >
            <ChevronDown size={14} />
            <ChevronDown size={14} className="-ml-2" />
          </button>
          <button
            onClick={sendBackward}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
            title="Send Backward (Ctrl+[)"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={bringForward}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
            title="Bring Forward (Ctrl+])"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={bringToFront}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center"
            title="Bring to Front (Ctrl+Shift+])"
          >
            <ChevronUp size={14} />
            <ChevronUp size={14} className="-ml-2" />
          </button>
        </div>
      )}

      {/* Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="bg-white shadow-2xl relative flex-shrink-0"
        style={{
          width: CANVAS_WIDTH * (zoom / 100),
          height: CANVAS_HEIGHT * (zoom / 100),
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <canvas ref={canvasRef} />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20 rounded">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">{isLoading}</span>
            </div>
          </div>
        )}

        {/* Page indicator */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {currentPage + 1} / {pages.length}
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;