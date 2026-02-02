import React, { useState } from "react";
import { Icon } from "@iconify/react";

// --- Reusable UI Components (Matched to PreDefined.jsx) ---

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
          isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
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

// Adapted StackedSliderBox to match new sizing
const StackedSliderBox = ({ label, val, onChange, children }) => (
  <div className="mb-6">
    <div className="text-[13px] font-medium text-gray-600 mb-3 flex items-center justify-between">
      {label} :
    </div>
    <div className="flex items-center gap-4">
      {/* Reusing CustomSlider logic but horizontal layout inside flex */}
      <div className="relative flex-1 h-1.5 bg-gray-100 rounded-full cursor-pointer group touch-none">
        <div
          className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full transition-all duration-75"
          style={{ width: `${val}%` }}
        ></div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#5d5efc] border-2 border-white rounded-full shadow-md hover:scale-110 transition-transform duration-100"
          style={{ left: `${val}%`, marginLeft: "-6px" }}
        ></div>
        <input
          type="range"
          min="0"
          max="100"
          value={val}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
      {/* Value Display */}
      <div className="w-10 text-right text-[12px] font-medium text-gray-500 tabular-nums">
        {val} <span className="text-[10px] ml-0.5 text-gray-400">%</span>
      </div>
      {/* Extra Child (Box/Image) */}
      {children}
    </div>
  </div>
);


