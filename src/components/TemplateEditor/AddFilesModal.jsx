import React, { useState, useRef } from 'react';
import { X, Upload, FileType } from 'lucide-react';

const AddFilesModal = ({ isOpen, onClose, onUpload, isLoading }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onUpload && onUpload(files);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onUpload && onUpload(files);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={onClose}
        >
            {isLoading ? (
                <div className="bg-white rounded-[24px] p-12 shadow-2xl flex flex-col items-center justify-center min-w-[300px] min-h-[300px] animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-[#1e234a] font-bold text-xl mb-2">Processing Files...</p>
                    <p className="text-gray-500 text-sm font-medium">Please wait while we prepare your pages.</p>
                </div>
            ) : (
                <div
                    className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                            <h3 className="text-lg font-bold text-[#1e234a]">Upload Files to the Book</h3>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        {/* Close Button Styled like screenshot */}
                        <button
                            onClick={onClose}
                            className="ml-3 p-1 rounded-full border border-red-200 bg-white hover:bg-red-50 transition-colors group"
                        >
                            <X size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Subtitle */}
                    <p className="text-[11px] font-medium mb-4">
                        <span className="text-red-500 font-bold">*</span>
                        <span className="text-gray-400 font-normal ml-1">You Can Add Files To The Entire Page</span>
                    </p>

                    {/* Drag and Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            w-full py-10 border-2 border-dashed rounded-[20px] 
                            flex flex-col items-center justify-center cursor-pointer transition-all
                            ${isDragging
                                ? 'border-[#6C63FF] bg-[#6C63FF]/5 scale-[0.99]'
                                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }
                        `}
                    >
                        <Upload size={40} className="text-gray-300 mb-3" />

                        <p className="text-sm font-medium text-gray-700 mb-1">
                            Drag & Drop or <span className="text-[#6C63FF] hover:underline">Upload</span>
                        </p>

                        <div className="flex items-center justify-center mt-1">
                            <Upload size={14} className="text-[#6C63FF]" />
                        </div>

                        <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-wider font-semibold">
                            Supported File : <span className="text-gray-500">PDF, JPG, PNG, JPEG</span>
                        </p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,image/jpeg,image/png,image/jpg"
                        />
                    </div>
                </div>
            )}
        </div >
    );
};

export default AddFilesModal;
