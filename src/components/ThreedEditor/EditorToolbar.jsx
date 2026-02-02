import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";

export default function EditorToolbar({ hasModel, settings, setSettings }) {
    const [showSettings, setShowSettings] = useState(false);
    const [activeColorPicker, setActiveColorPicker] = useState(null); // 'bg' | 'base' | null
    const settingsRef = useRef(null);

    // Close settings when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            // If clicking inside the color picker, don't close
            if (activeColorPicker && event.target.closest(".color-picker-popover")) return;

            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                // Only close if we are not interacting with the active color picker
                setShowSettings(false);
                setActiveColorPicker(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeColorPicker]);

    const updateSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className={`absolute right-4 z-50 flex flex-col items-center gap-3 transition-all duration-500 ease-in-out ${hasModel ? "top-20" : "top-10"}`}>
            
            {/* SETTINGS POPOVER */}
            {showSettings && (
                <div 
                    ref={settingsRef}
                    className="absolute right-14 top-20 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-in fade-in slide-in-from-right-4 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                             <Icon icon="heroicons:cog-6-tooth-solid" width={18} className="text-gray-800" />
                             <span className="font-bold text-gray-800 text-[14px]">Settings</span>
                        </div>
                        <button 
                            onClick={() => { setShowSettings(false); setActiveColorPicker(null); }}
                            className="w-6 h-6 border border-red-200 rounded flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                            <Icon icon="heroicons:x-mark" width={14} className="stroke-2" />
                        </button>
                    </div>

                    {/* Background Color */}
                    <div className="mb-6 relative">
                        <label className="text-[13px] font-medium text-gray-700 block mb-3">Background Color</label>
                        <div className="flex items-center gap-3">
                            <div 
                                onClick={() => setActiveColorPicker("bg")}
                                className={`w-8 h-8 rounded-lg border shadow-sm relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform ${activeColorPicker === 'bg' ? 'ring-2 ring-[#5d5efc] border-[#5d5efc]' : 'border-gray-200'}`}
                            >
                                <div 
                                    className="w-full h-full"
                                    style={{ backgroundColor: settings?.backgroundColor || "#ffffff" }}
                                />
                            </div>
                            <div className="flex items-center justify-between flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white shadow-sm">
                                <input 
                                    type="text" 
                                    value={settings?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                                    className="w-full text-[12px] text-gray-600 font-mono uppercase bg-transparent outline-none"
                                />
                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4">
                        <div>
                            <ToggleRow 
                                label="Base" 
                                isActive={settings?.base} 
                                onToggle={() => updateSetting("base", !settings?.base)} 
                            />
                            
                            {/* Conditional Base Color Picker */}
                            {settings?.base && (
                                <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-300 relative">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            onClick={() => setActiveColorPicker("base")}
                                            className={`w-8 h-8 rounded-lg border shadow-sm relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform ${activeColorPicker === 'base' ? 'ring-2 ring-[#5d5efc] border-[#5d5efc]' : 'border-gray-200'}`}
                                        >
                                            <div 
                                                className="w-full h-full"
                                                style={{ backgroundColor: settings?.baseColor || "#f9fafb" }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50/50 shadow-sm">
                                            <input 
                                                type="text" 
                                                value={settings?.baseColor || "#f9fafb"}
                                                onChange={(e) => updateSetting("baseColor", e.target.value)}
                                                className="w-full text-[12px] text-gray-600 font-mono uppercase bg-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <ToggleRow 
                            label="Grid lines" 
                            isActive={settings?.grid} 
                            onToggle={() => updateSetting("grid", !settings?.grid)} 
                        />
                         <ToggleRow 
                            label="Wireframe" 
                            isActive={settings?.wireframe} 
                            onToggle={() => updateSetting("wireframe", !settings?.wireframe)} 
                        />
                    </div>

                    {/* UNIFIED COLOR PICKER SIDE-PANEL */}
                    {activeColorPicker && (
                        <div className="absolute top-0 right-full mr-3 z-50 color-picker-popover">
                            <ColorPicker 
                                color={activeColorPicker === 'bg' ? (settings?.backgroundColor || "#ffffff") : (settings?.baseColor || "#f9fafb")} 
                                onChange={(c) => updateSetting(activeColorPicker === 'bg' ? 'backgroundColor' : 'baseColor', c)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* MAIN TOOLBAR */}
            <div className="w-12 bg-white rounded-xl border-2 border-gray-300 py-1 flex flex-col items-center gap-2 shadow-sm">
                <ToolbarButton icon="heroicons:plus" enabled />
                <ToolbarButton icon="clarity:image-gallery-line" enabled />
                <ToolbarButton icon="heroicons:camera" enabled={hasModel} />
                <ToolbarButton 
                    icon="heroicons:cog-6-tooth" 
                    enabled={hasModel} 
                    active={showSettings}
                    onClick={() => hasModel && setShowSettings(!showSettings)}
                />
            </div>

            {/* SECONDARY TOOLBAR (TRANSFORM TOOLS) */}
            {hasModel && (
                <div className="w-12 bg-white rounded-xl border-2 border-gray-300 py-1 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                    <ToolbarButton icon="lucide:move" enabled />
                    <ToolbarButton icon="mdi:rotate-orbit" enabled />
                    <ToolbarButton icon="solar:scale-linear" enabled />
                </div>
            )}
        </div>
    );
}

function ToggleRow({ label, isActive, onToggle }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-600 font-medium">{label}</span>
            <div className="flex-1 border-b border-dashed border-gray-200 mx-3 relative top-1 opacity-50"></div>
            <button 
                onClick={onToggle}
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${
                    isActive ? "bg-[#5d5efc]" : "bg-gray-200"
                }`}
            >
                <div 
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                        isActive ? "left-[18px]" : "left-0.5"
                    }`}
                />
            </button>
        </div>
    );
}

function ToolbarButton({ icon, active, enabled = true, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={!enabled}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border ${
                !enabled 
                    ? "text-gray-300 cursor-not-allowed opacity-50 border-transparent" 
                    : active 
                        ? "bg-[#5d5efc] text-white shadow-md shadow-indigo-200 border-transparent" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 cursor-pointer border-transparent"
            }`}
        >
            <Icon icon={icon} width={20} />
        </button>
    );
}
