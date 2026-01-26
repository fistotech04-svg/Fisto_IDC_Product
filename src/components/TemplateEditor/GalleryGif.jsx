import React, { useState, useRef } from "react";
import { Upload, X, Check, Replace } from "lucide-react";

export default function GalleryGif({ onClose, onUpdate, selectedElement }) {
  const [tempSelectedGif, setTempSelectedGif] = useState(null);
  const [uploadedGifs, setUploadedGifs] = useState([]);
  const galleryInputRef = useRef(null);

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's a gif
    const isGif = file.type === 'image/gif';
    
    if (!isGif) {
      alert('Please select a valid GIF file');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const newGifData = {
      id: Date.now(),
      name: file.name.split('.')[0],
      url: fileUrl,
      type: file.type
    };
    
    setUploadedGifs((prev) => [newGifData, ...prev]);
    setTempSelectedGif(newGifData);
    e.target.value = '';
  };

  const handleReplace = () => {
    if (!selectedElement || !tempSelectedGif) return;
    
    if (selectedElement.tagName === "VIDEO") {
      selectedElement.src = tempSelectedGif.url;
      const source = selectedElement.querySelector("source");
      if (source) source.src = tempSelectedGif.url;
      selectedElement.load();
    } else {
      selectedElement.src = tempSelectedGif.url;
    }

    if (onUpdate) onUpdate();
    onClose();
  };

  return (
    <div
      className="fixed z-[10000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans"
      style={{
        width: '320px',
        height: '540px',
        top: '55%',
        left: '80%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h2 className="text-mg font-bold text-gray-900">Gif Gallery</h2>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Upload Section */}
        <div className="px-4 py-2 mt-2">
          <h3 className="text-[13px] font-bold text-gray-900 mb-1">Upload your Gif</h3>
          <p className="text-[11px] text-gray-400 mb-4"><span>You Can Reuse The File Which Is Uploaded In Gallery</span><span className="text-red-500">*</span></p>
          
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-2"
          >
            <p className="text-[13px] text-gray-500 font-normal mb-3">
              Drag & Drop or <span className="text-blue-600 font-semibold">Upload</span>
            </p>
            <Upload size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
            <p className="text-[11px] text-gray-400 text-center px-4">
              Supported File : <span className="font-medium">GIF</span>
            </p>
          </div>
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleModalFileUpload}
            accept="image/gif"
            className="hidden"
          />
        </div>

        <div className="px-5 py-4">
          <h3 className="text-[13px] font-bold text-gray-900 mb-4">Your Uploads</h3>

          {/* Grid View */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            {uploadedGifs.map((item, i) => (
              <div
                key={i}
                onClick={() => setTempSelectedGif(item)}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className={`relative aspect-video w-full rounded-xl overflow-hidden border-2 transition-all shadow-sm ${tempSelectedGif?.url === item.url ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-gray-200'}`}>
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  
                  {/* Selection Overlay */}
                  {tempSelectedGif?.url === item.url && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check size={14} className="text-indigo-600" />
                        </div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium text-center truncate w-full px-1">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
          
          {uploadedGifs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No uploaded GIFs yet</p>
              <p className="text-xs mt-1">Upload a GIF or video to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex justify-end gap-2 bg-white">
        <button
          onClick={onClose}
          className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"
        >
          <X size={12} /> Close
        </button>
        <button
          disabled={!tempSelectedGif}
          onClick={handleReplace}
          className="flex-1 h-8 bg-black text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-zinc-800 disabled:opacity-50"
        >
          <Replace size={12} /> Replace
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
}