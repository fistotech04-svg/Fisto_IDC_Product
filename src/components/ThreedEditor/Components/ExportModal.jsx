import React, { useState } from 'react';
import { Icon } from '@iconify/react';

export default function ExportModal({ onClose, onExport }) {
    const [selectedFormat, setSelectedFormat] = useState('glb');
    const formats = [
        { id: 'glb', label: 'GLB', desc: 'Binary GLTF (Recommended)', icon: 'tabler:box-model-2' },
        { id: 'obj', label: 'OBJ', desc: 'Wavefront Object', icon: 'tabler:box-model' },
        { id: 'stl', label: 'STL', desc: 'Stereolithography', icon: 'tabler:printer' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[400px] shadow-2xl p-6 relative">
                 {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Icon icon="heroicons:x-mark" width={20} />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-2">Export 3D Model</h2>
                <p className="text-sm text-gray-500 mb-6">Select the file format ensuring compatibility with your target platform.</p>

                <div className="space-y-3 mb-8">
                    {formats.map((fmt) => (
                        <div 
                            key={fmt.id}
                            onClick={() => !fmt.disabled && setSelectedFormat(fmt.id)}
                            className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer group ${
                                fmt.disabled ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' : 
                                selectedFormat === fmt.id 
                                    ? 'border-[#5d5efc] bg-[#5d5efc]/5' 
                                    : 'border-gray-200 hover:border-[#5d5efc]/60 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4 ${
                                selectedFormat === fmt.id ? 'bg-[#5d5efc] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                            }`}>
                                <Icon icon={fmt.icon} width={24} />
                            </div>
                            <div className="flex-1">
                                <div className={`font-semibold text-sm ${selectedFormat === fmt.id ? 'text-[#5d5efc]' : 'text-gray-900'}`}>
                                    {fmt.label}
                                </div>
                                <div className="text-xs text-gray-500">{fmt.desc}</div>
                            </div>
                            
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedFormat === fmt.id ? 'border-[#5d5efc] bg-[#5d5efc]' : 'border-gray-300'
                            }`}>
                                {selectedFormat === fmt.id && <Icon icon="heroicons:check" className="text-white w-3 h-3" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            onExport(selectedFormat);
                            onClose();
                        }}
                        className="flex-1 py-3 text-sm font-semibold text-white bg-[#5d5efc] hover:bg-[#4d4eec] rounded-xl transition-colors shadow-lg shadow-[#5d5efc]/25"
                    >
                        Export Model
                    </button>
                </div>
            </div>
        </div>
    );
}
