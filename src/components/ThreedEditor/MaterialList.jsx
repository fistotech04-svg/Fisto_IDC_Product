import React, { useState } from "react";
import { Icon } from "@iconify/react";

// --- Sub-Components for Cleanliness ---

const MaterialItem = ({ text, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`py-1.5 px-3 text-[12px] font-semibold rounded-lg cursor-pointer transition-all truncate
            ${selected
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
    >
        {text}
    </div>
);

const MaterialGroup = ({ group, materials, selectedMaterial, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Determine if this group is the active one
    const isGroupSelected = selectedMaterial && typeof selectedMaterial === 'object' && selectedMaterial.isGroup && selectedMaterial.name === group;

    const handleGroupClick = (e) => {
        e.stopPropagation();
        onSelect({ name: group, isGroup: true, materials: materials });
        setIsOpen(!isOpen);
    };

    const toggleOpen = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    }

    return (
        <div className="mb-2">
            <div 
                onClick={handleGroupClick}
                className={`flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-lg group select-none transition-colors
                    ${isGroupSelected ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-50/80 border border-transparent"}`}
                title="Select Group"
            >
                <div className="flex items-center gap-2">
                     <Icon 
                        icon={isOpen ? "solar:folder-open-bold-duotone" : "solar:folder-bold-duotone"} 
                        width={14} 
                        className={`${isGroupSelected ? "text-indigo-500" : "text-gray-400 group-hover:text-[#5d5efc]"} transition-colors`} 
                     />
                     <span className={`${isGroupSelected ? "text-indigo-700" : "text-gray-500 group-hover:text-gray-700"} text-[11px] font-bold uppercase tracking-wider transition-colors`}>
                        {group} <span className={`${isGroupSelected ? "text-indigo-400" : "text-gray-300"} ml-1 text-[9px]`}>({materials.length})</span>
                     </span>
                </div>
                <div onClick={toggleOpen} className="p-1 hover:bg-gray-200 rounded">
                    <Icon 
                        icon="heroicons:chevron-down-20-solid" 
                        width={14} 
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                    />
                </div>
            </div>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="pl-2 space-y-0.5 border-l-2 border-gray-100/80 ml-2.5 my-1">
                    {materials.map((mat, matIdx) => (
                        <MaterialItem 
                            key={matIdx} 
                            text={mat} 
                            selected={selectedMaterial === mat || (selectedMaterial && typeof selectedMaterial === 'object' && !selectedMaterial.isGroup && selectedMaterial.name === mat)} 
                            onClick={() => onSelect(mat)} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function MaterialList({ isCollapsed, setIsCollapsed, isTextureOpen, materials = [], selectedMaterial, onSelect, modelName }) {

    return (
        <div className="relative z-40 flex flex-col w-[220px]">
            {/* STATIC FLOATING HEADER */}
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center justify-between gap-4 bg-white px-4 h-[42px] border border-gray-200 pointer-events-auto transition-all duration-300 cursor-pointer ${!isCollapsed ? "rounded-t-xl border-b-transparent shadow-none" : "rounded-xl shadow-sm"}`}
            >
                <div className="flex items-center gap-2">
                    <Icon icon="solar:layers-minimalistic-bold-duotone" width={18} className="text-gray-500" />
                    <span className="text-[14px] font-semibold text-gray-700 tracking-tight">
                        Materials
                    </span>
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {materials.reduce((acc, item) => acc + (item.group ? item.materials.length : 1), 0)}
                    </span>
                </div>
                
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    className={`w-7 h-7 flex items-center justify-center border border-gray-100 hover:bg-gray-50 rounded-lg transition-all shadow-sm group ${!isCollapsed ? "bg-gray-50" : "bg-white"
                        }`}
                >
                    <Icon
                        icon={isCollapsed ? "heroicons:chevron-down-20-solid" : "heroicons:chevron-up-20-solid"}
                        width={16}
                        className={`text-gray-500 group-hover:text-gray-900 transition-transform duration-300`}
                    />
                </button>
            </div>

            {/* DROPDOWN CONTENT */}
            <div
                className={`absolute top-full left-0 w-full bg-white border border-gray-200 border-t-0 transition-all duration-500 ease-in-out overflow-hidden flex flex-col pointer-events-auto ${isCollapsed ? "max-h-0 opacity-0 -translate-y-2 scale-95 pointer-events-none rounded-xl" : "opacity-100 translate-y-0 scale-100 rounded-b-xl rounded-t-none"
                    }`}
                style={{
                    maxHeight: isCollapsed ? "0" : (isTextureOpen ? "calc(92vh - 410px)" : "calc(92vh - 270px)")
                }}
            >
                {/* MATERIALS LIST */}
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar px-2 py-3">
                    {/* Model Name Parent Item */}
                    <div 
                        onClick={() => onSelect(modelName || "Model")}
                        className={`py-2 px-3 mb-3 flex items-center gap-2.5 text-[12px] font-bold rounded-lg cursor-pointer transition-all border border-transparent
                            ${(selectedMaterial === (modelName || "Model") || (selectedMaterial && selectedMaterial.name === (modelName || "Model")))
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                                : "bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-100/50"
                            }`}
                    >
                         <Icon icon="ph:cube-duotone" width={16} className={(selectedMaterial === (modelName || "Model") || (selectedMaterial && selectedMaterial.name === (modelName || "Model"))) ? "text-indigo-500" : "text-gray-400"} />
                         <span className="truncate flex-1">{modelName || "Entire Model"}</span>
                         {(selectedMaterial === (modelName || "Model") || (selectedMaterial && selectedMaterial.name === (modelName || "Model"))) && <Icon icon="heroicons:check-circle-20-solid" width={14} className="text-indigo-500" />}
                    </div>

                    <div className="h-[1px] bg-gray-100 mx-2 mb-3"></div>

                    {/* Material Items */}
                    <div className="space-y-0.5">
                        {materials.length === 0 && (
                             <div className="text-center py-4 text-xs text-gray-400 italic">No materials found</div>
                        )}

                        {materials.map((item, idx) => {
                            // Check if it's a group
                            if (typeof item === 'object' && item.group) {
                                return (
                                    <MaterialGroup 
                                        key={idx} 
                                        group={item.group} 
                                        materials={item.materials} 
                                        selectedMaterial={selectedMaterial} 
                                        onSelect={onSelect} 
                                    />
                                );
                            } else {
                                // Standard string item
                                return (
                                    <MaterialItem 
                                        key={idx} 
                                        text={item} 
                                        selected={selectedMaterial === item || (selectedMaterial && typeof selectedMaterial === 'object' && selectedMaterial.name === item && !selectedMaterial.isGroup)} 
                                        onClick={() => onSelect(item)} 
                                    />
                                );
                            }
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
