import React from "react";
import { Icon } from "@iconify/react";

export default function MaterialList({ isCollapsed, setIsCollapsed, isTextureOpen, materials = [] }) {

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
                    {materials.map((material, idx) => (
                        <div
                            key={idx}
                            className={`py-1.5 px-3 text-[12px] font-semibold rounded-lg cursor-pointer transition-all
                                ${idx === 2
                                    ? "bg-gray-900 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {material}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
