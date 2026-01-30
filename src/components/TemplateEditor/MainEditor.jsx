// MainEditor.jsx - Updated Prop Passing for Double Page & Preview
import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useOutletContext, useParams, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { Folder, Plus, Check } from 'lucide-react';
// Navbar removed
import ExportModal from '../ExportModal';
import LeftSidebar from './LeftSidebar';
import TopToolbar from './TopToolbar';
import TemplateModal from './TemplateModal';
import HTMLTemplateEditor from './HTMLTemplateEditor';
import FlipbookPreview from './FlipbookPreview';
import RightSidebar from './RightSidebar';
import PopupPreview from './PopupPreview';
import AlertModal from '../AlertModal';
import useZoom from '../../hooks/useZoom';
import useDeviceDetection from '../../hooks/useDeviceDetection';
import useThumbnail from '../../hooks/useThumbnail';
import useHistory from '../../hooks/useHistory';
import usePreventBrowserZoom from '../../hooks/usePreventBrowserZoom';

const MainEditor = () => {
  // ==================== REFS ====================
  const editorContainerRef = useRef(null);
  const htmlEditorRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isPotentialDragRef = useRef(false);
  const panStartPosRef = useRef({ x: 0, y: 0 });
  const modalListRef = useRef(null);
  
  // ==================== HOOKS ====================
  usePreventBrowserZoom(); // Block default browser zoom globally
  const deviceInfo = useDeviceDetection();
  const { zoom, zoomIn, zoomOut, setZoomLevel, fitToScreen } = useZoom(60, editorContainerRef);
  const { generateThumbnail, getThumbnail } = useThumbnail();
  const { canUndo, canRedo, undo, redo, saveToHistory } = useHistory();

  // React Router
  const { folder: paramFolder, v_id: paramVId, id: paramId } = useParams();
  const navigate = useNavigate();
  
  // ==================== STATE ====================
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPageSettingsMenu, setShowPageSettingsMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  // Hook up to Layout Navbar Export and Save buttons
  const { setExportHandler, setSaveHandler, setHasUnsavedChanges, triggerSaveSuccess, isAutoSaveEnabled } = useOutletContext() || {};
  
  // Add isDirtyRef to track dirty state locally for auto-save
  const isDirtyRef = useRef(false);
  const autoSaveTimerRef = useRef(null);
  


  // Export logic moved below state declarations to ensure all variables are accessible
  
  // Template state
  // Template state
  const location = useLocation();
  const initialData = location.state || {}; // React Router state

  // Restore state logic
  const getRestoredState = (key, defaultValue) => {
      // If we are loading a specific book or template via navigation, ignore autosave for initial render
      // (The useEffect will handle loading the new content)
      if (initialData.loadBook || initialData.templateData || initialData.pageCount) return defaultValue;

      const autosave = localStorage.getItem('editor_autosave');
      if (autosave) {
          try {
              const parsed = JSON.parse(autosave);
              return parsed[key] !== undefined ? parsed[key] : defaultValue;
          } catch (e) { return defaultValue; }
      }
      return defaultValue;
  };

  const [templateHTML, setTemplateHTML] = useState('');
  const [pages, setPages] = useState(() => {
     // If explicit new template creation
     if (initialData.pageCount) {
         return Array.from({ length: initialData.pageCount }, (_, i) => ({
             id: i + 1,
             v_id: 'page_' + Math.random().toString(36).substr(2, 9),
             name: `Page ${i + 1}`,
             html: '',
             thumbnail: null
         }));
     }
     // Handle Template Data
     if (initialData.templateData) {
         const tplPages = initialData.templateData.pages || (Array.isArray(initialData.templateData) ? initialData.templateData : []);
         if (tplPages.length > 0) {
             return tplPages.map((p, i) => ({
                 id: i + 1,
                 v_id: p.v_id || 'page_' + Math.random().toString(36).substr(2, 9),
                 name: p.name || `Page ${i + 1}`,
                 html: p.html || '',
                 thumbnail: null
             }));
         }
     }
     return getRestoredState('pages', [{ 
       id: 1, 
       v_id: 'page_' + Math.random().toString(36).substr(2, 9),
       name: 'Page 1', 
       html: '',
       thumbnail: null 
     }]);
  });
  const [currentPage, setCurrentPage] = useState(() => getRestoredState('currentPage', 0));
  
  // Editor state
  const [pageName, setPageName] = useState(() => getRestoredState('pageName', "Untitled Document"));
  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [isDoublePage, setIsDoublePage] = useState(() => getRestoredState('isDoublePage', false));
  
  // Track the last successfully saved name
  const [lastSavedName, setLastSavedName] = useState(() => getRestoredState('lastSavedName', null));
  const [lastSavedFolder, setLastSavedFolder] = useState(() => getRestoredState('lastSavedFolder', 'Recent Book'));
  const [currentVId, setCurrentVId] = useState(() => getRestoredState('currentVId', null));

  // Panning State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Element selection state
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElementType, setSelectedElementType] = useState(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(null);

  // Page renaming state (for auto-rename after add/duplicate)
  const [editingPageId, setEditingPageId] = useState(null);
  
  // Menu expansion state for Double Page view
  const [expandedMenuAction, setExpandedMenuAction] = useState(null);

  const markAsDirty = useCallback(() => {
      isDirtyRef.current = true;
      if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [setHasUnsavedChanges]);

  // Sync templateHTML with current page content on load/change/refresh
  useEffect(() => {
     if (pages[currentPage]) {
         // Only update if different to avoid unnecessary re-renders
         if (pages[currentPage].html !== templateHTML) {
             setTemplateHTML(pages[currentPage].html || '');
         }
     }
  }, [currentPage, pages]);

  // Mark as dirty when creating a NEW flipbook (from Page Count or Template)
  useEffect(() => {
      if (initialData.pageCount || initialData.templateData) {
          // Small timeout to ensure context is ready and initial render is done
          setTimeout(markAsDirty, 100);
      }
  }, [initialData, markAsDirty]);

  // Initial Auto-Save for New Flipbooks (Standardize default save)
  useEffect(() => {
    const handleInitialSave = async () => {
        // Only if AutoSave is ON, we are creating a NEW book, and haven't saved yet
        if (isAutoSaveEnabled && !initialData.loadBook && !lastSavedName && (initialData.pageCount || initialData.templateData)) {
             try {
                 // Generate Unique Name: Flipbook_YYYYMMDD_HHMMSS
                 const now = new Date();
                 const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); // Compact timestamp
                 const uniqueName = `Flipbook_${timeString}`;
                 const defaultFolder = 'My Flipbooks';
                 
                 // Update state to reflect this decision
                 setPageName(uniqueName);
                 setLastSavedFolder(defaultFolder);
                 
                 // Execute immediate save (overwrite=true because it's new, silent=true)
                 // We need to pass the explicit name/folder because state updates are async
                 if (executeSave) {
                     if (pages.length > 0) {
                         // We are inside useEffect[pages...], so pages is fresh.
                         await executeSave(defaultFolder, true, true, uniqueName); 
                     }
                 }
             } catch (e) {
                 console.error("Initial auto-save failed", e);
             }
        }
    };
    
    // Debounce slightly to ensure initialization
    const timer = setTimeout(handleInitialSave, 500);
    return () => clearTimeout(timer);
  }, [isAutoSaveEnabled, initialData, lastSavedName, pages.length, navigate]); // Run once when these stabilize

  // Auto-save state on change
  useEffect(() => {
      if (pages.length > 0) {
          const stateToSave = {
              pages,
              currentPage,
              pageName,
              isDoublePage,
              lastSavedName,
              lastSavedFolder,
              currentVId,
              timestamp: Date.now()
          };
          localStorage.setItem('editor_autosave', JSON.stringify(stateToSave));
      }
  }, [pages, currentPage, pageName, isDoublePage, lastSavedName, lastSavedFolder, currentVId]);

 

  // Clear history for New Template / Page Count to allow autosave on refresh
  useEffect(() => {
     if (initialData.templateData || initialData.pageCount) {
         window.history.replaceState({}, document.title);
     }
  }, [initialData]);



  // Load Book Logic (Open in Editor from URL or State)
  useEffect(() => {
    // Determine source: URL Params > Location State
    const targetFolder = paramFolder ? decodeURIComponent(paramFolder) : initialData.loadBook?.folder;
    // paramVId is the 2nd segment in /editor/Folder/v_id
    const targetVal = paramVId ? decodeURIComponent(paramVId) : initialData.loadBook?.name;
    const targetId = paramId; // Distinct /editor/:id route
    if ((targetFolder && targetVal) || targetId) {
        const loadBook = async () => {
             setLoadingText('Loading Book...');
             setIsLoading(true);
             try {
                 const storedUser = localStorage.getItem('user');
                 if (!storedUser) return;
                 const user = JSON.parse(storedUser);
                 const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                 
                 let res;
                 let loadedByName = false;
                 
                 // Strategy: Try loading by ID (v_id) first.
                 // targetVal (from URL) might be an ID or a Book Name.
                 // paramId (from specific route) is definitely an ID.
                 const idToTry = paramId || targetVal;

                 try {
                     res = await axios.get(`${backendUrl}/api/flipbook/get`, {
                         params: { emailId: user.emailId, v_id: idToTry }
                     });
                 } catch (idErr) {
                     // If ID lookup failed (404) AND we have a folder context (and no specific paramId), try Name lookup
                     // This supports legacy URLs: /editor/Folder/My%20Book
                     if (targetFolder && targetVal && !paramId) {
                         res = await axios.get(`${backendUrl}/api/flipbook/get`, {
                             params: { emailId: user.emailId, folderName: targetFolder, bookName: targetVal }
                         });
                         loadedByName = true;
                     } else {
                         throw idErr; // Propagate real error (Not Found)
                     }
                 }
                 
                 if (res && res.data.pages && res.data.pages.length > 0) {
                      const loadedPages = res.data.pages.map((p, i) => ({
                          id: i + 1,
                          v_id: p.v_id,
                          name: p.name || `Page ${i + 1}`,
                          html: p.html,
                          thumbnail: null
                      }));
                      setPages(loadedPages);
                      
                      const meta = res.data.meta || {};
                      const resolvedName = meta.flipbookName || (loadedByName ? targetVal : "Untitled");
                      const resolvedFolder = meta.folderName || (loadedByName ? targetFolder : "My Flipbooks");

                      if (loadedByName && meta.v_id) {
                           // Enforce v_id in URL
                           navigate(`/editor/${encodeURIComponent(resolvedFolder)}/${meta.v_id}`, { replace: true });
                           return;
                      }

                      setPageName(resolvedName);
                      setLastSavedName(resolvedName);
                      setLastSavedFolder(resolvedFolder);
                      setCurrentVId(meta.v_id || null);
                      setCurrentPage(0);
                      
                      // Clear dirty state
                      isDirtyRef.current = false;
                 }
             } catch (err) {
                 console.error("Failed to load book", err);
                 // Show error as requested
                 showAlert('error', 'Flipbook Not Found', 'The requested flipbook could not be found. Please check the URL.');
                 // Optional: Redirect to home? 
                 // navigate('/'); 
             } finally {
                 setIsLoading(false);
             }
        };
        loadBook();
    }
  }, [paramFolder, paramVId, paramId, initialData.loadBook]);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [targetFolder, setTargetFolder] = useState(''); // Default empty to force selection
  const [availableFolders, setAvailableFolders] = useState(['Public Book']);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Fetch folders when modal opens
  useEffect(() => {
    if (showSaveModal) {
        setTargetFolder(''); // Reset selection
        setIsCreatingFolder(false);
        setNewFolderInput('');

        const fetchFolders = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                    const res = await axios.get(`${backendUrl}/api/flipbook/folders`, {
                        params: { emailId: user.emailId }
                    });
                    if (res.data.folders) {
                        setAvailableFolders(res.data.folders);
                        
                        // Auto-switch to "Create Folder" if no valid folders exist
                        const validFolders = res.data.folders.filter(f => f !== 'Recent Book');
                        if (validFolders.length === 0) {
                            setIsCreatingFolder(true);
                            setNewFolderInput('My Flipbooks');
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch folders", err);
            }
        };
        fetchFolders();
    }
  }, [showSaveModal]);

  // Scroll to bottom when creating folder
  useEffect(() => {
    if (isCreatingFolder && modalListRef.current) {
        modalListRef.current.scrollTo({
            top: modalListRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [isCreatingFolder]);

  // Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'Okay',
    cancelText: 'Cancel',
    onConfirm: null
  });



  const [popupPreview, setPopupPreview] = useState({
    isOpen: false,
    content: '',
    elementType: 'text',
    elementSource: '',
    styles: {}
  });

  const [closePanelsSignal, setClosePanelsSignal] = useState(0);

  // Memoize flipbook pages at top level to follow Rules of Hooks
  const flipbookPages = React.useMemo(() => pages.map(p => p.html), [pages]);

  const handlePopupPreviewUpdate = useCallback((data) => {
    setPopupPreview(prev => ({
      ...prev,
      isOpen: data.isOpen,
      content: data.content !== undefined ? data.content : prev.content,
      elementType: data.elementType || prev.elementType,
      elementSource: data.elementSource || prev.elementSource,
      styles: data.styles ? { ...prev.styles, ...data.styles } : prev.styles
    }));
  }, []);

  const showAlert = useCallback((type, title, message, options = {}) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      showCancel: options.showCancel || false,
      confirmText: options.confirmText || 'Okay',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || null
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // ==================== SAVE & EXPORT HANDLERS ====================
  // Refs for handlers to avoid stale closures in context
  const saveHandlerRef = useRef(null);
  const exportHandlerRef = useRef(null);

  const executeSave = useCallback(async (folderName, overwrite = false, silent = false, overrideName = null) => {
    // Determine the name to save as (use override if provided, else current state)
    const nameToSave = overrideName || pageName;
    
    if (!silent) {
        setShowSaveModal(false); // Close modal immediately for better UX
        setLoadingText('Saving...');
        setIsLoading(true);
    }
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
         if (!silent) showAlert('error', 'Authentication Error', 'User not found. Please log in again.');
         return;
      }
      const user = JSON.parse(storedUser);
      const emailId = user.emailId;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      // If we are saving the same flipbook we just saved/confirmed, auto-overwrite
      let shouldOverwrite = overwrite;
      
      // RENAME LOGIC: If saving exiting book to same folder with DIFFERENT name
      // Normalize strings for comparison (handle simple mismatches)
      const isSameFolder = lastSavedFolder && folderName && (lastSavedFolder.trim().toLowerCase() === folderName.trim().toLowerCase());
      const isNameChanged = lastSavedName && (nameToSave.trim() !== lastSavedName.trim());

      if (!overwrite && isSameFolder && isNameChanged) {
           // Attempt to rename the directory first
           try {
               await axios.post(`${backendUrl}/api/flipbook/rename`, {
                  emailId,
                  folderName: lastSavedFolder, // Use original casing for reliability
                  oldName: lastSavedName,
                  newName: nameToSave.trim(),
                  v_id: currentVId
               });
               // If rename successful, the "new" name now exists (it's the renamed folder).
               // We must overwrite it with the current content.
               shouldOverwrite = true;
           } catch (renameErr) {
               // If rename fails (e.g. name exists), we fall through to normal save (which handles conflicts)
               // But if it's a conflict, the Save call below will trigger the 409 flow.
               console.warn("Rename attempt failed, falling back to standard save", renameErr);
               // We do NOT set shouldOverwrite to true here, so Save will check existence.
           }
      }

      if (lastSavedName && (nameToSave.trim() === lastSavedName.trim()) && isSameFolder) {
          shouldOverwrite = true;
      }

      // Prepare pages
      const pagesToSave = pages.map(p => ({
          pageName: p.name,
          content: p.html,
          v_id: p.v_id  // Include page v_id to preserve it across renames
      }));
      
      // Reset dirty ref BEFORE async operation to capture any changes made DURING save
      isDirtyRef.current = false;

      const saveRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
          emailId,
          flipbookName: nameToSave.trim(), 
          pages: pagesToSave,
          overwrite: shouldOverwrite,
          folderName: folderName.trim(),
          v_id: paramVId  // Include v_id for rename detection
      });
      
      const savedVId = saveRes.data.v_id;
      
      setLastSavedName(nameToSave);
      setLastSavedFolder(folderName);
      setCurrentVId(savedVId);
      if (setHasUnsavedChanges) setHasUnsavedChanges(false);
      
      // If we used an override name, ensure state matches (though caller usually sets it too)
      if (overrideName && pageName !== overrideName) {
           setPageName(overrideName);
      }
      
      closeAlert(); 
      if (!silent) {
          if (triggerSaveSuccess) {
              triggerSaveSuccess({ name: nameToSave, folder: folderName });
          } else {
              showAlert('success', 'Saved Successfully', `Saved to ${folderName}/${nameToSave}`);
          }
      }
      
// Update URL if name/folder changed during save (e.g. Save As or Rename)
      if (folderName && savedVId) {
           navigate(`/editor/${encodeURIComponent(folderName)}/${savedVId}`, { replace: true });
      } else if (folderName && nameToSave) {
          navigate(`/editor/${encodeURIComponent(folderName)}/${encodeURIComponent(nameToSave)}`, { replace: true });
      }
      
      return savedVId;

    } catch (error) {
      // Restore dirty state on failure so we retry
      isDirtyRef.current = true;
      
      if (!silent && error.response && error.response.status === 409) {
          showAlert('warning', 'Flipbook Exists', 'A flipbook with this name already exists in this folder. Do you want to overwrite it?', {
              showCancel: true,
              confirmText: 'Overwrite',
              cancelText: 'Cancel',
              onConfirm: () => executeSave(folderName, true, false, overrideName)
          });
          return;
      }
      console.error("Save failed:", error);
      if (!silent) showAlert('error', 'Save Failed', `Failed to save flipbook. ${error.response?.data?.message || error.message}`);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [pages, pageName, showAlert, closeAlert, lastSavedName, lastSavedFolder, triggerSaveSuccess, setHasUnsavedChanges]);

  // ==================== AUTO SAVE TO BACKEND ====================
  useEffect(() => {
    // Only auto-save if enabled, we have a context, and we have a previous save (to rename FROM)
    if (isAutoSaveEnabled && lastSavedName && lastSavedFolder) {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        
        autoSaveTimerRef.current = setTimeout(() => {
             const nameChanged = pageName !== lastSavedName;
             // Trigger if content is dirty OR name has changed
             if (isDirtyRef.current || nameChanged) {
                 console.log(`[Auto-save] Triggering save. Dirty: ${isDirtyRef.current}, NameChanged: ${nameChanged}`);
                 // Auto-save silently
                 // If name changed, pass overwrite=false to allow executeSave's rename logic to run
                 // If name same, pass overwrite=true to just save content
                 executeSave(lastSavedFolder, !nameChanged, true);
             }
        }, 2000); // 2 seconds debounce
        
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }
  }, [pages, pageName, lastSavedName, lastSavedFolder, isAutoSaveEnabled, executeSave]);

  const handleSaveFlipbook = useCallback(() => {
     // Quick Save condition: Name hasn't changed AND we have a last saved folder
     if (pageName === lastSavedName && lastSavedFolder) {
         executeSave(lastSavedFolder, true, false);
     } else {
         // Show options to select folder
         setShowSaveModal(true);
     }
  }, [pageName, lastSavedName, lastSavedFolder, executeSave]);
  
  // Keep refs up to date
  useEffect(() => {
    saveHandlerRef.current = handleSaveFlipbook;
  }, [handleSaveFlipbook]);

  useEffect(() => {
    exportHandlerRef.current = () => setShowExportModal(true);
  }, []);

  // Register Handlers Once
  useEffect(() => {
    if (setExportHandler) {
      setExportHandler(() => () => exportHandlerRef.current?.());
    }
    if (setSaveHandler) {
      setSaveHandler(() => () => saveHandlerRef.current?.());
    }
    // Cleanup
    return () => {
        if (setExportHandler) setExportHandler(null);
        if (setSaveHandler) setSaveHandler(null);
    };
  }, [setExportHandler, setSaveHandler]);

  // ==================== EXPORT LOGIC ====================
  const handleDownloadPages = useCallback(async (pagesToExport, format = 'png') => {
      try {
        const PAGE_WIDTH = 595;
        const PAGE_HEIGHT = 842;
        
        // Helper to sanitize filenames
        const sanitizeName = (name) => (name || 'Untitled').replace(/[^a-z0-9 _-]/gi, '_').replace(/\s+/g, '_');
        const bookNameClean = sanitizeName(pageName) || 'Flipbook';

        // Helper to render page to canvas
        const renderPageToCanvas = async (html, scale = 4) => {
             const hiddenFrame = document.createElement('iframe');
             hiddenFrame.style.width = `${PAGE_WIDTH}px`;
             hiddenFrame.style.height = `${PAGE_HEIGHT}px`;
             hiddenFrame.style.position = 'fixed';
             hiddenFrame.style.top = '0';
             hiddenFrame.style.left = '0';
             hiddenFrame.style.zIndex = '-9999';
             hiddenFrame.style.border = 'none';
             document.body.appendChild(hiddenFrame);
             
             const doc = hiddenFrame.contentDocument;
             if (!doc) throw new Error("Could not create iframe document");

             // doc.open() is not strictly needed for iframe contentDocument and can cause issues if not handled perfectly
             // Just writing to it is often safer, or ensuring we wait for load.
             doc.write(html);
             doc.close(); // Essential to finish document parsing
             
             // Inject styles to ensure full page capture and background printing
             const style = doc.createElement('style');
             style.innerHTML = `
                html, body {
                    width: 595px !important;
                    height: 842px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: white !important;
                }
                * {
                   -webkit-print-color-adjust: exact !important;
                   print-color-adjust: exact !important;
                }
             `;
             
             // Safer append: ensure head or body exists, or make one.
             // Writing raw HTML usually creates them.
             if (doc.head) {
                 doc.head.appendChild(style);
             } else if (doc.body) {
                 doc.body.appendChild(style);
             } else {
                 // Extreme fallback
                 const head = doc.createElement('head');
                 doc.documentElement.appendChild(head);
                 head.appendChild(style);
             }

             // doc.close() removed (was duplicate)
             
             // Wait for images/content to load
             await new Promise(resolve => setTimeout(resolve, 1500));
             
             const canvas = await html2canvas(doc.documentElement, {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                x: 0,
                y: 0,
                backgroundColor: '#ffffff'
             });
             
             document.body.removeChild(hiddenFrame);
             return canvas;
        };

        if (format === 'pdf') {
             const pdf = new jsPDF('p', 'pt', [PAGE_WIDTH, PAGE_HEIGHT]);
             
             for (let i = 0; i < pagesToExport.length; i++) {
                 const pageNum = pagesToExport[i];
                 const page = pages.find((p, idx) => (idx + 1) === pageNum);
                 const pageHTML = page?.html || '';
                 
                 const canvas = await renderPageToCanvas(pageHTML, 4);
                 const imgData = canvas.toDataURL('image/jpeg', 0.95);
                 
                 if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                 pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
             }
             
             pdf.save(`${bookNameClean}.pdf`);
             
        } else {
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const ext = format === 'jpg' ? 'jpg' : 'png';

            if (pagesToExport.length === 1) {
              const pageNum = pagesToExport[0];
              const page = pages.find((p, i) => (i + 1) === pageNum);
              const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);
              
              const canvas = await renderPageToCanvas(page?.html || '', 4);
              
              canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, `${bookNameClean}_${pageNameClean}.${ext}`);
                } else {
                    throw new Error("Failed to generate image blob");
                }
              }, mimeType);
              
            } else {
              const zip = new JSZip();
              
              for (const pageNum of pagesToExport) {
                 const page = pages.find((p, i) => (i + 1) === pageNum);
                 const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);
                 
                 const canvas = await renderPageToCanvas(page?.html || '', 4);

                 const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType));
                 if (blob) {
                    zip.file(`${pageNameClean}.${ext}`, blob);
                 }
              }
              
              const content = await zip.generateAsync({ type: 'blob' });
              saveAs(content, `${bookNameClean}.zip`);
            }
        }
      } catch (err) {
        console.error("Export failed:", err);
        showAlert('error', 'Export Failed', `Failed to export pages. ${err.message}`);
      }
    }, [pages, pageName, showAlert]);

  // ==================== HISTORY TRACKING ====================
  useEffect(() => {
    saveToHistory({ pages, currentPage, pageName });
  }, [pages, currentPage, pageName, saveToHistory]);

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setPages(previousState.pages);
      setCurrentPage(previousState.currentPage);
      setPageName(previousState.pageName);
      setTemplateHTML(previousState.pages[previousState.currentPage]?.html || '');
      markAsDirty();
    }
  }, [undo, markAsDirty]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
        setPages(nextState.pages);
        setCurrentPage(nextState.currentPage);
        setPageName(nextState.pageName);
        setTemplateHTML(nextState.pages[nextState.currentPage]?.html || '');
        markAsDirty();
    }
  }, [redo, markAsDirty]);

  // ==================== PANNING LOGIC ====================
  useEffect(() => {
    const handleKeyDown = (e) => {
        const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
        
        // Undo: Ctrl+Z (but not input fields)
        if (e.ctrlKey && e.key === 'z' && !isInput) {
            e.preventDefault();
            handleUndo();
            return;
        }
        
        // Redo: Ctrl+Y or Ctrl+Shift+Z (but not input fields)
        if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z')) && !isInput) {
            e.preventDefault();
            handleRedo();
            return;
        }
        
        // Space key for panning
        if (e.code === 'Space' && !e.repeat && !isInput && !isEditingPageName) {
            e.preventDefault(); 
            setIsSpacePressed(true);
        }
    };
    const handleKeyUp = (e) => {
        if (e.code === 'Space') {
            setIsSpacePressed(false);
            setIsPanning(false);
            isDraggingRef.current = false;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEditingPageName, handleUndo, handleRedo]);

  // Close Page Settings Menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPageSettingsMenu && !e.target.closest('.page-settings-menu')) {
        setShowPageSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPageSettingsMenu]);

  // Reset expanded menu action when menu closes
  useEffect(() => {
    if (!showPageSettingsMenu) {
        setExpandedMenuAction(null);
    }
  }, [showPageSettingsMenu]);

  const handleMouseDown = (e) => {
    // Check for middle click (button 1) or background click
    const isMiddleClick = e.button === 1;
    const isBackgroundClick = e.target === editorContainerRef.current && e.button === 0;
    
    
    // Immediate Pan if Space is held OR Middle Mouse
    if (isSpacePressed || isMiddleClick) {
        setIsPanning(true);
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.screenX, y: e.screenY };
        e.preventDefault(); 
    } else if (isBackgroundClick) {
        // Delayed Pan for Left Click (wait for movement > 5px)
        isPotentialDragRef.current = true;
        panStartPosRef.current = { x: e.screenX, y: e.screenY };
        lastMousePosRef.current = { x: e.screenX, y: e.screenY };
    }
  };

  const handleMouseMove = (e) => {
    // Check threshold for potential drag (Left click background)
    if (isPotentialDragRef.current && !isDraggingRef.current) {
        const dx = e.screenX - panStartPosRef.current.x;
        const dy = e.screenY - panStartPosRef.current.y;
        if (Math.hypot(dx, dy) > 5) {
            setIsPanning(true);
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.screenX, y: e.screenY }; // Sync position to smooth start
        }
    }

    if (isDraggingRef.current && isPanning) {
        const dx = e.screenX - lastMousePosRef.current.x;
        const dy = e.screenY - lastMousePosRef.current.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePosRef.current = { x: e.screenX, y: e.screenY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPotentialDragRef.current = false;
    // Stop panning mode if space is not held
    if (!isSpacePressed) {
        setIsPanning(false);
    }
  };


  // ==================== TEMPLATE LOADING ====================
  const loadHTMLTemplate = useCallback(async (templatePath) => {
    try {
      const response = await fetch(templatePath);
      const html = await response.text();
      setTemplateHTML(html);
      setPages(prev => {
        const updated = [...prev];
        updated[currentPage] = { ...updated[currentPage], html: html };
        return updated;
      });
      // Immediate generation for loaded template (50ms wait for state, 100ms debounce)
      setTimeout(() => generateThumbnail(html, pages[currentPage].id, 100), 50);
      markAsDirty();
    } catch (error) {
      console.error('Failed to load:', error);
      showAlert('error', 'Load Failed', 'Failed to load the selected template. Please try again.');
    }
  }, [currentPage, generateThumbnail, pages, markAsDirty]);

  // ==================== PAGE MANAGEMENT ====================
  const switchToPage = useCallback((index) => {
    setPages(prev => {
        const updated = [...prev];
        if (updated[currentPage]) updated[currentPage] = { ...updated[currentPage], html: templateHTML };
        return updated;
    });
    setCurrentPage(index);
    setTemplateHTML(pages[index]?.html || '');
    setSelectedElement(null);
    setSelectedElementType(null);
    setPanOffset({ x: 0, y: 0 }); 
  }, [currentPage, templateHTML, pages]);

  const addNewPage = useCallback((index = null) => {
    // Generate unique ID before setPages so it's captured in closure
    const newPageId = Date.now() + Math.random();
    
    setPages(prev => {
        let newName;
        const insertAt = index !== null ? index + 1 : prev.length;

        if (index !== null) {
            // Smart Naming: "Insert After"
            const sourcePage = prev[index];
            // Extract root name by stripping any existing " (N)" suffix
            // e.g. "Page 1 (2)" -> "Page 1", "My Page" -> "My Page"
            const baseMatch = sourcePage.name.match(/^(.*?) \(\d+\)$/);
            const rootName = baseMatch ? baseMatch[1] : sourcePage.name;

            // Scan all existing names to find the next available counter
            // We want "Root (1)", "Root (2)", etc.
            const existingNames = new Set(prev.map(p => p.name));
            let counter = 1;
            while(true) {
                const candidate = `${rootName} (${counter})`;
                if (!existingNames.has(candidate)) {
                    newName = candidate;
                    break;
                }
                counter++;
            }
        } else {
             // Appending to end (Main Add Button): "Page N+1"
             const maxPageNum = prev.reduce((max, page) => {
                  const match = page.name.match(/Page (\d+)/);
                  return match ? Math.max(max, parseInt(match[1])) : max;
             }, 0);
             const nextPageNum = maxPageNum + 1;
             newName = `Page ${nextPageNum}`;
        }

        // Create new page with the pre-generated ID
        const newPage = { 
            id: newPageId, 
            v_id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: newName, 
            html: '', 
            thumbnail: null 
        };

        const newPages = [...prev];
        newPages.splice(insertAt, 0, newPage);
        return newPages;
    });

    // Only switch page if explicitly inserting (Context Menu action)
    if (index !== null) {
        setCurrentPage(index + 1);
        setTemplateHTML(''); 
    }
    
    markAsDirty();

    // Trigger rename mode for the newly added page
    setTimeout(() => {
      setEditingPageId(newPageId);
    }, 100); // Small delay to ensure state is updated
  }, []);

  const duplicatePage = useCallback((index) => {
    // Need to access current state inside setPages or use dependency.
    // To properly calculate unique copy name, we need the LATEST pages state.
    // So we'll force the logic inside the setPages updater or rely on `pages` dependency being up to date.
    // MainEditor re-renders on `pages` change, so `pages` variable here IS current.
    
    // BUT `duplicatePage` is memoized on `[pages, currentPage]`.
    // It is safe to use `pages` array directly for name calculation.
    
    const sourceIndex = index !== null ? index : currentPage;
    const sourcePage = pages[sourceIndex];
    if (!sourcePage) return;

    // Calculate new name: "Page 1" -> "Page 1 (copy)", "Page 1 (copy)" -> "Page 1 (copy 1)"
    let baseName = sourcePage.name;
    let newName;

    // Check if it already has (copy X) or (copy)
    const copyMatch = baseName.match(/^(.*?) \(copy(?: (\d+))?\)$/); // Matches "Base (copy)" or "Base (copy 1)"
    
    if (copyMatch) {
       // It's already a copy style name
       const rootName = copyMatch[1];
       // We want to find the next available index for this rootName
       // But wait, user requirement: "duplicate page 1 (copy), (copy 1),...".
       // If source is "Page 1", duplicates: "Page 1 (copy)", "Page 1 (copy 1)", "Page 1 (copy 2)"
       // If source is "Page 1 (copy)", duplicate is "Page 1 (copy) (copy)" ?? OR "Page 1 (copy 1)"?
       // Usually: Duplicate "Page 1" -> "Page 1 (copy)". Duplicate "Page 1" AGAIN -> "Page 1 (copy 1)".
       // Duplicate "Page 1 (copy)" -> "Page 1 (copy) (copy)" is standard simple duplicate.
       // User said: "duplicate page 1 (copy), (copy 1),...". implies incrementing.
       
       // Let's implement robust "unique name" generation.
       // If I duplicate "Page 1", I want "Page 1 (copy)". If that exists, "Page 1 (copy 1)".
       // This requires scanning ALL pages.
       baseName = baseName; // use exact source name as base for now?
       // Actually simpler: Just append (copy) first, then fix collisions?
       // Let's assume user wants: Source="Name" -> New="Name (copy)" -> Collision? "Name (copy 1)"
       
        // Extract pure base without any (copy ...) suffix if we want to accept that behavior?
        // No, usually Duplicate means "Copy of THIS specific object".
        // Let's try: Target Name = `${sourcePage.name} (copy)`
        // If that exists, try `${sourcePage.name} (copy 1)`, etc.
    }

    let targetNameBase = sourcePage.name;
    // Check if source ends with " (copy N)" or " (copy)" to just increment?
    // User request: "if click duplicate page 1 (copy), (copy 1),...".
    // This implies if I duplicate "Page 1", I get "Page 1 (copy)".
    // If I duplicate "Page 1" AGAIN, I get "Page 1 (copy 1)".
    
    // Logic:
    // Base = sourcePage.name IF source does not match `(copy...)`.
    // If source IS `(copy...)`, user might mean duplicate THAT.
    // Let's strictly follow: New name should always be unique.
    // Default Pattern: `[Original Name] (copy)` or `[Original Name] (copy N)`
    
    // Let's parse the source name to find a "Base". 
    // If source is "Page 1", Base="Page 1".
    // If source is "Page 1 (copy)", Base="Page 1".
    // If source is "Page 1 (copy 2)", Base="Page 1".
    
    const baseMatch = sourcePage.name.match(/^(.*?) \(copy(?: \d+)?\)$/);
    const rootName = baseMatch ? baseMatch[1] : sourcePage.name; 

    // Find all names starting with rootName + " (copy"
    const existingNames = pages.map(p => p.name);
    
    let counter = 0;
    let proposedName = `${rootName} (copy)`;
    
    // Check if "Page 1 (copy)" exists
    if (!existingNames.includes(proposedName)) {
        newName = proposedName;
    } else {
        // "Page 1 (copy)" exists. Try "Page 1 (copy 1)", "Page 1 (copy 2)"...
        counter = 1;
        while (true) {
            proposedName = `${rootName} (copy ${counter})`;
            if (!existingNames.includes(proposedName)) {
                newName = proposedName;
                break;
            }
            counter++;
        }
    }

    const newPageId = Date.now();
    const newPage = { 
        id: newPageId, 
        v_id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: newName, 
        html: sourcePage.html, 
        thumbnail: sourcePage.thumbnail 
    };
    
    setPages(prev => {
        const newPages = [...prev];
        newPages.splice(sourceIndex + 1, 0, newPage);
        return newPages;
    });
    setCurrentPage(sourceIndex + 1);
    setTemplateHTML(sourcePage.html);
    
    markAsDirty();

    // Trigger rename mode for the duplicated page
    setTimeout(() => {
      setEditingPageId(newPageId);
    }, 100); // Small delay to ensure state is updated
  }, [pages, currentPage]);

  const clearPage = useCallback((index) => {
      showAlert('warning', 'Clear Content', 'Are you sure you want to clear all content from this page?', {
          showCancel: true,
          confirmText: 'Clear Page',
          onConfirm: () => {
             const blankHTML = '';
             setPages(prev => {
                const newPages = [...prev];
                newPages[index] = { ...newPages[index], html: blankHTML, thumbnail: null };
                return newPages;
             });
             if (index === currentPage) setTemplateHTML(blankHTML);
             markAsDirty();
             closeAlert();
          }
      });
  }, [currentPage, showAlert, closeAlert]);

  const deletePage = useCallback((index) => {
    if (pages.length <= 1) { 
        showAlert('warning', 'Action Denied', 'You cannot delete the only page in the document.');
        return; 
    }
    
    showAlert('error', 'Delete Page', 'Are you sure you want to delete this page? This action cannot be undone.', {
        showCancel: true,
        confirmText: 'Delete',
        onConfirm: () => {
            const targetIndex = index ?? currentPage;
            const newPages = pages.filter((_, i) => i !== targetIndex);
            
            // Calculate new current page logic BEFORE setting state to avoid race conditions with rendering
            let newCurrentPage = currentPage;
            if (targetIndex === currentPage) {
                newCurrentPage = Math.max(0, targetIndex - 1);
            } else if (targetIndex < currentPage) {
                newCurrentPage = currentPage - 1;
            }

            setPages(newPages);
            setCurrentPage(newCurrentPage);
            setTemplateHTML(newPages[newCurrentPage]?.html || '');
            markAsDirty();
            closeAlert();
        }
    });
  }, [pages, currentPage, showAlert, closeAlert]);

  // ==================== TEMPLATE EDITING ====================
  const handleTemplateChange = useCallback((newHTML) => {
    setTemplateHTML(newHTML);
    setPages(prev => {
      const updated = [...prev];
      updated[currentPage] = { ...updated[currentPage], html: newHTML };
      return updated;
    });
    markAsDirty();
    // Reduced debounce for faster typing feedback (800ms)
    generateThumbnail(newHTML, pages[currentPage].id, 800);
  }, [currentPage, generateThumbnail, pages]);

  const handlePageUpdate = useCallback((index, newHTML, shouldRefresh = false) => {
    setPages(prev => {
        const updated = [...prev];
        if (updated[index]) {
            updated[index] = { ...updated[index], html: newHTML };
        }
        return updated;
    });
    if (index === currentPage) {
        setTemplateHTML(newHTML);
    }
    if (pages[index]) {
       generateThumbnail(newHTML, pages[index].id, 800);
    }
    markAsDirty();
  }, [currentPage, generateThumbnail, pages, markAsDirty]);

  const handleElementSelect = useCallback((element, type, pageIndex) => {
    setSelectedElement(element);
    setSelectedElementType(type);
    setSelectedPageIndex(pageIndex !== undefined ? pageIndex : currentPage);
  }, [currentPage]);

  // Debounce ref for element updates
  const elementUpdateDebounceRef = useRef(null);

  const handleElementUpdate = useCallback((options = {}) => {
    const targetElement = options?.newElement || selectedElement;
    
    if (targetElement) {
      // Use the element's ownerDocument to ensure we get the correct page's HTML
      const doc = targetElement.ownerDocument;
      
      if (doc && doc.documentElement) {
        const html = doc.documentElement.outerHTML;
        const targetIndex = selectedPageIndex !== null ? selectedPageIndex : currentPage;
        
        // Prevent re-render of iframe by syncing internal ref first
        if (!options?.shouldRefresh && htmlEditorRef.current) {
            htmlEditorRef.current.setInternalHTML(html);
        }

        // If it's a structural refresh (like icon replacement), update immediately
        if (options?.shouldRefresh) {
            if (elementUpdateDebounceRef.current) clearTimeout(elementUpdateDebounceRef.current);
            handlePageUpdate(targetIndex, html, options?.shouldRefresh);
            
            // If a new element was created (icon replacement), re-select it after refresh
            if (options?.newElement) {
                // Wait for iframe to refresh and event listeners to be reattached
                setTimeout(() => {
                    const iframe = document.querySelector('iframe[title="Template Editor"]');
                    if (iframe && iframe.contentDocument) {
                        const doc = iframe.contentDocument;
                        // Find the new element in the refreshed iframe
                        // Use data-editable and position/attributes to locate it
                        const svgs = doc.querySelectorAll('svg[data-editable="true"]');
                        // Find matching SVG by comparing key attributes
                        const newElementInIframe = Array.from(svgs).find(svg => {
                            // Match by similar attributes (width, height, position)
                            return svg.getAttribute('width') === options.newElement.getAttribute('width') &&
                                   svg.getAttribute('height') === options.newElement.getAttribute('height');
                        }) || svgs[0]; // Fallback to first SVG if no exact match
                        
                        if (newElementInIframe) {
                            // Trigger selection
                            newElementInIframe.click();
                        }
                    }
                }, 150); // Wait for setupEditableElements to complete
            }
            return;
        }
        
        // Otherwise, debounce the heavy state update (Sidebar re-render)
        if (elementUpdateDebounceRef.current) clearTimeout(elementUpdateDebounceRef.current);
        elementUpdateDebounceRef.current = setTimeout(() => {
            handlePageUpdate(targetIndex, html);
        }, 500);
      }
    }
  }, [selectedElement, selectedPageIndex, currentPage, handlePageUpdate]);

  const openPreview = useCallback(() => {
    setPages(pages.map((page, idx) => idx === currentPage ? { ...page, html: templateHTML } : page));
    setShowPreview(true);
  }, [pages, currentPage, templateHTML]);

  const closePreview = useCallback(() => setShowPreview(false), []);

  const renamePage = useCallback((pageId, newName) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: newName } : p));
    markAsDirty();
  }, [markAsDirty]);

  // Handle pan start events bubbled up from iframe
  const handleIframePanStart = useCallback((event) => {
    if (event.type === 'space_down') {
        setIsSpacePressed(true);
    } else if (event.type === 'space_up') {
        setIsSpacePressed(false);
        setIsPanning(false);
        isDraggingRef.current = false;
    } else if (event.screenX !== undefined) {
        // It's a mousedown event (middle click or space+click)
        setIsPanning(true);
        isDraggingRef.current = true;
        
        // Use screen coordinates for consistency
        lastMousePosRef.current = { x: event.screenX, y: event.screenY };
    }
  }, []);

  // ==================== PAGE REORDERING ====================
  const movePage = useCallback((fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= pages.length || fromIndex === toIndex) return;
    
    setPages(prev => {
        const newPages = [...prev];
        const [movedPage] = newPages.splice(fromIndex, 1);
        newPages.splice(toIndex, 0, movedPage);
        return newPages;
    });

    markAsDirty();

    // Update current page selection if the current page was moved
    if (currentPage === fromIndex) {
        setCurrentPage(toIndex);
    } else if (currentPage === toIndex) {
        // If we moved something INTO the current slot (displacement), 
        // the logic is complex depending on direction.
        // Simplest: track the ID.
        // But since we rely on index for currentPage, let's just stick to the simple case:
        // If the moved page WAS active, follow it. 
        // If another page was active, we might need to adjust index.
        // Calculating valid new index for currentPage:
        if (fromIndex < currentPage && toIndex >= currentPage) {
             setCurrentPage(currentPage - 1);
        } else if (fromIndex > currentPage && toIndex <= currentPage) {
             setCurrentPage(currentPage + 1);
        }
    }
  }, [pages.length, currentPage]);

  const movePageUp = useCallback((index) => movePage(index, index - 1), [movePage]);
  const movePageDown = useCallback((index) => movePage(index, index + 1), [movePage]);
  const movePageToFirst = useCallback((index) => movePage(index, 0), [movePage]);
  const movePageToLast = useCallback((index) => movePage(index, pages.length - 1), [movePage, pages.length]);



  const handlePreviousPage = useCallback(() => {
    if (!isDoublePage) {
        if (currentPage > 0) switchToPage(currentPage - 1);
        return;
    }
    
    // Double Page Logic
    if (currentPage === 0) return;

    // If we are on first spread (Page 1 or 2), go to Cover (0)
    // Spread 1 starts at 1. Spread 2 starts at 3.
    const isOdd = currentPage % 2 !== 0;
    const currentSpreadStart = isOdd ? currentPage : currentPage - 1;

    // If current spread start is 1, previous is 0
    if (currentSpreadStart <= 1) {
        switchToPage(0);
    } else {
        // Go back one full spread (2 pages)
        switchToPage(currentSpreadStart - 2);
    }
  }, [currentPage, isDoublePage, switchToPage]);

  const handleNextPage = useCallback(() => {
    if (!isDoublePage) {
        if (currentPage < pages.length - 1) switchToPage(currentPage + 1);
        return;
    }

    // Double Page Logic
    if (currentPage === 0) {
        // From Cover to first spread (Page 1)
        if (pages.length > 1) switchToPage(1);
        return;
    }

    const isOdd = currentPage % 2 !== 0;
    const currentSpreadStart = isOdd ? currentPage : currentPage - 1;
    const nextSpreadStart = currentSpreadStart + 2;

    if (nextSpreadStart < pages.length) {
        switchToPage(nextSpreadStart);
    }
  }, [currentPage, isDoublePage, switchToPage, pages.length]);

  // Handle Zoom Changes (Persist to Page)
  const handleZoomChange = useCallback((newZoom) => {
      setZoomLevel(newZoom);
      setPages(prev => {
          const updated = [...prev];
          
          if (!isDoublePage) {
             // Update current page zoom
             if (updated[currentPage]) {
                 updated[currentPage] = { ...updated[currentPage], zoom: newZoom };
             }
          } else {
             // Double Page: Update both pages in spread to keep them consistent
             // If cover (0)
             if (currentPage === 0) {
                 if (updated[0]) updated[0] = { ...updated[0], zoom: newZoom };
             } else {
                 const isOdd = currentPage % 2 !== 0;
                 const leftIndex = isOdd ? currentPage : currentPage - 1;
                 const rightIndex = leftIndex + 1;
                 
                 if (updated[leftIndex]) updated[leftIndex] = { ...updated[leftIndex], zoom: newZoom };
                 if (updated[rightIndex]) updated[rightIndex] = { ...updated[rightIndex], zoom: newZoom };
             }
          }
          return updated;
      });
  }, [currentPage, isDoublePage]);

  // Restore Zoom on Page Change
  useEffect(() => {
     if (pages[currentPage]) {
         const savedZoom = pages[currentPage].zoom || 60;
         // Only update if different (prevent loop slightly, though react handles it)
         setZoomLevel(savedZoom);
     }
  }, [currentPage]); // Re-run when page changes. (Dependency on pages omitted to avoid cycle with setPages in handleZoomChange, but we need initial values?)
  // Actually if we omit pages, we might miss updates? No, we only care about LOADING when currentPage changes.
  // If we change zoom, handleZoomChange updates state AND pages. UseEffect might run if we included pages.
  // By omitting pages, we only load when switching. Perfect.

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 font-sans text-gray-700">
      {/* Navbar moved to Layout */}
      <div 
        className="flex flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      <LeftSidebar
        pages={pages.map((page, idx) => ({ ...page, thumbnail: getThumbnail(page.id) }))}
        currentPage={currentPage}
        switchToPage={switchToPage}
        addNewPage={() => addNewPage(null)}
        insertPageAfter={addNewPage}
        deletePage={deletePage}
        duplicatePage={duplicatePage}
        clearPage={clearPage}
        renamePage={renamePage}
        movePageUp={movePageUp}
        movePageDown={movePageDown}
        movePageToFirst={movePageToFirst}
        movePageToLast={movePageToLast}
        movePage={movePage}
        editingPageIdProp={editingPageId}
        onEditingPageIdChange={setEditingPageId}
        onOpenTemplateModal={() => setShowTemplateModal(true)}
        isDoublePage={isDoublePage}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 border-r border-gray-200">
        <TopToolbar
          pageName={pageName}
          isEditingPageName={isEditingPageName}
          setPageName={(name) => { setPageName(name); markAsDirty(); }}
          setIsEditingPageName={setIsEditingPageName}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={zoom}
          handleZoom={handleZoomChange}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <div 
            ref={editorContainerRef} 
            className={`flex-1 overflow-hidden relative bg-gray-100 flex items-center justify-center p-8 
                ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                // If clicking directly on the background area, deselect
                if (e.target === editorContainerRef.current) {
                    if (htmlEditorRef.current) {
                        htmlEditorRef.current.deselectAll();
                    }
                }
            }}
          >
            <div 
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                filter: popupPreview.isOpen ? 'blur(8px)' : 'none'
              }}
              className="transition-all duration-300"
            >
                <HTMLTemplateEditor
                    ref={htmlEditorRef}
                    templateHTML={templateHTML}
                    onTemplateChange={handleTemplateChange}
                    onPageUpdate={handlePageUpdate}
                    pages={pages}
                    currentPage={currentPage}
                    onPageChange={switchToPage}
                    zoom={zoom}
                    onZoomChange={handleZoomChange}
                    onPanStart={handleIframePanStart}
                    onElementSelect={handleElementSelect}
                    onGlobalClick={() => setClosePanelsSignal(prev => prev + 1)}
                    onOpenTemplateModal={(index) => {
                        if (typeof index === 'number' && index !== currentPage) {
                            switchToPage(index);
                        }
                        setShowTemplateModal(true);
                    }}
                    isDoublePage={isDoublePage}
                /> 
                
                {/* Overlay to capture mouse events during panning */}
                {isPanning && (
                  <div 
                    className="absolute inset-0 z-50 bg-transparent"
                    style={{ cursor: 'grabbing' }}
                  />
                )}
            </div>

            {/* Page Indicator (Fixed Corner) */}
            {pages && pages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-white/90 text-gray-600 border border-gray-200 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm backdrop-blur-sm z-10 pointer-events-none select-none">
                    Page {currentPage + 1} / {pages.length}
                </div>
            )}

            {/* Previous Page Arrow - Left Side */}
            {(() => {
                const canGoPrevious = isDoublePage 
                    ? currentPage > 0 // Start (Cover) is 0. If > 0, we can go back.
                    : currentPage > 0;
                
                if (!canGoPrevious) return null;

                return (
                  <button
                    onClick={handlePreviousPage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-3 rounded-full shadow-lg border border-gray-200 backdrop-blur-sm transition-all hover:scale-110"
                    title="Previous Page"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                );
            })()}

            {/* Next Page Arrow - Right Side */}
            {(() => {
                let canGoNext = false;
                if (!isDoublePage) {
                    canGoNext = currentPage < pages.length - 1;
                } else {
                    if (currentPage === 0) {
                        canGoNext = pages.length > 1;
                    } else {
                        const isOdd = currentPage % 2 !== 0; // True if 1, 3, 5
                        const currentSpreadStart = isOdd ? currentPage : currentPage - 1;
                        const nextSpreadStart = currentSpreadStart + 2; 
                        
                        // Check if we can technically advance
                        // If next indices exist OR if we are advancing to the single last page
                        if (nextSpreadStart < pages.length) {
                             canGoNext = true;
                        } else if (nextSpreadStart === pages.length && pages.length % 2 === 0) {
                             // SPECIAL CASE: Even pages (e.g. 6). Last index is 5.
                             // Spread 3,4 (start=3). NextSpread=5.
                             // 5 < 6. It's covered by above check.
                             
                             // Wait, logic:
                             // If indices 0..5. (Len 6).
                             // Current: 3 (Spread 3,4).
                             // NextSpread: 5.
                             // 5 < 6. True.
                             
                             // Current: 5 (Back Cover).
                             // NextSpread: 7.
                             // 7 < 6. False.
                             
                             // Odd pages (0..4). (Len 5).
                             // Current: 1 (Spread 1,2).
                             // NextSpread: 3.
                             // 3 < 5. True.
                             
                             // Current: 3 (Spread 3,4).
                             // NextSpread: 5.
                             // 5 < 5. False. (Correct, as 3,4 is last view).
                             
                             canGoNext = false; // It's covered above.
                        }
                    }
                }
                
                if (!canGoNext) return null;

                return (
                  <button
                    onClick={handleNextPage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-3 rounded-full shadow-lg border border-gray-200 backdrop-blur-sm transition-all hover:scale-110"
                    title="Next Page"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                );
            })()}

            {/* Page Settings Menu - Top Right with Settings Icon */}
            <div className="absolute top-4 right-4 z-10 page-settings-menu">
              <div className="relative">
                <button
                  onClick={() => setShowPageSettingsMenu(prev => !prev)}
                  className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 transition-all"
                  title="Page Settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                {/* Dropdown Menu */}
                {showPageSettingsMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-[9999] flex flex-col gap-1">
                    {isDoublePage && currentPage !== 0 ? (
                      // Double Page Menu Layout
                      <>
                        <div className="px-2 py-1.5 text-sm font-bold text-gray-900 border-b border-gray-100 mb-1 flex items-center justify-between">
                            Page Settings
                            <div className="h-px bg-gray-200 w-8"></div>
                        </div>

                        {/* Helper vars for indices */}
                        {(() => {
                            const leftIdx = (currentPage % 2 !== 0) ? currentPage : currentPage - 1;
                            const rightIdx = leftIdx + 1;
                            const hasRight = rightIdx < pages.length;

                            const ButtonRow = ({ onLeft, onRight }) => (
                                <div className="flex gap-2 px-1 mb-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                    <button onClick={(e) => { e.stopPropagation(); onLeft(); setShowPageSettingsMenu(false); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#3b4190] font-bold py-1.5 rounded text-sm transition-colors">L</button>
                                    <button onClick={(e) => { e.stopPropagation(); onRight(); setShowPageSettingsMenu(false); }} disabled={!hasRight} className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#3b4190] font-bold py-1.5 rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">R</button>
                                </div>
                            );
                            
                            const ExpandableMenuItem = ({ id, label, icon, onLeft, onRight }) => {
                                const isExpanded = expandedMenuAction === id;
                                return (
                                    <>
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setExpandedMenuAction(isExpanded ? null : id);
                                            }}
                                            className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors
                                                ${isExpanded ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {icon}
                                                {label}
                                            </div>
                                            <svg 
                                                width="12" 
                                                height="12" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>
                                        {isExpanded && <ButtonRow onLeft={onLeft} onRight={onRight} />}
                                    </>
                                );
                            };

                            return (
                             <>
                                {/* Add Page */}
                                <ExpandableMenuItem 
                                    id="add"
                                    label="Add Page"
                                    icon={<Plus size={14} />}
                                    onLeft={() => addNewPage(leftIdx)}
                                    onRight={() => addNewPage(rightIdx)}
                                />

                                {/* Duplicate */}
                                <ExpandableMenuItem 
                                    id="duplicate"
                                    label="Duplicate"
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                                    onLeft={() => duplicatePage(leftIdx)}
                                    onRight={() => duplicatePage(rightIdx)}
                                />

                                {/* Template */}
                                <ExpandableMenuItem 
                                    id="template"
                                    label="Template"
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
                                    onLeft={() => { switchToPage(leftIdx); setShowTemplateModal(true); }}
                                    onRight={() => { switchToPage(rightIdx); setShowTemplateModal(true); }}
                                />

                                <div className="h-px bg-gray-100 my-1"></div>

                                {/* Clear */}
                                <ExpandableMenuItem 
                                    id="clear"
                                    label="Clear"
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>}
                                    onLeft={() => clearPage(leftIdx)}
                                    onRight={() => clearPage(rightIdx)}
                                />

                                {/* Delete */}
                                <ExpandableMenuItem 
                                    id="delete"
                                    label="Delete"
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>}
                                    onLeft={() => deletePage(leftIdx)}
                                    onRight={() => deletePage(rightIdx)}
                                />
                             </>
                            );
                        })()}
                      </>
                    ) : (
                      // Single Page Layout (Original)
                      <>
                        <button
                          onClick={() => { addNewPage(currentPage); setShowPageSettingsMenu(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Add Page
                        </button>
                        <button
                          onClick={() => { duplicatePage(currentPage); setShowPageSettingsMenu(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Duplicate
                        </button>
                        <button
                          onClick={() => { setShowTemplateModal(true); setShowPageSettingsMenu(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                          </svg>
                          Template
                        </button>
                        
                        <div className="h-px bg-gray-100 my-1"></div>
                        
                        <button
                          onClick={() => { clearPage(currentPage); setShowPageSettingsMenu(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-left"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                          </svg>
                          Clear
                        </button>
                        <button
                          onClick={() => { deletePage(currentPage); setShowPageSettingsMenu(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg text-left"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {popupPreview.isOpen && (
              <PopupPreview
                content={popupPreview.content}
                styles={popupPreview.styles}
                elementType={popupPreview.elementType}
                elementSource={popupPreview.elementSource}
                onClose={() => setPopupPreview({ ...popupPreview, isOpen: false })}
              />
            )}
          </div>
        </div>
      </main>

      <RightSidebar
        selectedElement={selectedElement}
        selectedElementType={selectedElementType}
        onUpdate={handleElementUpdate}
        isDoublePage={isDoublePage}
        setIsDoublePage={setIsDoublePage}
        openPreview={openPreview}
        onPopupPreviewUpdate={handlePopupPreviewUpdate}
        closePanelsSignal={closePanelsSignal}
        currentPageVId={pages[currentPage]?.v_id || pages[currentPage]?.id}
        flipbookVId={currentVId}
        folderName={lastSavedFolder}
        flipbookName={lastSavedName}
      />

      {showTemplateModal && (
        <TemplateModal showTemplateModal={showTemplateModal} setShowTemplateModal={setShowTemplateModal} clearCanvas={() => clearPage(currentPage)} loadHTMLTemplate={loadHTMLTemplate} />
      )}

      {showPreview && (
        <FlipbookPreview 
          pages={flipbookPages} 
          pageName={pageName} 
          onClose={closePreview} 
          isMobile={deviceInfo.isMobile}
          isDoublePage={isDoublePage}
        />
      )}

      {/* Custom Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        showCancel={alertState.showCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
      />

      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        totalPages={pages.length}
        currentPage={currentPage + 1}
        onExport={handleDownloadPages}
        pageName={pageName}
      />

      {/* Save Modal */}
      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
               {/* Header */}
               <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-bold text-[#343868]">Save Flipbook</h3>
                   <button 
                       onClick={() => {
                           setIsCreatingFolder(!isCreatingFolder);
                           setNewFolderInput('');
                           setTargetFolder(''); // Reset selection when toggling create
                       }}
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm font-medium text-xs transition-colors
                           ${isCreatingFolder 
                               ? 'bg-[#3b4190] text-white border-[#3b4190]' 
                               : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                           }
                       `}
                   >
                       <Plus size={14} /> Folder
                   </button>
               </div>
               


               {/* Folder Selection Area */}
               <div 
                  ref={modalListRef}
                  className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar p-1 mb-4 scroll-smooth"
               >
                  {/* Folder List */}
                  {(!isCreatingFolder ? (availableFolders && availableFolders.length > 0 ? availableFolders : []) : (availableFolders || [])).filter(f => f !== 'Recent Book').sort((a,b) => {
                      return a.localeCompare(b);
                  }).map(folder => {
                      const isSelected = targetFolder === folder;
                      
                      return (
                        <button
                            key={folder}
                            onClick={() => setTargetFolder(folder)}
                            disabled={isCreatingFolder} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all group text-left
                                ${isCreatingFolder
                                    ? 'bg-white border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                                    : isSelected 
                                        ? 'bg-[#3b4190]/10 border-[#3b4190] text-[#343868] shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#3b4190] hover:bg-blue-50/50 hover:text-[#3b4190]'
                                }
                            `}
                        >
                            <Folder size={18} className={isCreatingFolder ? "text-gray-300" : (isSelected ? "text-[#3b4190]" : "text-gray-400 group-hover:text-[#3b4190]")} />
                            <span className="truncate">{folder}</span>
                            {/* {isSelected && !isCreatingFolder && <div className="ml-auto w-2 h-2 rounded-full bg-[#3b4190]"></div>} */}
                        </button>
                      );
                  })}

                  {/* Create Folder Input - At Bottom */}
                  {isCreatingFolder && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">New Folder Name</label>
                          <div className="w-full flex items-center gap-2 p-1 rounded-xl border border-[#3b4190] bg-[#3b4190]/5">
                              <input 
                                  autoFocus
                                  type="text" 
                                  placeholder="Enter name..."
                                  value={newFolderInput}
                                  onChange={(e) => setNewFolderInput(e.target.value)}
                                  className="flex-1 px-3 py-2 bg-transparent text-sm font-medium focus:outline-none text-[#343868] placeholder-gray-400"
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newFolderInput.trim()) {
                                          executeSave(newFolderInput.trim(), false);
                                      }
                                  }}
                              />
                          </div>
                      </div>
                  )}
               </div>

               {/* Footer Actions */}
               <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button 
                      onClick={() => {
                          setShowSaveModal(false);
                          setIsCreatingFolder(false);
                          setNewFolderInput('');
                          setTargetFolder('');
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={() => {
                          const finalFolder = isCreatingFolder ? newFolderInput.trim() : targetFolder;
                          if (finalFolder) {
                              executeSave(finalFolder, false);
                          }
                      }}
                      disabled={isCreatingFolder ? !newFolderInput.trim() : !targetFolder}
                      className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition-all shadow-lg
                          ${(isCreatingFolder ? !newFolderInput.trim() : !targetFolder)
                              ? 'bg-gray-300 cursor-not-allowed shadow-none'
                              : 'bg-[#3b4190] hover:bg-[#2f3575] shadow-indigo-500/30'
                          }
                      `}
                  >
                      Save
                  </button>
               </div>
           </div>
        </div>
      )}
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <p className="text-white font-medium text-lg">{loadingText}</p>
             </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MainEditor;