import React from "react";
import { Icon } from "@iconify/react";

export default function MaterialList({ isCollapsed, setIsCollapsed, isTextureOpen, materials = [], selectedMaterial, onSelect, modelName }) {

    return (
        <div className="relative z-40 flex flex-col w-[200px]">
            {/* STATIC FLOATING HEADER */}
            <div className={`flex items-center justify-between gap-4 bg-white px-4 h-[42px] border border-gray-200 pointer-events-auto transition-all duration-300 ${!isCollapsed ? "rounded-t-xl border-b-transparent shadow-none" : "rounded-xl shadow-sm"}`}>
                <span className="text-[14px] font-semibold text-gray-600 tracking-tight">
                    Materials ({materials.length})
                </span>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
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
                <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar px-2 py-3">
                    {/* Model Name Parent Item */}
                    <div 
                        onClick={() => onSelect(modelName || "Model")}
                        className={`py-1.5 px-3 mb-1 flex items-center gap-2 text-[12px] font-bold rounded-lg cursor-pointer transition-all border border-transparent
                            ${selectedMaterial === (modelName || "Model")
                                ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm"
                                : "text-gray-800 hover:bg-gray-50"
                            }`}
                    >
                         <Icon icon="ph:cube-duotone" width={14} className={selectedMaterial === (modelName || "Model") ? "text-blue-500" : "text-gray-400"} />
                         <span className="truncate">{modelName || "Model"}</span>
                    </div>

                    {/* Material Items */}
                    <div className="pl-3 space-y-0.5 border-l-2 border-gray-100 ml-1.5">
                        {materials.map((item, idx) => {
                            // Check if it's a group
                            if (typeof item === 'object' && item.group) {
                                return (
                                    <div key={idx} className="mb-2">
                                        <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            {item.group}
                                        </div>
                                        <div className="pl-2 space-y-0.5 border-l border-gray-100 ml-1">
                                            {item.materials.map((mat, matIdx) => (
                                                 <div
                                                    key={matIdx}
                                                    onClick={() => onSelect(mat)}
                                                    className={`py-1.5 px-3 text-[12px] font-semibold rounded-lg cursor-pointer transition-all truncate
                                                        ${selectedMaterial === mat
                                                            ? "bg-gray-900 text-white shadow-sm"
                                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                        }`}
                                                >
                                                    {mat}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            } else {
                                // Standard string item
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => onSelect(item)}
                                        className={`py-1.5 px-3 text-[12px] font-semibold rounded-lg cursor-pointer transition-all truncate
                                            ${selectedMaterial === item
                                                ? "bg-gray-900 text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        {item}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
