import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function CreateFolderModal({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[20px] shadow-2xl w-[450px] overflow-hidden transform transition-all scale-100 p-6 relative">
      
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Create New Folder
                <span className="flex-1 h-[1px] bg-gray-100 ml-4"></span>
            </h2>
            <button 
                onClick={onClose}
                className="text-red-500 hover:text-red-600 transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit}>
            {/* Input */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Folder Name</label>
                <input 
                    autoFocus
                    type="text" 
                    placeholder="Enter your Folder name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#4c5add] focus:ring-2 focus:ring-[#4c5add]/10 transition-all placeholder-gray-400"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
                <button 
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-[#4c5add] text-[#4c5add] font-bold text-sm hover:bg-blue-50 transition-colors"
                >
                    <X size={16} />
                    Cancel
                </button>
                <button 
                    type="submit"
                    disabled={!folderName.trim()}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#4c5add] text-white font-bold text-sm shadow-md hover:bg-[#3f4bc0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Check size={16} />
                    Create
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
