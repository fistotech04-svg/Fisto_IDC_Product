// LeftSidebar.jsx - Redesigned with Hover 3-Dots -> Menu Interaction
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Copy, Layout, RotateCcw, Trash2, ArrowLeft, MoreHorizontal, Edit2 } from 'lucide-react';

const LeftSidebar = ({
  pages,
  currentPage,
  switchToPage,
  addNewPage,
  deletePage,
  duplicatePage,
  clearPage,
  insertPageAfter,
  renamePage,
  onOpenTemplateModal
}) => {
  const [hoveredPage, setHoveredPage] = useState(null);
  const [activeMenuPage, setActiveMenuPage] = useState(null); // Page index where menu is OPEN
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setActiveMenuPage(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (e, idx) => {
      e.stopPropagation();
      setActiveMenuPage(activeMenuPage === idx ? null : idx);
  };

  // Renaming State
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleRenameStart = (page) => {
      setEditingPageId(page.id);
      setEditingName(page.name);
  };

  const handleRenameSubmit = (pageId) => {
      if (editingName.trim()) {
          renamePage(pageId, editingName.trim());
      }
      setEditingPageId(null);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Pages</h2>
        <button
          onClick={() => addNewPage()}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-white" onClick={() => setActiveMenuPage(null)}>
        {pages.map((page, idx) => (
          <div 
            key={page.id} 
            className="flex flex-col gap-2 relative group"
            onMouseEnter={() => setHoveredPage(idx)}
            onMouseLeave={() => setHoveredPage(null)}
          >
             {/* Thumbnail Container */}
             <div
                onClick={(e) => { e.stopPropagation(); switchToPage(idx); }}
                className={`relative rounded-lg overflow-hidden cursor-pointer border transition-all bg-white shadow-sm
                  ${currentPage === idx
                    ? 'border-2 border-black ring-1 ring-gray-200'
                    : 'border-gray-300 hover:border-gray-400'}`}
              >
                <div className="aspect-[1/1.414] relative bg-gray-50">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden bg-gray-50">
                    <div className="transform scale-[0.35] origin-center shadow-sm bg-white">
                        <iframe
                            srcDoc={`${page.html}<style>html,body{width:595px;height:842px;margin:0;padding:0;overflow:hidden;transform-origin:0 0;background:white;} * { outline: none !important; }</style>`}
                            title={`Preview ${page.name}`}
                            className="w-[595px] h-[842px] border-none bg-white"
                            scrolling="no"
                        />
                    </div>
                  </div>

                  {/* 3-Dots Button (Show on Hover or if Menu is Active) */}
                  {(hoveredPage === idx || activeMenuPage === idx) && (
                      <button
                        onClick={(e) => handleMenuClick(e, idx)}
                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors z-10
                            ${activeMenuPage === idx ? 'bg-gray-800 text-white' : 'bg-white/80 hover:bg-white text-gray-600 shadow-sm'}`}
                      >
                          <MoreHorizontal size={16} />
                      </button>
                  )}

                  {/* Menu Overlay */}
                  {activeMenuPage === idx && (
                    <div 
                        ref={menuRef}
                        className="absolute right-2 top-8 w-32 bg-white rounded-lg shadow-xl border border-gray-100 p-1 flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <button 
                            onClick={() => { insertPageAfter(idx); setActiveMenuPage(null); }}
                            className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded text-left transition-colors"
                        >
                            <Plus size={14} /> Add Page
                        </button>
                        <button 
                            onClick={() => { duplicatePage(idx); setActiveMenuPage(null); }}
                            className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded text-left transition-colors"
                        >
                            <Copy size={14} /> Duplicate
                        </button>
                        <button 
                            onClick={() => { 
                                switchToPage(idx); 
                                onOpenTemplateModal(); 
                                setActiveMenuPage(null); 
                            }}
                            className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded text-left transition-colors"
                        >
                            <Layout size={14} /> Template
                        </button>
                        <button 
                            onClick={() => { clearPage(idx); setActiveMenuPage(null); }}
                            className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded text-left transition-colors"
                        >
                            <RotateCcw size={14} /> Clear
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button 
                            onClick={() => { deletePage(idx); setActiveMenuPage(null); }}
                            className="flex items-center gap-2 px-2 py-2 text-xs text-red-500 hover:bg-red-50 rounded text-left transition-colors"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                  )}
                </div>
             </div>
             
             {/* Page Number / Name */}
             <div className="text-center mt-1 px-1">
                {editingPageId === page.id ? (
                   <input 
                       type="text"
                       value={editingName}
                       onChange={(e) => setEditingName(e.target.value)}
                       onBlur={() => handleRenameSubmit(page.id)}
                       onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(page.id)}
                       autoFocus
                       className="w-full text-center text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
                   />
                ) : (
                   <div className="flex items-center justify-center gap-1 group/name h-6">
                       <span 
                           onDoubleClick={() => handleRenameStart(page)}
                           className="text-sm text-gray-600 font-medium cursor-text hover:text-gray-900 truncate max-w-[140px]"
                           title="Double click to rename"
                       >
                           {page.name}
                       </span>
                       <button
                            onClick={(e) => { e.stopPropagation(); handleRenameStart(page); }}
                            className="opacity-0 group-hover/name:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                            title="Rename"
                       >
                           <Edit2 size={12} />
                       </button>
                   </div>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* Go to Customize Button */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft size={16} />
            Go to Customize
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;