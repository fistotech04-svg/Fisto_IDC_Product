import { useState, useRef } from "react";
import { Upload, X, RefreshCw } from "lucide-react";

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1541447271487-09612b3f49f7", label: "Sea Port 1" },
  { src: "https://images.unsplash.com/photo-1517420704212-6804d8c97371", label: "Sea Port 2" },
  { src: "https://images.unsplash.com/photo-1582005131393-545703056094", label: "Sea Port 3" },
  { src: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122", label: "Cutting Machine" },
  { src: "https://images.unsplash.com/photo-1581092160562-40aa08e78837", label: "Lathe Machine" },
  { src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", label: "Operator" },
  { src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8", label: "Study Materials" },
  { src: "https://images.unsplash.com/photo-1501504905252-473c47e087f8", label: "Digital Education" },
  { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f", label: "Classroom" },
];

// Ensure this name matches what you import in VideoEditor.jsx
export default function VideoGalleryModal({ onClose, onUpdate, selectedElement }) {
  const [activeTab, setActiveTab] = useState("gallery");
  const [selectedSrc, setSelectedSrc] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newImage = { src: url, label: file.name.split('.')[0] };
    setUploadedImages([newImage, ...uploadedImages]);
    setSelectedSrc(url);
  };

  const handleReplace = () => {
    if (!selectedElement || !selectedSrc) return;
    
    // Logic for updating video or image elements
    if (selectedElement.tagName === "VIDEO") {
      selectedElement.src = selectedSrc;
      const source = selectedElement.querySelector("source");
      if (source) source.src = selectedSrc;
      selectedElement.load();
    } else {
      selectedElement.src = selectedSrc;
    }

    if (onUpdate) onUpdate();
    onClose();
  };

  return (
    <div 
      className="fixed z-[10000] bg-white border border-gray-100 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        width: '320px',           
        height: '540px',          
        top: '55%',               
        left: '80%',              
        transform: 'translate(-50%, -50%)' 
      }}
    >
      {/* Tab Headers */}
      <div className="flex px-4 pt-3 border-b bg-white">
        <button
          onClick={() => setActiveTab("gallery")}
          className={`flex-1 pb-2 text-[12px] font-bold transition-all ${
            activeTab === "gallery" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"
          }`}
        >
          Video Gallery
        </button>
        <button
          onClick={() => setActiveTab("uploaded")}
          className={`flex-1 pb-2 text-[12px] font-bold transition-all ${
            activeTab === "uploaded" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"
          }`}
        >
          Uploaded Images
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {activeTab === "gallery" ? (
          <div>
            <h3 className="text-[11px] font-bold text-black mb-3 uppercase tracking-wider">Recent</h3>
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.map((img, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    onClick={() => setSelectedSrc(img.src)}
                    className={`w-full aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedSrc === img.src ? "border-black shadow-md" : "border-transparent bg-gray-50"
                    }`}
                  >
                    <img src={img.src} className="w-full h-full object-cover" alt="" />
                  </div>
                  <span className="text-[9px] mt-1 text-gray-500 text-center truncate w-full">{img.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <h3 className="text-[11px] font-bold text-black mb-3 uppercase tracking-wider">Upload your file</h3>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
            
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors mb-4"
            >
              <Upload size={20} className="mb-2" />
              <p className="text-[11px]">Drag & Drop or <span className="text-blue-600 font-medium">Upload</span></p>
              <p className="text-[9px] mt-1">JPG, PNG, MP4</p>
            </div>

            <h3 className="text-[11px] font-bold text-black mb-3 uppercase tracking-wider">Uploaded</h3>
            <div className="grid grid-cols-3 gap-3">
              {uploadedImages.map((img, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    onClick={() => setSelectedSrc(img.src)}
                    className={`w-full aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedSrc === img.src ? "border-black shadow-md" : "border-transparent bg-gray-50"
                    }`}
                  >
                    <img src={img.src} className="w-full h-full object-cover" alt="" />
                  </div>
                  <span className="text-[9px] mt-1 text-gray-500 text-center truncate w-full">{img.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex justify-center gap-2 bg-white">
        <button
          onClick={onClose}
          className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"
        >
          <X size={12} /> Close
        </button>
        <button
          onClick={handleReplace}
          disabled={!selectedSrc}
          className="flex-1 h-8 bg-black text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-zinc-800 disabled:opacity-50"
        >
          <RefreshCw size={12} /> Replace
        </button>
      </div>
    </div>
  );
}