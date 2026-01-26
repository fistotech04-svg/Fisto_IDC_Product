import { useRef, useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Upload,
  ArrowRightLeft,
  ChevronUp,
  ChevronDown,
  Edit3,
} from "lucide-react";
import GalleryGif from "./GalleryGif";
import InteractionPanel from './InteractionPanel';

const galleryPreviewImages = [
  "https://convertico.com/samples/download.php?format=gif&file=mesmerizing-motion-gif.gif",
  "https://www.easygifanimator.net/images/samples/video-to-gif-sample.gif",
  "https://psdgang.com//wp-content/uploads/2017/04/009.gif"
];

const GifEditor = ({ selectedElement, onUpdate, onPopupPreviewUpdate }) => {
  const fileInputRef = useRef(null);
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const open = activeSection === 'main';
  const [openGallery, setOpenGallery] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [imageType, setImageType] = useState('Fill');
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);

  // Sync opacity and object-fit when element changes
  useEffect(() => {
    if (selectedElement) {
      const currentOpacity = selectedElement.style.opacity;
      setOpacity(currentOpacity ? Math.round(Number(currentOpacity) * 100) : 100);

      const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'none': 'Crop' };
      const currentFit = selectedElement.style.objectFit || 'cover';
      setImageType(fitMapRev[currentFit] || 'Fill');
    }
  }, [selectedElement]);
  
  const updateImageType = (type) => {
    setImageType(type);
    if (selectedElement) {
      const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover' };
      selectedElement.style.objectFit = fitMap[type] || 'cover';
      onUpdate?.();
    }
  };

  const handleOpacityChange = (e) => {
    const value = Number(e.target.value);
    setOpacity(value);

    if (selectedElement) {
      selectedElement.style.opacity = value / 100;
      onUpdate?.();
    }
  };

  // 🔒 Always mark selected image as GIF
  useEffect(() => {
    if (
      selectedElement?.tagName === "IMG" &&
      selectedElement.dataset.mediaType !== "gif"
    ) {
      selectedElement.dataset.mediaType = "gif";
    }
  }, [selectedElement]);

  // ✅ Direct GIF upload
  const handleGifUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/gif") {
      alert("Please upload a GIF file");
      return;
    }

    const url = URL.createObjectURL(file);

    if (selectedElement?.tagName === "IMG") {
      if (selectedElement.src?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedElement.src);
      }

      selectedElement.src = url;
      selectedElement.dataset.mediaType = "gif";
      onUpdate?.();
    }
  };

  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <ImageIcon className="mx-auto mb-2" size={32} />
        <p>Click on a GIF to edit</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative font-sans mb-3">
        {/* HEADER */}
        <div
          onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}
          className="flex items-center justify-between px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Edit3 size={16} className="text-gray-600" />
            <span className="font-medium text-gray-800 text-[15px]">Gif</span>
          </div>
          <ChevronUp size={16} className={`text-gray-500 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
        </div>

        {/* CONTENT */}
        {open && (
          <div className="pr-5 pl-5 mb-5 pt-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Upload your Gif</span>
                <div className="h-[2px] w-full bg-gray-200" />
              </div>

              {/* FILE INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/gif"
                onChange={handleGifUpload}
                className="hidden"
              />

              <div className="flex items-center justify-between gap-3">
                {/* Current Image */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-[72px] h-[72px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedElement.src}
                      alt="Current"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Swap Icon */}
                <div className="flex-shrink-0 text-gray-400">
                  <ArrowRightLeft size={20} />
                </div>

                {/* Upload Area */}
                <div className="flex-1">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[72px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-colors"
                  >
                    <Upload size={20} className="text-indigo-600 mb-1" />
                    <p className="text-[11px] text-gray-500 text-center px-2">
                      Drag & Drop or <span className="text-indigo-600 font-bold">Upload</span>
                    </p>
                  </div>
                  <p className="text-[9px] text-gray-400 text-center mt-1.5">Supported File Format : GIF</p>
                </div>
              </div>
            </div>

            {/* 2. Gallery Section */}
            <div
              className="relative h-40 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setOpenGallery(true)}
            >
              {/* Background with thumbnails mockup */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 p-4">
                <div className="flex items-end justify-center gap-3 h-full pb-10 opacity-70 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105">
                  {galleryPreviewImages.map((src, i) => (
                    <div key={i} className={`rounded-lg shadow-lg overflow-hidden bg-white border-2 border-gray-300 ${i === 1 ? 'w-24 h-24 -mb-2 z-10' : 'w-20 h-20'}`}>
                      <img src={src} alt="Gallery" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">GIF</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-5">
                <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                  <ImageIcon size={20} />
                  GIF Gallery
                </div>
              </div>
            </div>

            {/* 3. Opacity Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Opacity</h3>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={handleOpacityChange}
                  className="flex-1 appearance-none cursor-pointer"
                  style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #e5e7eb ${opacity}%, #e5e7eb 100%)`
                  }}
                />
                <span className="text-sm font-bold text-gray-800 w-12 text-right">
                  {opacity} %
                </span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* INTERACTION PANEL */}
      <InteractionPanel
        selectedElement={selectedElement}
        onUpdate={onUpdate}
        onPopupPreviewUpdate={onPopupPreviewUpdate}
        isOpen={activeSection === 'interaction'}
        onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
      />

      {/* GALLERY MODAL */}
      {openGallery && (
        <GalleryGif
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onClose={() => setOpenGallery(false)}
        />
      )}
    </>
  );
};

export default GifEditor;
