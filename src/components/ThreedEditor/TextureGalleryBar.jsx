import React from "react";
import { Icon } from "@iconify/react";

export default function TextureGalleryBar({ isOpen, setIsOpen }) {
    const textures = [
        { name: "Silver Mate", color: "linear-gradient(135deg, #a1a1aa 0%, #3f3f46 100%)" },
        { name: "Power Cot...", color: "linear-gradient(135deg, #78350f 0%, #451a03 100%)" },
        { name: "Bronze Ma...", color: "linear-gradient(135deg, #d97706 0%, #78350f 100%)" },
        { name: "Basic Mate..", color: "linear-gradient(135deg, #facc15 0%, #854d0e 100%)" },
        { name: "Metal Clad...", color: "linear-gradient(135deg, #52525b 0%, #18181b 100%)" },
        { name: "Worn Alu...", color: "linear-gradient(135deg, #94a3b8 0%, #334155 100%)" },
        { name: "Scratched Met...", color: "linear-gradient(135deg, #3f3f46 0%, #09090b 100%)" },
        { name: "Power Cot...", color: "linear-gradient(135deg, #451a03 0%, #000000 100%)" },
        { name: "Over Hum...", color: "linear-gradient(135deg, #9a3412 0%, #431407 100%)" },
        { name: "Bronze Ma...", color: "linear-gradient(135deg, #b45309 0%, #451a03 100%)" },
        { name: "Silver Mate", color: "linear-gradient(135deg, #d4d4d8 0%, #52525b 100%)" },
        { name: "Knights Ar...", color: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)" },
        { name: "Worn Alu...", color: "linear-gradient(135deg, #64748b 0%, #1e293b 100%)" },
        { name: "Silver Mate", color: "linear-gradient(135deg, #d4d4d8 0%, #52525b 100%)" },
        { name: "Knights Ar...", color: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)" },
        { name: "Worn Alu...", color: "linear-gradient(135deg, #64748b 0%, #1e293b 100%)" },
    ];


    return (
        <div
            className={`absolute bottom-[60px] left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out ${isOpen ? "w-full" : "w-[96%]"
                }`}
        >
            {/* MINI TOGGLE BUTTON & BAR (When closed) */}
            {!isOpen && (
                <div className="relative w-full">
                    {/* Floating Toggle Button above the bar */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="absolute -top-12 right-2 flex items-center justify-center w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Icon icon="heroicons:chevron-double-up-20-solid" width={20} className="text-gray-900" />
                    </button>

                    {/* Placeholder Bar */}
                    <div className="w-full h-16 bg-white border-t border-x border-gray-100 rounded-t-[20px] shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center">
                        <span className="text-[14px] font-bold text-gray-800 tracking-tight">
                            Click to View Texture Gallery
                        </span>
                    </div>
                </div>
            )}

            {/* MAIN GALLERY CONTAINER */}
            <div
                className={`bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-x border-gray-100 rounded-t-[24px] overflow-hidden transition-all duration-500 ${isOpen ? "h-[160px] p-4 opacity-100 translate-y-0" : "h-0 p-0 opacity-0 translate-y-10 pointer-events-none"
                    }`}
            >
                {/* HEADER SECTION */}
                <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-4">
                        <span className="text-[15px] font-bold text-gray-800 tracking-tight">Texture Gallery :</span>
                        <div className="group relative">
                            <button className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-[12px] hover:bg-gray-100 transition-all">
                                <span className="text-[12px] font-semibold text-gray-700">Metal (24)</span>
                                <Icon icon="heroicons:chevron-down-20-solid" width={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all shadow-sm"
                    >
                        <Icon icon="heroicons:chevron-double-down-20-solid" width={16} className="text-gray-900" />
                    </button>
                </div>

                {/* SCROLLABLE GALLERY CONTENT */}
                <div className="relative flex items-center group/nav h-[90px]">
                    {/* Navigation Buttons */}
                    <button className="absolute -left-2 z-10 w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-lg text-gray-400 hover:text-gray-900 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100">
                        <Icon icon="heroicons:chevron-left-20-solid" width={20} />
                    </button>

                    <div className="flex-1 overflow-x-auto no-scrollbar px-6">
                        <div className="flex items-center gap-5 min-w-max h-full">
                            {textures.map((tex, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1 group cursor-pointer relative pt-2">
                                    <div
                                        className={`relative rounded-full transition-all duration-300 group-hover:scale-110 shadow-lg ${tex.active
                                            ? "w-[64px] h-[64px] ring-4 ring-gray-900/5 shadow-xl"
                                            : "w-[48px] h-[48px]"
                                            }`}
                                        style={{
                                            background: tex.color,
                                            boxShadow: `inset -6px -6px 15px rgba(0,0,0,0.3), inset 6px 6px 15px rgba(255,255,255,0.2), 0 8px 12px -3px rgba(0,0,0,0.1)`
                                        }}
                                    >
                                        <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/20 rounded-full blur-[2px]"></div>
                                    </div>
                                    <span
                                        className={`text-[9px] text-center whitespace-nowrap tracking-tight transition-all ${tex.active ? "font-bold text-gray-900" : "font-medium text-gray-500 group-hover:text-gray-800"
                                            }`}
                                    >
                                        {tex.name}
                                    </span>
                                    {tex.active && (
                                        <div className="absolute -bottom-1 w-1 h-1 bg-gray-900 rounded-full"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="absolute -right-2 z-10 w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-lg text-gray-400 hover:text-gray-900 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100">
                        <Icon icon="heroicons:chevron-right-20-solid" width={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
