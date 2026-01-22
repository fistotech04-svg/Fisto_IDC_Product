import React from 'react';
import TextEditor from './TextEditor';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';
import IconEditor from './IconEditor';
import { Layers, Edit3, Eye, Video as VideoIcon, Compass } from 'lucide-react';
import GifEditor from './Gif';


const isGif = (el) => {
  if (!el) return false;
  if (el.tagName !== "IMG") return false;

  // PRIMARY source of truth
  if (el.dataset?.mediaType === "gif") return true;

  // Fallback (for existing assets)
  return el.src?.toLowerCase().endsWith(".gif");
};

const RightSidebar = ({
  selectedElement,
  selectedElementType,
  onUpdate,
  isDoublePage,
  setIsDoublePage,
  openPreview,
  onPopupPreviewUpdate,
  closePanelsSignal
}) => {
  return (
    <aside className="w-[25vw] bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0">
      
      {/* ================= Display Controls (New Top Section) ================= */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-4">
         {/* Preview & Double Page Toggle Row */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsDoublePage && setIsDoublePage(!isDoublePage)}
                    className={`
                        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ease-in-out
                        ${isDoublePage ? 'bg-indigo-600' : 'bg-gray-200'}
                    `}
                >
                    <span className="sr-only">Use setting</span>
                    <span
                        aria-hidden="true"
                        className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                            transition duration-200 ease-in-out
                            ${isDoublePage ? 'translate-x-5' : 'translate-x-0'}
                        `}
                    />
                </button>
                <span className="text-gray-700 font-medium text-sm">Double Page</span>
            </div>

            <button
                onClick={openPreview}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors shadow-sm"
            >
                <Eye size={14} /> Preview
            </button>
         </div>

         {/* Dimensions Row */}
         <div className="flex items-center justify-between pt-2">
             <span className="text-sm font-semibold text-gray-900">Dimension :</span>
                 <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium text-xs">W</span>
                    <div className="border border-gray-400 rounded px-2 py-1 text-gray-900 min-w-[50px] text-center font-medium text-xs bg-white">
                        210
                    </div>
                 </div>

                 <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium text-xs">H</span>
                    <div className="border border-gray-400 rounded px-2 py-1 text-gray-900 min-w-[50px] text-center font-medium text-xs bg-white">
                        297
                    </div>
                 </div>
         </div>
      </div>


      {/* ================= Properties Header ================= */}
      {/* <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedElementType === 'text' ? <Edit3 size={16} className="text-blue-500" /> : 
             selectedElementType === 'video' ? <VideoIcon size={16} className="text-purple-500" /> :
             selectedElementType === 'svg' ? <Compass size={16} className="text-orange-500" /> :
             <Layers size={16} className="text-gray-500" />}
            <h3 className="font-semibold text-gray-800">
                {selectedElementType === 'text' ? 'Text Properties' : 
                 selectedElementType === 'image' ? 'Image Properties' : 
                 selectedElementType === 'video' ? 'Video Properties' : 
                 selectedElementType === 'svg' ? 'Icon Properties' : 'Properties'}
            </h3>
          </div>
          {selectedElementType && (
             <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium capitalize">
                 {selectedElementType === 'svg' ? 'Icon' : selectedElementType}
             </span>
          )}
      </div> */}

      {/* ================= Context-Sensitive Editor ================= */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedElementType === 'text' && (
          <TextEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            closePanelsSignal={closePanelsSignal}
          />
        )}

        {selectedElementType === "image" && isGif(selectedElement) && (
          <GifEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
          />
        )}

        {/* IMAGE EDITOR (non-GIF images only) */}
        {selectedElementType === "image" && !isGif(selectedElement) && (
          <ImageEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
          />
        )}
        
        {selectedElementType === 'video' && (
          <VideoEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
          />
        )}

        {selectedElementType === 'svg' && (
          <IconEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
          />
        )}
        
        {!selectedElementType && (
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
            <Layers className="mx-auto mb-3 opacity-20" size={48} />
            <p className="text-sm font-medium text-gray-500">No element selected</p>
            <p className="text-xs mt-1 max-w-[200px]">Click on any text, image, icon or video in the canvas to edit its properties.</p>
          </div>
        )}
      </div>

    </aside>
  );
};

export default RightSidebar;