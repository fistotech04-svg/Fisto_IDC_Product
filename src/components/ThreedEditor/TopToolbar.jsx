import React from "react";
import { Icon } from "@iconify/react";

const TopToolbar = ({ isSidebarCollapsed }) => {
    return (
        <div className="absolute inset-x-0 left-5 z-30 pointer-events-none">
            {/* Left: Undo/Redo Section (Static Island) */}
            <div className="absolute top-5 left-[220px] pointer-events-auto transition-none">
                <div className="flex items-center bg-white h-[42px] px-1.5 rounded-[12px] border border-gray-200 gap-1 shadow-sm">
                    <button className="w-9 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all text-gray-700">
                        <Icon icon="lucide:undo-dot" width={18} />
                    </button>
                    <button className="w-9 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all text-gray-700">
                        <Icon icon="lucide:redo-dot" width={18} />
                    </button>
                </div>
            </div>

            {/* Center: Model Name Section (Individual Item) */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className="flex items-center bg-white h-[42px] px-5  gap-2.5 rounded-[12px]  group cursor-pointer">
                    <span className="text-[14px] font-semibold text-gray-600 tracking-tight">Name of the Model</span>
                    <Icon icon="heroicons:pencil-square" width={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
            </div>

            {/* Right: Coordinates & Reset Section (Individual Box) */}
            <div className="absolute top-5 right-5 flex items-center gap-3 pointer-events-auto">
                <div className="bg-white h-[42px] px-5 rounded-[12px] border border-gray-200 flex items-center gap-5 shadow-sm">
                    <div className="text-[12px] font-semibold flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">X</span>
                        <span className="text-gray-700">234</span>
                    </div>
                    <div className="text-[12px] font-semibold flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Y</span>
                        <span className="text-gray-700">234</span>
                    </div>
                    <div className="text-[12px] font-semibold flex items-center gap-2 border-r border-gray-100 pr-5 h-5">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Z</span>
                        <span className="text-gray-700">123</span>
                    </div>
                    <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all">
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopToolbar;
