import React, { useState } from "react";
import { Icon } from "@iconify/react";

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

// --- Main Application ---

export default function SettingsPanel() {
  const [controls, setControls] = useState({
    alpha: 35,
    metallic: 35,
    roughness: 35,
    normal: 35,
    bump: 35,
    scale: 35,
    rotation: 35,
    specular: 35,
    reflection: 35,
    shadow: 35,
    softness: 35,
    ao: 35,
  });

  const [activePanel, setActivePanel] = useState("factor"); // "factor", "position", or "lighting"

  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const updateControl = (key, val) => {
    setControls((prev) => ({ ...prev, [key]: val }));
  };

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

            <div className="flex items-center justify-between mb-5 mt-4 group">
              <span className="text-[13px] font-medium text-gray-600 w-24 flex items-center justify-between pr-2">
                Factor <span>:</span>
              </span>
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-8 h-8 bg-black rounded-[6px] border border-gray-200 shadow-sm cursor-pointer hover:border-[#5d5efc] transition-colors relative overflow-hidden">
                    {/* Optional: Add a subtle shine or texture */}
                    <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent"></div>
                </div>
                <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[6px] px-3 py-1.5 bg-white hover:border-gray-300 transition-colors shadow-sm">
                  <span className="text-[12px] text-gray-600 font-medium tracking-wide font-mono">#000000</span>
                  <span className="text-[12px] text-gray-400 font-medium">100%</span>
                </div>
              </div>
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

      {/* 3. Lightning Controls Section */}
      <Accordion
        title="Lightning Controls"
        icon="ix:light-dark"
        isOpen={activePanel === "lighting"}
        onToggle={() => togglePanel("lighting")}
      >
        {/* Visualizer Box */}
        <div className="relative bg-[#f8fafc] h-[180px] rounded-xl border border-gray-100 mb-6 flex flex-col items-center justify-center shadow-inner overflow-hidden group">
          <div className="absolute top-4 left-4 text-amber-400 drop-shadow-sm">
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
          <NumberStepper value={210} axisLabel="X" compact />
          <NumberStepper value={210} axisLabel="Y" compact />
          <NumberStepper value={210} axisLabel="Z" compact />
        </div>

        <div className="space-y-6">
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
