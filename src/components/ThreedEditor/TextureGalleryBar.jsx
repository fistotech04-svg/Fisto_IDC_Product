import React from "react";
import { Icon } from "@iconify/react";


export default function TextureGalleryBar({ isOpen, setIsOpen }) {
    const scrollRef = React.useRef(null);

    const textures = [
        { name: "Silver Mate", color: "linear-gradient(135deg, #a1a1aa 0%, #3f3f46 100%)", active: false },
        { name: "Power Cot...", color: "linear-gradient(135deg, #78350f 0%, #451a03 100%)", active: false },
        { name: "Bronze Ma...", color: "linear-gradient(135deg, #d97706 0%, #78350f 100%)", active: false },
        { name: "Basic Mate..", color: "linear-gradient(135deg, #facc15 0%, #854d0e 100%)", active: false },
        { name: "Metal Clad...", color: "linear-gradient(135deg, #52525b 0%, #18181b 100%)", active: true },
        { name: "Worn Alu...", color: "linear-gradient(135deg, #94a3b8 0%, #334155 100%)", active: false },
        { name: "Scratched Met...", color: "linear-gradient(135deg, #3f3f46 0%, #09090b 100%)", active: false },
        { name: "Power Cot...", color: "linear-gradient(135deg, #451a03 0%, #000000 100%)", active: false },
        { name: "Over Hum...", color: "linear-gradient(135deg, #9a3412 0%, #431407 100%)", active: false },
        { name: "Bronze Ma...", color: "linear-gradient(135deg, #b45309 0%, #451a03 100%)", active: false },
        { name: "Silver Mate", color: "linear-gradient(135deg, #d4d4d8 0%, #52525b 100%)", active: false },
        { name: "Knights Ar...", color: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)", active: false },
        { name: "Worn Alu...", color: "linear-gradient(135deg, #64748b 0%, #1e293b 100%)", active: false },
        { name: "Silver Mate", color: "linear-gradient(135deg, #d4d4d8 0%, #52525b 100%)", active: false },
        { name: "Knights Ar...", color: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)", active: false },
        { name: "Worn Alu...", color: "linear-gradient(135deg, #64748b 0%, #1e293b 100%)", active: false },
    ];

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
        }
    };

    return (
        <div 
            className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden
            ${isOpen ? "bottom-0 w-[96%] h-[200px] rounded-t-2xl" : "bottom-0 w-[96%] h-[60px] rounded-t-2xl cursor-pointer hover:bg-gray-50"}
            `}
            onClick={(e) => !isOpen && setIsOpen(true)}
        >
            {/* COLLAPSED STATE CONTENT */}
            <div 
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                <span className="text-[14px] font-semibold text-gray-700">Click to View Texture Gallery</span>
                <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-gray-900"
                >
                    <Icon icon="heroicons:chevron-up-20-solid" width={20} />
                </button>
            </div>

            {/* EXPANDED STATE CONTENT */}
            <div 
                className={`w-full h-full flex flex-col transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[14px] font-semibold text-gray-900">Texture Gallery :</span>
                        
                        {/* Fake Dropdown */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                            <span className="text-[13px] font-medium text-gray-700">Metal (24)</span>
                            <Icon icon="heroicons:chevron-down-20-solid" width={14} className="text-gray-500" />
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                    >
                        <Icon icon="heroicons:chevron-down-20-solid" width={18} />
                    </button>
                </div>

                {/* Gallery Scroll Area */}
                <div className="flex-1 relative flex items-center px-4">
                    {/* Left Nav */}
                    <button 
                        onClick={scrollLeft}
                        className="z-10 w-8 h-8 flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all -mr-2 -translate-y-3"
                    >
                        <Icon icon="heroicons:chevron-left-20-solid" width={20} />
                    </button>

                    {/* Scrollable List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-x-auto custom-scrollbar px-4 h-full flex items-center pb-2"
                    >
                        <div className="flex items-center gap-4 min-w-max mx-auto">
                            {textures.map((tex, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <div
                                        className={`relative rounded-full transition-all duration-300 group-hover:scale-105 shadow-sm ${
                                            tex.active
                                            ? "w-[80px] h-[80px] ring-[2px] ring-offset-2 ring-gray-900"
                                            : "w-[80px] h-[80px] hover:shadow-md"
                                        }`}
                                        style={{
                                            background: tex.color,
                                            boxShadow: !tex.active ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : ''
                                        }}
                                    >
                                        {/* Specular Shine */}
                                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 opacity-50 rounded-lg"></div>
                                    </div>
                                    
                                    <span
                                        className={`text-[11px] text-center max-w-[80px] truncate ${
                                            tex.active ? "font-bold text-gray-900" : "font-medium text-gray-500"
                                        }`}
                                    >
                                        {tex.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Nav */}
                    <button 
                        onClick={scrollRight}
                        className="z-10 w-8 h-8 flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all -ml-2 -translate-y-3"
                    >
                        <Icon icon="heroicons:chevron-right-20-solid" width={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
