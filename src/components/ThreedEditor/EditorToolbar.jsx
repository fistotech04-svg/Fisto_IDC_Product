import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";

export default function EditorToolbar({ hasModel, settings, setSettings, onClear, transformMode, setTransformMode }) {
    const [showSettings, setShowSettings] = useState(false);

    const handleModeToggle = (mode) => {
        if (transformMode === mode) {
            setTransformMode(null); // Toggle off
        } else {
            setTransformMode(mode);
        }
    };
    const [activeColorPicker, setActiveColorPicker] = useState(null); // 'bg' | 'base' | null
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
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

    const handleBasePickerToggle = (e) => {
        e.stopPropagation();
        if (activeColorPicker === 'base') {
            setActiveColorPicker(null);
        } else {
            if (settingsRef.current) {
                const rect = settingsRef.current.getBoundingClientRect();
                setPickerPos({
                    top: rect.top,
                    left: rect.right + 12
                });
            }
            setActiveColorPicker('base');
        }
    };

    return (
        <div className={`absolute right-4 z-49 flex flex-col items-center gap-3 transition-all duration-500 ease-in-out ${hasModel ? "top-20" : "top-10"}`}>
            
            {/* SETTINGS POPOVER */}
            {showSettings && (
                <div 
                    ref={settingsRef}
                    className="absolute right-14 top-20 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-in fade-in slide-in-from-right-4 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                             <Icon icon="heroicons:cog-6-tooth" width={18} className="text-gray-800" />
                             <span className="font-semibold text-gray-800 text-[14px]">Settings</span>
                        </div>
                        <button 
                            onClick={() => { setShowSettings(false); setActiveColorPicker(null); }}
                            className="w-6 h-6 border-2 border-red-400 rounded-xl flex cursor-pointer items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                            <Icon icon="heroicons:x-mark" width={19} className="stroke-2" />
                        </button>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4 pt-2">
                        <div>
                            <ToggleRow 
                                label="Base" 
                                isActive={settings?.base} 
                                onToggle={() => updateSetting("base", !settings?.base)} 
                            />
                            {settings?.base && (
                                <div className="mt-3 flex items-center gap-2 pl-0.5 relative">
                                    <div 
                                        className="w-8 h-8 rounded-[8px] border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                                        style={{ backgroundColor: settings.baseColor || '#000000' }}
                                        onClick={handleBasePickerToggle}
                                    ></div>
                                    
                                    <div 
                                        className="flex-1 flex items-center justify-between border border-gray-200 rounded-[8px] px-2.5 py-1.5 bg-white hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
                                        onClick={handleBasePickerToggle}
                                    >
                                        <span className="text-[11px] text-gray-600 font-medium tracking-wide font-mono uppercase">{settings.baseColor || '#000000'}</span>
                                        <span className="text-[11px] text-gray-400 font-medium">100%</span>
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

                    {/* Clear Model Action */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <button
                            onClick={() => {
                                onClear();
                                setShowSettings(false);
                            }} 
                            className="w-full py-2.5 px-4 bg-red-50 text-red-600 text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-95"
                        >
                            <Icon icon="heroicons:trash" width={18} />
                            Clear 3D Model
                        </button>
                    </div>

                    {/* Color Picker Sidebar */}
                    {activeColorPicker === 'base' && createPortal(
                        <div 
                            className="fixed z-[9999] color-picker-popover"
                            style={{ top: pickerPos.top, left: pickerPos.left }}
                        >
                            <ColorPicker 
                                color={settings.baseColor || '#2c2c2c'}
                                onChange={(c) => updateSetting('baseColor', c)}
                                onClose={() => setActiveColorPicker(null)}
                                className="block"
                            />
                        </div>,
                        document.body
                    )}
                </div>
            )}

            {/* MAIN TOOLBAR */}
            <div className="w-12 bg-white rounded-xl border-2 border-gray-300 py-1 flex flex-col items-center gap-2 shadow-sm">
                <ToolbarButton icon="material-symbols:add-rounded" enabled />
                <ToolbarButton icon="solar:gallery-wide-outline" enabled />
                <ToolbarButton icon="solar:camera-outline" enabled={hasModel} />
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
                    <ToolbarButton 
                        icon="si:move-line" 
                        active={transformMode === 'translate'}
                        onClick={() => handleModeToggle('translate')}
                        enabled 
                    />
                    <ToolbarButton 
                        icon="mdi:rotate-orbit" 
                        active={transformMode === 'rotate'}
                        onClick={() => handleModeToggle('rotate')}
                        enabled 
                    />
                    <ToolbarButton 
                        icon="solar:scale-outline" 
                        active={transformMode === 'scale'}
                        onClick={() => handleModeToggle('scale')}
                        enabled 
                    />
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
