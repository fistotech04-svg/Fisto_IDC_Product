import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MaterialList from "./MaterialList";

const TopToolbar = ({ 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    isTextureOpen, 
    onReset, 
    targetPosition, 
    materialList, 
    selectedMaterial, 
    onSelectMaterial, 
    modelName, 
    onRename,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState("");

    const startEditing = () => {
        setTempName(modelName || "");
        setIsEditingName(true);
    };

    const stopEditing = () => {
        if (isEditingName && tempName !== modelName) {
            if (onRename) onRename(tempName);
        }
        setIsEditingName(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            stopEditing();
        }
    };

    return (
        <div className="absolute inset-x-0 left-5 z-30 pointer-events-none">
            {/* Left Section: Materials + Undo/Redo */}
            <div className="absolute top-5 left-0 flex items-start gap-3 pointer-events-auto transition-none">
                <MaterialList 
                    isCollapsed={isSidebarCollapsed} 
                    setIsCollapsed={setIsSidebarCollapsed} 
                    isTextureOpen={isTextureOpen}
                    materials={materialList}
                    selectedMaterial={selectedMaterial}
                    onSelect={onSelectMaterial}
                    modelName={modelName}
                />
                
                <div className="flex items-center bg-white h-[42px] px-1.5 rounded-[12px] border border-gray-200 gap-1 shadow-sm">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo}
                        className={`w-9 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all text-gray-700 ${!canUndo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Icon icon="lucide:undo-dot" width={18} />
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo}
                        className={`w-9 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all text-gray-700 ${!canRedo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Icon icon="lucide:redo-dot" width={18} />
                    </button>
                </div>
            </div>

            {/* Center: Model Name Section (Individual Item) */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div 
                    onClick={!isEditingName ? startEditing : undefined}
                    className={`flex items-center bg-white h-[42px] px-5 gap-2.5 rounded-[12px] ${!isEditingName ? "cursor-pointer hover:bg-gray-50 group border border-transparent hover:border-gray-200" : "border border-blue-500 ring-2 ring-blue-100"} transition-all`}
                >
                    {isEditingName ? (
                        <input 
                            autoFocus
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={stopEditing}
                            onKeyDown={handleKeyDown}
                            className="text-[14px] font-semibold text-gray-800 tracking-tight outline-none bg-transparent w-[200px] text-center"
                        />
                    ) : (
                        <>
                            <span className="text-[14px] font-semibold text-gray-600 tracking-tight">{modelName || "Untitled Model"}</span>
                            <Icon icon="heroicons:pencil-square" width={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </>
                    )}
                </div>
            </div>

            {/* Right: Coordinates & Reset Section (Individual Box) */}
            <div className="absolute top-5 right-5 flex items-center gap-3 pointer-events-auto">
                <div className="bg-white h-[42px] px-5 rounded-[12px] border border-gray-200 flex items-center gap-5 shadow-sm">
                    <div className="text-[12px] font-semibold flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">X</span>
                        <span className="text-gray-700 min-w-[20px] text-right">{targetPosition?.x ?? 0}</span>
                    </div>
                    <div className="text-[12px] font-semibold flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Y</span>
                        <span className="text-gray-700 min-w-[20px] text-right">{targetPosition?.y ?? 0}</span>
                    </div>
                    <div className="text-[12px] font-semibold flex items-center gap-2 border-r border-gray-100 pr-5 h-5">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Z</span>
                        <span className="text-gray-700 min-w-[20px] text-right">{targetPosition?.z ?? 0}</span>
                    </div>
                    <button 
                        onClick={onReset}
                        className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all uppercase tracking-wide"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopToolbar;
