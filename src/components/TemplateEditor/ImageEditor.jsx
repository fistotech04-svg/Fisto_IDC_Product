import React, { useState, useRef, useEffect } from 'react';
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

} from 'lucide-react';
import InteractionPanel from './InteractionPanel';

const ImageEditor = ({ selectedElement, onUpdate, onPopupPreviewUpdate }) => {
  const fileInputRef = useRef(null);

  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);

  const [openSubSection, setOpenSubSection] = useState(null);
  const [isRadiusLinked, setIsRadiusLinked] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');

  const [galleryView, setGalleryView] = useState('template');
  const [tempSelectedImage, setTempSelectedImage] = useState(null);

  const [imageType, setImageType] = useState('Fit');
  const [opacity, setOpacity] = useState(100);
  const [activePopup, setActivePopup] = useState(null);

  const [filters, setFilters] = useState({
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0
  });

  const [radius, setRadius] = useState({ tl: 12, tr: 12, br: 12, bl: 12 });

  const [activeEffects, setActiveEffects] = useState(['effect']);

  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 60, y: 60, blur: 60, spread: 60 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 60, y: 60, blur: 60, spread: 60 },
    'Blur': { blur: 60, spread: 60 },
    'Background Blur': { blur: 60, spread: 60 }
  });

  const galleryImages = [
    { name: 'Sea Port 1', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
    { name: 'Sea Port 2', url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206' },
    { name: 'Sea Port 3', url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda' },
    { name: 'Cutting Machine', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158' },
    { name: 'AI', url: 'https://plus.unsplash.com/premium_photo-1764695426527-8f344be39993?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { name: 'Operator', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837' }
  ];

  const [uploadedImages, setUploadedImages] = useState([
    { name: 'Study Materials', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6' },
    { name: 'Digital Education', url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8' },
    { name: 'Classroom', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7' }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.)');
      e.target.value = '';
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    const newImageData = {
      id: Date.now(),
      name: file.name,
      url: imageUrl,
    };
    setUploadedImages((prev) => [newImageData, ...prev]);

    if (selectedElement) {
      selectedElement.src = imageUrl;
      if (onUpdate) onUpdate();
    }

    e.target.value = '';
  };

  const applyVisuals = () => {
    if (!selectedElement) return;

    let filterString = `brightness(${100 + filters.exposure}%) contrast(${100 + filters.contrast}%) saturate(${100 + filters.saturation}%) hue-rotate(${filters.tint}deg) sepia(${filters.temperature > 0 ? filters.temperature : 0}%)`;

    const highlightEffect = filters.highlights / 5;
    const shadowEffect = filters.shadows / 5;
    filterString += ` brightness(${100 + highlightEffect}%) contrast(${100 + shadowEffect}%)`;

    if (activeEffects.includes('Blur')) {
      filterString += ` blur(${effectSettings['Blur'].blur / 10}px)`;
    }

    selectedElement.style.filter = filterString;
    selectedElement.style.opacity = opacity / 100;
    const fitMap = { 'Fit': 'contain', 'Fill': 'fill', 'Crop': 'cover', 'Cover': 'cover' };
    selectedElement.style.objectFit = fitMap[imageType] || 'cover';

    let shadowString = "";
    if (activeEffects.includes('Drop Shadow')) {
      const s = effectSettings['Drop Shadow'];
      shadowString += `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`;
    }
    if (activeEffects.includes('Inner Shadow')) {
      const s = effectSettings['Inner Shadow'];
      if (shadowString) shadowString += ", ";
      shadowString += `inset ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`;
    }
    selectedElement.style.boxShadow = shadowString;
    if (onUpdate) onUpdate();
  };

  useEffect(() => { applyVisuals(); }, [filters, activeEffects, effectSettings, opacity, imageType]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
    selectedElement.style.borderRadius = `${next.tl}px ${next.tr}px ${next.br}px ${next.bl}px`;
    if (onUpdate) onUpdate();
  };

  const updateEffectSetting = (effect, key, value) => {
    setEffectSettings(prev => ({
      ...prev,
      [effect]: { ...prev[effect], [key]: value }
    }));
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
        <button
          onClick={() => updateRadius(corner, value - 1)}
          className="text-gray-300 hover:text-indigo-500 transition-colors p-1"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => updateRadius(corner, e.target.value)}
          className="w-full text-center text-[13px] font-bold outline-none bg-transparent text-gray-800"
        />
        <button
          onClick={() => updateRadius(corner, value + 1)}
          className="text-gray-300 hover:text-indigo-500 transition-colors p-1"
        >
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );

  const EffectControlRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-gray-600">{label} :</span>
      <div className="flex items-center border border-gray-200 rounded-lg px-1.5 py-1 w-20">
        <button onClick={() => onChange(value - 1)} className="text-gray-400"><ChevronLeft size={12} /></button>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full text-center text-[11px] font-bold outline-none" />
        <button onClick={() => onChange(value + 1)} className="text-gray-400"><ChevronRight size={12} /></button>
      </div>
    </div>
  );


  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-4 w-full max-w-sm">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        input[type='range'] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type='range']::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          margin-top: -5px;
          cursor: pointer;
        }
      `}</style>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="flex items-center justify-between p-4 border-sm  border-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 border border-gray-200 rounded-lg"><Edit3 size={16} className="text-gray-600" /></div>
            <span className="font-bold text-gray-700 text-sm">Image</span>
          </div>
          <button onClick={() => setIsMainPanelOpen(!isMainPanelOpen)} className="p-1 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronUp size={18} className={`text-gray-400 transition-transform duration-200 ${isMainPanelOpen ? '' : 'rotate-180'}`} />
          </button>
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
                    onBlur={() => setTimeout(() => setShowImageTypeDropdown(false), 200)}
                    className="flex items-center justify-between w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[13px] font-bold text-gray-700">{imageType}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {showImageTypeDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
                      {['Fit', 'Fill', 'Crop'].map((type) => (
                        <button
                          key={type}
                          onClick={() => { setImageType(type); setShowImageTypeDropdown(false); }}
                          className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-18 h-18 rounded-xl overflow-hidden  border-2 border-dashed bg-gray-50 ">
                  <img src={selectedElement.src} className="w-full h-full object-cover" alt="preview" />
                </div>
                <Replace size={18} className="text-gray-300 shrink-0" />
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-18 border-2 border-dashed bg-gray-50 rounded-xl flex flex-col items-center justify-center cursor-pointer">
                  <Upload size={18} className="text-500 mb-1" />
                  <p className="text-[10px] text-gray-400 font-medium text-center">Drag & Drop or <span className="font-bold text-indigo-600">Upload</span></p>
                </div>
              </div>

              <div
                onClick={() => { setShowGallery(true); setGalleryView('template'); }}
                className="relative h-28 bg-gray-100 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 select-none"
              >
                <div className="grid grid-cols-3 gap-2 p-2 opacity-40">
                  {galleryImages.slice(0, 6).map((img, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="aspect-square rounded-md overflow-hidden bg-gray-200">
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                      </div>
                      <span className="text-[8px] text-center text-gray-500 font-medium truncate">{img.name}</span>
                    </div>
                  ))}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex items-end justify-center pb-5 ">
                  <div className="flex items-center gap-2 text-white">
                    <ImageIcon size={20} strokeWidth={2} />
                    <span className="font-bold text-[15px] text-base tracking-tight">Image Gallery</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Opacity</span>
                <div className="h-[2px] w-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-3 px-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-1 rounded- appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(
                      to right,
                      #6366f1 0%,
                      #6366f1 ${opacity}%,
                      #f3f4f6 ${opacity}%,
                      #f3f4f6 100%
                    )`,
                  }}
                />

                <span className="text-[11px] font-bold text-gray-700 w-10 text-right">
                  {opacity}%
                </span>
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
                      ['Exposure', 'exposure', -100, 100],
                      ['Contrast', 'contrast', -100, 100],
                      ['Saturation', 'saturation', -100, 100],
                      ['Temperature', 'temperature', -100, 100],
                      ['Tint', 'tint', -180, 180],
                      ['Highlights', 'highlights', -100, 100],
                      ['Shadows', 'shadows', -100, 100],
                    ].map(([label, key, min, max]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
                          <span className="text-[11px] font-bold text-gray-900">{filters[key]}</span>
                        </div>
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
                      {/* Top Row */}
                      <div className="flex items-center gap-6">
                        <RadiusBox corner="tl" value={radius.tl} radiusStyle="rounded-tl-[18px] rounded-tr-md rounded-br-md rounded-bl-md" />
                        <RadiusBox corner="tr" value={radius.tr} radiusStyle="rounded-tr-[18px] rounded-tl-md rounded-br-md rounded-bl-md" />
                      </div>

                      {/* Center Link Icon */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <button
                          onClick={() => setIsRadiusLinked(!isRadiusLinked)}
                          className="pointer-events-auto p-1.5 transition-colors bg-white rounded-full"
                        >
                          {isRadiusLinked ? (
                            <LinkIcon size={20} className="text-gray-900" />
                          ) : (
                            <Link2Off size={20} className="text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Bottom Row */}
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
                          <span
                            className="text-[12px] font-bold text-gray-700 cursor-pointer flex-1"
                            onClick={() => {
                              if (activeEffects.includes(eff)) {
                                setActivePopup(activePopup === eff ? null : eff);
                              }
                            }}
                          >
                            {eff}
                          </span>
                          <button onClick={() => {
                            const isActive = activeEffects.includes(eff);
                            if (isActive) {
                              setActiveEffects(prev => prev.filter(e => e !== eff));
                              if (activePopup === eff) setActivePopup(null);
                            } else {
                              setActiveEffects(prev => [...prev, eff]);
                              setActivePopup(eff);
                            }
                          }}>
                            {activeEffects.includes(eff) ? <Trash2 size={16} className="text-red-500" /> : <Plus size={16} className="text-gray-400" />}
                          </button>

                        </div>
                        {activePopup === eff && (
                          <div
                            className="fixed z-[9999] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-right-4 fade-in duration-200"
                            style={{
                              width: '270px',
                              top: '35%',
                              left: '90%',
                              transform: 'translateX(-120%)'
                            }}
                          >
                            <div className="flex items-center mb-4">
                              <span className="text-sm font-extrabold text-gray-800">
                                {eff}
                              </span>

                              <div className="h-[1px] flex-1 mx-3 bg-gray-100" />

                              <button
                                onClick={() => setActivePopup(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                                aria-label="Close"
                              >
                                <X size={16} className="text-gray-500" />
                              </button>
                            </div>

                            <div className="space-y-6">
                              {eff.includes('Shadow') && (
                                <>
                                  <div className="flex items-start gap-4">
                                    <div
                                      className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xs font-bold border-4 border-gray-50 shadow-inner"
                                      style={{
                                        background: `linear-gradient(135deg, ${effectSettings[eff].color} 10%, #4b5563 100%)`,
                                        opacity: effectSettings[eff].opacity / 100
                                      }}
                                    >
                                      {effectSettings[eff].opacity}%
                                      <input
                                        type="color"
                                        value={effectSettings[eff].color}
                                        onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Code :</p>
                                        <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 bg-white relative">
                                          <input
                                            type="text"
                                            value={effectSettings[eff].color}
                                            onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)}
                                            className="text-[12px] font-bold text-gray-700 w-16 outline-none bg-transparent"
                                          />
                                          <div className="relative w-4 h-4 cursor-pointer">
                                            <Pipette size={14} className="text-gray-400 absolute inset-0 z-0 pointer-events-none" />
                                            {'EyeDropper' in window ? (
                                              <button
                                                onClick={() => handleColorPick(eff)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                aria-label="Pick color"
                                              />
                                            ) : (
                                              <input
                                                type="color"
                                                value={effectSettings[eff].color}
                                                onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                          <p className="text-[10px] font-bold text-gray-400 uppercase">Opacity :</p>
                                          <span className="text-[11px] font-extrabold text-gray-700">{effectSettings[eff].opacity}%</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="0" max="100"
                                          value={effectSettings[eff].opacity}
                                          onChange={(e) => updateEffectSetting(eff, 'opacity', Number(e.target.value))}
                                          className="h-1.5"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4 pt-2">
                                    <EffectControlRow label="X Axis" value={effectSettings[eff].x} onChange={(v) => updateEffectSetting(eff, 'x', v)} />
                                    <EffectControlRow label="Y Axis" value={effectSettings[eff].y} onChange={(v) => updateEffectSetting(eff, 'y', v)} />
                                    <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} />
                                    <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} />
                                  </div>
                                </>
                              )}
                              {!eff.includes('Shadow') && (
                                <div className="space-y-4">
                                  <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} />
                                  <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} />
                                </div>
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

      <InteractionPanel
                selectedElement={selectedElement}
                onUpdate={onUpdate}
                onPopupPreviewUpdate={onPopupPreviewUpdate}
              />




      {showGallery && (
        <div
          className="fixed z-[10000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            width: '320px',
            height: '540px',
            top: '55%',
            left: '80%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {galleryView === 'template' ? (
            <>
              <div className="flex px-4 pt-3 border-b bg-white">
                <button
                  onClick={() => setActiveTab("gallery")}
                  className={`flex-1 pb-2 text-[12px] font-bold transition-all ${activeTab === "gallery" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"
                    }`}
                >
                  Image Gallery
                </button>
                <button
                  onClick={() => setActiveTab("uploaded")}
                  className={`flex-1 pb-2 text-[12px] font-bold transition-all ${activeTab === "uploaded" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"
                    }`}
                >
                  Uploaded Images
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                {activeTab === 'uploaded' && (
                  <div className="mb-8">
                    <h3 className="text-[12px] font-bold text-black mb-6">Upload you file</h3>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-25 border-[2px] border-dashed border-gray-400 rounded-[24px] flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      <p className="text-[13px] text-gray-500 font-medium mb-3">
                        Drag & Drop or <span className="text-[#5D38FF] font-bold">Upload</span>
                      </p>
                      <Upload size={32} className="text-gray-400 mb-4" strokeWidth={1.5} />
                      <p className="text-[11px] text-gray-400 font-medium">
                        Supported File : <span className="uppercase">JPG, PNG</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[12px] font-bold text-black">
                    {activeTab === 'gallery' ? 'Recent' : 'Uploaded files'}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                  {(activeTab === 'gallery' ? [...uploadedImages, ...galleryImages] : uploadedImages).map((img, index) => (
                    <div key={img.id || index} className="group cursor-pointer" onClick={() => { setTempSelectedImage(img); }}>
                      <div className={`aspect-square rounded-[4px] overflow-hidden border-2 transition-all ${tempSelectedImage?.name === img.name ? 'border-black' : 'border-transparent'
                        }`}>
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2 font-medium text-center leading-tight" title={img.name}>
                        {img.name.length > 18 ? img.name.slice(0, 11) + '...' : img.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t flex justify-center gap-2 bg-white">
                <button
                  onClick={() => setShowGallery(false)}
                  className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"
                >
                  <X size={12} /> Close
                </button>
                <button
                  disabled={!tempSelectedImage}
                  onClick={() => { if (!tempSelectedImage) return; selectedElement.src = tempSelectedImage.url; if (onUpdate) onUpdate(); }}
                  className="flex-1 h-8 bg-black text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Replace size={12} /> Replace
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                <button onClick={() => setGalleryView('template')} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowLeft size={20} className="text-black" />
                </button>
                <span className="font-bold text-black text-sg">Image Properties</span>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="w-full aspect-square rounded-[24px] overflow-hidden shadow-xl border border-gray-100 bg-gray-50">
                  <img src={tempSelectedImage?.url} className="w-full h-full object-cover" alt="Selected preview" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-400 font-bold text-[12px] uppercase">Name</span>
                    <span className="font-bold text-black text-[14px]">{tempSelectedImage?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-400 font-bold text-[12px] uppercase">Format</span>
                    <span className="font-bold text-black text-[14px]">JPEG</span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-4 bg-white">
                <button onClick={() => setGalleryView('template')} className="flex-1 py-4 border-2 border-black rounded-xl text-[11px] font-bold text-black hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => { selectedElement.src = tempSelectedImage.url; setGalleryView('template'); if (onUpdate) onUpdate(); }}
                  className="flex-1 py-4 bg-black text-white rounded-xl text-[11px] font-bold shadow-lg hover:bg-gray-800"
                >
                  Confirm Selection
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default ImageEditor;