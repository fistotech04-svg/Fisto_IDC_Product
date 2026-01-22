import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Upload, Replace, ChevronUp, ChevronDown, Edit3, X, Grid, ArrowLeft, ZoomIn, ZoomOut, Mail, Phone, Globe, Trash2, Save, Image, Folder, Move, Check, CheckCheck, Battery, Calendar, File, Settings, Search, Home, User, Users, Star, Heart, Share2, Download, Cloud, Clock, MapPin, Lock, Unlock, Menu, Play, Pause, AlertCircle, Info, HelpCircle, Facebook, Twitter, Instagram, Linkedin, Github, Youtube } from 'lucide-react';
import InteractionPanel from './InteractionPanel';

const IconEditor = ({ selectedElement, onUpdate, onPopupPreviewUpdate }) => {
  const [iconColor, setIconColor] = useState('#000000');
  const [iconFill, setIconFill] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [previewData, setPreviewData] = useState({ viewBox: '0 0 24 24', html: '' });
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null); 
  
  const rgbToHex = useCallback((rgb) => {
    if (!rgb || rgb === 'none' || rgb === 'transparent') return 'none';
    if (!rgb.startsWith('rgb')) return rgb;
    const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/);
    if (!parts) return rgb;
    const r = parseInt(parts[1]);
    const g = parseInt(parts[2]);
    const b = parseInt(parts[3]);
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    return hex === '#000000' && rgb.includes('0, 0, 0, 0') ? 'none' : hex;
  }, []);

  const hslToRgb = useCallback((h, s, l) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q,h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }, []);

  const hexToRgb = useCallback((hex) => {
    if (!hex || hex === 'none' || hex === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    if (hex.startsWith('#')) hex = hex.slice(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b, a: 1 };
  }, []);
  
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState('fill'); // 'fill' or 'stroke'
  const colorBoxRef = useRef(null);

  const [showGallery, setShowGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [tempSelectedIcon, setTempSelectedIcon] = useState(null);

  const galleryIcons = useMemo(() => [
    { name: 'Zoom In', Component: ZoomIn },
    { name: 'Zoom Out', Component: ZoomOut },
    { name: 'Recycle Bin', Component: Trash2 },
    { name: 'Save', Component: Save },
    { name: 'Image', Component: Image },
    { name: 'Folder', Component: Folder },
    { name: 'Arrows', Component: Move },
    { name: 'Tick', Component: Check },
    { name: 'Double Tick', Component: CheckCheck },
    { name: 'Replace', Component: Replace },
    { name: 'Battery', Component: Battery },
    { name: 'Calendar', Component: Calendar },
    { name: 'File', Component: File },
    { name: 'Settings', Component: Settings },
    { name: 'Search', Component: Search },
    { name: 'Home', Component: Home },
    { name: 'User', Component: User },
    { name: 'Users', Component: Users },
    { name: 'Star', Component: Star },
    { name: 'Heart', Component: Heart },
    { name: 'Share', Component: Share2 },
    { name: 'Download', Component: Download },
    { name: 'Cloud', Component: Cloud },
    { name: 'Clock', Component: Clock },
    { name: 'Location', Component: MapPin },
    { name: 'Lock', Component: Lock },
    { name: 'Unlock', Component: Unlock },
    { name: 'Menu', Component: Menu },
    { name: 'Play', Component: Play },
    { name: 'Pause', Component: Pause },
    { name: 'Alert', Component: AlertCircle },
    { name: 'Info', Component: Info },
    { name: 'Help', Component: HelpCircle },
    { name: 'Facebook', Component: Facebook },
    { name: 'Twitter', Component: Twitter },
    { name: 'Instagram', Component: Instagram },
    { name: 'LinkedIn', Component: Linkedin },
    { name: 'GitHub', Component: Github },
    { name: 'YouTube', Component: Youtube },
  ], []);

  const [uploadedIcons, setUploadedIcons] = useState([
     { name: 'Mail', Component: Mail },
    { name: 'Call', Component: Phone },
    { name: 'Web', Component: Globe },
  ]);

  useEffect(() => {
    if (selectedElement) {
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
    }
  }, [selectedElement, rgbToHex]);

  const updateIconColor = useCallback((newColor) => {
    if (!selectedElement) return;
    selectedElement.setAttribute('stroke', newColor);
    selectedElement.style.stroke = newColor;
    const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
    paths.forEach(p => {
      p.setAttribute('stroke', newColor);
      p.style.stroke = newColor;
    });
    selectedElement.style.color = newColor; 
    setIconColor(newColor);
    onUpdate && onUpdate();
  }, [selectedElement, onUpdate]);

  const updateIconFill = useCallback((newColor) => {
    if (!selectedElement) return;
    selectedElement.setAttribute('fill', newColor);
    selectedElement.style.fill = newColor;
    const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
    paths.forEach(p => {
      p.setAttribute('fill', newColor);
      p.style.fill = newColor;
    });
    setIconFill(newColor);
    onUpdate && onUpdate();
  }, [selectedElement, onUpdate]);

  const updateStrokeWidth = useCallback((newWidth) => {
    if (!selectedElement) return;
    selectedElement.setAttribute('stroke-width', newWidth);
    selectedElement.style.strokeWidth = newWidth;
    const paths = selectedElement.querySelectorAll('path, circle, rect, polyline, polygon, line');
    paths.forEach(p => {
      p.setAttribute('stroke-width', newWidth);
      p.style.strokeWidth = newWidth;
    });
    setStrokeWidth(newWidth);
    onUpdate && onUpdate();
  }, [selectedElement, onUpdate]);

  const updateOpacity = useCallback((newOpacity) => {
    if (!selectedElement) return;
    const val = newOpacity / 100;
    selectedElement.style.opacity = val;
    selectedElement.setAttribute('opacity', val);
    setOpacity(newOpacity);
    onUpdate && onUpdate();
  }, [selectedElement, onUpdate]);

  const replaceIconContent = useCallback((newViewBox, newInnerHtml) => {
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
  }, [selectedElement, rgbToHex, onUpdate]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(event.target.result, 'image/svg+xml');
        const newSvg = doc.querySelector('svg');

        if (newSvg) {
          replaceIconContent(newSvg.getAttribute('viewBox'), newSvg.innerHTML);
          
          const newIcon = {
             name: file.name.replace('.svg', ''),
             viewBox: newSvg.getAttribute('viewBox') || '0 0 24 24',
             d: newSvg.querySelector('path')?.getAttribute('d') || '',
             html: newSvg.innerHTML
          };
          setUploadedIcons(prev => [newIcon, ...prev]);
          setTempSelectedIcon(newIcon);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, [replaceIconContent]);

  const handleModalFileUpload = useCallback((e) => {
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
             setShowGallery(false);
          }
        };
        reader.readAsText(file);
    }
    e.target.value = '';
  }, [replaceIconContent]);

  const handleReplaceFromGallery = useCallback(() => {
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
  }, [tempSelectedIcon, replaceIconContent]);


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

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative font-sans space-y-4">
        
        <div className="flex items-center justify-between p-4 border-sm border-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 border border-gray-200 rounded-lg"><Edit3 size={16} className="text-gray-600" /></div>
            <span className="font-bold text-gray-700 text-sm">Icon</span>
          </div>
          <button onClick={() => setIsMainPanelOpen(!isMainPanelOpen)} className="p-1 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronUp size={18} className={`text-gray-400 transition-transform duration-200 ${isMainPanelOpen ? '' : 'rotate-180'}`} />
          </button>
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
                        style={{ fill: iconFill, stroke: iconColor, strokeWidth: strokeWidth }}
                        dangerouslySetInnerHTML={{ __html: previewData.html }} 
                    />
                </div>
           
                
                <Replace size={18} className="text-gray-300 shrink-0" />
                
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-18 border-2 border-dashed bg-gray-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload size={18} className="text-500 mb-1" />
                  <p className="text-[10px] text-gray-400 font-medium text-center">Drag & Drop or <br/><span className="font-bold text-indigo-600">Upload SVG</span></p>
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
                className="relative h-28 bg-gray-100 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 select-none pb-8" 
              >
                 <div className="grid grid-cols-6 gap-2 p-3 opacity-60">
                    {[...uploadedIcons, ...galleryIcons].slice(0, 18).map((icon, i) => (
                       <div key={i} className="aspect-square bg-white rounded-md flex items-center justify-center shadow-sm">
                          {icon.Component ? (
                            <icon.Component className="w-4 h-4 text-gray-700" />
                          ) : (
                            <svg viewBox={icon.viewBox} className="w-4 h-4 fill-gray-700">
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
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end justify-center pb-3 transition-opacity group-hover:via-black/20">
                    <span className="font-bold text-[12px] text-white tracking-wide">Icon Gallery</span>
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
                  onChange={(e) => updateOpacity(Number(e.target.value))}
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
               <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden relative
        w-full max-w-sm">
                <button onClick={() => setOpenSubSection(openSubSection === 'color' ? null : 'color')} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  <span>Color</span>
                  {openSubSection === 'color' ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
                </button>
                
                {openSubSection === 'color' && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-4">
                    {/* Fill Row */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-800 block">Fill :</span>
                      <div className="flex items-center gap-3">
                        <div 
                          ref={(el) => colorPickerType === 'fill' ? colorBoxRef.current = el : null}
                          onClick={(e) => {
                            setColorPickerType('fill');
                            setShowColorPicker(true);
                          }}
                          className="relative w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm shrink-0 overflow-hidden cursor-pointer hover:border-indigo-400 transition"
                        >
                          <div className="w-full h-full" style={{ backgroundColor: iconFill === 'none' ? '#ffffff' : iconFill }} />
                        </div>
                        
                        <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden h-10 bg-white">
                          <input 
                            type="text"
                            value={iconFill === 'none' ? '#FFFFFF' : iconFill.toUpperCase()}
                            onChange={(e) => updateIconFill(e.target.value)}
                            className="flex-1 px-3 text-sm text-gray-700 outline-none font-mono"
                            placeholder="#FFFFFF"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stroke Row */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-800 block">Stroke :</span>
                      <div className="flex items-center gap-3">
                        <div 
                          ref={(el) => colorPickerType === 'stroke' ? colorBoxRef.current = el : null}
                          onClick={(e) => {
                            setColorPickerType('stroke');
                            setShowColorPicker(true);
                          }}
                          className="relative w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm shrink-0 overflow-hidden cursor-pointer hover:border-indigo-400 transition"
                        >
                          <div className="w-full h-full" style={{ backgroundColor: iconColor === 'none' ? '#000000' : iconColor }} />
                        </div>
                        
                        <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden h-10 bg-white">
                          <input 
                            type="text"
                            value={iconColor === 'none' ? '#000000' : iconColor.toUpperCase()}
                            onChange={(e) => updateIconColor(e.target.value)}
                            className="flex-1 px-3 text-sm text-gray-700 outline-none font-mono"
                            placeholder="#000000"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stroke Width Box */}
                  <div className="flex justify-end pt-1">
                    <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2 w-fit bg-white shadow-sm h-10">
                      <div className="flex flex-col gap-[2px] w-4">
                        <div className="h-[1px] w-full bg-gray-600" />
                        <div className="h-[2px] w-full bg-gray-600" />
                        <div className="h-[2.5px] w-full bg-gray-600" />
                        <div className="h-[3px] w-full bg-gray-600" />
                      </div>
                      <input 
                        type="number"
                        min="0"
                        max="20"
                        value={strokeWidth}
                        onChange={(e) => updateStrokeWidth(parseFloat(e.target.value))}
                        className="w-6 text-sm font-medium text-gray-600 outline-none bg-transparent text-center"
                      />
                    </div>
                  </div>
                  </div>
                )}
               </div>
            </div>

            {/* Color Picker Popup - Positioned on left side */}
            {showColorPicker && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowColorPicker(false)}
                />
                
                {/* Popup - Left side positioning */}
                <div className="fixed top-[180px] right-[21vw] w-[240px] bg-white rounded-2xl shadow-2xl z-[101] p-5 space-y-3">
                  {/* Color Picker: Saturation/Value + Hue Slider */}
                  <div className="flex gap-3">
                    {/* Saturation/Value Picker */}
                    <div
                      className="w-48 h-48 relative cursor-crosshair overflow-hidden border border-gray-200"
                      style={{ 
                        backgroundColor: (() => {
                          const currentColor = colorPickerType === 'fill' ? iconFill : iconColor;
                          if (!currentColor || currentColor === 'none') return '#ff0000';
                          
                          // Convert hex to RGB
                          const hex = currentColor.replace('#', '');
                          const r = parseInt(hex.substr(0, 2), 16) / 255;
                          const g = parseInt(hex.substr(2, 2), 16) / 255;
                          const b = parseInt(hex.substr(4, 2), 16) / 255;
                          
                          // Get hue
                          const max = Math.max(r, g, b);
                          const min = Math.min(r, g, b);
                          const delta = max - min;
                          
                          let h = 0;
                          if (delta !== 0) {
                            if (max === r) h = ((g - b) / delta) % 6;
                            else if (max === g) h = (b - r) / delta + 2;
                            else h = (r - g) / delta + 4;
                          }
                          h = Math.round(h * 60);
                          if (h < 0) h += 360;
                          
                          return `hsl(${h}, 100%, 50%)`;
                        })()
                      }}
                      onMouseDown={(e) => {
                        const handleMove = (moveEvent) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                          const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                          
                          // Get current hue from background color
                          const currentColor = colorPickerType === 'fill' ? iconFill : iconColor;
                          let hue = 0;
                          if (currentColor && currentColor !== 'none') {
                            const hex = currentColor.replace('#', '');
                            const r = parseInt(hex.substr(0, 2), 16) / 255;
                            const g = parseInt(hex.substr(2, 2), 16) / 255;
                            const b = parseInt(hex.substr(4, 2), 16) / 255;
                            const max = Math.max(r, g, b);
                            const min = Math.min(r, g, b);
                            const delta = max - min;
                            if (delta !== 0) {
                              if (max === r) hue = ((g - b) / delta) % 6;
                              else if (max === g) hue = (b - r) / delta + 2;
                              else hue = (r - g) / delta + 4;
                            }
                            hue = (hue * 60);
                            if (hue < 0) hue += 360;
                          }
                          
                          // Convert HSV to RGB
                          const s = x;
                          const v = 1 - y;
                          const c = v * s;
                          const hPrime = hue / 60;
                          const x2 = c * (1 - Math.abs((hPrime % 2) - 1));
                          const m = v - c;
                          
                          let r, g, b;
                          if (hPrime < 1) { r = c; g = x2; b = 0; }
                          else if (hPrime < 2) { r = x2; g = c; b = 0; }
                          else if (hPrime < 3) { r = 0; g = c; b = x2; }
                          else if (hPrime < 4) { r = 0; g = x2; b = c; }
                          else if (hPrime < 5) { r = x2; g = 0; b = c; }
                          else { r = c; g = 0; b = x2; }
                          
                          r = Math.round((r + m) * 255);
                          g = Math.round((g + m) * 255);
                          b = Math.round((b + m) * 255);
                          
                          const newColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                          
                          if (colorPickerType === 'fill') {
                            updateIconFill(newColor);
                          } else {
                            updateIconColor(newColor);
                          }
                        };
                        handleMove(e);
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                      <div className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: '50%', top: '50%' }}></div>
                    </div>

                    {/* Vertical Hue Slider */}
                    <div
                      className="w-9 h-48 rounded-xl relative cursor-pointer border border-gray-200"
                      style={{ background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
                      onMouseDown={(e) => {
                        const handleMove = (moveEvent) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                          const hue = y * 360;
                          const rgb = hslToRgb(hue / 360, 1, 0.5);
                          const newColor = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
                          
                          if (colorPickerType === 'fill') {
                            updateIconFill(newColor);
                          } else {
                            updateIconColor(newColor);
                          }
                        };
                        handleMove(e);
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                      }}
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 w-full h-1 border-2 border-white rounded-full shadow-md" style={{ top: '50%' }}></div>
                    </div>
                  </div>

                  {/* Color Code Input */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-800">Color Code :</span>
                    <div className="flex items-center gap-2 px-3 h-9 border border-gray-300 rounded-lg bg-white">
                      <input
                        type="text"
                        value={colorPickerType === 'fill' 
                          ? (iconFill === 'none' ? '#FFFFFF' : iconFill.toUpperCase())
                          : (iconColor === 'none' ? '#000000' : iconColor.toUpperCase())
                        }
                        onChange={(e) => {
                          if (colorPickerType === 'fill') {
                            updateIconFill(e.target.value);
                          } else {
                            updateIconColor(e.target.value);
                          }
                        }}
                        className="flex-1 text-sm text-gray-700 outline-none font-mono"
                        maxLength={7}
                      />
                      <Edit3 size={14} className="text-gray-400" />
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800">Opacity :</span>
                      <span className="text-xs text-gray-500">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => updateOpacity(Number(e.target.value))}
                      className="w-full appearance-none cursor-pointer"
                      style={{
                        height: '4px',
                        borderRadius: '2px',
                        background: `linear-gradient(
                          to right,
                          #6366f1 0%,
                          #6366f1 ${opacity}%,
                          #e5e7eb ${opacity}%,
                          #e5e7eb 100%
                        )`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

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
           
           <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
             {activeTab === 'gallery' && (
                 <>
                    <h3 className="text-[12px] font-bold text-black mb-4">Recent</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {[...uploadedIcons, ...galleryIcons].map((icon, index) => (
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

      {/* INTERACTION PANEL */}
      <InteractionPanel
        selectedElement={selectedElement}
        onUpdate={onUpdate}
        onPopupPreviewUpdate={onPopupPreviewUpdate}
      />
    </div>
  );
};

export default IconEditor;