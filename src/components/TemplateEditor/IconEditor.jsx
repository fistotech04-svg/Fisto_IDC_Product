import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Upload, Replace, ChevronUp, ChevronDown, Edit3, X, Grid, ArrowLeft, ZoomIn, ZoomOut, Mail, Phone, Globe, Trash2, Save, Image, Folder, Move, Check, CheckCheck, Battery, Calendar, File, Settings, Search, Home, User, Users, Star, Heart, Share2, Download, Cloud, Clock, MapPin, Lock, Unlock, Menu, Play, Pause, AlertCircle, Info, HelpCircle, Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Pipette } from 'lucide-react';
import InteractionPanel from './InteractionPanel';
import AnimationPanel from './AnimationPanel';
import { Icon } from '@iconify/react';
import ColorPicker from '../ThreedEditor/ColorPicker';


const IconEditor = ({
  selectedElement,
  onUpdate,
  onPopupPreviewUpdate,
  activePopupElement,
  onPopupUpdate,
  pages,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true
}) => {
  const [iconColor, setIconColor] = useState('#000000');
  const [iconFill, setIconFill] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [previewData, setPreviewData] = useState({ viewBox: '0 0 24 24', html: '' });
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [pickerTarget, setPickerTarget] = useState(null); // 'fill' or 'stroke'
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);
  
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'none' || rgb === 'transparent') return 'none';
    if (!rgb.startsWith('rgb')) return rgb;
    const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/);
    if (!parts) return rgb;
    const r = parseInt(parts[1]);
    const g = parseInt(parts[2]);
    const b = parseInt(parts[3]);
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    return hex === '#000000' && rgb.includes('0, 0, 0, 0') ? 'none' : hex;
  };  
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const isMainPanelOpen = activeSection === 'main';
  const [openSubSection, setOpenSubSection] = useState(null);

  const [showGallery, setShowGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [tempSelectedIcon, setTempSelectedIcon] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  
  // Reset visible count when search or gallery availability changes
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, showGallery]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCount(prev => prev + 50);
    }
  };

  const lucideList = useMemo(() => {
    return Object.keys(LucideIcons)
      .filter(key => key !== 'createLucideIcon' && key !== 'default' && key !== 'icons' && key !== 'Icon' && /^[A-Z]/.test(key))
      .map(key => ({ name: key, Component: LucideIcons[key] }));
  }, []);

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return lucideList;
    const lower = searchQuery.toLowerCase();
    return lucideList.filter(icon => icon.name.toLowerCase().includes(lower));
  }, [searchQuery, lucideList]);

  const [uploadedIcons, setUploadedIcons] = useState([
     { name: 'Mail', Component: Mail },
    { name: 'Call', Component: Phone },
    { name: 'Web', Component: Globe },
    { name: 'Twitter', Component: Twitter },
    { name: 'Instagram', Component: Instagram },
    { name: 'LinkedIn', Component: Linkedin },
    { name: 'GitHub', Component: Github }
  ]);

  useEffect(() => {
    if (!selectedElement) return;

    const syncFromDOM = () => {
        const path = selectedElement.querySelector('path, circle, rect, polyline, polygon, line') || selectedElement;
        const computed = window.getComputedStyle(path);

        const stroke = rgbToHex(computed.stroke);
        const fill = rgbToHex(computed.fill);
        const width = parseFloat(computed.strokeWidth) || 2;

        setIconColor(stroke === 'none' ? '#000000' : stroke); 
        setIconFill(fill);
        setStrokeWidth(width);

        const currentOpacity = selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1';
        setOpacity(Math.round(parseFloat(currentOpacity) * 100));

        setPreviewData({
            viewBox: selectedElement.getAttribute('viewBox') || '0 0 24 24',
            html: selectedElement.innerHTML
        });
    };

    const observer = new MutationObserver(syncFromDOM);
    observer.observe(selectedElement, { attributes: true, subtree: true, attributeFilter: ['stroke', 'fill', 'stroke-width', 'style', 'd', 'points', 'opacity'] });

    syncFromDOM();

    return () => observer.disconnect();
  }, [selectedElement]);

  const updateIconColor = (color) => {
    setIconColor(color);
    if (selectedElement) {
      // Validate hex for partial typing
      if (color !== 'none' && !/^#([A-Fa-f0-9]{0,6})$/.test(color)) return;

      selectedElement.setAttribute('stroke', color);
      selectedElement.style.setProperty('stroke', color, 'important');
      
      const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
      paths.forEach(p => {
        p.setAttribute('stroke', color);
        p.style.setProperty('stroke', color, 'important');
      });
      
      selectedElement.style.color = color; 
      
      // Sync sidebar preview SVG (instant, no iframe rewrite)
      setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
      // Removed immediate onUpdate() to prevent iframe rewrite during drag
    }
  };

  const updateIconFill = (color) => {
    setIconFill(color);
    if (selectedElement) {
      // Validate hex for partial typing
      if (color !== 'none' && !/^#([A-Fa-f0-9]{0,6})$/.test(color)) return;

      if (color === 'none') {
        selectedElement.removeAttribute('fill');
      } else {
        selectedElement.setAttribute('fill', color);
      }
      selectedElement.style.setProperty('fill', color, 'important');
      
      const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
      paths.forEach(p => {
        if (color === 'none') {
          p.removeAttribute('fill');
        } else {
          p.setAttribute('fill', color);
        }
        p.style.setProperty('fill', color, 'important');
      });

      // Sync sidebar preview SVG (instant, no iframe rewrite)
      setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
      // Removed immediate onUpdate() to prevent iframe rewrite during drag
    }
  };

  const commitChanges = () => {
    if (onUpdate) onUpdate();
  };

  const updateStrokeWidth = (newWidth) => {
    if (!selectedElement || isNaN(newWidth)) return;
    
    const widthVal = Math.max(0, newWidth);
    
    selectedElement.setAttribute('stroke-width', widthVal.toString());
    selectedElement.style.setProperty('stroke-width', widthVal.toString(), 'important');
    
    const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
    paths.forEach(p => {
      p.setAttribute('stroke-width', widthVal.toString());
      p.style.setProperty('stroke-width', widthVal.toString(), 'important');
    });
    
    setStrokeWidth(widthVal);
    setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
    onUpdate && onUpdate();
  };

  const updateOpacity = (newOpacity) => {
    if (!selectedElement) return;
    const val = newOpacity / 100;
    selectedElement.style.opacity = val;
    selectedElement.setAttribute('opacity', val);
    setOpacity(newOpacity);
    onUpdate && onUpdate();
  };

  const replaceIconContent = (newViewBox, newInnerHtml) => {
    if (!selectedElement) return;
    if (newViewBox) selectedElement.setAttribute('viewBox', newViewBox);
    selectedElement.innerHTML = newInnerHtml;
    
    // Use a small timeout to let the browser compute styles for the new content
    setTimeout(() => {
        const path = selectedElement.querySelector('path, circle, rect, polyline, polygon, line') || selectedElement;
        const computed = window.getComputedStyle(path);

        const stroke = rgbToHex(computed.stroke);
        const fill = rgbToHex(computed.fill);
        const width = parseFloat(computed.strokeWidth) || 2;

        setIconColor(stroke === 'none' ? '#000000' : stroke); 
        setIconFill(fill);
        setStrokeWidth(width);

        setPreviewData({
            viewBox: newViewBox || selectedElement.getAttribute('viewBox') || '0 0 24 24',
            html: newInnerHtml
        });
        
        onUpdate && onUpdate();
    }, 0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(event.target.result, 'image/svg+xml');
        const newSvg = doc.querySelector('svg');

        if (newSvg) {
          replaceIconContent(newSvg.getAttribute('viewBox'), newSvg.innerHTML);
          // Do NOT save to gallery or temp selection for main panel upload
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(event.target.result, 'image/svg+xml');
          const newSvg = doc.querySelector('svg');
          if (newSvg) {
             const newIcon = {
                 name: file.name.replace('.svg', ''),
                 viewBox: newSvg.getAttribute('viewBox') || '0 0 24 24',
                 d: newSvg.querySelector('path')?.getAttribute('d') || '',
                 html: newSvg.innerHTML
             };
             setUploadedIcons(prev => [newIcon, ...prev]);
             setTempSelectedIcon(newIcon);

             replaceIconContent(newSvg.getAttribute('viewBox'), newSvg.innerHTML);
          }
        };
        reader.readAsText(file);
    }
    e.target.value = '';
  }

  const handleReplaceFromGallery = () => {
      if(!tempSelectedIcon) return;
      
      let newViewBox = '0 0 24 24';
      let innerHtml = '';

      if (tempSelectedIcon.Component) {
          const svgString = renderToStaticMarkup(<tempSelectedIcon.Component strokeWidth={2} />);
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgString, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          if (svg) {
              newViewBox = svg.getAttribute('viewBox') || '0 0 24 24';
              innerHtml = svg.innerHTML;
          }
      } else if (tempSelectedIcon.html) {
          newViewBox = tempSelectedIcon.viewBox || '0 0 24 24';
          innerHtml = tempSelectedIcon.html;
      } else if (tempSelectedIcon.d) {
          newViewBox = tempSelectedIcon.viewBox || '0 0 24 24';
          innerHtml = `<path d="${tempSelectedIcon.d}" stroke="none"></path>`;
      }
      
      replaceIconContent(newViewBox, innerHtml);
      setShowGallery(false);
  }


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

      <div className="bg-white border space-y-4 border-gray-200 rounded-[15px] shadow-sm overflow-hidden relative font-sans">
        
        <div 
          className="flex items-center justify-between px-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}
        >
          <div className="flex items-center gap-2">
            <Icon icon="uil:icons"  className="text-gray-600" width="16" height="16" />
            <span className="font-medium text-gray-700 text-sm">Icon</span>
          </div>
          <ChevronUp size={16} className={`text-gray-500 transition-transform duration-200 ${isMainPanelOpen ? '' : 'rotate-180'}`} />
        </div>

        {isMainPanelOpen && (
          <div className="space-y-5 pr-5 pl-5 mb-15">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Replace Icon</span>
                <div className="h-[2px] w-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-18 h-18 rounded-xl overflow-hidden border-2 border-dashed bg-gray-50 p-2 flex items-center justify-center">
                    <svg 
                        viewBox={previewData.viewBox}
                        className="w-full h-full"
                        style={{ 
                            fill: iconFill, 
                            stroke: iconColor, 
                            strokeWidth: strokeWidth,
                            opacity: opacity / 100 
                        }}
                        dangerouslySetInnerHTML={{ __html: previewData.html }} 
                    />
                </div>
           
                
                <Replace size={18} className="text-gray-300 shrink-0" />
                
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-18 border-2 border-dashed bg-gray-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload size={18} className="text-500 mb-1" />
                  <p className="text-[10px] text-gray-400 font-medium text-center">Drag & Drop or <span className="font-bold text-indigo-600">Upload SVG</span></p>
                </div>
                <input
                    type="file"
                    accept=".svg"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
              </div>

              <div 
                onClick={() => setShowGallery(true)}
                className="relative h-40 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 select-none" 
              >
                {/* Background with icon previews */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 p-4">
                  <div className="grid grid-cols-3 gap-3 h-10% pb-6 px-4 opacity-70 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105">
                    {[...uploadedIcons, ...lucideList].slice(0, 6).map((icon, i) => (
                      <div key={i} className="aspect-square rounded-lg shadow-lg overflow-hidden bg-white border-2 border-gray-300 p-3 flex items-center justify-center h-50%">
                        {icon.Component ? (
                          <icon.Component className="w-full h-full text-gray-700" strokeWidth={1.5} />
                        ) : (
                          <svg viewBox={icon.viewBox} className="w-full h-full fill-gray-700">
                            {icon.html ? (
                              <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                            ) : (
                              <path d={icon.d} />
                            )}
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                 
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                    <Grid size={20} />
                    Icon Gallery
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Opacity</span>
                <div className="h-[2px] w-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-4 px-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => updateOpacity(Number(e.target.value))}
                  className="flex-1 h-1 appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)`,
                  }}
                />
                <span className="text-[14px] font-medium text-gray-600 w-14 text-right whitespace-nowrap">
                  {opacity} %
                </span>
              </div>
            </div>



            <div className="border border-gray-200 rounded-[15px] overflow-hidden bg-white shadow-sm font-sans">
              <button 
                onClick={() => setOpenSubSection(openSubSection === 'color' ? null : 'color')} 
                className="w-full flex items-center justify-between px-4 py-4 text-sm font-bold text-gray-900 border-b border-gray-50"
              >
                <span className="text-sm font-bold text-gray-900">Color</span>
                <ChevronUp size={20} className={`text-gray-900 transition-transform duration-200 ${openSubSection === 'color' ? '' : 'rotate-180'}`} strokeWidth={2.5} />
              </button>
              
               {openSubSection === 'color' && (
                <div className="p-4 space-y-4">
                  {/* Fill Row */}
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-gray-800 w-10">Fill</span>
                    <span className="text-[14px] font-medium text-gray-800 w-4 text-center">:</span>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget('fill');
                        const parentRect = e.currentTarget.closest('.space-y-4').getBoundingClientRect();
                        setPickerPos({ x: parentRect.left, y: parentRect.top });
                      }}
                      className="color-picker-trigger relative w-10 h-10 rounded-[10px] border border-gray-300 shadow-sm shrink-0 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors bg-white"
                    >
                      <div 
                        className="w-full h-full" 
                        style={{ 
                          backgroundColor: iconFill === 'none' ? 'transparent' : iconFill,
                        }} 
                      />
                      { (iconFill === 'none' || iconFill === '#' || !iconFill) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center border border-gray-400 rounded-[12px] px-3 py-2 bg-white h-10 ml-1">
                      <input 
                        type="text"
                        value={iconFill === 'none' ? '#' : (iconFill.startsWith('#') ? iconFill : '#' + iconFill)}
                        onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val === '#' || val === '') updateIconFill('none');
                            else updateIconFill(val.startsWith('#') ? val : '#' + val);
                        }}
                        className="text-[14px] font-medium text-gray-600 uppercase w-full outline-none bg-transparent"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => updateOpacity(Number(e.target.value))}
                        className="text-[14px] font-medium text-gray-500 ml-2 w-12 text-right outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Stroke Row */}
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-gray-800 w-10">Stroke</span>
                    <span className="text-[14px] font-medium text-gray-800 w-4 text-center">:</span>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget('stroke');
                        const parentRect = e.currentTarget.closest('.space-y-4').getBoundingClientRect();
                        setPickerPos({ x: parentRect.left, y: parentRect.top });
                      }}
                      className="color-picker-trigger relative w-10 h-10 rounded-[10px] border border-gray-300 shadow-sm shrink-0 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors bg-white"
                    >
                      <div 
                        className="w-full h-full" 
                        style={{ 
                          backgroundColor: iconColor === 'none' ? 'transparent' : iconColor,
                        }} 
                      />
                      { (iconColor === 'none' || iconColor === '#' || !iconColor) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center border border-gray-400 rounded-[12px] px-3 py-2 bg-white h-10 ml-1">
                      <input 
                        type="text"
                        value={iconColor === 'none' ? '#' : (iconColor.startsWith('#') ? iconColor : '#' + iconColor)}
                        onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val === '#' || val === '') updateIconColor('none');
                            else updateIconColor(val.startsWith('#') ? val : '#' + val);
                        }}
                        className="text-[14px] font-medium text-gray-600 uppercase w-full outline-none bg-transparent"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => updateOpacity(Number(e.target.value))}
                        className="text-[14px] font-medium text-gray-500 ml-2 w-12 text-right outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Stroke Width Box */}
                  <div className="flex justify-end pt-1">
                    <div
                      className="h-10 min-w-[50px] border border-gray-400 rounded-[12px] flex items-center px-3 gap-2 bg-white hover:border-blue-500 transition-colors cursor-ew-resize select-none shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent click from bubbling
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent event bubbling
                        const startX = e.clientX;
                        const startVal = strokeWidth || 0;

                        const handleMove = (moveEvent) => {
                          const diff = Math.round((moveEvent.clientX - startX) / 2);
                          const newVal = Math.max(0, Math.min(20, startVal + diff));
                          
                          // Update stroke width WITHOUT calling onUpdate during drag
                          if (!selectedElement || isNaN(newVal)) return;
                          const widthVal = Math.max(0, newVal);
                          
                          selectedElement.setAttribute('stroke-width', widthVal.toString());
                          selectedElement.style.setProperty('stroke-width', widthVal.toString(), 'important');
                          
                          const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
                          paths.forEach(p => {
                            p.setAttribute('stroke-width', widthVal.toString());
                            p.style.setProperty('stroke-width', widthVal.toString(), 'important');
                          });
                          
                          setStrokeWidth(widthVal);
                          setPreviewData(prev => ({ ...prev, html: selectedElement.innerHTML }));
                          // DO NOT call onUpdate here during drag
                        };

                        const handleUp = () => {
                          window.removeEventListener('mousemove', handleMove);
                          window.removeEventListener('mouseup', handleUp);
                          // NOW call onUpdate after dragging is done
                          if (onUpdate) onUpdate();
                        };

                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', handleUp);
                      }}
                    >
                      <div className="flex flex-col gap-[2px] w-4 flex-shrink-0">
                        <div className="h-[1px] w-full bg-gray-600" />
                        <div className="h-[2px] w-full bg-gray-600" />
                        <div className="h-[2.5px] w-full bg-gray-600" />
                        <div className="h-[3px] w-full bg-gray-600" />
                      </div>
                      <div className="w-[1px] h-5 bg-gray-300"></div>
                      <input
                        type="number"
                        readOnly
                        value={strokeWidth}
                        className="w-[40px] text-[14px] font-medium text-gray-600 outline-none text-center bg-transparent cursor-ew-resize pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>



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
           <div className="flex px-4 pt-3 border-b bg-white">
             <button
               onClick={() => setActiveTab("gallery")}
               className={`flex-1 pb-2 text-[12px] font-bold transition-all ${activeTab === "gallery" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"}`}
             >
               Icon Gallery
             </button>
             <button
               onClick={() => setActiveTab("uploaded")}
               className={`flex-1 pb-2 text-[12px] font-bold transition-all ${activeTab === "uploaded" ? "border-b-2 border-black text-black" : "border-transparent text-gray-400"}`}
             >
               Uploaded Icons
             </button>
           </div>
           
           {activeTab === 'gallery' && (
             <div className="px-6 py-4 border-b bg-white">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search icons..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 text-xs bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-black  transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
             </div>
           )}
           
           <div 
             className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar"
             onScroll={handleScroll}
           >
             {activeTab === 'gallery' && (
                 <>
                     <div className="grid grid-cols-5 gap-3">
                         {filteredIcons.slice(0, visibleCount).map((icon, index) => (
                            <div 
                                key={index} 
                                onClick={() => setTempSelectedIcon(icon)}
                                className={`aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 ${tempSelectedIcon === icon ? 'bg-gray-200 ring-2 ring-gray-300' : 'bg-transparent'}`}
                            >
                                {icon.Component ? (
                                    <icon.Component className="w-9 h-9 text-black" strokeWidth={1.5} />
                                ) : (
                                    <svg viewBox={icon.viewBox} className="w-9 h-9 fill-black">
                                        {icon.html ? (
                                            <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                                        ) : (
                                            <path d={icon.d} />
                                        )}
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                 </>
             )}

             {activeTab === 'uploaded' && (
                 <>
                    <h3 className="text-[12px] font-bold text-black mb-4">Upload your Icon</h3>
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full h-28 border-[2px] border-dashed border-gray-300 rounded-[18px] flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-6"
                    >
                      <p className="text-[12px] text-gray-400 font-medium mb-2">
                        Drag & Drop or <span className="text-[#5D38FF] font-bold">Upload</span>
                      </p>
                      <Upload size={24} className="text-gray-300 mb-2" strokeWidth={1.5} />
                      <p className="text-[10px] text-gray-400">
                        Supported File : <span className="uppercase">SVG</span>
                      </p>
                    </div>
                    <input 
                        type="file" 
                        accept=".svg" 
                        ref={galleryInputRef} 
                        className="hidden" 
                        onChange={handleModalFileUpload}
                    />

                    <h3 className="text-[12px] font-bold text-black mb-4">Uploaded Icons</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {uploadedIcons.map((icon, index) => (
                            <div 
                                key={index} 
                                onClick={() => setTempSelectedIcon(icon)}
                                className={`aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 ${tempSelectedIcon === icon ? 'bg-gray-200 ring-2 ring-gray-300' : 'bg-transparent'}`}
                            >
                                {icon.Component ? (
                                    <icon.Component className="w-6 h-6 text-black" strokeWidth={1.5} />
                                ) : (
                                    <svg viewBox={icon.viewBox} className="w-6 h-6 fill-black">
                                        {icon.html ? (
                                            <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                                        ) : (
                                            <path d={icon.d} />
                                        )}
                                    </svg>
                                )}
                            </div>
                        ))}
                         {uploadedIcons.length === 0 && <span className="text-[10px] text-gray-400 col-span-5 text-center py-4">No uploaded icons yet</span>}
                    </div>
                 </>
             )}
           </div>

           <div className="p-3 border-t flex justify-end gap-2 bg-white">
             <button
               onClick={() => setShowGallery(false)}
               className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"
             >
               <X size={12} /> Close
             </button>
             <button
               disabled={!tempSelectedIcon}
               onClick={handleReplaceFromGallery}
               className="flex-1 h-8 bg-black text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-zinc-800 disabled:opacity-50"
             >
               <Replace size={12} /> Replace
             </button>
           </div>
        </div>
      )}


      {showInteraction && (
        <InteractionPanel
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onPopupPreviewUpdate={onPopupPreviewUpdate}
          pages={pages}
          isOpen={activeSection === 'interaction'}
          onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
          activePopupElement={activePopupElement}
          onPopupUpdate={onPopupUpdate}
          TextEditorComponent={TextEditorComponent}
          ImageEditorComponent={ImageEditorComponent}
          VideoEditorComponent={VideoEditorComponent}
          GifEditorComponent={GifEditorComponent}
          IconEditorComponent={IconEditorComponent || IconEditor}
        />
      )}

      <AnimationPanel
        selectedElement={selectedElement}
        onUpdate={onUpdate}
        isOpen={activeSection === 'animation'}
        onToggle={() => setActiveSection(activeSection === 'animation' ? null : 'animation')}
      />

      {pickerTarget && createPortal(
        <>
          <div className="fixed inset-0 z-[10000] bg-transparent" onClick={() => setPickerTarget(null)}></div>
          <ColorPicker
            className="fixed z-[10001] w-[280px]"
            style={{
              top: Math.max(20, Math.min(pickerPos.y, window.innerHeight - 400)),
              left: Math.max(20, Math.min(pickerPos.x - 290, window.innerWidth - 300))
            }}
            color={pickerTarget === 'fill' ? iconFill : iconColor}
            onChange={(color) => {
              if (pickerTarget === 'fill') updateIconFill(color);
              else updateIconColor(color);
            }}
            opacity={opacity}
            onOpacityChange={updateOpacity}
            onClose={() => setPickerTarget(null)}
          />
        </>,
        document.body
      )}
    </div>
  );
};

export default IconEditor;