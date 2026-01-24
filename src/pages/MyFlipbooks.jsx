import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Folder, Plus, ArrowLeft, Search, MoreVertical, Trash2, Edit2, Copy, Eye, Wrench, PenTool, BarChart2, Share2, Download, FolderInput, SlidersHorizontal, CheckSquare, Check } from 'lucide-react';
import DashboardBg from '../assets/images/myflipbook.png';

import CreateFolderModal from '../components/CreateFolderModal';
import AlertModal from '../components/AlertModal';
import CreateFlipbookModal from '../components/CreateFlipbookModal';

export default function MyFlipbooks() {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState('Public Books');
  const [folders, setFolders] = useState([
    { name: 'Public Books', id: 'public' },
    { name: 'Office Books', id: 'office' },
    { name: 'Entertainment Books', id: 'entertainment' },
    { name: 'Story Books', id: 'story' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleUploadPDF = (files) => {
    console.log("Upload PDF Clicked", files);
    setIsCreateModalOpen(false);
  };

  const handleUseTemplate = (templateData) => {
    console.log("Use Template Clicked", templateData);
    setIsCreateModalOpen(false);
    if (templateData) {
        navigate('/editor', { state: templateData });
    }
  };

  // Renaming States
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');
  
  // Menu Action State
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Open Modal
  const handleAddFolderClick = () => {
    setIsModalOpen(true);
  };

  // Logic to actually create the folder
  const handleCreateFolder = (name) => {
    const newId = Date.now().toString();
    setFolders([...folders, { name: name, id: newId }]);
    setActiveFolder(name);
  };

  const startEditing = (folder) => {
    setEditingId(folder.id);
    setTempName(folder.name);
  };

  const saveEdit = () => {
    if (editingId && tempName.trim()) {
      setFolders(folders.map(f => f.id === editingId ? { ...f, name: tempName.trim() } : f));
      const folderBeingEdited = folders.find(f => f.id === editingId);
      if (folderBeingEdited && activeFolder === folderBeingEdited.name) {
          setActiveFolder(tempName.trim());
      }
    }
    setEditingId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    }
  };

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    folderId: null,
    folderName: ''
  });

  const handleDeleteFolderClick = (folder) => {
    setActiveMenuId(null);
    setDeleteConfirmation({
      isOpen: true,
      folderId: folder.id,
      folderName: folder.name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.folderId) {
      setFolders(prev => prev.filter(f => f.id !== deleteConfirmation.folderId));
      // If the deleted folder was active, switch to the first available folder (e.g., Public Books)
      if (activeFolder === deleteConfirmation.folderName) {
        setActiveFolder('Public Books');
      }
    }
    setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' });
  };

  const handleDuplicateFolder = (folder) => {
    const newId = Date.now().toString();
    const newName = `${folder.name} Copy`;
    setFolders([...folders, { name: newName, id: newId }]);
    setActiveMenuId(null);
  };

  // Mock Books Data
  const [books, setBooks] = useState([
    { id: 1, title: 'Kerala Explorer', pages: 12, created: '20-11-2025', views: 245, size: '24MB', folder: 'Public Books', image: 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=600&auto=format&fit=crop' },
    { id: 2, title: 'Sirius Black Construction', pages: 30, created: '20-11-2025', views: 245, size: '24MB', folder: 'Public Books', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=260&auto=format&fit=crop' },
    { id: 3, title: 'Alloy Flipbook', pages: 30, created: '20-11-2025', views: 245, size: '24MB', folder: 'Public Books', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=260&auto=format&fit=crop' },
    { id: 4, title: 'Financial Report Q1', pages: 45, created: '15-10-2025', views: 120, size: '15MB', folder: 'Office Books', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=260&auto=format&fit=crop' },
    { id: 5, title: 'Employee Handbook', pages: 20, created: '10-09-2025', views: 500, size: '10MB', folder: 'Office Books', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=260&auto=format&fit=crop' },
  ]);

  /* Selection State */
  const [selectedBooks, setSelectedBooks] = useState([]);

  /* Menu State */
  const [activeBookMenu, setActiveBookMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, isDropup: false });

  // Book Renaming State
  const [editingBookId, setEditingBookId] = useState(null);
  const [tempBookTitle, setTempBookTitle] = useState('');

  // Book Delete Confirmation
  const [deleteBookConfirmation, setDeleteBookConfirmation] = useState({
    isOpen: false,
    bookId: null,
    bookTitle: ''
  });

  // Book Move State
  const [moveBookModal, setMoveBookModal] = useState({
    isOpen: false,
    bookId: null,
    isBulk: false // Added to track bulk move
  });

  // --- Selection Logic ---
  const handleSelectAll = () => {
    if (selectedBooks.length === filteredBooks.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(filteredBooks.map(b => b.id));
    }
  };

  const toggleBookSelection = (id) => {
    setSelectedBooks(prev => 
      prev.includes(id) ? prev.filter(bookId => bookId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedBooks.length === 0) return;
    setDeleteBookConfirmation({
        isOpen: true,
        bookId: 'BULK',
        bookTitle: `${selectedBooks.length} Selected Books` 
    });
  };

  const handleBulkMove = () => {
    if (selectedBooks.length === 0) return;
    setMoveBookModal({
        isOpen: true,
        bookId: 'BULK',
        isBulk: true
    });
  };

  // --- Book Handlers ---

  const handleDuplicateBook = (book) => {
    setActiveBookMenu(null);
    const newId = Date.now().toString();
    const newBook = { 
        ...book, 
        id: newId, 
        title: `${book.title} Copy`,
        created: new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // Current date
    };
    setBooks(prev => [newBook, ...prev]);
  };

  const handleDeleteBookClick = (book) => {
    setActiveBookMenu(null);
    setDeleteBookConfirmation({
      isOpen: true,
      bookId: book.id,
      bookTitle: book.title
    });
  };

  const confirmDeleteBook = () => {
    if (deleteBookConfirmation.bookId === 'BULK') {
        setBooks(prev => prev.filter(b => !selectedBooks.includes(b.id)));
        setSelectedBooks([]);
    } else if (deleteBookConfirmation.bookId) {
      setBooks(prev => prev.filter(b => b.id !== deleteBookConfirmation.bookId));
      setSelectedBooks(prev => prev.filter(id => id !== deleteBookConfirmation.bookId));
    }
    setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' });
  };

  const startEditingBook = (book) => {
    setActiveBookMenu(null);
    setEditingBookId(book.id);
    setTempBookTitle(book.title);
  };

  const saveBookEdit = () => {
    if (editingBookId && tempBookTitle.trim()) {
      setBooks(books.map(b => b.id === editingBookId ? { ...b, title: tempBookTitle.trim() } : b));
    }
    setEditingBookId(null);
  };

  const handleBookKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveBookEdit();
    }
  };

  const handleMoveBookClick = (book) => {
    setActiveBookMenu(null);
    setMoveBookModal({
        isOpen: true,
        bookId: book.id
    });
  };

  const confirmMoveBook = (targetFolder) => {
    if (moveBookModal.bookId === 'BULK') {
        setBooks(books.map(b => selectedBooks.includes(b.id) ? { ...b, folder: targetFolder } : b));
        setSelectedBooks([]);
        setActiveFolder(targetFolder); 
    } else if (moveBookModal.bookId) {
        setBooks(books.map(b => b.id === moveBookModal.bookId ? { ...b, folder: targetFolder } : b));
        setSelectedBooks(prev => prev.filter(id => id !== moveBookModal.bookId));
    }
    setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
    setIsCreatingInMove(false); // Reset create mode
    setNewMoveFolderName('');
  };

  // --- Create Folder in Move Modal Logic ---
  const [isCreatingInMove, setIsCreatingInMove] = useState(false);
  const [newMoveFolderName, setNewMoveFolderName] = useState('');
  const moveModalListRef = useRef(null);

  useEffect(() => {
    if (isCreatingInMove && moveModalListRef.current) {
        moveModalListRef.current.scrollTo({
            top: moveModalListRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [isCreatingInMove]);

  const handleCreateFolderAndMove = () => {
    if (!newMoveFolderName.trim()) return;
    const name = newMoveFolderName.trim();
    
    // Create Folder Logic
    const newId = Date.now().toString();
    const newFolder = { name: name, id: newId };
    setFolders(prev => [...prev, newFolder]);
    
    // Move Book(s) to new folder
    if (moveBookModal.bookId === 'BULK') {
        setBooks(prev => prev.map(b => selectedBooks.includes(b.id) ? { ...b, folder: name } : b));
        setSelectedBooks([]);
        setActiveFolder(name);
    } else if (moveBookModal.bookId) {
        setBooks(prev => prev.map(b => b.id === moveBookModal.bookId ? { ...b, folder: name } : b));
        setSelectedBooks(prev => prev.filter(id => id !== moveBookModal.bookId));
    }
    
    // Close Modal and Reset
    setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
    setIsCreatingInMove(false);
    setNewMoveFolderName('');
  };


  // Filter books by active folder
  const filteredBooks = books.filter(book => book.folder === activeFolder);
  const isAllSelected = filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length;

  return (
    <div className="flex bg-[#eef0f8] min-h-screen pt-[8vh]">
      {/* Sidebar */}
      <aside className="w-72 bg-white h-[92vh] fixed left-0 top-[8vh] border-r border-gray-100 flex flex-col p-6 z-20">
        
        {/* Create Button */}
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-black text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold mb-8 hover:bg-gray-800 transition-colors shadow-lg"
        >
          <BookOpen size={20} />
          Create Flipbook
        </button>

        {/* Folders Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Static Header Area */}
          <div className="flex-none">
            <div className="mb-2 flex items-center">
                <span className="text-sm font-bold text-gray-800">Your Folders</span>
                <div className="h-[1px] bg-gray-200 flex-1 ml-4"></div>
            </div>
            <div className="flex justify-end mb-4">
                <button 
                  onClick={handleAddFolderClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-gray-500 font-medium text-xs bg-white hover:bg-gray-50 transition-colors"
                >
                    <Plus size={14} /> Folder
                </button>
            </div>
          </div>

          {/* Scrollable Folder List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
            <div className="space-y-3">
              {folders.map(folder => {
                  const isEditing = editingId === folder.id;
                  const isActive = activeFolder === folder.name;
                  
                  return isEditing ? (
                      <div key={folder.id} className="w-full px-4 py-3 rounded-xl border border-[#3b4190] bg-white shadow-md">
                          <input 
                              autoFocus
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full text-sm font-medium text-gray-900 focus:outline-none"
                          />
                      </div>
                  ) : (
                      <div 
                          key={folder.id}
                          onClick={() => setActiveFolder(folder.name)}
                          className={`relative group w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-medium text-left cursor-pointer
                              ${isActive 
                                  ? 'bg-[#3b4190] text-white border-[#3b4190] shadow-md' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#3b4190] hover:text-[#3b4190]'
                              }
                          `}
                      >
                          <Folder size={18} fill={isActive ? "currentColor" : "none"} />
                          <span className="truncate flex-1">{folder.name}</span>

                          {/* Options Menu Trigger */}
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                              }}
                              className={`p-1.5 rounded-lg transition-all rotate-90 ${
                                isActive 
                                    ? 'hover:bg-white/20 text-white' 
                                    : 'hover:bg-gray-100 text-gray-500'
                              } ${activeMenuId === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                              <MoreVertical size={16} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === folder.id && (
                              <>
                                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                  <div className="absolute right-2 top-10 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              startEditing(folder);
                                              setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                      >
                                          <Edit2 size={14} />
                                          Rename
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDuplicateFolder(folder);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                      >
                                          <Copy size={14} />
                                          Duplicate
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFolderClick(folder);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                          <Trash2 size={14} />
                                          Delete
                                      </button>
                                  </div>
                              </>
                          )}
                      </div>
                  );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-auto pt-4">
             <Link to="/home" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#3b4190] text-[#3b4190] font-medium hover:bg-blue-50 transition-colors">
                 <ArrowLeft size={18} />
                 Back to Home
             </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 ml-72 p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${DashboardBg})` }}
      >
           
           <h1 className="text-3xl font-semibold text-[#00000] mb-8 relative z-10">My Flipbooks</h1>

           {/* Blue Container Card */}
           <div className="w-full h-[calc(93vh-140px)] bg-[#343b854d] rounded-2xl p-6 shadow-2xl relative flex flex-col">
                <div className="flex items-center justify-between mb-6 z-10">
                    <h2 className="text-2xl font-semibold text-[#343868]">Recent - Flipbooks</h2>
                    
                    <div className="flex items-center gap-4">
                        {selectedBooks.length > 0 && (
                            <>
                                <button 
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm text-sm font-semibold"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                                <button 
                                    onClick={handleBulkMove}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#4c5add] text-white rounded-lg hover:bg-[#3f4bc0] transition-colors shadow-sm text-sm font-semibold"
                                >
                                    <FolderInput size={16} /> Move to Folder
                                </button>
                                <div className="w-[1px] h-6 bg-gray-300 mx-2"></div>
                            </>
                        )}

                        <button 
                            onClick={handleSelectAll}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all
                                ${isAllSelected 
                                    ? 'bg-white border-white' 
                                    : 'border-white bg-transparent hover:bg-white/10'
                                }`}
                            >
                                {isAllSelected && <Check size={14} className="text-[#343868]" strokeWidth={3} />}
                            </div>
                            <span className="text-base font-medium text-white group-hover:text-gray-200 transition-colors">Select All</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3 mb-6 z-10">
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#343b85]" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-[#343b85] bg-white shadow-lg"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#343b85] text-sm font-semibold shadow-lg hover:bg-gray-50 transition-all">
                        <SlidersHorizontal size={18} />
                        Filter
                    </button>
                </div>

                {/* Content Area */}
                {filteredBooks.length > 0 ? (
                    <div 
                        className="flex-1 overflow-y-auto custom-scrollbar pr-2 z-10 space-y-4 min-h-0"
                        onScroll={() => setActiveBookMenu(null)} // Close menu on scroll
                    >
                        {filteredBooks.map((book, index) => {
                            const isBookEditing = editingBookId === book.id;
                            const isSelected = selectedBooks.includes(book.id);
                            
                            return (
                                <div 
                                    key={book.id} 
                                    className="flex items-center gap-4 group" // Flex container for Checkbox + Card
                                >
                                    {/* Checkbox Outside Card - Visible only on Select */}
                                    <div 
                                        className={`transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden
                                            ${selectedBooks.length > 0 ? 'w-8 opacity-100 mr-2' : 'w-0 opacity-0'}
                                        `}
                                        onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id); }}
                                    >   
                                        <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors flex-shrink-0
                                            ${isSelected 
                                                ? 'bg-white border-white' 
                                                : 'border-white hover:bg-white/10'
                                            }`}
                                        >
                                            {isSelected && <Check size={14} className="text-[#343868]" strokeWidth={3} />}
                                        </div>
                                    </div>
                                    
                                    {/* The Card */}
                                    <div 
                                        onDoubleClick={() => toggleBookSelection(book.id)}
                                        className="w-full bg-white rounded-xl p-3 flex gap-4 items-center shadow-lg relative transition-all duration-200 hover:scale-[1.01]"
                                    >
                                    {/* Thumbnail */}
                                    <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                        <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-between h-24 py-1">
                                        {/* Header Row */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {isBookEditing ? (
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        value={tempBookTitle} 
                                                        onChange={(e) => setTempBookTitle(e.target.value)}
                                                        onBlur={saveBookEdit}
                                                        onKeyDown={handleBookKeyDown}
                                                        className="text-lg font-bold text-gray-900 border-b border-blue-500 focus:outline-none mb-1 w-64"
                                                    />
                                                ) : (
                                                    <h3 className="text-lg font-bold text-gray-900">{book.title}</h3>
                                                )}
                                                <p className="text-xs text-gray-500 font-medium">{book.pages} Pages</p>
                                            </div>
                                            <div className="flex gap-6 text-[10px] text-gray-400 font-medium">
                                                <span>Created on : {book.created}</span>
                                                <span>Views : {book.views}</span>
                                                <span>Size : {book.size}</span>
                                            </div>
                                        </div>

                                        {/* Action Row */}
                                        <div className="flex items-center justify-between w-full mt-auto pt-2">
                                            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                                                <Eye size={14} /> View Book
                                            </button>
                                            <button className="flex items-center gap-1.5 text-xs font-semibold text-[#4c5add] hover:text-[#3f4bc0] transition-colors">
                                                <Wrench size={14} /> Customize
                                            </button>
                                            <Link to="/editor" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                                                <PenTool size={14} /> Open in Editor
                                            </Link>
                                            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                                <BarChart2 size={14} /> Statistic
                                            </button>
                                            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                                <Share2 size={14} /> Share
                                            </button>
                                            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                                <Download size={14} /> Download
                                            </button>

                                            {/* More Options */}
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Calculate position
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const screenHeight = window.innerHeight;
                                                        const spaceBelow = screenHeight - rect.bottom;
                                                        const menuHeight = 160; // Approx height
                                                        
                                                        // Determine if we should show above or below
                                                        const showAbove = spaceBelow < menuHeight;
                                                        
                                                        setMenuPosition({
                                                            top: showAbove ? (rect.top - 5) : (rect.bottom + 5),
                                                            left: rect.right,
                                                            isDropup: showAbove,
                                                            activeId: book.id
                                                        });
                                                        
                                                        setActiveBookMenu(activeBookMenu === book.id ? null : book.id);
                                                    }}
                                                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                                                >
                                                    <MoreVertical size={16} /> More
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State - Perfectly Centered */
                    <div className="flex-1 flex flex-col items-center justify-center text-center z-10 pb-12">
                        <div 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                        >
                            <Plus size={32} className="text-white" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-1">Create Flipbook</h3>
                        <p className="text-white/50 text-sm">There are No Recent Books in {activeFolder}</p>
                    </div>
                )}

                {/* Decorative blob inside card */}
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#4c5add] rounded-full blur-[80px] opacity-50 pointer-events-none"></div>
           </div>
      </main>

      {/* Fixed Book Menu Portal */}
      {activeBookMenu && (
        <>
            <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveBookMenu(null); }}></div>
            <div 
                className="fixed z-[101] w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                style={{
                    top: menuPosition.top,
                    left: menuPosition.left,
                    transform: menuPosition.isDropup ? 'translate(-100%, -100%)' : 'translate(-100%, 0)'
                }}
            >
                {/* Find active book */}
                {(() => {
                    const book = books.find(b => b.id === activeBookMenu);
                    if (!book) return null;
                    return (
                        <>
                            <button 
                                onClick={() => startEditingBook(book)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                            >
                                <Edit2 size={14} className="group-hover:text-white" />
                                Rename
                            </button>
                            <button 
                                onClick={() => handleMoveBookClick(book)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                            >
                                <FolderInput size={14} className="group-hover:text-white" />
                                Move to folder
                            </button>
                            <button 
                                onClick={() => handleDuplicateBook(book)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                            >
                                <Plus size={14} className="border border-current rounded-[3px] p-[1px] group-hover:border-white" />
                                Duplicate
                            </button>
                            <button 
                                onClick={() => handleDeleteBookClick(book)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors group"
                            >
                                <Trash2 size={14} className="group-hover:text-white" />
                                Delete
                            </button>
                        </>
                    );
                })()}
            </div>
        </>
      )}

      <CreateFolderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateFolder} 
      />

      {/* Move Book Modal - Simple Implementation */}
      {moveBookModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#343868]">Move to Folder</h3>
                      {!isCreatingInMove && (
                        <button
                            onClick={() => setIsCreatingInMove(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-gray-600 font-medium text-xs bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Plus size={14} /> Folder
                        </button>
                      )}
                  </div>
                  
                  <div 
                    ref={moveModalListRef}
                    className="space-y-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar p-1 scroll-smooth"
                  >
                        {folders.map(f => (
                            <button
                                key={f.id}
                                onClick={() => confirmMoveBook(f.name)}
                                disabled={f.name === activeFolder}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                                    ${f.name === activeFolder 
                                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#3b4190] hover:bg-blue-50 hover:text-[#3b4190]'
                                    }
                                `}
                            >
                                <Folder size={18} />
                                {f.name}
                            </button>
                        ))}

                        {/* Input Field at Bottom */}
                        {isCreatingInMove && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-full flex items-center gap-2 p-1 rounded-xl border border-[#3b4190] bg-[#3b4190]/5">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="New folder name..."
                                        value={newMoveFolderName}
                                        onChange={(e) => setNewMoveFolderName(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-transparent text-sm font-medium focus:outline-none text-[#343868] placeholder-gray-400"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolderAndMove()}
                                    />
                                    <button 
                                        onClick={handleCreateFolderAndMove}
                                        disabled={!newMoveFolderName.trim()}
                                        className="p-2 bg-[#3b4190] text-white rounded-lg hover:bg-[#2f3575] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                  </div>

                  <button 
                    onClick={() => {
                        setMoveBookModal({ isOpen: false, bookId: null });
                        setIsCreatingInMove(false);
                        setNewMoveFolderName('');
                    }}
                    className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                      Cancel
                  </button>
              </div>
          </div>
      )}

      {/* Folder Delete Alert */}
      <AlertModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' })}
        onConfirm={confirmDelete}
        type="error"
        title="Delete Folder"
        message={`Are you sure you want to delete "${deleteConfirmation.folderName}"? This action cannot be undone.`}
        showCancel={true}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Book Delete Alert */}
      <AlertModal
        isOpen={deleteBookConfirmation.isOpen}
        onClose={() => setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' })}
        onConfirm={confirmDeleteBook}
        type="error"
        title={deleteBookConfirmation.bookId === 'BULK' ? "Delete Multiple Flipbooks" : "Delete Flipbook"}
        message={`Are you sure you want to delete "${deleteBookConfirmation.bookTitle}"? This action cannot be undone.`}
        showCancel={true}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Create Flipbook Modal */}
      <CreateFlipbookModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUpload={handleUploadPDF}
        onTemplate={handleUseTemplate}
      />
    </div>
  );
}