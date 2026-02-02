import React from "react";
import { Icon } from "@iconify/react";
import EditorInfoBox from "./EditorInfoBox";

export default function MaterialList({ isCollapsed, setIsCollapsed, isTextureOpen }) {
    const materials = Array.from({ length: 14 }, (_, i) => `Material ${i + 1}`);

    return (
        <div className="absolute left-5 top-5 z-40 flex flex-col">
            {/* STATIC FLOATING HEADER */}
            <div className="flex items-center justify-between gap-4 bg-white px-4 h-[42px] rounded-[12px] border border-gray-200 shadow-sm pointer-events-auto">
                <span className="text-[14px] font-semibold text-gray-600 tracking-tight">
                    Materials
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
                className={`mt-2 w-[210px] bg-white border border-gray-100 rounded-[18px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-500 ease-in-out overflow-hidden flex flex-col pointer-events-auto ${isCollapsed ? "max-h-0 opacity-0 -translate-y-2 scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"
                    }`}
                style={{
                    maxHeight: isCollapsed ? "0" : (isTextureOpen ? "calc(100vh - 310px)" : "calc(100vh - 210px)")
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

                {/* INFO BOX (BOTTOM OF DROPDOWN) */}
                <div className="border-t border-gray-100 p-2 bg-gray-50/50">
                    <EditorInfoBox />
                </div>
            </div>
        </div>
    );
}
