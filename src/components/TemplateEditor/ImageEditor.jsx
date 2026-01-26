import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Link2Off,
  Edit3,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pipette,
  MousePointerClick,
  Sparkles,
  Repeat,
  ArrowLeft,
  ArrowRight,
  Filter,
  Pencil,
  Search,
  Maximize2,
  Check,
} from 'lucide-react';
import InteractionPanel from './InteractionPanel';

const ImageCropOverlay = ({ imageSrc, onSave, onCancel, element }) => {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  const [crop, setCrop] = useState({ top: 15, left: 15, width: 70, height: 70 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); 
  const [startPos, setStartPos] = useState({ x: 0, y: 0, crop: {} });

  useEffect(() => {
    if (element) {
        const cp = element.style.clipPath || element.style.webkitClipPath || '';
        if (cp.includes('inset')) {
            const m = cp.match(/inset\(([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\)/);
            if (m) {
                const t = parseFloat(m[1]), r = parseFloat(m[2]), b = parseFloat(m[3]), l = parseFloat(m[4]);
                setCrop({ top: t, left: l, width: Math.max(1, 100 - l - r), height: Math.max(1, 100 - t - b) });
            }
        }
    }
  }, [element]);

  const updateDisplaySize = useCallback(() => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
            setDisplaySize({ width: rect.width, height: rect.height });
        }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateDisplaySize, 150);
    window.addEventListener('resize', updateDisplaySize);
    return () => { window.removeEventListener('resize', updateDisplaySize); clearTimeout(timer); };
  }, [updateDisplaySize]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    updateDisplaySize();
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true); setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !displaySize.width) return;
    const dx = ((e.clientX - startPos.x) / displaySize.width) * 100;
    const dy = ((e.clientY - startPos.y) / displaySize.height) * 100;

    setCrop(prev => {
      let next = { ...prev };
      if (dragType === 'move') {
        next.left = Math.max(0, Math.min(100 - prev.width, startPos.crop.left + dx));
        next.top = Math.max(0, Math.min(100 - prev.height, startPos.crop.top + dy));
      } else {
        const MIN_SIZE = 5;
        if (dragType.includes('t')) {
            const newTop = Math.max(0, Math.min(startPos.crop.top + startPos.crop.height - MIN_SIZE, startPos.crop.top + dy));
            next.height = startPos.crop.height + (startPos.crop.top - newTop);
            next.top = newTop;
        }
        if (dragType.includes('b')) next.height = Math.max(MIN_SIZE, Math.min(100 - prev.top, startPos.crop.height + dy));
        if (dragType.includes('l')) {
            const newLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
            next.width = startPos.crop.width + (startPos.crop.left - newLeft);
            next.left = newLeft;
        }
        if (dragType.includes('r')) next.width = Math.max(MIN_SIZE, Math.min(100 - prev.left, startPos.crop.width + dx));
      }
      return next;
    });
  }, [isDragging, dragType, startPos, displaySize]);

  useEffect(() => {
    const handleMouseUp = () => { setIsDragging(false); setDragType(null); };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, handleMouseMove]);

  const handleApply = useCallback(() => {
    // 1. Inset for clip-path
    const inset = `inset(${crop.top.toFixed(2)}% ${(100 - crop.left - crop.width).toFixed(2)}% ${(100 - crop.top - crop.height).toFixed(2)}% ${crop.left.toFixed(2)}%)`;
    
    // 2. Zoom logic: How much do we need to scale to make the crop area fill the box?
    // Scale = 100 / cropDimension
    const scaleX = 100 / Math.max(1, crop.width);
    const scaleY = 100 / Math.max(1, crop.height);
    const scale = Math.min(scaleX, scaleY);
    
    // 3. Offset to center the crop area
    const offX = -(crop.left + (crop.width / 2) - 50) * scale;
    const offY = -(crop.top + (crop.height / 2) - 50) * scale;

    onSave({ inset, scale, offX, offY });
  }, [crop, onSave]);

  const currentPixelSize = {
    w: Math.round((crop.width / 100) * naturalSize.width) || 0,
    h: Math.round((crop.height / 100) * naturalSize.height) || 0
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[999999] bg-black/95 flex flex-col items-center justify-center p-6 md:p-12 font-sans select-none animate-in fade-in duration-300 backdrop-blur-sm"
      onMouseDown={(e) => e.target === overlayRef.current && onCancel()}
    >
      <style>{`
        .checkerboard {
            background-image: linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            background-color: #111;
        }
      `}</style>

      <div className="w-full max-w-5xl flex items-center justify-between mb-8 text-white px-4">
        
        <div className="flex items-center gap-3 pl-250">
          <button onClick={onCancel} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-bold text-sm border border-white/10">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-bold text-sm border border-white/10">
             Done
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
        <div 
            ref={containerRef} 
            className="relative inline-block shadow-[0_0_100px_rgba(0,0,0,0.5)] checkerboard rounded-lg overflow-hidden border border-white/5"
        >
          <img 
            ref={imageRef} 
            src={imageSrc} 
            onLoad={handleImageLoad} 
            className="max-w-full max-h-[65vh] block opacity-90 transition-opacity duration-500" 
            alt="To crop" 
            draggable={false} 
          />
          
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          
          <div 
            className="absolute z-10 cursor-move border-[2px] border-white border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{ 
              top: `${crop.top}%`, 
              left: `${crop.left}%`, 
              width: `${crop.width}%`, 
              height: `${crop.height}%` 
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-[#0095FF] text-white text-[12px] font-bold px-4 py-1.5 rounded-full shadow-2xl whitespace-nowrap z-20 transform hover:scale-110 transition-transform">
              {currentPixelSize.w} × {currentPixelSize.h}
            </div>

            {[
              { id: 'tl', pos: '-top-2.5 -left-2.5 cursor-nwse-resize' },
              { id: 'tr', pos: '-top-2.5 -right-2.5 cursor-nesw-resize' },
              { id: 'bl', pos: '-bottom-2.5 -left-2.5 cursor-nesw-resize' },
              { id: 'br', pos: '-bottom-2.5 -right-2.5 cursor-nwse-resize' },
              { id: 't', pos: '-top-2.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
              { id: 'b', pos: '-bottom-2.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
              { id: 'l', pos: 'top-1/2 -left-2.5 -translate-y-1/2 cursor-ew-resize' },
              { id: 'r', pos: 'top-1/2 -right-2.5 -translate-y-1/2 cursor-ew-resize' }
            ].map(h => (
              <div 
                key={h.id} 
                className={`absolute bg-[#0095FF] w-5 h-5 z-20 border-2 border-white shadow-lg active:scale-125 transition-transform rounded-sm ${h.pos}`} 
                onMouseDown={(e) => handleMouseDown(e, h.id)} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageEditor = ({ selectedElement, onUpdate, onPopupPreviewUpdate }) => {
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const stateRef = useRef({ imageType: 'Fit', opacity: 100, radius: { tl: 12, tr: 12, br: 12, bl: 12 }, previewSrc: selectedElement?.src });
  const isUpdatingDOM = useRef(false);

  const [activeSection, setActiveSection] = useState('main');
  const isMainPanelOpen = activeSection === 'main';
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [isRadiusLinked, setIsRadiusLinked] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [galleryView, setGalleryView] = useState('template');
  const [tempSelectedImage, setTempSelectedImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(selectedElement?.src);
  const [imageType, setImageType] = useState('Fit');
  const [opacity, setOpacity] = useState(100);
  const [isCropping, setIsCropping] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 12, tr: 12, br: 12, bl: 12 });
  const [activeEffects, setActiveEffects] = useState(['effect']);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 8, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 0, y: 0, blur: 10, spread: 0 },
    'Blur': { blur: 5, spread: 0 },
    'Background Blur': { blur: 10, spread: 0 }
  });

  const galleryImages = [
    { name: 'Sea Port 1', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
    { name: 'Sea Port 2', url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206' },
    { name: 'Sea Port 3', url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda' },
    { name: 'Cutting Machine', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158' },
    { name: 'AI', url: 'https://plus.unsplash.com/premium_photo-1764695426527-8f344be39993?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { name: 'Operator', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837' }
  ];

  const [uploadedImages, setUploadedImages] = useState([]);

  useEffect(() => {
    if (!stateRef.current) stateRef.current = {};
    stateRef.current = { ...stateRef.current, imageType, opacity, radius, previewSrc };
  });

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.)');
      e.target.value = '';
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    const newImageData = { id: Date.now(), name: file.name, url: imageUrl };
    setUploadedImages((prev) => [newImageData, ...prev]);
    if (selectedElement) {
      selectedElement.src = imageUrl;
      if (onUpdate) onUpdate();
    }
    e.target.value = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.)');
      e.target.value = '';
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    if (selectedElement) {
      selectedElement.src = imageUrl;
      if (onUpdate) onUpdate();
    }
    e.target.value = '';
  };

  const syncStateFromDOM = useCallback(() => {
    if (!selectedElement) return;

    // 1. Sync Opacity
    const domOpacity = selectedElement.style.opacity || '1';
    const newOpacity = Math.round(parseFloat(domOpacity) * 100);
    if (newOpacity !== opacity) setOpacity(newOpacity);

    // 2. Sync Radius
    const domRadius = selectedElement.style.borderRadius || '0px';
    const radiusVal = parseFloat(domRadius) || 0;
    if (radius.tl !== radiusVal) { 
        setRadius({ tl: radiusVal, tr: radiusVal, br: radiusVal, bl: radiusVal });
    }

    // 3. Sync Image Type (Object Fit & Crop)
    const inlineFit = selectedElement.style.objectFit;
    const cp = selectedElement.style.clipPath || selectedElement.style.webkitClipPath || '';
    const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill' };
    const currentFit = inlineFit || window.getComputedStyle(selectedElement).objectFit || 'contain';
    const hasCrop = cp.includes('inset');
    const newType = hasCrop ? 'Crop' : (fitMapRev[currentFit] || 'Fit');
    
    // Only call setState if the DOM actually changed from what we think it is
    if (newType !== stateRef.current.imageType) {
        setImageType(newType);
        stateRef.current.imageType = newType;
    }

    // 4. Sync Src
    if (selectedElement.src !== previewSrc) {
        setPreviewSrc(selectedElement.src);
    }

    // 5. Sync Active Effects
    const filterStr = selectedElement.style.filter || '';
    const backdropStr = selectedElement.style.backdropFilter || selectedElement.style.webkitBackdropFilter || '';
    const overlay = selectedElement.parentElement?.querySelector('.inner-shadow-overlay');
    const shadowStr = selectedElement.style.boxShadow || (overlay ? overlay.style.boxShadow : '') || '';
    const newEffects = [];
    if (/blur\(\d+px\)/.test(filterStr)) newEffects.push('Blur');
    if (filterStr.includes('drop-shadow')) newEffects.push('Drop Shadow');
    if (backdropStr.includes('blur')) newEffects.push('Background Blur');
    if (shadowStr.includes('inset')) newEffects.push('Inner Shadow');
    setActiveEffects(prev => {
        const currentRealEffects = prev.filter(e => e !== 'effect');
        const isSame = newEffects.length === currentRealEffects.length && newEffects.every(e => currentRealEffects.includes(e));
        if (isSame) return prev;
        return prev.includes('effect') ? ['effect', ...newEffects] : newEffects;
    });
  }, [selectedElement, opacity, radius.tl, previewSrc]);

  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
        if (isUpdatingDOM.current) return;
        const relevantMutation = mutations.some(m => m.type === 'attributes' && (m.attributeName === 'src' || m.attributeName === 'style'));
        if (relevantMutation) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true, attributeFilter: ['style', 'src'] });
    syncStateFromDOM();
    return () => {
        observer.disconnect();
        isUpdatingDOM.current = false;
    };
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    if (!selectedElement) return;
    isUpdatingDOM.current = true;
    try {
        let filterString = `brightness(${100 + filters.exposure}%) contrast(${100 + filters.contrast}%) saturate(${100 + filters.saturation}%) hue-rotate(${filters.tint}deg) sepia(${filters.temperature > 0 ? filters.temperature : 0}%)`;
        const highlightEffect = filters.highlights / 5;
        const shadowEffect = filters.shadows / 5;
        filterString += ` brightness(${100 + highlightEffect}%) contrast(${100 + shadowEffect}%)`;
        if (activeEffects.includes('Blur')) filterString += ` blur(${effectSettings['Blur'].blur}px)`;
        if (activeEffects.includes('Drop Shadow')) {
            const s = effectSettings['Drop Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            filterString += ` drop-shadow(${s.x}px ${s.y}px ${s.blur}px ${colorWithAlpha})`;
        }
        selectedElement.style.setProperty('filter', filterString, 'important');
        selectedElement.style.setProperty('opacity', (opacity / 100).toString(), 'important');

        if (activeEffects.includes('Background Blur')) {
            const s = effectSettings['Background Blur'];
            const blurVal = `blur(${s.blur}px)`;
            selectedElement.style.setProperty('backdrop-filter', blurVal, 'important');
            selectedElement.style.setProperty('-webkit-backdrop-filter', blurVal, 'important');
            if (selectedElement.src) {
                selectedElement.style.setProperty('mask-image', `url(${selectedElement.src})`, 'important');
                selectedElement.style.setProperty('-webkit-mask-image', `url(${selectedElement.src})`, 'important');
                selectedElement.style.setProperty('mask-repeat', 'no-repeat', 'important');
                selectedElement.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
                const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover' };
                const objectFit = fitMap[imageType] || 'contain';
                selectedElement.style.setProperty('mask-size', objectFit, 'important');
                selectedElement.style.setProperty('-webkit-mask-size', objectFit, 'important');
                selectedElement.style.setProperty('mask-position', 'center', 'important');
                selectedElement.style.setProperty('-webkit-mask-position', 'center', 'important');
            }
        } else {
            selectedElement.style.setProperty('backdrop-filter', 'none', 'important');
            selectedElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
            selectedElement.style.setProperty('mask-image', 'none', 'important');
            selectedElement.style.setProperty('-webkit-mask-image', 'none', 'important');
        }

        const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover' };
        const objectFit = fitMap[imageType] || 'contain';
        selectedElement.style.setProperty('object-fit', objectFit, 'important');
        
        // Force dimensions for Fill and Crop to ensure they actually occupy the area
        if (imageType === 'Fill' || imageType === 'Crop') {
            selectedElement.style.setProperty('width', '100%', 'important');
            selectedElement.style.setProperty('height', '100%', 'important');
        }

        if (imageType !== 'Crop') {
            selectedElement.style.removeProperty('clip-path');
            selectedElement.style.removeProperty('-webkit-clip-path');
            selectedElement.style.removeProperty('transform');
        }

        let shadowString = "";
        if (activeEffects.includes('Inner Shadow')) {
            const s = effectSettings['Inner Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            shadowString += `inset ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${colorWithAlpha}`;
        }
        if (selectedElement.tagName !== 'IMG') {
            selectedElement.style.setProperty('box-shadow', shadowString, 'important');
        } else {
            let overlay = selectedElement.parentElement?.querySelector('.inner-shadow-overlay');
            if (activeEffects.includes('Inner Shadow') && shadowString) {
                if (!overlay && selectedElement.parentElement) {
                    overlay = document.createElement('div');
                    overlay.className = 'inner-shadow-overlay';
                    overlay.style.position = 'absolute';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.pointerEvents = 'none';
                    overlay.style.zIndex = '2';
                    if (window.getComputedStyle(selectedElement.parentElement).position === 'static') {
                        selectedElement.parentElement.style.position = 'relative';
                    }
                    selectedElement.parentElement.appendChild(overlay);
                }
                if (overlay) {
                    overlay.style.boxShadow = shadowString;
                    overlay.style.borderRadius = selectedElement.style.borderRadius;
                }
            } else if (overlay) overlay.remove();
        }
        if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
            if (selectedElement.parentElement) selectedElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
        if (onUpdate) onUpdate();
    } finally {
        // Increase delay to ensure all browser style mutations are processed
        setTimeout(() => { isUpdatingDOM.current = false; }, 250);
    }
  }, [selectedElement, filters, activeEffects, effectSettings, opacity, imageType, onUpdate]);

  useEffect(() => { applyVisuals(); }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
    selectedElement.style.borderRadius = `${next.tl}px ${next.tr}px ${next.br}px ${next.bl}px`;
    if (onUpdate) onUpdate();
  };

  const updateEffectSetting = (effect, key, value) => {
    setEffectSettings(prev => ({ ...prev, [effect]: { ...prev[effect], [key]: value } }));
  };

  const handleColorPick = async (effectName) => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      updateEffectSetting(effectName, 'color', result.sRGBHex);
    } catch (e) {
      console.error('Color selection cancelled or failed', e);
    }
  };

  const RadiusBox = ({ corner, value, radiusStyle }) => (
    <div className={`relative flex items-center bg-white border border-gray-200 ${radiusStyle} w-24 h-12 shadow-sm px-2`}>
      <div className="flex items-center justify-between w-full">
        <button onClick={() => updateRadius(corner, value - 1)} className="text-gray-300 hover:text-indigo-500 transition-colors p-1"><ChevronLeft size={14} strokeWidth={1.5} /></button>
        <input type="number" value={value} onChange={(e) => updateRadius(corner, e.target.value)} className="w-full text-center text-[13px] font-bold outline-none bg-transparent text-gray-800" />
        <button onClick={() => updateRadius(corner, value + 1)} className="text-gray-300 hover:text-indigo-500 transition-colors p-1"><ChevronRight size={14} strokeWidth={1.5} /></button>
      </div>
    </div>
  );

  const EffectControlRow = ({ label, value, onChange, min = -100, max = 100 }) => (
    <div className="flex items-center gap-2">
      <span className="text-[14px] text-gray-800 font-normal w-[70px]">{label} :</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={18} strokeWidth={2} /></button>
        <input type="number" value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))} className="w-[70px] h-8 text-center border border-gray-300 rounded-lg text-[14px] font-normal text-gray-800 outline-none focus:border-gray-400" />
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight size={18} strokeWidth={2} /></button>
      </div>
    </div>
  );

  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-4 w-full max-w-sm">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type='range']::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #6366f1; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-top: -5px; cursor: pointer; }
      `}</style>
      <div className="bg-white border space-y-4 border-gray-200 rounded-lg shadow-sm overflow-hidden relative font-sans">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}>
          <div className="flex items-center gap-2">
            <Edit3 size={16} className="text-gray-600" />
            <span className="font-medium text-gray-800 text-[15px]">Image</span>
          </div>
          <ChevronUp size={16} className={`text-gray-500 transition-transform duration-200 ${isMainPanelOpen ? '' : 'rotate-180'}`} />
        </div>

        {isMainPanelOpen && (
          <div className="space-y-5 pr-5 pl-5 mb-15 ">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Upload your Image</span>
                <div className="h-[2px] w-full bg-gray-200" />
              </div>

              <div className="flex items-center justify-between relative z-20">
                <span className="text-[12px] font-bold text-gray-700">Select the Image type :</span>
                <div className="relative">
                  <button 
                    onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)} 
                    className="flex items-center justify-between w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[13px] font-bold text-gray-700">{imageType}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showImageTypeDropdown && (
                    <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowImageTypeDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-[100] flex flex-col py-1 animate-in fade-in zoom-in-95 duration-150">
                      {['Fit', 'Fill', 'Crop'].map((type) => (
                        <button 
                          key={type} 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation();
                            setImageType(type); 
                            stateRef.current.imageType = type;
                            setShowImageTypeDropdown(false); 
                            if (type === 'Crop') {
                                setTimeout(() => setIsCropping(true), 50);
                            }
                          }} 
                          className={"px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-18 h-18 rounded-xl overflow-hidden  border-2 border-dashed bg-gray-50 ">
                  <img src={previewSrc || selectedElement.src} className="w-full h-full object-cover" alt="preview" />
                </div>
                <Replace size={18} className="text-gray-300 shrink-0" />
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-18 border-2 border-dashed bg-gray-50 rounded-xl flex flex-col items-center justify-center cursor-pointer">
                  <Upload size={18} className="text-500 mb-1" />
                  <p className="text-[10px] text-gray-400 font-medium text-center">Drag & Drop or <span className="font-bold text-indigo-600">Upload</span></p>
                </div>
              </div>

              <div onClick={() => { setShowGallery(true); setGalleryView('template'); }} className="relative h-40 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 select-none">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 p-4">
                  <div className="flex items-end justify-center gap-3 h-full pb-10 opacity-70 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105">
                    {galleryImages.slice(0, 3).map((img, i) => (
                      <div key={i} className={`rounded-lg shadow-lg overflow-hidden bg-white border-2 border-gray-300 ${i === 1 ? 'w-24 h-24 -mb-2 z-10' : 'w-20 h-20'}`}>
                        <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide"><ImageIcon size={20} />Image Gallery</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Opacity</span>
                <div className="h-[2px] w-full bg-gray-200" />
              </div>
              <div className="flex items-center gap-3 px-1">
                <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-1 rounded- appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)` }} />
                <span className="text-[11px] font-bold text-gray-700 w-10 text-right">{opacity}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <button onClick={() => setOpenSubSection(openSubSection === 'adjustments' ? null : 'adjustments')} className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold text-gray-800">
                  <span>Adjustments</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${openSubSection === 'adjustments' ? 'rotate-180' : ''}`} />
                </button>
                {openSubSection === 'adjustments' && (
                  <div className="px-5 pb-5 space-y-5 animate-in slide-in-from-top-2">
                    {[
                      ['Exposure', 'exposure', -100, 100], ['Contrast', 'contrast', -100, 100], ['Saturation', 'saturation', -100, 100], ['Temperature', 'temperature', -100, 100], ['Tint', 'tint', -180, 180], ['Highlights', 'highlights', -100, 100], ['Shadows', 'shadows', -100, 100],
                    ].map(([label, key, min, max]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{label}</span><span className="text-[11px] font-bold text-gray-900">{filters[key]}</span></div>
                        <input type="range" min={min} max={max} value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: +e.target.value }))} style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((filters[key] - min) / (max - min)) * 100}%, #f3f4f6 ${((filters[key] - min) / (max - min)) * 100}%, #f3f4f6 100%)` }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <button onClick={() => setOpenSubSection(openSubSection === 'radius' ? null : 'radius')} className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold text-gray-800">
                  <span>Corner Radius</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${openSubSection === 'radius' ? 'rotate-180' : ''}`} />
                </button>
                {openSubSection === 'radius' && (
                  <div className="relative px-6 pb-5 border-t border-gray-50">
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center gap-6">
                        <RadiusBox corner="tl" value={radius.tl} radiusStyle="rounded-tl-[18px] rounded-tr-md rounded-br-md rounded-bl-md" />
                        <RadiusBox corner="tr" value={radius.tr} radiusStyle="rounded-tr-[18px] rounded-tl-md rounded-br-md rounded-bl-md" />
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <button onClick={() => setIsRadiusLinked(!isRadiusLinked)} className="pointer-events-auto p-1.5 transition-colors bg-white rounded-full">{isRadiusLinked ? <LinkIcon size={20} className="text-gray-900" /> : <Link2Off size={20} className="text-gray-400" />}</button>
                      </div>
                      <div className="flex items-center gap-6">
                        <RadiusBox corner="bl" value={radius.bl} radiusStyle="rounded-bl-[18px] rounded-tr-md rounded-br-md rounded-tl-md" />
                        <RadiusBox corner="br" value={radius.br} radiusStyle="rounded-br-[18px] rounded-tr-md rounded-tl-md rounded-bl-md" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <button onClick={() => setOpenSubSection(openSubSection === 'effect' ? null : 'effect')} className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold text-gray-800">
                  <span>Effect</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${openSubSection === 'effect' ? 'rotate-180' : ''}`} />
                </button>
                {openSubSection === 'effect' && (
                  <div className="p-4 pt-0 space-y-2 bg-white border-t border-gray-50">
                    {['Drop Shadow', 'Inner Shadow', 'Blur', 'Background Blur'].map((eff) => (
                      <div key={eff} className="relative">
                        <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${activePopup === eff ? 'border-indigo-500 bg-indigo-50/20' : 'bg-gray-50/80 border-gray-100'}`}>
                          <span className="text-[12px] font-bold text-gray-700 cursor-pointer flex-1" onClick={() => { if (activeEffects.includes(eff)) setActivePopup(activePopup === eff ? null : eff); }}>{eff}</span>
                          <button onClick={() => {
                            const isActive = activeEffects.includes(eff);
                            if (isActive) { setActiveEffects(prev => prev.filter(e => e !== eff)); if (activePopup === eff) setActivePopup(null); }
                            else { setActiveEffects(prev => [...prev, eff]); setActivePopup(eff); }
                          }}>{activeEffects.includes(eff) ? <Trash2 size={16} className="text-red-500" /> : <Plus size={16} className="text-gray-400" />}</button>
                        </div>
                        {activePopup === eff && (
                          <div className="fixed z-[9999] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-right-4 fade-in duration-200" style={{ width: '350px', top: '35%', left: '90%', transform: 'translateX(-120%)' }}>
                            <div className="flex items-center mb-4"><span className="text-sm font-extrabold text-gray-800">{eff}</span><div className="h-[1px] flex-1 mx-3 bg-gray-100" /><button onClick={() => setActivePopup(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition" aria-label="Close"><X size={16} className="text-gray-500" /></button></div>
                            <div className="space-y-5">
                              {eff.includes('Shadow') && (
                                <><div className="flex items-start gap-3"><div className="relative"><div className="w-[75px] h-[75px] rounded-lg flex items-center justify-center text-white text-sm font-semibold cursor-pointer overflow-hidden" style={{ background: `linear-gradient(to right, ${effectSettings[eff].color} 0%, ${effectSettings[eff].color}88 50%, transparent 100%)` }}><span className="relative z-10">{effectSettings[eff].opacity} %</span><input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div><div className="flex-1 space-y-3"><div className="flex items-center gap-2"><span className="text-[14px] text-gray-800 font-normal whitespace-nowrap">Code :</span><div className="flex-1 relative"><input type="text" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="w-full text-[14px] text-gray-800 outline-none bg-transparent border border-gray-300 rounded-lg px-3 pr-8 h-9" /><div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer"><Pencil size={16} className="text-gray-400" strokeWidth={2} />{'EyeDropper' in window ? <button onClick={() => handleColorPick(eff)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /> : <input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />}</div></div></div><div className="flex items-center gap-2"><span className="text-[14px] text-gray-800 font-normal whitespace-nowrap">Opacity :</span><div className="flex-1 flex items-center gap-2"><input type="range" min="0" max="100" value={effectSettings[eff].opacity} onChange={(e) => updateEffectSetting(eff, 'opacity', Number(e.target.value))} className="flex-1 w-1 h-1.5 appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${effectSettings[eff].opacity}%, #e5e7eb ${effectSettings[eff].opacity}%, #e5e7eb 100%)` }} /><span className="text-[14px] text-gray-600 font-normal w-9 text-right">{effectSettings[eff].opacity} %</span></div></div></div></div><div className="space-y-3 pt-2"><EffectControlRow label="X Axis" value={effectSettings[eff].x} onChange={(v) => updateEffectSetting(eff, 'x', v)} min={-100} max={100} /><EffectControlRow label="Y Axis" value={effectSettings[eff].y} onChange={(v) => updateEffectSetting(eff, 'y', v)} min={-100} max={100} /><EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} /><EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div></>
                              )}
                              {!eff.includes('Shadow') && (
                                <div className="space-y-3"><EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} /><EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <InteractionPanel selectedElement={selectedElement} onUpdate={onUpdate} onPopupPreviewUpdate={onPopupPreviewUpdate} isOpen={activeSection === 'interaction'} onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')} />

      {showGallery && (
        <div className="fixed z-[10000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '320px', height: '540px', top: '55%', left: '80%', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100"><h2 className="text-mg font-bold text-gray-900">Image Gallery</h2><button onClick={() => setShowGallery(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-400" /></button></div>
          <div className=" px-4 py-2"><h3 className="text-[13px] font-bold text-gray-900 mb-1">Upload your Image</h3><p className="text-[11px] text-gray-400 mb-4"><span>You Can Reuse The File Which Is Uploaded In Gallery</span><span className="text-red-500">*</span></p><div onClick={() => galleryInputRef.current?.click()} className="w-72 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-2"><p className="text-[13px] text-gray-500 font-normal mb-3">Drag & Drop or <span className="text-blue-600 font-semibold">Upload</span></p><Upload size={28} className="text-gray-300 mb-2" strokeWidth={1.5} /><p className="text-[11px] text-gray-400 text-center">Supported File : <span className="font-medium">JPG, PNG</span></p></div><input type="file" ref={galleryInputRef} onChange={handleModalFileUpload} accept="image/*" className="hidden" /></div>
          <div className="mb-20 px-4 py-2"><h3 className="text-[13px] font-bold text-gray-900 mb-1">Uploaded Images</h3>{uploadedImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-x-6 gap-y-8">{uploadedImages.map((img, index) => (
              <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setTempSelectedImage(img)}><div className={`aspect-square w-full rounded-[8px] overflow-hidden border-2 transition-all shadow-sm ${tempSelectedImage?.name === img.name ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent'}`}><img src={img.url} alt={img.name} className="w-full h-full object-cover" /></div><p className="text-[12px] text-gray-400 mt-2 font-medium text-center leading-tight w-full truncate px-1">{img.name}</p></div>
            ))}</div>
          ) : (
            <div className="text-center py-8 text-gray-400"><p className="text-sm">No uploaded images yet</p><p className="text-xs mt-1">Upload an image to get started</p></div>
          )}</div>
          <div className="p-3 border-t flex justify-end gap-2 bg-white"><button onClick={() => setShowGallery(false)} className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"><X size={12} /> Close</button><button disabled={!tempSelectedImage} onClick={() => { if (!tempSelectedImage) return; selectedElement.src = tempSelectedImage.url; if (onUpdate) onUpdate(); setShowGallery(false); }} className="flex-1 h-8 bg-black text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-zinc-800 disabled:opacity-50"><Replace size={12} /> Replace</button></div>
        </div>
      )}

      {isCropping && (
        <ImageCropOverlay 
            imageSrc={previewSrc || selectedElement.src}
            element={selectedElement}
            onSave={({ inset, scale, offX, offY }) => {
                selectedElement.style.setProperty('clip-path', inset, 'important');
                selectedElement.style.setProperty('-webkit-clip-path', inset, 'important');
                
                // Advanced Zoom: Make the cropped area fill the selected image box
                const transform = `scale(${scale.toFixed(3)}) translate(${offX.toFixed(2)}%, ${offY.toFixed(2)}%)`;
                selectedElement.style.setProperty('transform', transform, 'important');
                selectedElement.style.setProperty('transform-origin', 'center', 'important');

                setIsCropping(false);
                if (onUpdate) onUpdate();
            }}
            onCancel={() => setIsCropping(false)}
        />
      )}
    </div>
  );
};

export default ImageEditor;