import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { textureData } from "../../data/textureData";

export default function TextureGalleryBar({ isOpen, setIsOpen, onSelectTexture, selectedTextureId }) {
    const scrollRef = React.useRef(null);
    const [localSelected, setLocalSelected] = useState(null);

    // Use data from centralized file
    const textures = textureData;

    const handleSelect = (tex) => {
        setLocalSelected(tex.id || tex.name);
        if (onSelectTexture) {
            onSelectTexture(tex);
        }
    };

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
                        
                        {/* Count Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                            <span className="text-[13px] font-medium text-gray-700">All ({textures.length})</span>
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
                            {textures.map((tex, idx) => {
                                const isActive = selectedTextureId === tex.id || (!selectedTextureId && localSelected === (tex.id || tex.name));
                                return (
                                    <div 
                                        key={idx} 
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(tex);
                                        }}
                                    >
                                        <div
                                            className={`relative rounded-full transition-all duration-300 group-hover:scale-105 shadow-sm overflow-hidden bg-gray-100 ${
                                                isActive
                                                ? "w-[80px] h-[80px] ring-[2px] ring-offset-2 ring-[#5d5efc]"
                                                : "w-[80px] h-[80px] hover:shadow-md border border-gray-200"
                                            }`}
                                        >
                                            <img 
                                                src={tex.preview} 
                                                alt={tex.name} 
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            {/* Specular Shine Overlay */}
                                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 opacity-50 pointer-events-none"></div>
                                        </div>
                                        
                                        <span
                                            className={`text-[11px] text-center max-w-[80px] truncate ${
                                                isActive ? "font-bold text-[#5d5efc]" : "font-medium text-gray-500"
                                            }`}
                                            title={tex.name}
                                        >
                                            {tex.name}
                                        </span>
                                    </div>
                                );
                            })}
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