const NumberStepper = ({ label, value, axisLabel, compact }) => {
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

export default function Customized() {
  const [openPanel, setOpenPanel] = useState("factor"); // "factor", "position", or "lightning"

  const handlePanelToggle = (panelName) => {
    setOpenPanel(openPanel === panelName ? null : panelName);
  };

  const [pos, setPos] = useState({ x: 210, y: 210, z: 210 });
  const [lightPos, setLightPos] = useState({ x: 210, y: 210, z: 210 });
  const [factors, setFactors] = useState({
    alpha: 35,
    metallic: 35,
    roughness: 35,
    normalMap: 35,
    bump: 35,
    scale: 35,
    rotation: 35,
    specular: 35,
    reflection: 35,
    shadow: 35,
    softness: 35,
    ao: 35,
  });

  // --- ACTIONS ---
  const updateFactor = (key, val) =>
    setFactors((prev) => ({ ...prev, [key]: val }));
  const updatePos = (axis, delta) =>
    setPos((prev) => ({ ...prev, [axis]: prev[axis] + delta }));
  const updateLightPos = (axis, delta) =>
    setLightPos((prev) => ({ ...prev, [axis]: prev[axis] + delta }));

  return (
    <div className="flex flex-col gap-1 pb-10">
      {/* --- FACTOR ADJUSTMENT COMPONENT --- */}
      <Accordion
        title="Factor Adjustment"
        icon="icon-park-outline:texture-two"
        isOpen={openPanel === "factor"}
        onToggle={() => handlePanelToggle("factor")}
      >
        <div className="space-y-6">
            {/* Color & Transparency Section */}
            <div>
                <SectionHeader label="Color & Transparency" />
                <div className="flex items-center justify-between mb-5 mt-4">
                    <span className="text-[13px] font-medium text-gray-600 w-24">
                    Factor :
                    </span>
                    <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-8 h-8 bg-black rounded-[6px] border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent"></div>
                    </div>
                    <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[6px] px-3 py-1.5 bg-white shadow-sm">
                        <span className="text-[12px] text-gray-600 font-medium tracking-wide font-mono">#000000</span>
                        <span className="text-[12px] text-gray-400 font-medium">100%</span>
                    </div>
                    </div>
                </div>

                <CustomSlider
                    label="Alpha Blend"
                    value={factors.alpha}
                    onChange={(v) => updateFactor("alpha", v)}
                />
            </div>

            {/* Surface Finish Section */}
            <div>
                <SectionHeader label="Surface Finish" />
                <div className="space-y-2">
                    <StackedSliderBox
                        label="Metallic"
                        val={factors.metallic}
                        onChange={(v) => updateFactor("metallic", v)}
                    >
                        <div className="w-9 h-9 bg-gray-50 rounded border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shrink-0 text-gray-400">
                        <Icon icon="heroicons:arrow-up-tray" width={16} height={16} />
                        </div>
                    </StackedSliderBox>

                    <StackedSliderBox
                        label="Roughness"
                        val={factors.roughness}
                        onChange={(v) => updateFactor("roughness", v)}
                    >
                        <div className="w-9 h-9 rounded border border-gray-200 overflow-hidden shrink-0">
                        <img
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%238b6f47' width='100' height='100'/%3E%3Cline x1='0' y1='0' x2='100' y2='100' stroke='%23704d1f' stroke-width='2'/%3E%3Cline x1='100' y1='0' x2='0' y2='100' stroke='%23704d1f' stroke-width='2'/%3E%3C/svg%3E"
                            alt="roughness"
                            className="w-full h-full object-cover"
                        />
                        </div>
                    </StackedSliderBox>
                </div>
            </div>

            {/* Surface Detail Section */}
            <div>
                <SectionHeader label="Surface Detail" />
                <div className="space-y-2">
                    <StackedSliderBox
                        label="Normal Map"
                        val={factors.normalMap}
                        onChange={(v) => updateFactor("normalMap", v)}
                    >
                        <div className="w-9 h-9 rounded border border-gray-200 overflow-hidden shrink-0">
                        <img
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%238b6f47' width='100' height='100'/%3E%3C/svg%3E"
                            alt="normal"
                            className="w-full h-full object-cover"
                        />
                        </div>
                    </StackedSliderBox>

                    <StackedSliderBox
                        label="Bump"
                        val={factors.bump}
                        onChange={(v) => updateFactor("bump", v)}
                    >
                        <div className="w-9 h-9 rounded border border-gray-200 overflow-hidden shrink-0">
                        <img
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%238b6f47' width='100' height='100'/%3E%3C/svg%3E"
                            alt="bump"
                            className="w-full h-full object-cover"
                        />
                        </div>
                    </StackedSliderBox>
                </div>
            </div>

            {/* Texture Placement Section */}
            <div>
                <SectionHeader label="Texture Placement" />
                <div className="space-y-1">
                    <CustomSlider
                        label="Scale"
                        value={factors.scale}
                        onChange={(v) => updateFactor("scale", v)}
                    />
                    <CustomSlider
                        label="Rotation"
                        value={factors.rotation}
                        onChange={(v) => updateFactor("rotation", v)}
                    />
                </div>

                <div className="flex items-center justify-between mt-6">
                    <span className="text-xs font-medium text-gray-600 w-24">
                        Offset :
                    </span>
                    <div className="flex gap-1.5 flex-1 justify-end">
                        <NumberStepper value={pos.x} axisLabel="X" compact />
                        <NumberStepper value={pos.y} axisLabel="Y" compact />
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
        isOpen={openPanel === "position"}
        onToggle={() => handlePanelToggle("position")}
      >
        <div className="flex flex-col gap-1 pb-2">
           {/* Move Row */}
           <div className="flex items-end justify-between py-2 px-1">
              <span className="text-[13px] font-medium text-gray-600 w-14 mb-1">Move :</span>
              <div className="flex gap-2">
                 {["X", "Y", "Z"].map((axis) => (
                    <div key={axis} className="flex flex-col items-center gap-1.5">
                       <span className="text-[10px] font-semibold text-gray-400 uppercase">{axis}</span>
                       <NumberStepper value={210} compact />
                    </div>
                 ))}
              </div>
           </div>

           {/* Rotate Row - with subtle background */}
           <div className="flex items-end justify-between py-2 px-1 bg-gray-50 rounded-lg">
              <span className="text-[13px] font-medium text-gray-600 w-14 mb-1">Rotate :</span>
              <div className="flex gap-2">
                 {["X", "Y", "Z"].map((axis) => (
                    <div key={axis} className="flex flex-col items-center gap-1.5">
                       <span className="text-[10px] font-semibold text-gray-400 uppercase">{axis}</span>
                       <NumberStepper value={210} compact />
                    </div>
                 ))}
              </div>
           </div>

           {/* Scale Row */}
           <div className="flex items-end justify-between py-2 px-1">
              <span className="text-[13px] font-medium text-gray-600 w-14 mb-1">Scale :</span>
              <div className="flex gap-2">
                 {["X", "Y", "Z"].map((axis) => (
                    <div key={axis} className="flex flex-col items-center gap-1.5">
                       <span className="text-[10px] font-semibold text-gray-400 uppercase">{axis}</span>
                       <NumberStepper value={210} compact />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </Accordion>

      {/* --- LIGHTNING CONTROLS --- */}
      <Accordion
        title="Lightning Controls"
        icon="ix:light-dark"
        isOpen={openPanel === "lightning"}
        onToggle={() => handlePanelToggle("lightning")}
      >
        {/* Visual Preview Box */}
        <div className="relative bg-[#f8fafc] h-[180px] rounded-xl border border-gray-100 mb-6 flex flex-col items-center justify-center shadow-inner overflow-hidden group">
            <div className="absolute top-4 left-4 text-amber-400 drop-shadow-sm">
            <Icon icon="heroicons:sun" width={24} height={24} />
            </div>
            <div className="flex flex-col items-center text-gray-300 group-hover:text-gray-400 transition-colors">
            <Icon icon="heroicons:cube" width={40} height={40} className="stroke-1" />
            <span className="text-[11px] mt-2 font-medium tracking-wide uppercase">Model Preview</span>
            </div>
            <div className="absolute inset-0 bg-linear-to-br from-white/60 via-transparent to-indigo-50/10 pointer-events-none"></div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
            <NumberStepper value={lightPos.x} axisLabel="X" compact />
            <NumberStepper value={lightPos.y} axisLabel="Y" compact />
            <NumberStepper value={lightPos.z} axisLabel="Z" compact />
        </div>

        <div className="space-y-6">
            <div>
                <SectionHeader label="Lighting & Reflection" />
                <div className="space-y-1">
                    <CustomSlider
                        label="Specular"
                        value={factors.specular}
                        onChange={(v) => updateFactor("specular", v)}
                    />
                    <CustomSlider
                        label="Reflection"
                        value={factors.reflection}
                        onChange={(v) => updateFactor("reflection", v)}
                    />
                </div>
            </div>

            <div>
                <SectionHeader label="Adjust Shadow" />
                <div className="space-y-1">
                    <CustomSlider
                        label="Shadow"
                        value={factors.shadow}
                        onChange={(v) => updateFactor("shadow", v)}
                    />
                    <CustomSlider
                        label="Softness"
                        value={factors.softness}
                        onChange={(v) => updateFactor("softness", v)}
                    />
                    <CustomSlider
                        label="AO"
                        value={factors.ao}
                        onChange={(v) => updateFactor("ao", v)}
                    />
                </div>
            </div>
        </div>
      </Accordion>
    </div>
  );
}
