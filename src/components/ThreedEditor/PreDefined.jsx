import React, { useState } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";

// --- Reusable UI Components ---

const Accordion = ({ title, icon: iconName, children, isOpen, onToggle, iconSize = 20 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3 transition-all duration-200 hover:shadow-md">
      <div
        className={`flex items-center justify-between px-4 py-3.5 bg-white cursor-pointer select-none transition-colors duration-200 ${
          isOpen ? "border-b border-gray-100" : ""
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 text-gray-800 font-semibold text-[14px]">
          {iconName && <Icon icon={iconName} width={iconSize} height={iconSize} className="text-gray-500" />}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <button
            className="hover:text-[#5d5efc] hover:bg-indigo-50 p-1 rounded-md transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Icon icon="ix:reset" width={16} height={16} />
          </button>
          <Icon
            icon="heroicons:chevron-down"
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            width={16}
            height={16}
          />
        </div>
      </div>

      <div
        className={`bg-white transition-[max-height] duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-5 pt-2">{children}</div>
      </div>
    </div>
  );
};

const SectionHeader = ({ label, showLine = true }) => (
  <div className="flex items-center gap-3 mb-4 mt-2">
    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
      {label}
    </span>
    {showLine && <div className="h-[1px] bg-gray-100 w-full flex-1"></div>}
  </div>
);

const CustomSlider = ({ label, value, onChange, unit = "%" }) => {
  return (
    <div className="flex items-center justify-between mb-5 last:mb-0 h-7">
      <div className="w-24 text-[13px] font-medium text-gray-600 shrink-0 flex items-center justify-between pr-2">
        {label} <span>:</span>
      </div>
      <div className="relative flex-1 h-1.5 bg-gray-100 rounded-full cursor-pointer group touch-none">
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full transition-all duration-75"
          style={{ width: `${value}%` }}
        ></div>
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#5d5efc] border-2 border-white rounded-full shadow-md hover:scale-110 transition-transform duration-100"
          style={{ left: `${value}%`, marginLeft: "-6px" }}
        ></div>
        {/* Input Range (Hidden overlay for functionality) */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
      <div className="w-10 text-right text-[12px] font-medium text-gray-500 tabular-nums">
        {value} <span className="text-[10px] ml-0.5 text-gray-400">{unit}</span>
      </div>
    </div>
  );
};

const NumberStepper = ({ label, value, axisLabel, compact, onChange, step = 1 }) => {
  const handleIncrement = () => {
    if (onChange) {
      onChange(parseFloat(value) + step);
    }
  };

  const handleDecrement = () => {
    if (onChange) {
      onChange(parseFloat(value) - step);
    }
  };

  return (
    <div
      className={`flex items-center ${
        label ? "justify-between" : "justify-center"
      } ${compact ? "gap-1" : "gap-2 mb-3"}`}
    >
      {label && (
        <div className={`font-medium text-gray-600 ${compact ? "text-xs w-24" : "text-[13px] w-24"}`}>
           {label} :
        </div>
      )}

      <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
        {axisLabel && (
          <span className={`${compact ? "text-xs w-3" : "text-[11px]"} text-gray-500 uppercase text-center font-bold`}>
            {axisLabel}:
          </span>
        )}
        <button 
          onClick={handleDecrement}
          className={`text-gray-400 hover:text-[#5d5efc] transition-colors ${compact ? "" : "p-0.5 hover:bg-indigo-50 rounded"}`}
        >
          <Icon
            icon="heroicons:chevron-left"
            width={compact ? 12 : 16}
            height={compact ? 12 : 16}
          />
        </button>
        <div
          className={`${
            compact ? "px-1.5 py-0.5 min-w-[32px] text-[11px] rounded" : "px-3 py-1.5 min-w-[44px] text-[12px] rounded-[6px]"
          } border border-gray-200 text-gray-700 font-semibold text-center bg-white shadow-sm hover:border-[#5d5efc] transition-colors`}
        >
          {value}
        </div>
        <button 
          onClick={handleIncrement}
          className={`text-gray-400 hover:text-[#5d5efc] transition-colors ${compact ? "" : "p-0.5 hover:bg-indigo-50 rounded"}`}
        >
          <Icon
            icon="heroicons:chevron-right"
            width={compact ? 12 : 16}
            height={compact ? 12 : 16}
          />
        </button>
      </div>
    </div>
  );
};

const CustomDropdown = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const dropdownRef = React.useRef(null);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const toggleDropdown = () => {
      if (!isOpen && dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceNeeded = 200; // max-h-48 is roughly 192px
          
          if (spaceBelow < spaceNeeded) {
              setDropdownPosition('top');
          } else {
              setDropdownPosition('bottom');
          }
      }
      setIsOpen(!isOpen);
  };

  return (
    <div className="relative mb-5" ref={dropdownRef}>
      {label && (
         <div className="text-[13px] font-medium text-gray-600 mb-2 flex items-center justify-between">
            {label} <span>:</span>
         </div>
      )}
      
      <div 
        className={`w-full px-3 py-2 flex items-center justify-between bg-white border ${isOpen ? 'border-[#5d5efc] ring-1 ring-[#5d5efc]/20' : 'border-gray-200'} rounded-lg shadow-sm cursor-pointer transition-all hover:border-gray-300`}
        onClick={toggleDropdown}
      >
         <span className="text-[12px] font-medium text-gray-700 capitalize">
            {selectedOption?.label || value}
         </span>
         <Icon 
            icon="heroicons:chevron-down" 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            width={14} 
            height={14} 
         />
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
            {options.map((opt) => (
                <div 
                    key={opt.value}
                    className={`px-3 py-2 text-[12px] cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-[#5d5efc] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                    }}
                >
                    {opt.label}
                </div>
            ))}
        </div>
      )}
      
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
};

// --- Main Application ---

// --- Main Application ---

// --- Main Application ---

export default function SettingsPanel({ controls, updateControl, activePanel, setActivePanel, transformValues, onManualTransformChange }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // Helper to format values safely
  const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toFixed(2) : "0.00";
  const fmtDeg = (rad) => (rad !== undefined && rad !== null) ? Math.round(rad * (180 / Math.PI)) : "0";

  return (
    <div className="flex flex-col gap-1 pb-10">
      {/* 1. Factor Adjustment Section */}
      <Accordion
        title="Factor Adjustment"
        icon="icon-park-outline:texture-two"
        isOpen={activePanel === "factor"}
        onToggle={() => togglePanel("factor")}
      >
        {/* Reset Texture Row */}
        {/* Reset Texture Row */}
        <div className="flex justify-end mb-6">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-md border border-gray-200 transition-all shadow-sm hover:shadow active:scale-95">
                Reset Texture :
                <Icon icon="heroicons:arrow-path" width={12} height={12} className="stroke-2" />
            </button>
        </div>

        <div className="space-y-6">
          {/* Color & Transparency */}
          <div>
            <SectionHeader label="Color & Transparency" />

            <div className="flex items-center justify-between mb-5 mt-4 group relative">
              <span className="text-[13px] font-medium text-gray-600 w-24 flex items-center justify-between pr-2">
                Factor <span>:</span>
              </span>
              <div className="flex items-center gap-2.5 flex-1">
                <div 
                    className="w-8 h-8 rounded-[6px] border border-gray-200 shadow-sm cursor-pointer hover:border-[#5d5efc] transition-colors"
                    style={{ backgroundColor: controls.color || '#000000' }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                >
                </div>
                <div 
                    className="flex-1 flex items-center justify-between border border-gray-200 rounded-[6px] px-3 py-1.5 bg-white hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <span className="text-[12px] text-gray-600 font-medium tracking-wide font-mono uppercase">{controls.color || '#000000'}</span>
                  <span className="text-[12px] text-gray-400 font-medium">{controls.alpha}%</span>
                </div>
              </div>

              {showColorPicker && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowColorPicker(false)}></div>
                    <ColorPicker 
                        color={controls.color || '#000000'} 
                        onChange={(c) => {
                             updateControl('color', c);
                             updateControl('useFactorColor', true); // Automagic activation
                        }}
                        opacity={controls.alpha}
                        onOpacityChange={(val) => updateControl('alpha', val)}
                        onClose={() => setShowColorPicker(false)}
                    />
                  </>
              )}
            </div>

            <CustomSlider
              label="Alpha Blend"
              value={controls.alpha}
              onChange={(v) => updateControl("alpha", v)}
            />
          </div>

          {/* Surface Finish */}
          <div>
            <SectionHeader label="Surface Finish" />
            <div className="space-y-1">
                <CustomSlider
                label="Metallic"
                value={controls.metallic}
                onChange={(v) => updateControl("metallic", v)}
                />
                <CustomSlider
                label="Roughness"
                value={controls.roughness}
                onChange={(v) => updateControl("roughness", v)}
                />
            </div>
          </div>

          {/* Surface Detail */}
          <div>
            <SectionHeader label="Surface Detail" />
            <div className="space-y-1">
                <CustomSlider
                label="Normal Map"
                value={controls.normal}
                onChange={(v) => updateControl("normal", v)}
                />
                <CustomSlider
                label="Bump"
                value={controls.bump}
                onChange={(v) => updateControl("bump", v)}
                />
            </div>
          </div>

          {/* Texture Placement */}
          <div>
            <SectionHeader label="Texture Placement" />
            <div className="space-y-1">
                <CustomSlider
                label="Scale"
                value={controls.scale}
                onChange={(v) => updateControl("scale", v)}
                />
                <CustomSlider
                label="Rotation"
                value={controls.rotation}
                onChange={(v) => updateControl("rotation", v)}
                />
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-xs font-medium text-gray-600 w-24">
                Offset :
              </span>
              <div className="flex gap-1.5 flex-1 justify-end">
                <NumberStepper value={210} axisLabel="X" compact />
                <NumberStepper value={210} axisLabel="Y" compact />
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      {/* 2. Position Section (Updated) */}
      <Accordion
        title="Model Position"
        icon="hugeicons:3d-move"
        iconSize={24}
        isOpen={activePanel === "position"}
        onToggle={() => togglePanel("position")}
      >
        <div className="flex flex-col gap-1 pb-2">
           {/* Move Row */}
           <div className="flex flex-col items-start gap-2 mb-2 w-full">
              <span className="text-[13px] font-medium text-black mb-1 ml-1">Move :</span>
              <div className="grid grid-cols-3 gap-2 w-full">
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmt(transformValues?.position?.x)} compact onChange={(val) => onManualTransformChange('position', 'x', val)} step={0.5} />
                 </div>
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmt(transformValues?.position?.y)} compact onChange={(val) => onManualTransformChange('position', 'y', val)} step={0.5} />
                 </div>
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmt(transformValues?.position?.z)} compact onChange={(val) => onManualTransformChange('position', 'z', val)} step={0.5} />
                 </div>
              </div>
           </div>

           {/* Rotate Row */}
           <div className="flex flex-col items-start gap-2 mb-2 bg-gray-50 rounded-lg py-2 w-full">
              <span className="text-[13px] font-medium text-black mb-1 ml-1">Rotate :</span>
              <div className="grid grid-cols-3 gap-2 w-full">
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.x)} compact onChange={(val) => onManualTransformChange('rotation', 'x', val)} step={5} />
                 </div>
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.y)} compact onChange={(val) => onManualTransformChange('rotation', 'y', val)} step={5} />
                 </div>
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.z)} compact onChange={(val) => onManualTransformChange('rotation', 'z', val)} step={5} />
                 </div>
              </div>
           </div>

           {/* Scale Row */}
           <div className="flex flex-col items-start gap-2 w-full">
              <span className="text-[13px] font-medium text-black mb-1 ml-1">Scale :</span>
              <div className="grid grid-cols-3 gap-2 w-full">
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmt(transformValues?.scale?.x)} compact onChange={(val) => onManualTransformChange('scale', 'x', val)} step={0.1} />
                 </div>
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmt(transformValues?.scale?.y)} compact onChange={(val) => onManualTransformChange('scale', 'y', val)} step={0.1} />
                 </div>
                 <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmt(transformValues?.scale?.z)} compact onChange={(val) => onManualTransformChange('scale', 'z', val)} step={0.1} />
                 </div>
              </div>
           </div>
        </div>
      </Accordion>

      {/* 3. Lightning Controls Section */}
      <Accordion
        title="Lightning Controls"
        icon="ix:light-dark"
        isOpen={activePanel === "lighting"}
        onToggle={() => togglePanel("lighting")}
      >
        {/* Visualizer Box */}
        <div className="relative bg-[#f8fafc] h-[180px] rounded-xl border border-gray-100 mb-6 flex flex-col items-center justify-center shadow-inner overflow-hidden group">
          {/* Dynamic Sun Position */}
          <div 
            className="absolute text-amber-400 drop-shadow-sm transition-all duration-300"
            style={{
              left: `${50 + (controls.lightPosition?.x || 10) * 2}%`,
              top: `${50 - (controls.lightPosition?.y || 10) * 2}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon icon="heroicons:sun" width={24} height={24} />
          </div>

          <div className="flex flex-col items-center text-gray-300 group-hover:text-gray-400 transition-colors">
            <Icon icon="heroicons:cube" width={40} height={40} className="stroke-1" />
            <span className="text-[11px] mt-2 font-medium tracking-wide uppercase">Model Preview</span>
          </div>

          {/* Light Effect */}
          <div className="absolute inset-0 bg-linear-to-br from-white/60 via-transparent to-indigo-50/10 pointer-events-none"></div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <NumberStepper 
            value={Math.round(controls.lightPosition?.x || 10)} 
            axisLabel="X" 
            compact 
            onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, x: val })}
            step={1}
          />
          <NumberStepper 
            value={Math.round(controls.lightPosition?.y || 10)} 
            axisLabel="Y" 
            compact 
            onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, y: val })}
            step={1}
          />
          <NumberStepper 
            value={Math.round(controls.lightPosition?.z || 10)} 
            axisLabel="Z" 
            compact 
            onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, z: val })}
            step={1}
          />
        </div>

        <div className="space-y-6">
            <div>

                 <SectionHeader label="Environment" />
                 <CustomDropdown 

                    value={controls.environment || 'city'}
                    onChange={(val) => updateControl('environment', val)}
                    options={[
                        { label: 'City', value: 'city' },
                        { label: 'Apartment', value: 'apartment' },
                        { label: 'Dawn', value: 'dawn' },
                        { label: 'Forest', value: 'forest' },
                        { label: 'Lobby', value: 'lobby' },
                        { label: 'Night', value: 'night' },
                        { label: 'Park', value: 'park' },
                        { label: 'Studio', value: 'studio' },
                        { label: 'Sunset', value: 'sunset' },
                        { label: 'Warehouse', value: 'warehouse' },
                    ]}
                 />
            </div>


            <div>
                <SectionHeader label="Lighting & Reflection" />
                <div className="space-y-1">
                    <CustomSlider
                    label="Specular"
                    value={controls.specular}
                    onChange={(v) => updateControl("specular", v)}
                    />
                    <CustomSlider
                    label="Reflection"
                    value={controls.reflection}
                    onChange={(v) => updateControl("reflection", v)}
                    />
                </div>
            </div>

            <div>
                <SectionHeader label="Adjust Shadow" />
                <div className="space-y-1">
                    <CustomSlider
                    label="Shadow"
                    value={controls.shadow}
                    onChange={(v) => updateControl("shadow", v)}
                    />
                    <CustomSlider
                    label="Softness"
                    value={controls.softness}
                    onChange={(v) => updateControl("softness", v)}
                    />
                    <CustomSlider
                    label="AO"
                    value={controls.ao}
                    onChange={(v) => updateControl("ao", v)}
                    />
                </div>
            </div>
        </div>
      </Accordion>
    </div>
  );
}
