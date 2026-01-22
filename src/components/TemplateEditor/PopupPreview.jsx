import React from 'react';
import { X, Type, Image as ImageIcon } from 'lucide-react';

const PopupPreview = ({ content, styles, elementType, elementSource, onClose }) => {
    const {
        font = 'Poppins',
        size = '24',
        weight = 'Semi Bold',
        fill = '#000000',
        autoWidth = true,
        autoHeight = true,
        fit = 'Fit'
    } = styles || {};

    // Locked to fixed dimensions as per user request
    const isAutoWidth = false;
    const isAutoHeight = false;

    const fontWeight =
        weight === 'Bold' ? '700' :
            weight === 'Semi Bold' ? '600' : '400';

    const getObjectFit = () => {
        if (fit === 'Fill') return 'cover';
        if (fit === 'Stretch') return 'fill';
        return 'contain'; // Default for 'Fit'
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-default pointer-events-auto animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-none shadow-[0_15px_40px_rgba(0,0,0,0.2)] relative border border-[#00a2ff] flex flex-col items-center pointer-events-auto scale-in-center transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '100%',
                    height: '85%',
                    maxHeight: '95vh',
                    minWidth: '320px',
                    minHeight: '400px', // Fixed minimum height for stability
                    padding: '60px 40px',
                    overflowY: 'auto'
                }}
            >
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&display=swap');
                `}</style>


                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600 hover:rotate-90 bg-white/80 backdrop-blur-sm shadow-sm"
                >
                    <X size={20} />
                </button>

                {/* Element Rendering */}
                <div className="w-full flex-grow flex flex-col items-center justify-center relative overflow-hidden min-h-[150px]">
                    {elementType === 'image' ? (
                        <div className="w-full flex flex-col items-center gap-8">
                            <div className="relative">
                                <img
                                    src={elementSource}
                                    alt="Popup Content"
                                    className="max-w-full max-h-[50vh] object-contain"
                                    style={{
                                        objectFit: getObjectFit(),
                                        width: fit === 'Stretch' ? '100%' : 'auto',
                                        height: fit === 'Stretch' ? '100%' : 'auto'
                                    }}
                                />
                            </div>

                            {content && (
                                <div
                                    className="break-words whitespace-pre-wrap w-full text-center px-4"
                                    style={{
                                        fontFamily: `'${font}', sans-serif`,
                                        fontSize: `${size}px`,
                                        fontWeight: fontWeight,
                                        color: fill,
                                        lineHeight: '1.6'
                                    }}
                                >
                                    {content}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full text-center px-4 py-4">
                            <div
                                className="break-words whitespace-pre-wrap w-full"
                                style={{
                                    fontFamily: `'${font}', sans-serif`,
                                    fontSize: `${size}px`,
                                    fontWeight: fontWeight,
                                    color: fill,
                                    lineHeight: '1.6'
                                }}
                            >
                                {content || elementSource}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupPreview;
