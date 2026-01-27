import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Folder, Plus, ArrowLeft, Search, MoreVertical, Trash2, Edit2, Copy, Eye, Wrench, PenTool, BarChart2, Share2, Download, FolderInput, SlidersHorizontal, CheckSquare, Check } from 'lucide-react';
import DashboardBg from '../assets/images/myflipbook.png';

import CreateFolderModal from '../components/CreateFolderModal';
import AlertModal from '../components/AlertModal';
import CreateFlipbookModal from '../components/CreateFlipbookModal';

export default function MyFlipbooks() {
  const navigate = useNavigate();
  
  // User Data
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const emailId = user?.emailId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const [activeFolder, setActiveFolder] = useState(() => localStorage.getItem('last_active_folder') || 'Recent Book');
  
  // Persist Active Folder
  useEffect(() => {
    localStorage.setItem('last_active_folder', activeFolder);
  }, [activeFolder]);
  const [folders, setFolders] = useState([]);
  const [books, setBooks] = useState([]);

  // Data Fetching
  const fetchData = async () => {
      if (!emailId) return;
      setIsLoading(true);
      try {
          // Fetch Folders
          const folderRes = await axios.get(`${backendUrl}/api/flipbook/folders`, { params: { emailId } });
          let folderNames = folderRes.data.folders || [];
          
          // Ensure Recent Book is at the top
          folderNames = folderNames.sort((a, b) => {
              if (a === 'Recent Book') return -1;
              if (b === 'Recent Book') return 1;
              return a.localeCompare(b);
          });
          
          setFolders(folderNames.map(name => ({ id: name, name })));

          // Fetch Books
          const booksRes = await axios.get(`${backendUrl}/api/flipbook/list`, { params: { emailId } });
          setBooks(booksRes.data.books || []);
      } catch (error) {
          console.error("Error fetching data:", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [emailId]);

  useEffect(() => {
      setSelectedBooks([]);
  }, [activeFolder]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState({
      isOpen: false,
      title: '',
      message: '',
      type: 'error',
      showCancel: false,
      onConfirm: null
  });

  const showAlert = (title, message, type = 'error') => {
      setAlertState({
          isOpen: true,
          title,
          message,
          type,
          showCancel: false,
          onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
      });
  };

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

  // Create Folder
  const handleCreateFolder = async (name) => {
    setIsLoading(true);
    try {
        await axios.post(`${backendUrl}/api/flipbook/folder/create`, { emailId, folderName: name });
        await fetchData();
        setActiveFolder(name);
    } catch (err) { 
        console.error(err);
        showAlert('Create Failed', err.response?.data?.message || err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const startEditing = (folder) => {
    setEditingId(folder.id);
    setTempName(folder.name);
  };

  const saveEdit = async () => {
    if (!editingId || !tempName.trim()) {
        setEditingId(null);
        return;
    }

    const folder = folders.find(f => f.id === editingId);
    if (!folder || folder.name === tempName.trim()) {
        setEditingId(null);
        return;
    }

    setIsLoading(true);
    try {
        await axios.post(`${backendUrl}/api/flipbook/folder/rename`, { 
            emailId, 
            oldName: folder.name, 
            newName: tempName.trim() 
        });
        if (activeFolder === folder.name) setActiveFolder(tempName.trim());
        await fetchData();
    } catch (err) { 
        console.error(err);
        const msg = err.response?.status === 409 ? 'Folder name already exists.' : (err.response?.data?.message || err.message);
        showAlert('Rename Failed', msg);
    } finally {
        setIsLoading(false);
        setEditingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
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

  const confirmDelete = async () => {
    if (deleteConfirmation.folderId) {
       setIsLoading(true);
       try {
             await axios.delete(`${backendUrl}/api/flipbook/folder`, { 
                data: { emailId, folderName: deleteConfirmation.folderName } 
             });
             
             if (activeFolder === deleteConfirmation.folderName) setActiveFolder('Recent Book');
             await fetchData();
       } catch (err) { 
           console.error(err);
           showAlert('Delete Failed', err.response?.data?.message || err.message);
       } finally {
           setIsLoading(false);
       }
    }
    setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' });
  };

  const handleDuplicateFolder = async (folder) => {
    setActiveMenuId(null);
    setIsLoading(true);
    try {
        const res = await axios.post(`${backendUrl}/api/flipbook/folder/duplicate`, {
            emailId, folderName: folder.name
        });
        const newName = res.data.newFolderName;
        
        await fetchData(); 

        startEditing({ id: newName, name: newName });
        
    } catch(err) { 
        console.error(err);
        showAlert('Duplicate Failed', err.response?.data?.message || err.message);
    } finally {
        setIsLoading(false);
    }
  };

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

  const handleDuplicateBook = async (book) => {
    setActiveBookMenu(null);
    setIsLoading(true);
    try {
        const res = await axios.post(`${backendUrl}/api/flipbook/duplicate`, {
             emailId, 
             folderName: book.folder, 
             bookName: book.realName 
        });
        const newName = res.data.newBookName;
        await fetchData();
        
        const newId = `${book.folder}_${newName}`;
        startEditingBook({ id: newId, title: newName, folder: book.folder, realName: newName });

    } catch(err) { 
        console.error(err); 
        showAlert('Duplicate Failed', err.response?.data?.message || err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRemoveFromRecent = async (book) => {
      setActiveBookMenu(null);
      setIsLoading(true);
      try {
          await axios.post(`${backendUrl}/api/flipbook/remove-recent`, {
              emailId,
              bookName: book.realName
          });
          await fetchData();
      } catch(err) {
          console.error(err);
          showAlert('Remove Failed', err.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteBookClick = (book) => {
    setActiveBookMenu(null);
    setDeleteBookConfirmation({
      isOpen: true,
      bookId: book.id,
      bookTitle: book.title
    });
  };

  const confirmDeleteBook = async () => {
    setIsLoading(true);
    try {
        const isRecent = activeFolder === 'Recent Book';
        const endpoint = isRecent ? `${backendUrl}/api/flipbook/remove-recent` : `${backendUrl}/api/flipbook/delete`;

        if (deleteBookConfirmation.bookId === 'BULK') {
             await Promise.all(selectedBooks.map(bookId => {
                 const book = books.find(b => b.id === bookId);
                 if (book) {
                     if (isRecent) {
                         return axios.post(endpoint, {
                             emailId,
                             bookName: book.realName
                         });
                     } else {
                         return axios.delete(endpoint, {
                             data: { emailId, folderName: book.folder, bookName: book.realName }
                         });
                     }
                 }
                 return Promise.resolve();
             }));
             setSelectedBooks([]);
        } else if (deleteBookConfirmation.bookId) {
             const book = books.find(b => b.id === deleteBookConfirmation.bookId);
             if (book) {
                  if (isRecent) {
                       await axios.post(endpoint, { emailId, bookName: book.realName });
                  } else {
                       await axios.delete(endpoint, {
                           data: { emailId, folderName: book.folder, bookName: book.realName }
                       });
                  }
             }
             setSelectedBooks(prev => prev.filter(id => id !== deleteBookConfirmation.bookId));
        }
        await fetchData();
    } catch(err) { 
        console.error(err); 
        showAlert('Delete Failed', err.response?.data?.message || err.message);
    } finally {
        setIsLoading(false);
        setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' });
    }
  };

  const startEditingBook = (book) => {
    setActiveBookMenu(null);
    setEditingBookId(book.id);
    setTempBookTitle(book.title);
  };

  const saveBookEdit = async () => {
    if (editingBookId && tempBookTitle.trim()) {
        const book = books.find(b => b.id === editingBookId);
        if (book && book.title !== tempBookTitle.trim()) {
             setIsLoading(true);
             try {
                   await axios.post(`${backendUrl}/api/flipbook/rename`, {
                          emailId,
                          folderName: book.folder,
                          oldName: book.realName,
                          newName: tempBookTitle.trim()
                   });
                   await fetchData();
              } catch(err) { 
                  console.error(err); 
                  const msg = err.response?.status === 409 ? 'Flipbook name already exists.' : (err.response?.data?.message || err.message);
                  showAlert('Rename Failed', msg);
              } finally {
                  setIsLoading(false);
              }
        }
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

  const confirmMoveBook = async (targetFolder) => {
     try {
          if (moveBookModal.bookId === 'BULK') {
              for (const bookId of selectedBooks) {
                  const book = books.find(b => b.id === bookId);
                  if (book) {
                      await axios.post(`${backendUrl}/api/flipbook/move`, {
                          emailId,
                          bookName: book.realName,
                          currentFolder: book.folder,
                          targetFolder
                      });
                  }
              }
              setSelectedBooks([]);
              setActiveFolder(targetFolder); 
          } else if (moveBookModal.bookId) {
              const book = books.find(b => b.id === moveBookModal.bookId);
               if (book) {
                      await axios.post(`${backendUrl}/api/flipbook/move`, {
                          emailId,
                          bookName: book.realName,
                          currentFolder: book.folder,
                          targetFolder
                      });
               }
          }
          await fetchData();
      } catch(err) { console.log(err); }
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

  const handleCreateFolderAndMove = async () => {
    if (!newMoveFolderName.trim()) return;
    const name = newMoveFolderName.trim();
    try {
          await axios.post(`${backendUrl}/api/flipbook/folder/create`, { emailId, folderName: name });
          await confirmMoveBook(name);
    } catch (err) { console.error(err); }
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
                          {folder.name !== 'Recent Book' && (
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
                          )}

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
                                    <Trash2 size={16} /> {activeFolder === 'Recent Book' ? 'Remove' : 'Delete'}
                                </button>
                                {activeFolder !== 'Recent Book' && (
                                    <button 
                                        onClick={handleBulkMove}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#4c5add] text-white rounded-lg hover:bg-[#3f4bc0] transition-colors shadow-sm text-sm font-semibold"
                                    >
                                        <FolderInput size={16} /> Move to Folder
                                    </button>
                                )}
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
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
                        <p className="text-white/80 mt-4 font-medium text-sm">Loading Flipbooks...</p>
                    </div>
                ) : filteredBooks.length > 0 ? (
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
                                        <img src={"https://plus.unsplash.com/premium_photo-1677567996070-68fa4181775a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Ym9va3N8ZW58MHx8MHx8fDA%3D"} alt={book.title} className="w-full h-full object-cover" />
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
                                            <button 
                                                onClick={() => {
                                                    let targetFolder = book.folder;
                                                    if (targetFolder === 'Recent Book') {
                                                        const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                                        if (physicalBook) targetFolder = physicalBook.folder;
                                                    }
                                                    navigate('/editor', { state: { loadBook: { folder: targetFolder, name: book.realName } } });
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                                            >
                                                <PenTool size={14} /> Open in Editor
                                            </button>
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
                        {activeFolder === 'Recent Book' ? (
                            <>
                                <div 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                                >
                                    <Plus size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-1">Create Flipbook</h3>
                                <p className="text-white/50 text-sm">There are no flipbooks in {activeFolder}</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                                    <Folder size={32} className="text-white/50" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-1">No Flipbooks Found</h3>
                                <p className="text-white/50 text-sm">This folder is empty</p>
                            </>
                        )}
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
                            {activeFolder !== 'Recent Book' && (
                                <button 
                                    onClick={() => handleDuplicateBook(book)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group"
                                >
                                    <Plus size={14} className="border border-current rounded-[3px] p-[1px] group-hover:border-white" />
                                    Duplicate
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    if (activeFolder === 'Recent Book') {
                                        handleRemoveFromRecent(book);
                                    } else {
                                        handleDeleteBookClick(book);
                                    }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors group"
                            >
                                <Trash2 size={14} className="group-hover:text-white" />
                                {activeFolder === 'Recent Book' ? 'Remove' : 'Delete'}
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

      {/* Move Book Modal */}
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
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1 mb-4 scroll-smooth" ref={moveModalListRef}>
                       {/* Create Folder Input */}
                      {isCreatingInMove && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="block text-xs font-medium text-gray-500 mb-1">New Folder Name</label>
                              <div className="w-full flex items-center gap-2 p-1 rounded-xl border border-[#3b4190] bg-[#3b4190]/5 mb-2">
                                  <input 
                                      autoFocus
                                      type="text" 
                                      placeholder="Enter folder name..."
                                      value={newMoveFolderName}
                                      onChange={(e) => setNewMoveFolderName(e.target.value)}
                                      className="flex-1 px-3 py-2 bg-transparent text-sm font-medium focus:outline-none text-[#343868] placeholder-gray-400"
                                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolderAndMove()}
                                  />
                                  <button onClick={handleCreateFolderAndMove} className="p-2 bg-[#3b4190] text-white rounded-lg hover:bg-[#2f3575]">
                                     <Check size={16} />
                                  </button>
                              </div>
                          </div>
                      )}

                       {folders.filter(f => f.name !== 'Recent Book').map(folder => {
                           let isCurrent = false;

                           if (moveBookModal.bookId === 'BULK') {
                               if (activeFolder !== 'Recent Book') {
                                   isCurrent = folder.name === activeFolder;
                               }
                           } else {
                               const book = books.find(b => b.id === moveBookModal.bookId);
                               if (book) {
                                   let currentRealFolder = book.folder;
                                   if (book.folder === 'Recent Book') {
                                       const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                       if (physicalBook) currentRealFolder = physicalBook.folder;
                                   }
                                   isCurrent = folder.name === currentRealFolder;
                               }
                           }

                           return (
                               <button
                                   key={folder.id}
                                   onClick={() => confirmMoveBook(folder.name)}
                                   disabled={isCurrent}
                                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all group text-left
                                       ${isCurrent
                                           ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                           : 'bg-white border-gray-200 text-gray-700 hover:border-[#3b4190] hover:bg-blue-50/50 hover:text-[#3b4190]'
                                       }
                                   `}
                               >
                                   <Folder size={18} className={isCurrent ? "text-gray-300" : "text-gray-400 group-hover:text-[#3b4190]"} />
                                   <span className="truncate">{folder.name}</span>
                                   {isCurrent && <span className="ml-auto text-xs text-gray-400">(Current)</span>}
                               </button>
                           );
                       })}
                  </div>

                  <button 
                      onClick={() => {
                          setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <p className="text-white font-medium text-lg">Processing...</p>
             </div>
        </div>
      )}

      {/* Generic Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
}