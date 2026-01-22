// MainEditor.jsx - Updated Prop Passing for Double Page & Preview
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import Navbar from '../Navbar';
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
  
  // ==================== HOOKS ====================
  usePreventBrowserZoom(); // Block default browser zoom globally
  const deviceInfo = useDeviceDetection();
  const { zoom, zoomIn, zoomOut, setZoomLevel, fitToScreen } = useZoom(100, editorContainerRef);
  const { generateThumbnail, getThumbnail } = useThumbnail();
  const { canUndo, canRedo, undo, redo, saveToHistory } = useHistory();

  // ==================== STATE ====================
  const [showTemplateModal, setShowTemplateModal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Export Logic
  const handleDownloadPages = async (pagesToExport, format = 'png') => {
      try {
        const PAGE_WIDTH = 595;
        const PAGE_HEIGHT = 842;
        
        // Helper to sanitize filenames
        const sanitizeName = (name) => name.replace(/[^a-z0-9 _-]/gi, '_').replace(/\s+/g, '_');
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
             doc.open();
             doc.write(html);
             
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
             if (doc.head) doc.head.appendChild(style);
             else doc.body.appendChild(style);

             doc.close();
             
             // Wait for images/content to load (Extended delay for reliability)
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
                scrollX: 0,
                scrollY: 0,
                backgroundColor: '#ffffff'
             });
             
             document.body.removeChild(hiddenFrame);
             return canvas;
        };

        if (format === 'pdf') {
             // Generate Single Merged PDF
             // Using A4 size in mm (210 x 297) approx matches 595x842 pts
             const pdf = new jsPDF('p', 'pt', [PAGE_WIDTH, PAGE_HEIGHT]);
             
             for (let i = 0; i < pagesToExport.length; i++) {
                 const pageNum = pagesToExport[i];
                 const page = pages.find((p, idx) => (idx + 1) === pageNum);
                 const pageHTML = page?.html || '';
                 
                 const canvas = await renderPageToCanvas(pageHTML, 4);
                 const imgData = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG for PDF
                 
                 if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                 pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
             }
             
             pdf.save(`${bookNameClean}.pdf`);
             
        } else {
            // JPG or PNG Export
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const ext = format === 'jpg' ? 'jpg' : 'png';

            if (pagesToExport.length === 1) {
              // Single Image Download
              const pageNum = pagesToExport[0];
              const page = pages.find((p, i) => (i + 1) === pageNum);
              const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);
              
              const canvas = await renderPageToCanvas(page?.html || '', 4);
              
              canvas.toBlob((blob) => {
                saveAs(blob, `${bookNameClean}_${pageNameClean}.${ext}`);
              }, mimeType);
              
            } else {
              // Multiple Images -> ZIP
              const zip = new JSZip();
              
              for (const pageNum of pagesToExport) {
                 const page = pages.find((p, i) => (i + 1) === pageNum);
                 const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);
                 
                 const canvas = await renderPageToCanvas(page?.html || '', 4);

                 const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType));
                 
                 zip.file(`${pageNameClean}.${ext}`, blob);
              }
              
              const content = await zip.generateAsync({ type: 'blob' });
              saveAs(content, `${bookNameClean}.zip`);
            }
        }
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export pages. Please try again.");
      }
    };
  
  // Template state
  // Template state
  const location = useLocation();
  const initialData = location.state || {};

  const [templateHTML, setTemplateHTML] = useState('');
  const [pages, setPages] = useState(() => {
     if (initialData.pageCount) {
         return Array.from({ length: initialData.pageCount }, (_, i) => ({
             id: i + 1,
             name: `Page ${i + 1}`,
             html: '',
             thumbnail: null
         }));
     }
     return [{ 
       id: 1, 
       name: 'Page 1', 
       html: '',
       thumbnail: null 
     }];
  });
  const [currentPage, setCurrentPage] = useState(0);
  
  // Editor state
  const [pageName, setPageName] = useState("Untitled Document");
  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [isDoublePage, setIsDoublePage] = useState(false);
  
  // Panning State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Element selection state
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElementType, setSelectedElementType] = useState(null);

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
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
        setPages(nextState.pages);
        setCurrentPage(nextState.currentPage);
        setPageName(nextState.pageName);
        setTemplateHTML(nextState.pages[nextState.currentPage]?.html || '');
    }
  }, [redo]);

  // ==================== PANNING LOGIC ====================
  useEffect(() => {
    const handleKeyDown = (e) => {
        const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
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
  }, [isEditingPageName]);

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
    } catch (error) {
      console.error('Failed to load:', error);
      showAlert('error', 'Load Failed', 'Failed to load the selected template. Please try again.');
    }
  }, [currentPage, generateThumbnail, pages]);

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
    const targetIndex = index !== null ? index + 1 : pages.length;
    const newPage = { id: Date.now(), name: `Page ${pages.length + 1}`, html: '', thumbnail: null };
    setPages(prev => {
        const newPages = [...prev];
        newPages.splice(targetIndex, 0, newPage);
        return newPages;
    });
    setCurrentPage(targetIndex);
    setTemplateHTML('');
  }, [pages.length]);

  const duplicatePage = useCallback((index) => {
    const sourceIndex = index !== null ? index : currentPage;
    const sourcePage = pages[sourceIndex];
    if (!sourcePage) return;
    const newPage = { id: Date.now(), name: `${sourcePage.name} (Copy)`, html: sourcePage.html, thumbnail: sourcePage.thumbnail };
    setPages(prev => {
        const newPages = [...prev];
        newPages.splice(sourceIndex + 1, 0, newPage);
        return newPages;
    });
    setCurrentPage(sourceIndex + 1);
    setTemplateHTML(sourcePage.html);
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
    // Reduced debounce for faster typing feedback (800ms)
    generateThumbnail(newHTML, pages[currentPage].id, 800);
  }, [currentPage, generateThumbnail, pages]);

  const handleElementSelect = useCallback((element, type) => {
    setSelectedElement(element);
    setSelectedElementType(type);
  }, []);

  // Debounce ref for element updates
  const elementUpdateDebounceRef = useRef(null);

  const handleElementUpdate = useCallback((options = {}) => {
    if (selectedElement || options?.newElement) {
      const iframe = document.querySelector('iframe[title="Template Editor"]');
      if (iframe && iframe.contentDocument && iframe.contentDocument.documentElement) {
        const doc = iframe.contentDocument;
        const html = doc.documentElement.outerHTML;
        
        // Prevent re-render of iframe by syncing internal ref first
        if (!options?.shouldRefresh && htmlEditorRef.current) {
            htmlEditorRef.current.setInternalHTML(html);
        }

        // If it's a structural refresh (like icon replacement), update immediately
        if (options?.shouldRefresh) {
            if (elementUpdateDebounceRef.current) clearTimeout(elementUpdateDebounceRef.current);
            handleTemplateChange(html);
            
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
            handleTemplateChange(html);
        }, 500);
      }
    }
  }, [selectedElement, handleTemplateChange]);

  const openPreview = useCallback(() => {
    setPages(pages.map((page, idx) => idx === currentPage ? { ...page, html: templateHTML } : page));
    setShowPreview(true);
  }, [pages, currentPage, templateHTML]);

  const closePreview = useCallback(() => setShowPreview(false), []);

  const renamePage = useCallback((pageId, newName) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: newName } : p));
  }, []);

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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans text-gray-700">
      <Navbar onExport={() => setShowExportModal(true)} />
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
        onOpenTemplateModal={() => setShowTemplateModal(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 border-r border-gray-200">
        <TopToolbar
          pageName={pageName}
          isEditingPageName={isEditingPageName}
          setPageName={setPageName}
          setIsEditingPageName={setIsEditingPageName}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={zoom}
          handleZoom={setZoomLevel}
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
                    pages={pages}
                    currentPage={currentPage}
                    onPageChange={switchToPage}
                    zoom={zoom}
                    onZoomChange={setZoomLevel}
                    onPanStart={handleIframePanStart}
                    onElementSelect={handleElementSelect}
                    onGlobalClick={() => setClosePanelsSignal(prev => prev + 1)}
                    onOpenTemplateModal={() => setShowTemplateModal(true)}
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
      </div>
    </div>
  );
};

export default MainEditor;