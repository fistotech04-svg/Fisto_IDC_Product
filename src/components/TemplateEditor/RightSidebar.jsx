import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';
import IconEditor from './IconEditor';
import FileInteractionEditor from './FileInteractionEditor';
import { Layers, Edit3, Eye, Video as VideoIcon, Compass } from 'lucide-react';
import GifEditor from './Gif';
import InteractionPanel from './InteractionPanel';


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
  closePanelsSignal,
  activePopupElement,
  onPopupUpdate,
  pages,
  currentPage,
  onPDFUpload
}) => {
  const [dimensions, setDimensions] = useState({ width: 793, height: 1122 });

  useEffect(() => {
    if (selectedElement) {
      const updateDimensions = () => {
        setDimensions({
          width: selectedElement.offsetWidth || 0,
          height: selectedElement.offsetHeight || 0
        });
      };

      // Initial update
      updateDimensions();

      // Observer for style/attribute changes (resizing)
      const observer = new MutationObserver(updateDimensions);
      observer.observe(selectedElement, { 
        attributes: true, 
        attributeFilter: ['style', 'class', 'width', 'height'] 
      });

      window.addEventListener('resize', updateDimensions);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateDimensions);
      };
    } else {
      setDimensions({ width: 793, height: 1122 });
    }
  }, [selectedElement]);

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
         <div className="flex items-center justify-between pt-3 pb-1">
             <span className="text-[13px] font-semibold text-gray-800">Dimensions</span>
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium text-[11px] uppercas">W</span>
                    <div className="h-8 px-2 w-[70px] bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[12px] font-medium text-gray-700 shadow-sm">
                        {dimensions.width} px
                    </div>
                 </div>

                 <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium text-[11px] uppercase">H</span>
                    <div className="h-8 px-2 w-[70px] bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[12px] font-medium text-gray-700 shadow-sm">
                        {dimensions.height} px
                    </div>
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
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
          />
        )}

        {selectedElementType === "image" && isGif(selectedElement) && (
          <GifEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
          />
        )}

        {/* IMAGE EDITOR (non-GIF images only) */}
        {selectedElementType === "image" && !isGif(selectedElement) && (
          <ImageEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
          />
        )}
        
        {selectedElementType === 'video' && (
          <VideoEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
          />
        )}

        {selectedElementType === 'svg' && (
          <IconEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
          />
        )}
        
        {selectedElementType === 'file-interaction' && (
          <FileInteractionEditor
            selectedElement={selectedElement}
            onUpdate={onUpdate}
            pages={pages}
            currentPage={currentPage}
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            InteractionPanelComponent={InteractionPanel}
            onPDFUpload={onPDFUpload}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
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