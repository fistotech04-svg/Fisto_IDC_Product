// LeftSidebar.jsx - Redesigned with Context Menu + Drag-to-Reorder
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Copy, Edit2, Layout, 
  ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, 
  Ban, Trash2, MoreVertical, GripVertical 
} from 'lucide-react';

const LeftSidebar = ({
  pages,
  currentPage,
  switchToPage,
  addNewPage,
  insertPageAfter,
  duplicatePage,
  renamePage,
  clearPage,
  deletePage,
  movePageUp,
  movePageDown,
  movePageToFirst,
  movePageToLast,
  movePage,
  onOpenTemplateModal,
  editingPageIdProp,
  onEditingPageIdChange
}) => {
  // Menu State
  const [activeMenuPageId, setActiveMenuPageId] = useState(null);
  const menuRef = useRef(null);

  // Renaming State
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef(null);

  // Drag State
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Sync external editing state with internal state (for auto-rename after add/duplicate)
  useEffect(() => {
    if (editingPageIdProp !== undefined && editingPageIdProp !== editingPageId) {
      setEditingPageId(editingPageIdProp);
      if (editingPageIdProp !== null) {
        const page = pages.find(p => p.id === editingPageIdProp);
        if (page) {
          setEditingName(page.name);
        }
      }
    }
  }, [editingPageIdProp, pages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuPageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (e, pageId) => {
    e.stopPropagation();
    setActiveMenuPageId(activeMenuPageId === pageId ? null : pageId);
  };

  const handleRenameStart = (e, page) => {
    // e.stopPropagation(); // Context menu click already handled
    setEditingPageId(page.id);
    setEditingName(page.name);
    setActiveMenuPageId(null); // Close menu
    if (onEditingPageIdChange) {
      onEditingPageIdChange(page.id);
    }
  };

  const handleRenameSubmit = (pageId) => {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim());
    }
    setEditingPageId(null);
    if (onEditingPageIdChange) {
      onEditingPageIdChange(null);
    }
  };

  const handleRenameCancel = () => {
    setEditingPageId(null);
    setEditingName('');
    if (onEditingPageIdChange) {
      onEditingPageIdChange(null);
    }
  };

  // Drag Handlers
  const handleDragStart = (e, index) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer to be set
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedPageIndex !== null && draggedPageIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedPageIndex !== null && draggedPageIndex !== dropIndex) {
      movePage(draggedPageIndex, dropIndex);
    }
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Pages</h2>
        <button
          onClick={() => addNewPage()} 
          className="flex items-center gap-1 bg-transparent hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Files
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white" onClick={() => setActiveMenuPageId(null)}>
        {pages.map((page, idx) => (
          <div 
            key={page.id} 
            className="relative group"
            id={`page-card-${page.id}`}
            draggable={editingPageId !== page.id}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: draggedPageIndex === idx ? 0.5 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {/* Drop Indicator - Show above the card when dragging over */}
            {dragOverIndex === idx && draggedPageIndex !== idx && draggedPageIndex < idx && (
              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
            )}
            
            <div 
              onClick={() => editingPageId !== page.id && switchToPage(idx)}
              className={`w-full py-3 px-4 rounded-lg cursor-pointer transition-all text-center text-sm font-medium relative flex items-center justify-center
                ${currentPage === idx
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
            >
              {/* Drag Handle - Left Side */}
              {editingPageId !== page.id && (
                <div 
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseEnter={(e) => e.currentTarget.parentElement.style.cursor = 'grab'}
                  onMouseLeave={(e) => e.currentTarget.parentElement.style.cursor = 'pointer'}
                >
                  <GripVertical size={16} className="text-gray-400" />
                </div>
              )}

              {editingPageId === page.id ? (
                <input 
                  ref={renameInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRenameSubmit(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(page.id);
                    if (e.key === 'Escape') handleRenameCancel();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.target.select()}
                  autoFocus
                  className="w-full text-center text-sm border-b border-black py-0.5 focus:outline-none"
                />
              ) : (
                <>
                  <span className="truncate max-w-[130px]">{page.name}</span>
                  
                  {/* 3-Dot Menu Button - Visible on Hover or Active Menu */}
                  <button
                    onClick={(e) => handleMenuClick(e, page.id)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors 
                        ${activeMenuPageId === page.id ? 'opacity-100 bg-gray-300' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200'}`}
                  >
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                </>
              )}
            </div>

            {/* Drop Indicator - Show below the card when dragging over */}
            {dragOverIndex === idx && draggedPageIndex !== idx && draggedPageIndex > idx && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
            )}

            {/* Context Menu Dropdown - Rendered via Portal to avoid clipping */}
            {activeMenuPageId === page.id && createPortal(
                <div 
                    ref={menuRef}
                    style={(() => {
                        const element = document.getElementById(`page-card-${page.id}`);
                        if (!element) return { display: 'none' };
                        const rect = element.getBoundingClientRect();
                        const menuHeight = 380; // Approximate max height of menu
                        
                        // Check if menu would overflow bottom of screen (with 100px buffer)
                        if (rect.top + menuHeight + 200 > window.innerHeight) {
                            // Vertically centered, but horizontally next to card
                            return {
                                position: 'fixed',
                                top: '50%',
                                left: `${rect.right + 10}px`,
                                transform: 'translateY(-50%)'
                            };
                        }
                        
                        // Default position: Next to the card, aligned to top
                        return {
                            position: 'fixed',
                            left: `${rect.right + 10}px`,
                            top: `${rect.top}px`
                        };
                    })()}
                    className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-[9999] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Page Settings Section */}
                    {/* ... menu content same as before ... */}
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        Page Settings <div className="h-px bg-gray-100 flex-1"></div>
                    </div>
                    
                    <button onClick={() => { insertPageAfter(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <Plus size={14} /> Add Page
                    </button>
                    <button onClick={() => { duplicatePage(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <Copy size={14} /> Duplicate
                    </button>
                    <button onClick={(e) => handleRenameStart(e, page)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <Edit2 size={14} /> Rename
                    </button>
                    <button onClick={() => { switchToPage(idx); onOpenTemplateModal(); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <Layout size={14} /> Template
                    </button>

                    {/* Page Order Section */}
                    <div className="px-2 py-1 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                         Page Order <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

                    <button onClick={() => { movePageUp(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <ArrowUp size={14} /> Move Up
                    </button>
                    <button onClick={() => { movePageDown(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <ArrowDown size={14} /> Move Down
                    </button>
                    <button onClick={() => { movePageToFirst(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <ArrowUpToLine size={14} /> Move to First
                    </button>
                    <button onClick={() => { movePageToLast(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <ArrowDownToLine size={14} /> Move to Last
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 my-1"></div>

                    {/* Actions */}
                    <button onClick={() => { clearPage(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                        <Ban size={14} /> Clear
                    </button>
                    <button onClick={() => { deletePage(idx); setActiveMenuPageId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg text-left">
                        <Trash2 size={14} /> Delete
                    </button>
                </div>,
                document.body
            )}
          </div>
        ))}
      </div>

      {/* Footer - Add Page Toggle */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button 
          onClick={() => addNewPage()}
          className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Page
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;