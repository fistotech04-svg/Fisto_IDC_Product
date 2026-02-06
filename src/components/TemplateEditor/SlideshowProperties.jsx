import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  ArrowRightLeft,
  MoreVertical,
  Replace,
  Upload,
  Trash2,
  X,
  Check
} from 'lucide-react';

const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const Toggle = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative w-10 h-[22px] transition-colors duration-200 ease-in-out rounded-full focus:outline-none ${active ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
  >
    <div className={`absolute left-0.5 top-0.5 bg-white w-[18px] h-[18px] rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${active ? 'translate-x-[18px]' : 'translate-x-0'}`} />
  </button>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-2 py-1 mt-1">
    <span className="text-xs font-semibold text-black-900 whitespace-nowrap">{title}</span>
    <div className="h-[1px] flex-1 bg-gray-200" />
  </div>
);

const SlideshowProperties = ({ selectedElement, onUpdate, isOpen, onToggle, opacity, onUpdateOpacity, setPreviewSrc, setIsUpdatingDOM }) => {
  const [showEffectDropdown, setShowEffectDropdown] = useState(false);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [localGallerySelected, setLocalGallerySelected] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);
  const [newReplaceImg, setNewReplaceImg] = useState(null);
  const replaceInputRef = useRef(null);
  
  // Slideshow specific states
  const [slideshowSettings, setSlideshowSettings] = useState({
    autoPlay: true,
    speed: 2,
    infiniteLoop: false,
    showArrows: true,
    showDots: true,
    imageFitType: 'Fill All',
    transitionEffect: 'Linear',
    dragToSlide: false,
    dotColor: '#000000',
    dotOpacity: 100
  });
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hydratedElement, setHydratedElement] = useState(null); // Track which element matches current state

  const onUpdateRef = useRef(onUpdate);
  const onUpdateOpacityRef = useRef(onUpdateOpacity);
  const setPreviewSrcRef = useRef(setPreviewSrc);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onUpdateOpacityRef.current = onUpdateOpacity;
    setPreviewSrcRef.current = setPreviewSrc;
  });

  // Ref to prevent persistence for one cycle during hydration
  const shouldSkipPersistence = useRef(false);

  // Hydrate Slideshow State from DOM
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.dataset.slideshow) {
        try {
          const savedData = JSON.parse(selectedElement.dataset.slideshow);
          if (savedData) {
            shouldSkipPersistence.current = true;
            setSlideshowSettings(prev => ({ ...prev, ...savedData.settings }));
            setSlideshowImages(savedData.images || []);
            setActiveSlideIndex(0);
            setHydratedElement(selectedElement); // Mark as hydrated
          }
        } catch (e) {
          console.error("Failed to parse slideshow data", e);
        }
      } else {
        // Reset to default for new element if it has no slideshow data
        // This prevents state leakage from previous element
        
        // IMPORTANT: Skip persistence for this reset to prevent tagging the new element as a slideshow
        shouldSkipPersistence.current = true;

        setSlideshowSettings({
          autoPlay: true,
          speed: 2,
          infiniteLoop: false,
          showArrows: true,
          showDots: true,
          imageFitType: 'Fill All',
          transitionEffect: 'Linear',
          dragToSlide: false,
          dotColor: '#000000',
          dotOpacity: 100
        });
        
        const currentSrc = selectedElement.getAttribute('src') || selectedElement.src;
        if (currentSrc) {
          setSlideshowImages([{ id: Date.now(), url: currentSrc, name: 'Main Image' }]);
        } else {
          setSlideshowImages([]);
        }
        setActiveSlideIndex(0);
        setHydratedElement(selectedElement); // Mark as hydrated (even if default)
      }
    }
  }, [selectedElement]);

  // Persist Slideshow Slides & Settings to DOM
  useEffect(() => {
    if (shouldSkipPersistence.current) {
      shouldSkipPersistence.current = false;
      return;
    }

    if (selectedElement) {
      if (slideshowImages.length > 0) {
        const dataToSave = {
          settings: slideshowSettings,
          images: slideshowImages
        };
        selectedElement.setAttribute('data-slideshow', JSON.stringify(dataToSave));
        selectedElement.setAttribute('data-is-slideshow', 'true');
        if (onUpdateRef.current) onUpdateRef.current();
      }
    }
  }, [slideshowSettings, slideshowImages]);

  // Safety: Clamp active index if images are removed
  useEffect(() => {
    if (slideshowImages.length > 0 && activeSlideIndex >= slideshowImages.length) {
      setActiveSlideIndex(slideshowImages.length - 1);
    }
  }, [slideshowImages.length, activeSlideIndex]);

  // Auto Play Effect
  useEffect(() => {
    let interval;
    if (slideshowSettings.autoPlay && slideshowImages.length > 1) {
      interval = setInterval(() => {
        setActiveSlideIndex((prev) => {
          const next = prev + 1;
          if (next >= slideshowImages.length) {
            return slideshowSettings.infiniteLoop ? 0 : prev;
          }
          return next;
        });
      }, slideshowSettings.speed * 1000);
    }
    return () => clearInterval(interval);
  }, [slideshowSettings.autoPlay, slideshowSettings.speed, slideshowSettings.infiniteLoop, slideshowImages.length]);

  // Sync Template Image Src with Active Slide and Apply Effects
  useEffect(() => {
    // Only apply if the current state belongs to the selected element
    if (slideshowImages[activeSlideIndex] && selectedElement && selectedElement === hydratedElement) {
      const activeImg = slideshowImages[activeSlideIndex];
      const currentSrc = selectedElement.getAttribute('src');

      if (currentSrc !== activeImg.url) {
        if (setIsUpdatingDOM) setIsUpdatingDOM(true);
        const effect = slideshowSettings.transitionEffect;
        const baseOpacity = (opacity / 100).toString();

        const finishTransition = () => {
          selectedElement.src = activeImg.url;
          selectedElement.removeAttribute('data-original-src');
          if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
          
             setTimeout(() => {
                selectedElement.style.transition = '';
                selectedElement.style.transform = '';
                selectedElement.style.opacity = baseOpacity;
                selectedElement.style.filter = ''; 
                if (setIsUpdatingDOM) setIsUpdatingDOM(false);
             }, 50);
        };

        if (effect === 'Fade') {
            selectedElement.style.transition = 'opacity 0.4s ease-in-out';
            selectedElement.style.opacity = '0.2';
            setTimeout(() => {
                finishTransition();
                requestAnimationFrame(() => { selectedElement.style.opacity = baseOpacity; });
            }, 400);
        } else if (effect === 'Slide' || effect === 'Push') {
            selectedElement.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
            selectedElement.style.transform = 'translateX(-30%)';
            selectedElement.style.opacity = '0';
            setTimeout(() => {
                selectedElement.src = activeImg.url;
                if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
                selectedElement.style.transition = 'none';
                selectedElement.style.transform = 'translateX(30%)';
                void selectedElement.offsetWidth;
                selectedElement.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
                selectedElement.style.transform = 'translateX(0)';
                selectedElement.style.opacity = baseOpacity;
                setTimeout(() => {
                    selectedElement.style.transition = '';
                    selectedElement.style.transform = '';
                    if (setIsUpdatingDOM) setIsUpdatingDOM(false);
                }, 400);
            }, 400);
        } else if (effect === 'Flip') {
            selectedElement.style.transition = 'transform 0.5s ease-in-out';
            selectedElement.style.transform = 'rotateY(90deg)';
            setTimeout(() => {
                selectedElement.src = activeImg.url;
                if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
                selectedElement.style.transition = 'none';
                selectedElement.style.transform = 'rotateY(-90deg)';
                void selectedElement.offsetWidth;
                selectedElement.style.transition = 'transform 0.5s ease-in-out';
                selectedElement.style.transform = 'rotateY(0deg)';
                setTimeout(() => {
                    selectedElement.style.transition = '';
                    selectedElement.style.transform = '';
                    if (setIsUpdatingDOM) setIsUpdatingDOM(false);
                }, 500);
            }, 500);
        } else if (effect === 'Reveal' || effect === 'Zoom') {
            selectedElement.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease';
            selectedElement.style.transform = 'scale(0.8)';
            selectedElement.style.opacity = '0.5';
            setTimeout(() => {
                selectedElement.src = activeImg.url;
                if (setPreviewSrcRef.current) setPreviewSrcRef.current(activeImg.url);
                selectedElement.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease';
                selectedElement.style.transform = 'scale(1)';
                selectedElement.style.opacity = baseOpacity;
                setTimeout(() => {
                    selectedElement.style.transition = '';
                    selectedElement.style.transform = '';
                    if (setIsUpdatingDOM) setIsUpdatingDOM(false);
                }, 400);
            }, 400);
        } else {
            finishTransition();
        }
      }
    }
  }, [slideshowImages, activeSlideIndex, selectedElement, slideshowSettings.transitionEffect, opacity]);

  // Apply Image Fit (Fit All / Fill All) to DOM
  useEffect(() => {
    if (selectedElement) {
      selectedElement.style.objectFit = slideshowSettings.imageFitType === 'Fill All' ? 'cover' : 'contain';
    }
  }, [selectedElement, slideshowSettings.imageFitType]);

  // Inject Slideshow Controls
  useEffect(() => {
    if (!selectedElement || !selectedElement.parentElement) return;

    const doc = selectedElement.ownerDocument;
    const parent = selectedElement.parentElement;
    
    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    let overlay = parent.querySelector('.slideshow-overlay-controls');
    if (!overlay) {
      overlay = doc.createElement('div');
      overlay.className = 'slideshow-overlay-controls';
      overlay.style.cssText = `position: absolute; inset: 0; z-index: 10; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between;`;
      parent.appendChild(overlay);
    }
    overlay.innerHTML = '';

    if (!slideshowSettings.autoPlay && slideshowSettings.showArrows && slideshowImages.length > 1) {
      const createArrow = (direction) => {
        const isLeft = direction === 'left';
        const canGoBack = slideshowSettings.infiniteLoop || activeSlideIndex > 0;
        const canGoNext = slideshowSettings.infiniteLoop || activeSlideIndex < slideshowImages.length - 1;
        if (isLeft && !canGoBack) return null;
        if (!isLeft && !canGoNext) return null;

        const btn = doc.createElement('div');
        btn.style.cssText = `position: absolute; top: 50%; ${isLeft ? 'left: 10px;' : 'right: 10px;'} transform: translateY(-50%); width: 32px; height: 32px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: background 0.2s; z-index: 20;`;
        btn.innerHTML = isLeft ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
        btn.onclick = (e) => {
          e.stopPropagation(); e.preventDefault();
          setActiveSlideIndex(prev => isLeft ? (prev === 0 ? slideshowImages.length - 1 : prev - 1) : (prev === slideshowImages.length - 1 ? 0 : prev + 1));
        };
        return btn;
      };
      const left = createArrow('left'); if (left) overlay.appendChild(left);
      const right = createArrow('right'); if (right) overlay.appendChild(right);
    }

    if (slideshowSettings.showDots && slideshowImages.length > 1) {
      const dotsContainer = doc.createElement('div');
      dotsContainer.style.cssText = `position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; pointer-events: auto; padding: 4px 8px; background: rgba(0,0,0,0.1); border-radius: 12px; backdrop-filter: blur(2px);`;
      slideshowImages.forEach((_, idx) => {
        const dot = doc.createElement('div');
        const isActive = idx === activeSlideIndex;
        dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; cursor: pointer; transition: all 0.2s; background-color: ${isActive ? slideshowSettings.dotColor : 'rgba(255,255,255,0.5)'}; opacity: ${isActive ? 1 : (slideshowSettings.dotOpacity / 100)}; transform: ${isActive ? 'scale(1.2)' : 'scale(1)'}; box-shadow: 0 1px 2px rgba(0,0,0,0.1);`;
        dot.onclick = (e) => { e.stopPropagation(); e.preventDefault(); setActiveSlideIndex(idx); };
        dotsContainer.appendChild(dot);
      });
      overlay.appendChild(dotsContainer);
    }

    if (!slideshowSettings.autoPlay && slideshowSettings.dragToSlide && slideshowImages.length > 1) {
      const dragLayer = doc.createElement('div');
      dragLayer.style.cssText = `position: absolute; inset: 0; z-index: 5; cursor: grab; pointer-events: auto;`;
      dragLayer.onmousedown = (e) => {
        e.stopPropagation();
        const startX = e.clientX;
        let isDragging = false;
        const move = (mv) => { if (Math.abs(mv.clientX - startX) > 10) isDragging = true; };
        const up = (upE) => {
          if (isDragging) {
            const diff = upE.clientX - startX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) setActiveSlideIndex(prev => prev === 0 ? (slideshowSettings.infiniteLoop ? slideshowImages.length - 1 : 0) : prev - 1);
              else setActiveSlideIndex(prev => prev === slideshowImages.length - 1 ? (slideshowSettings.infiniteLoop ? 0 : prev) : prev + 1);
            }
          }
          doc.removeEventListener('mousemove', move); doc.removeEventListener('mouseup', up);
        };
        doc.addEventListener('mousemove', move); doc.addEventListener('mouseup', up);
      };
      overlay.insertBefore(dragLayer, overlay.firstChild);
    }

    return () => { if (overlay) overlay.remove(); };
  }, [slideshowSettings, slideshowImages, activeSlideIndex, selectedElement]);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 4 - slideshowImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const newImages = filesToUpload.filter(file => file.type.startsWith('image/')).map((file, idx) => ({
      id: Date.now() + idx, url: URL.createObjectURL(file), name: file.name
    }));
    if (newImages.length > 0) setSlideshowImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const imageUrl = URL.createObjectURL(file);
    const newImage = { id: Date.now(), name: file.name, url: imageUrl };
    setUploadedImages(prev => [newImage, ...prev]);
    e.target.value = '';
  };

  const handleReplaceUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const imageUrl = URL.createObjectURL(file);
    setNewReplaceImg({ url: imageUrl, name: file.name });
    e.target.value = '';
  };

  const confirmReplace = () => {
    if (!newReplaceImg || replaceTargetIndex === null) return;
    
    setSlideshowImages(prev => {
      const updated = [...prev];
      if (updated[replaceTargetIndex]) {
        updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], url: newReplaceImg.url, name: newReplaceImg.name };
      }
      return updated;
    });
    
    setShowReplaceModal(false);
    setReplaceTargetIndex(null);
    setNewReplaceImg(null);
    if (onUpdateRef.current) onUpdateRef.current();
  };

  const handleGallerySelect = (img) => {
    setSlideshowImages(prev => {
      const updated = [...prev];
      if (activeSlideIndex < updated.length) {
        updated[activeSlideIndex] = { id: img.id, url: img.url, name: img.name };
      } else if (updated.length < 4) {
        updated.push({ id: img.id, url: img.url, name: img.name });
      }
      return updated;
    });
    setOpenContextMenu(null);
    setShowGallery(false);
  };

  const updateSetting = (key, value) => {
    setSlideshowSettings({ ...slideshowSettings, [key]: value });
  };

  const effects = ['Linear', 'Fade', 'Slide', 'Push', 'Flip', 'Reveal'];

  return (
    <div className="space-y-4">
      {/* Slideshow Image Management UI */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 py-1">
    <span className="text-sm font-semibold text-black-900 whitespace-nowrap">Slideshow</span>
    <div className="h-[1px] flex-1 bg-gray-200" />
  </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-700">You Can Upload up to 4 Images :</span>
            <div className="relative">
                <button 
                  onClick={() => setShowFitDropdown(!showFitDropdown)}
                  className="flex items-center justify-between w-[85px] px-2 py-1.5 bg-white border border-gray-300 rounded-lg hover:border-indigo-400 transition-all text-[11px] font-medium text-gray-700 shadow-sm"
                >
                  <span>{slideshowSettings.imageFitType || 'Fill All'}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${showFitDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFitDropdown && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowFitDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 w-[85px] bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {['Fit All', 'Fill All'].map(type => (
                        <button 
                          key={type}
                          onClick={() => {
                            updateSetting('imageFitType', type);
                            setShowFitDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 px-0.5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="relative group/slot">
                <div 
                  onClick={() => setActiveSlideIndex(i)}
                  className={`aspect-[1/1] w-full rounded-[14px] cursor-pointer border-2 transition-all duration-300 relative flex items-center justify-center group/card hover:scale-[1.05] hover:-translate-y-1 hover:z-20 ${
                    activeSlideIndex === i 
                      ? 'border-[#6366f1] shadow-[0_12px_24px_-8px_rgba(99,102,241,0.3)]' 
                      : (slideshowImages[i] ? 'border-gray-200 hover:border-gray-400 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)]' : 'border-gray-400 hover:border-indigo-400 shadow-sm')
                  } ${!slideshowImages[i] ? 'bg-gray-50/50 border-dashed' : 'bg-white shadow-sm'}`}
                >
                  {slideshowImages[i] ? (
                    <img src={slideshowImages[i].url} className="w-full h-full object-cover rounded-[12px]" alt="" />
                  ) : (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setActiveSlideIndex(i); fileInputRef.current?.click(); }}
                      className="flex flex-col items-center justify-center gap-1.5 opacity-30 group-hover/card:opacity-60 transition-all duration-300"
                    >
                      <Upload size={18} strokeWidth={1.5} className="text-gray-900" />
                      <span className="text-[11px] font-semibold text-gray-900">Upload</span>
                    </div>
                  )}
 
                  {/* Actions Trigger - Premium Design */}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOpenContextMenu(openContextMenu === i ? null : i); 
                    }}
                    className={`absolute -top-1.5 -right-1.5 w-8 h-8 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] border-2 border-black flex items-center justify-center transition-all duration-200 z-30 ${
                      openContextMenu === i ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover/card:opacity-100 group-hover/card:scale-100'
                    } hover:bg-gray-50 active:scale-95`}
                  >
                    <MoreVertical size={14} className="text-black" strokeWidth={2.5} />
                  </button>
                </div>

                {openContextMenu === i && (
                  <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setOpenContextMenu(null)} />
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 mt-1 w-30 bg-white border border-gray-100 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <button 
                        onClick={() => { 
                          if (slideshowImages[i]) {
                             setReplaceTargetIndex(i);
                             setShowReplaceModal(true);
                             setOpenContextMenu(null);
                          } else {
                             setActiveSlideIndex(i); 
                             fileInputRef.current?.click(); 
                             setOpenContextMenu(null); 
                          }
                        }}
                        className="w-full px-4 py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors"
                      >
                        {slideshowImages[i] ? "Replace Image" : "Upload Image"}
                      </button>
                      <button 
                        onClick={() => { setActiveSlideIndex(i); setShowGallery(true); setOpenContextMenu(null); }}
                        className={`w-full px-4 py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors ${slideshowImages[i] ? 'border-b border-gray-50' : ''}`}
                      >
                        Image Gallery
                      </button>
                      {slideshowImages[i] && (
                        <button 
                          onClick={() => { 
                            setSlideshowImages(prev => prev.filter((_, idx) => idx !== i)); 
                            setOpenContextMenu(null); 
                          }}
                          className="w-full px-4 py-2.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 text-left transition-colors"
                        >
                          Delete Image
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      </div>

      {/* Opacity Slider */}
      <div className="space-y-3 py-2">
        <SectionHeader title="Opacity" />
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={opacity} 
              onChange={(e) => onUpdateOpacityRef.current?.(Number(e.target.value))} 
              className="w-full h-1 rounded-full appearance-none cursor-pointer" 
              style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)` }} 
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-10 text-right">{opacity}%</span>
        </div>
      </div>

      {/* Properties Accordion */}
      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
        <button 
          onClick={onToggle} 
          className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <span>Slideshow Properties</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="relative px-6 pb-5 pt-3 border-t border-gray-100">
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Mode Toggle */}
            <div className="flex justify-start pt-1">
              <button 
                onClick={() => updateSetting('autoPlay', !slideshowSettings.autoPlay)}
                className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 hover:border-indigo-200 transition-all group"
              >
                <span className="text-[11px] font-semibold text-gray-600">
                  {slideshowSettings.autoPlay ? 'Auto Slide Mode' : 'Manual Slide Mode'}
                </span>
                <ArrowRightLeft size={14} className="text-gray-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500" />
              </button>
            </div>

            {/* Slide Effect */}
            <div className="space-y-3">
              <SectionHeader title="Slide Effect" />
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-gray-600">Select Slide Effects :</span>
                <div className="relative">
                  <button 
                    onClick={() => setShowEffectDropdown(!showEffectDropdown)}
                    className="flex items-center justify-between w-[110px] px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all text-[12px] font-semibold text-gray-700"
                  >
                    <span>{slideshowSettings.transitionEffect || 'Linear'}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showEffectDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showEffectDropdown && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowEffectDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 w-full min-w-[110px] bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-[100] py-1 animate-in fade-in zoom-in-95 duration-150">
                        {effects.map((eff) => (
                          <button 
                            key={eff} 
                            onClick={() => {
                              updateSetting('transitionEffect', eff);
                              setShowEffectDropdown(false);
                            }} 
                            className="w-full px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"
                          >
                            {eff}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="space-y-4">
              <SectionHeader title="Navigation Controls" />
              
              {slideshowSettings.autoPlay && (
                <div className="flex items-center justify-between px-0 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-[12px] font-medium text-gray-700 whitespace-nowrap">Auto Slide Duration</span>
                  <div className="flex-1 mx-4 h-[1px] border-t border-gray-100 border-dashed" />
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => updateSetting('speed', Math.max(1, slideshowSettings.speed - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="w-11 h-7 border border-gray-200 rounded-md text-[12px] font-semibold text-gray-700 bg-white shadow-sm overflow-hidden">
                      <DraggableSpan 
                        label={`${slideshowSettings.speed}s`}
                        value={slideshowSettings.speed}
                        onChange={(v) => updateSetting('speed', v)}
                        min={1}
                        max={20}
                        className="w-full h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => updateSetting('speed', Math.min(20, slideshowSettings.speed + 1))}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {!slideshowSettings.autoPlay && (
                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[12px] font-medium text-gray-700">Drag to Slide</span>
                    <div className="flex-1 mx-4 h-[1px] border-t border-gray-100 border-dashed" />
                    <Toggle active={slideshowSettings.dragToSlide} onClick={() => updateSetting('dragToSlide', !slideshowSettings.dragToSlide)} />
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[12px] font-medium text-gray-700">Navigation Buttons</span>
                    <div className="flex-1 mx-4 h-[1px] border-t border-gray-200 border-dashed" />
                    <Toggle active={slideshowSettings.showArrows} onClick={() => updateSetting('showArrows', !slideshowSettings.showArrows)} />
                  </div>
                </div>
              )}
            </div>

            {/* Other Controls */}
            <div className="space-y-3">
              <SectionHeader title="Other Controls" />
              
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-gray-600">Pagination Dots</span>
                <div className="flex items-center gap-3 flex-1 px-4">
                  <div className="h-[1px] w-full border-t border-gray-100 border-dashed" />
                </div>
                <Toggle active={slideshowSettings.showDots} onClick={() => updateSetting('showDots', !slideshowSettings.showDots)} />
              </div>

              {slideshowSettings.showDots && (
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-[12px] font-medium text-gray-600">Dot Color :</span>
                  <div className="flex items-center gap-2">
                    <div className="relative group/color">
                      <div 
                        className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm cursor-pointer overflow-hidden"
                        style={{ backgroundColor: slideshowSettings.dotColor }}
                      >
                        <input 
                          type="color" 
                          value={slideshowSettings.dotColor}
                          onChange={(e) => updateSetting('dotColor', e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm gap-2">
                      <input 
                        type="text" 
                        value={slideshowSettings.dotColor.toUpperCase()}
                        onChange={(e) => updateSetting('dotColor', e.target.value)}
                        className="w-14 text-[11px] font-semibold text-gray-700 outline-none"
                      />
                      <div className="w-[1px] h-3 bg-gray-200" />
                      <DraggableSpan 
                        label={`${slideshowSettings.dotOpacity}%`}
                        value={slideshowSettings.dotOpacity}
                        onChange={(v) => updateSetting('dotOpacity', v)}
                        className="text-[11px] font-semibold text-gray-500 w-8 text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-gray-600">Infinity Loop Mode</span>
                <div className="flex items-center gap-3 flex-1 px-4">
                  <div className="h-[1px] w-full border-t border-gray-100 border-dashed" />
                </div>
                <Toggle active={slideshowSettings.infiniteLoop} onClick={() => updateSetting('infiniteLoop', !slideshowSettings.infiniteLoop)} />
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Internal Gallery Modal */}
      {showGallery && (
          <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '320px', height: '540px', top: '55%', left: '80%', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100"><h2 className="text-mg font-semibold text-gray-900">Image Gallery</h2><button onClick={() => { setShowGallery(false); setLocalGallerySelected(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-400" /></button></div>
          <div className=" px-4 py-2"><h3 className="text-[13px] font-semibold text-gray-900 mb-1">Upload your Image</h3><p className="text-[11px] text-gray-400 mb-4"><span>You Can Reuse The File Which Is Uploaded In Gallery</span><span className="text-red-500">*</span></p><div 
            onClick={() => galleryInputRef.current?.click()} 
            className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-2"
          ><p className="text-[13px] text-gray-500 font-normal mb-3">Drag & Drop or <span className="text-blue-600 font-semibold">Upload</span></p><Upload size={28} className="text-gray-300 mb-2" strokeWidth={1.5} /><p className="text-[11px] text-gray-400 text-center">Supported File : <span className="font-medium">JPG, PNG</span></p></div><input type="file" ref={galleryInputRef} onChange={handleModalFileUpload} accept="image/*" className="hidden" /></div>
          <div className="custom-scrollbar overflow-y-auto max-h-[250px] px-4 py-2 flex-1"><h3 className="text-[13px] font-semibold text-gray-900 mb-1">Uploaded Images</h3>{uploadedImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">{uploadedImages.map((img, index) => (
              <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalGallerySelected(img)}>
                <div className={`aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${localGallerySelected?.url === img.url ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}><img src={img.url} className="w-full h-full object-cover" alt="" /></div>
              </div>
            ))}</div>
          ) : (
            <div className="text-center py-8 text-gray-400"><p className="text-sm">No uploaded images yet</p></div>
          )}</div>
          <div className="p-3 border-t flex justify-end gap-2 bg-white mt-auto">
            <button onClick={() => { setShowGallery(false); setLocalGallerySelected(null); }} className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"><X size={12} /> Close</button>
            <button 
              onClick={() => { 
                if (localGallerySelected) {
                  handleGallerySelect(localGallerySelected);
                  setLocalGallerySelected(null);
                }
              }} 
              disabled={!localGallerySelected}
              className={`flex-1 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${localGallerySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Check size={12} /> Place
            </button>
          </div>
        </div>
      )}

      {/* Replace Image Modal*/}
      {showReplaceModal && replaceTargetIndex !== null && slideshowImages[replaceTargetIndex] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} />
           <div className="relative bg-white rounded-[32px] shadow-2xl w-[450px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 p-8">
              {/* HEADER */}
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-lg font-semibold text-gray-700 whitespace-nowrap">Replace Image</h2>
                <div className="h-[1.5px] w-full bg-gray-100 flex-1" />
                <button 
                  onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} 
                  className="w-6 h-6 flex items-center justify-center rounded-xl border-2 border-[#ff6b6b] text-[#ff6b6b] hover:bg-red-50 transition-colors shrink-0"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
 
              {/* CONTENT AREA */}
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Current Image container */}
                  <div className="flex flex-col items-center gap-2 w-32">
                    <div className="w-24 h-24 rounded-[20px] border-2 border-dashed border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                       <img src={slideshowImages[replaceTargetIndex].url} className="w-full h-full object-contain rounded-lg" alt="current" />
                    </div>
                    <span className="text-sm font-semibold text-gray-400 truncate w-full text-center">Current</span>
                  </div>
 
                  {/* Middle: Replacement Connector - Vertically Centered */}
                  <div className="flex items-center justify-center pt-2">
                    <Replace size={24} className="text-gray-400" strokeWidth={1.5} />
                  </div>
 
                  {/* Right: Upload Drop-zone - Matches height of left box */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div 
                      onClick={() => replaceInputRef.current?.click()}
                      className={`w-full h-24 rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                        newReplaceImg ? 'border-gray-400 bg-indigo-50/20' : 'border-gray-400 bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                       {newReplaceImg ? (
                         <div className="relative w-full h-full p-2 flex items-center justify-center">
                            <img src={newReplaceImg.url} className="w-full h-full object-contain rounded-lg" alt="new" />
                            <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Upload size={20} className="text-black-900" />
                            </div>
                         </div>
                       ) : (
                         <>
                           <Upload size={24} className="text-gray-400 mb-1 group-hover:-translate-y-1 transition-transform" />
                           <p className="text-[13px] text-gray-500 font-medium">Drag & Drop or <span className="text-indigo-600 font-semibold">Upload</span></p>
                         </>
                       )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium italic">Supported File Format : JPG, PNG</p>
                  </div>
                </div>
              </div>
 
              {/* FOOTER BUTTONS */}
              <div className="flex items-center justify-end gap-3 mt-4">
                 <button 
                  onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} 
                  className="px-6 h-8 rounded-lg border-2 border-gray-700 text-gray-700 font-semibold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all"
                 >
                   <X size={16} strokeWidth={2.5} /> Close
                 </button>
                 <button 
                  onClick={confirmReplace}
                  disabled={!newReplaceImg}
                  className={`px-8 h-8 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg transition-all ${
                    newReplaceImg 
                      ? 'bg-gray-600 text-white hover:bg-gray-700 hover:scale-[1.02] active:scale-95' 
                      : 'bg-gray-200 text-black-900 cursor-not-allowed shadow-none'
                  }`}
                 >
                   <Replace size={16} strokeWidth={2.5} /> Replace
                 </button>
              </div>
 
              <input type="file" ref={replaceInputRef} onChange={handleReplaceUpload} accept="image/*" className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default SlideshowProperties;
