import React, { useState } from 'react';
import { X, Upload, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { Icon } from '@iconify/react';

const CreateFlipbookModal = ({ isOpen, onClose, onUpload, onTemplate }) => {
  const [view, setView] = useState('selection'); // 'selection' | 'upload' | 'template'
  const fileInputRef = React.useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const carouselRef = React.useRef(null);

  // Template View State
  const [selectedTemplateId, setSelectedTemplateId] = useState('corporate');
  const [pageCount, setPageCount] = useState(12);

  const templates = [
    { id: 'corporate', label: 'A4', title: 'Corporate Brochure', dim: '(29.7 x 42 Cm)', width: 'w-24', height: 'h-36' },
    { id: 'catalogue', label: 'A4', title: 'Product Catalogue', dim: '(21 x 29 Cm)', width: 'w-36', height: 'h-24' },
    { id: 'large_catalogue', label: 'A3', title: 'Large Catalogue', dim: '(29.7 x 42 Cm)', width: 'w-28', height: 'h-40' },
    { id: 'showcase', label: 'A3', title: 'Showcase Brochure', dim: '(42 x 29.7 Cm)', width: 'w-40', height: 'h-28' },
    { id: 'mini', label: 'A5', title: 'Mini Brochure', dim: '(14.8 x 21 Cm)', width: 'w-20', height: 'h-28' },
    { id: 'booklet', label: 'B5', title: 'Standard Booklet', dim: '(17.6 x 25 Cm)', width: 'w-20', height: 'h-28' },
    { id: 'square', label: 'Square', title: 'Square Lookbook', dim: '(25 x 25 Cm)', width: 'w-28', height: 'h-28' },
    { id: 'square_small', label: 'Square Small', title: 'Square Small', dim: '(20 x 20 Cm)', width: 'w-24', height: 'h-24' },
    { id: 'digital_mag', label: 'Mag', title: 'Digital Magazine', dim: '(22 x 28 Cm)', width: 'w-20', height: 'h-32' },
    { id: 'mobile', label: 'Mob', title: 'Mobile Flipbook', dim: '(12 x 21.3 Cm)', width: 'w-16', height: 'h-28' },
  ];

  const scrollLeft = () => {
    if (carouselRef.current) {
        carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
        carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Simulate progress for new files
  React.useEffect(() => {
    if (uploadedFiles.length > 0) {
      const timers = uploadedFiles.map(fileObj => {
        if (fileObj.progress < 100) {
           return setInterval(() => {
             setUploadedFiles(prev => prev.map(f => {
               if (f.id === fileObj.id && f.progress < 100) {
                 return { ...f, progress: Math.min(f.progress + 10, 100) };
               }
               return f;
             }));
           }, 200);
        }
        return null;
      });

      return () => timers.forEach(t => t && clearInterval(t));
    }
  }, [uploadedFiles]);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateFlipbook = () => {
    onUpload(uploadedFiles.map(f => f.file));
  };

  const handleCreateFromTemplate = () => {
    // Logic for creating from templat
    const template = templates.find(t => t.id === selectedTemplateId);
    console.log("Creating from template:", template, "Pages:", pageCount);
    onTemplate({ templateId: selectedTemplateId, pageCount }); 
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Render Selection View
  const renderSelectionView = () => (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-center items-stretch">
            
      {/* Option 1: Upload PDF - Light Purple Background */}
      <div className="flex-1 bg-[#F5F6FF] rounded-2xl p-5 md:p-8 flex flex-col items-center text-center shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
        
        {/* Iconify Icon: PDF */}
        <div className="w-12 h-12 mb-3 flex items-center justify-center">
             <Icon icon="bi:file-earmark-pdf-fill" width="40" height="40" className='text-[#FF4444]'/>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">Upload PDF</h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">
          Upload your ready PDF file and instantly convert it into a smooth, interactive flipbook
        </p>

        <button 
          onClick={() => setView('upload')}
          className="mt-auto w-full max-w-[200px] py-2.5 bg-[#4F46E5] text-white rounded-xl font-bold text-sm hover:bg-[#4338ca] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
        >
          Upload
        </button>
      </div>

      {/* Option 2: Build Using Templates - White Background */}
      <div className="flex-1 bg-white rounded-2xl p-5 md:p-8 flex flex-col items-center text-center shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
        
        {/* Iconify Icon: Templates */}
        <div className="w-12 h-12 mb-3 flex items-center justify-center">
             <Icon icon="raphael:paper" width="40" height="40" />
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">Build Using Templets</h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">
          Choose from ready-made page templates and design a flipbook from scratch
        </p>

        <button 
          onClick={() => setView('template')}
          className="mt-auto w-full max-w-[200px] py-2.5 bg-[#4F46E5] text-white rounded-xl font-bold text-sm hover:bg-[#4338ca] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
        >
          Select Pages
        </button>
      </div>

    </div>
  );

  // Render Upload View
  const renderUploadView = () => (
    <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-[24px] p-5 md:p-6 shadow-2xl flex justify-center w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-5 md:p-8 w-full text-center flex flex-col shadow-lg relative min-h-[350px]">
        
         {/* Close Button for Upload View (Red) */}
         <button
            onClick={() => {
                setView('selection');
                setUploadedFiles([]); // Clear files on back
            }} 
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors z-50 p-1 hover:bg-red-50 rounded-full"
         >
            <X size={18} />
         </button>

        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
           <h2 className="text-xl font-bold text-gray-900">Upload PDF</h2>
        </div>

        <div className="mb-4 text-left">
            <p className="text-xs text-gray-500">Upload your ready PDF file and instantly convert it into a smooth, interactive flipbook</p>
        </div>

        {/* Container for centering content */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
            {uploadedFiles.length === 0 ? (
                /* Empty State - Compact Upload Box Centered */
                <div 
                className="border-2 border-dashed border-[#3b4190] rounded-xl bg-white flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer w-40 h-32 mx-auto"
                onClick={handleUploadClick}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="application/pdf" 
                        onChange={handleFileChange} 
                        multiple
                    />
                    <div className="w-10 h-10 rounded-full bg-[#f0f2ff] flex items-center justify-center text-[#3b4190] mb-1">
                        <Upload size={20} />
                    </div>
                    <h4 className="text-[#3b4190] font-bold text-xs">Upload PDF</h4>
                    <p className="text-gray-400 text-[9px]">Browse or Drop</p>
                </div>
            ) : (
                /* With Files - Split Layout */
                <div className="flex-1 flex flex-col justify-start pt-2 h-full">
                    <div className="flex-1 flex gap-4 items-start h-full">
                        {/* Left: Small Upload Box */}
                        <div 
                            className="w-28 h-28 border-2 border-dashed border-[#3b4190] rounded-xl bg-white flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0"
                            onClick={handleUploadClick}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="application/pdf" 
                                onChange={handleFileChange} 
                                multiple
                            />
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[#3b4190]">
                                <Upload size={16} />
                            </div>
                            <span className="text-[#3b4190] font-medium text-[9px] text-center px-1">Add PDF</span>
                        </div>

                        {/* Right: File List - Takes remaining space and scrolls */}
                        <div className="flex-1 flex flex-col gap-2 h-full max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                            {uploadedFiles.map((fileObj) => (
                                <div key={fileObj.id} className="relative flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0">
                                    {/* PDF Icon */}
                                    <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-red-50 rounded-md">
                                        <Icon icon="bi:file-earmark-pdf-fill" width="14" height="14" className='text-[#FF4444]'/>
                                    </div>
                                    
                                    {/* Info & Progress */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-semibold text-gray-800 truncate pr-2">{fileObj.file.name}</span>
                                            <button 
                                                onClick={() => handleRemoveFile(fileObj.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-0.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#4F46E5] transition-all duration-300 ease-out"
                                                style={{ width: `${fileObj.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Button */}
                    <div className="mt-6 flex justify-center pb-1">
                        <button 
                            onClick={handleCreateFlipbook}
                            className="px-8 py-2.5 bg-[#6366f1] text-white rounded-xl font-bold text-sm hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
                        >
                            Create Flipbook
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  // Render Template View
  const renderTemplateView = () => (
    <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-[24px] p-5 md:p-6 shadow-2xl flex justify-center w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-5 md:p-8 w-full flex flex-col shadow-lg relative min-h-[400px]">
         {/* Close Button (Red) */}
         <button
            onClick={() => setView('selection')} 
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors z-50 p-1 hover:bg-red-50 rounded-full"
         >
            <X size={18} />
         </button>

         {/* Header */}
         <div className="mb-4">
            <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-2xl font-bold text-gray-900">Build Using Templets</h2>
                 <div className="flex-1 h-[1px] bg-gray-200 mt-2"></div>
            </div>
            <p className="text-xs text-gray-500">Choose from ready-made page templates and design a flipbook from scratch</p>
         </div>

         {/* Templates Carousel */}
         <div className="flex items-center justify-between gap-4 mb-6 px-4 py-2 min-h-[160px]">
             {/* Left Arrow */}
             <button 
                onClick={scrollLeft}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 z-10"
             >
                 <ChevronLeft size={20} />
             </button>

             {/* Cards Container - Scrollable */}
             <div 
                ref={carouselRef}
                className="flex items-end gap-6 md:gap-8 overflow-x-auto scrollnav-hidden scroll-smooth py-4 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
             >
                 {templates.map((template) => {
                     const isSelected = selectedTemplateId === template.id;
                     return (
                         <div 
                             key={template.id} 
                             className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
                             onClick={() => setSelectedTemplateId(template.id)}
                         >
                             {/* The Shape Box */}
                             <div 
                                className={`
                                    ${template.width} ${template.height} 
                                    border rounded-sm flex items-center justify-center shadow-sm transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-[#3b4190] border-[#3b4190] text-white shadow-xl scale-105' 
                                        : 'bg-gray-50 border-gray-300 text-[#3b4190] group-hover:border-[#3b4190] group-hover:scale-105'
                                    }
                                `}
                             >
                                 <span className="text-sm font-medium">{template.label}</span>
                             </div>

                             {/* Label */}
                             <div className="text-center w-24">
                                 <p className={`text-[10px] font-bold transition-colors truncate ${isSelected ? 'text-[#3b4190]' : 'text-gray-700'}`}>
                                     {template.title}
                                 </p>
                                 <p className="text-[9px] text-gray-400">{template.dim}</p>
                             </div>
                         </div>
                     );
                 })}
             </div>

             {/* Right Arrow */}
             <button 
                onClick={scrollRight}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 z-10"
             >
                 <ChevronRight size={20} />
             </button>
         </div>

         {/* Page Count Selector */}
         <div className="flex items-center justify-center gap-3 mb-8">
             <span className="text-sm font-medium text-gray-900">Number of Pages<span className="text-red-500">*</span> :</span>
             
             <button 
                onClick={() => setPageCount(Math.max(2, pageCount - 2))}
                className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
             >
                 <Minus size={20} strokeWidth={1.5} />
             </button>
             
             <div className="w-12 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-sm font-bold text-gray-900 bg-white overflow-hidden">
                 <input 
                    type="number"
                    value={pageCount}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 2;
                        if (val > 12) val = 12;
                        if (val < 2) val = 2;
                        if (val % 2 !== 0) val = val + 1;
                        if (val > 12) val = 12; 
                        setPageCount(val);
                    }}
                    className="w-full h-full text-center focus:outline-none bg-transparent"
                 />
             </div>

             <button 
                onClick={() => setPageCount(Math.min(12, pageCount + 2))}
                className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
             >
                 <Plus size={20} strokeWidth={1.5} />
             </button>
         </div>

         {/* Create Button */}
         <div className="flex justify-center mt-auto">
            <button 
                onClick={handleCreateFromTemplate}
                className="px-16 py-2.5 bg-[#6366f1] text-white rounded-xl font-medium text-lg hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
            >
                Create
            </button>
         </div>

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      ></div>

      {/* The Container */}
      <div className={`relative z-10 w-full transform transition-all animate-in fade-in zoom-in-95 duration-200 ${view === 'template' ? 'max-w-4xl' : 'max-w-xl'}`}>
        
        {view === 'selection' && (
             <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-[24px] p-5 md:p-6 shadow-2xl">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-1.5 z-50" 
                >
                    <X size={16} />
                </button>
                {renderSelectionView()}
             </div>
        )}
        
        {view === 'upload' && renderUploadView()}
        
        {view === 'template' && renderTemplateView()}

      </div>
    </div>
  );
};

export default CreateFlipbookModal;
