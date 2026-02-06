import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

// Helper functions for color conversion
const hexToHsv = (hex) => {
  let color = hex.substring(1);
  if (color.length === 3)
    color = color.split("").map((c) => c + c).join("");
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }) => {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function ColorPicker({ color, onChange, opacity, onOpacityChange, onClose }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color));


  useEffect(() => {
    setHsv(hexToHsv(color));
  }, [color]);

  const handleSaturationChange = useCallback((e, container) => {
    const { width, height, left, top } = container.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    
    const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv));
  }, [hsv, onChange]);

  const handleHueChange = useCallback((e, container) => {
    const { height, top } = container.getBoundingClientRect();
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    
    // Hue goes from 0 to 360 top to bottom (red to red)
    const newHsv = { ...hsv, h: y * 360 };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv));
  }, [hsv, onChange]);

  // Generic dragger hook
  const useDrag = (handler) => {
    const isDragging = useRef(false);
    const containerRef = useRef(null);

    const onMouseDown = (e) => {
      isDragging.current = true;
      handler(e, containerRef.current);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (isDragging.current) {
        e.preventDefault(); // Prevent text selection
        handler(e, containerRef.current);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    return { onMouseDown, ref: containerRef };
  };

  const satDrag = useDrag(handleSaturationChange);
  const hueDrag = useDrag(handleHueChange);

  // Background color for saturation box based on current Hue
  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

  return (
    <div className="absolute top-10 right-0 z-50 w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
       {/* Close Button if standalone, but here we usually control from outside. Added just in case. */}
       {/* Main Area */}
       <div className="flex gap-3 h-[200px] mb-4">
          {/* Saturation/Value Box */}
          <div 
            ref={satDrag.ref}
            onMouseDown={satDrag.onMouseDown}
            className="flex-1 rounded-lg relative cursor-crosshair overflow-hidden"
            style={{ backgroundColor: hueColor }}
          >
             <div className="absolute inset-0 bg-linear-to-r from-white to-transparent"></div>
             <div className="absolute inset-0 bg-linear-to-t from-black to-transparent"></div>
             
             {/* Thumb */}
             <div 
               className="absolute w-3 h-3 border-2 border-white rounded-full shadow-sm -ml-1.5 -mt-1.5 pointer-events-none"
               style={{ 
                 left: `${hsv.s}%`, 
                 top: `${100 - hsv.v}%`,
                 boxShadow: '0 0 0 1px rgba(0,0,0,0.2)'
               }}
             />
          </div>

          {/* Vertical Hue Slider */}
          <div 
             ref={hueDrag.ref}
             onMouseDown={hueDrag.onMouseDown}
             className="w-6 rounded-full relative cursor-pointer"
             style={{ 
               background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
             }}
          >
             {/* Thumb */}
             <div 
               className="absolute left-0 right-0 h-2 bg-white border border-gray-300 rounded-full shadow-sm -mt-1 pointer-events-none translate-y-0.5"
               style={{ top: `${(hsv.h / 360) * 100}%` }}
             ></div>
          </div>
       </div>

       {/* Controls */}
       <div className="space-y-4">
          {/* Hex Input */}
          <div className="flex items-center justify-between">
             <span className="text-[13px] font-medium text-gray-800">Color Code :</span>
             <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 w-[140px] focus-within:border-[#5d5efc] focus-within:ring-1 focus-within:ring-[#5d5efc]/20 transition-all">
                <span className="text-gray-400 text-xs">#</span>
                <input 
                  type="text" 
                  value={color.replace("#", "")}
                  onChange={(e) => onChange(`#${e.target.value}`)}
                  className="w-full text-[13px] font-medium text-gray-700 outline-none uppercase font-mono"
                  maxLength={6}
                />
                <Icon icon="heroicons:pencil" width={14} className="text-gray-400" />
             </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center justify-between">
             <span className="text-[13px] font-medium text-gray-800">Opacity :</span>
             <div className="flex items-center gap-3 w-[140px]">
                <div className="relative flex-1 h-1.5 bg-gray-100 rounded-full">
                   <div 
                     className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full"
                     style={{ width: `${opacity}%` }}
                   ></div>
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={opacity} 
                      onChange={(e) => onOpacityChange && onOpacityChange(parseInt(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                   />
                   <div 
                      className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-[#5d5efc] border-2 border-white rounded-full shadow-sm pointer-events-none"
                      style={{ left: `${opacity}%`, marginLeft: "-6px" }}
                   ></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
