// HTMLTemplateEditor.jsx - Enhanced HTML Template editing with zoom and element selection
import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Type, Image as ImageIcon } from 'lucide-react';

const HTMLTemplateEditor = forwardRef(({
  templateHTML,
  onTemplateChange,
  pages,
  currentPage,
  onPageChange,
  zoom = 100,
  onElementSelect,
  onZoomChange,
  onPanStart,
  onOpenTemplateModal
}, ref) => {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedElement, setSelectedElement] = useState(null);
  const debounceRef = useRef(null);

  const internalHtmlRef = useRef(templateHTML);
  const lastPageRef = useRef(currentPage);

  // Initialize iframe with template content and handle updates
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Force reload if page changed, even if HTML is same (e.g., multiple blank pages)
      const pageChanged = lastPageRef.current !== currentPage;
      if (pageChanged) {
        lastPageRef.current = currentPage;
      }
      
      // 1. Check against our last known internal state (from edits)
      // Skip update if HTML hasn't changed AND page hasn't changed
      if (templateHTML === internalHtmlRef.current && !pageChanged) {
          return;
      }

      // 2. Check against actual DOM content (in case of drift or initial load)
      // But force reload if page changed
      if (!pageChanged && doc.documentElement && doc.documentElement.outerHTML === templateHTML) {
        internalHtmlRef.current = templateHTML; // Sync ref
        return;
      }

      // Write the full HTML template with styles
      doc.open();
      doc.write(templateHTML);
      doc.close();
      
      // Sync internal ref
      internalHtmlRef.current = templateHTML;

      // Add editing capabilities
      setTimeout(() => {
        setupEditableElements(doc);
      }, 100);
    }
  }, [templateHTML]); // Only depend on templateHTML, not currentPage

  // Deselect all elements
  const deselectAll = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    
    // Clear outlines
    const images = doc.querySelectorAll('img');
    images.forEach(i => i.style.outline = 'none');

    const videos = doc.querySelectorAll('video');
    videos.forEach(v => v.style.outline = 'none');

    const svgs = doc.querySelectorAll('svg');
    svgs.forEach(s => s.style.outline = 'none');
    
    const textElements = doc.querySelectorAll('[data-editable="true"]');
    textElements.forEach(el => el.style.outline = 'none');

    setSelectedElement(null);
    if (onElementSelect) {
      onElementSelect(null, null);
    }
  }, [onElementSelect]);

  // Setup editable elements in the iframe
  const setupEditableElements = (doc) => {
    if (!doc.body) return;

    // Remove previous event listeners by recreating elements
    const allEditableElements = doc.querySelectorAll('[data-editable="true"]');
    allEditableElements.forEach(el => {
      el.removeAttribute('data-editable');
    });

    // Select all elements first to avoid reference errors
    const textElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, div');
    const images = doc.querySelectorAll('img');
    const videos = doc.querySelectorAll('video');
    const svgs = doc.querySelectorAll('svg');

    // Make text elements editable
    textElements.forEach(el => {
      // Skip if it's a container element with children
      if (el.children.length > 0 && el.tagName === 'DIV') return;
      
      el.style.cursor = 'text';
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-editable', 'true');
      el.style.outline = 'none';
      
      el.addEventListener('focus', (e) => {
        // Remove selection from other elements
        textElements.forEach(other => {
            if (other !== el) other.style.outline = 'none';
        });
        images.forEach(i => i.style.outline = 'none');
        videos.forEach(v => v.style.outline = 'none');
        svgs.forEach(s => s.style.outline = 'none');
        
        el.style.outline = '2px solid #6366f1';
        el.style.outlineOffset = '2px';
        setSelectedElement(el);
        if (onElementSelect) {
          onElementSelect(el, 'text');
        }
      });
      
      // Don't remove selection on blur - only when clicking outside
      el.addEventListener('blur', () => {
        saveToHistory();
      });

      el.addEventListener('input', () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        
        debounceRef.current = setTimeout(() => {
            if (onTemplateChange) {
              const html = doc.documentElement.outerHTML;
              internalHtmlRef.current = html; // Sync before emitting
              onTemplateChange(html);
            }
        }, 200);
      });
    });

    // Make images clickable for replacement
    images.forEach(img => {
      img.style.cursor = 'pointer';
      img.setAttribute('data-editable', 'true');
      
      const handleImageClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        images.forEach(i => i.style.outline = 'none');
        videos.forEach(v => v.style.outline = 'none');
        svgs.forEach(s => s.style.outline = 'none');
        textElements.forEach(t => t.style.outline = 'none');
        
        img.style.outline = '2px solid #6366f1';
        img.style.outlineOffset = '2px';
        
        setSelectedElement(img);
        if (onElementSelect) {
          onElementSelect(img, 'image');
        }
      };
      
      img.addEventListener('click', handleImageClick);
    });

    // Make Video Elements Clickable and Selectable
    videos.forEach(video => {
        video.style.cursor = 'pointer';
        video.setAttribute('data-editable', 'true');

        const handleVideoClick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            images.forEach(i => i.style.outline = 'none');
            videos.forEach(v => v.style.outline = 'none');
            svgs.forEach(s => s.style.outline = 'none');
            textElements.forEach(t => t.style.outline = 'none');

            video.style.outline = '2px solid #6366f1';
            video.style.outlineOffset = '2px';

            setSelectedElement(video);
            if (onElementSelect) {
                onElementSelect(video, 'video');
            }
        };

        video.addEventListener('click', handleVideoClick);
    });

    // Make SVG Elements Clickable and Selectable
    svgs.forEach(svg => {
        svg.style.cursor = 'pointer';
        svg.setAttribute('data-editable', 'true');

        const handleSvgClick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            images.forEach(i => i.style.outline = 'none');
            videos.forEach(v => v.style.outline = 'none');
            svgs.forEach(s => s.style.outline = 'none');
            textElements.forEach(t => t.style.outline = 'none');

            svg.style.outline = '2px solid #6366f1';
            svg.style.outlineOffset = '2px';

            setSelectedElement(svg);
            if (onElementSelect) {
                onElementSelect(svg, 'svg'); 
            }
        };

        svg.addEventListener('click', handleSvgClick);
    });

    // Click outside to deselect - but ONLY outside the base area
    doc.addEventListener('click', (e) => {
      const isEditableElement = e.target.closest('[data-editable="true"]');
      if (isEditableElement) return;
      deselectAll();
    });

    // Add custom styles to iframe
    const style = doc.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #6366f1 !important;
        outline-offset: 2px !important;
      }
      /* Hover effects for all editable elements */
      [data-editable="true"]:hover {
        background-color: rgba(99, 102, 241, 0.05);
      }
      
      /* Text elements - editable */
      [contenteditable]:hover {
        background-color: rgba(99, 102, 241, 0.05);
        cursor: text;
      }
      [contenteditable]:focus {
        background-color: rgba(99, 102, 241, 0.08);
      }
      
      /* Image, Video, SVG elements */
      img[data-editable="true"], 
      video[data-editable="true"], 
      svg[data-editable="true"] {
        transition: all 0.2s ease;
      }
      
      img[data-editable="true"]:hover,
      video[data-editable="true"]:hover,
      svg[data-editable="true"]:hover {
        opacity: 0.95;
        background-color: rgba(99, 102, 241, 0.05);
      }
    `;
    
    // Remove existing custom styles
    const existingStyle = doc.getElementById('editor-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.id = 'editor-styles';
    doc.head.appendChild(style);
  };

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    const html = doc.documentElement.outerHTML;
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(html);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    
    if (onTemplateChange) {
      onTemplateChange(html);
    }
  }, [historyIndex, onTemplateChange]);

  // Calculate scaled dimensions
  const scale = zoom / 100;
  const scaledWidth = 595 * scale;
  const scaledHeight = 842 * scale;

  // Handle Ctrl + Scroll for zoom inside iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleWheel = (e) => {
      // Check if Ctrl key is pressed (or Cmd on Mac)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        if (onZoomChange) {
          // Determine zoom direction
          const delta = e.deltaY > 0 ? -5 : 5;
          const newZoom = Math.max(25, Math.min(200, zoom + delta));
          onZoomChange(newZoom);
        }
      }
    };

    // Handle Pan Start (Middle Click or Space + Drag) from inside iframe
    const handleMouseDown = (e) => {
        // Check for Middle Mouse (button 1) or Space + Left Click (button 0)
        // Space key state might need to be checked from parent or via event
        // But e.getModifierState('Space') isn't standard for mouse events, so we rely on parent's tracking/prop
        // OR we can just check if middle click.
        // For Space + Left Click, we can check if space key is currently pressed using a tracker or event
        
        const isMiddleClick = e.button === 1;
        // Simple check for now: Middle click works. Spacebar is harder to detect inside iframe unless we track keydown too.
        // Let's assume parent handles global Space key state, but here we only know about the click.
        // Actually, we can check if the parent passed down a "isSpacePressed" prop?
        // Or simply dispatch the event up.
        
        if (isMiddleClick && onPanStart) {
            e.preventDefault();
            // We use screen coordinates as they are consistent across iframe/window boundaries
            onPanStart({
                screenX: e.screenX,
                screenY: e.screenY,
                button: e.button
            });
        }
    };
    
    // Also need to track Space key inside iframe to allow Space + Click
    const handleKeyDown = (e) => {
        if (e.code === 'Space') {
            // Prevent scrolling if not in input
             const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
             if (!isInput) {
                 e.preventDefault();
                 // Notify parent?? Or handled by parent's window listener (which might not catch iframe events)
                 if (onPanStart) onPanStart({ type: 'space_down' });
             }
        }
    };
    
    const handleKeyUp = (e) => {
        if (e.code === 'Space') {
             if (onPanStart) onPanStart({ type: 'space_up' });
        }
    };

    // Attach listeners
    const win = iframe.contentWindow;
    if (win) {
      win.addEventListener('wheel', handleWheel, { passive: false });
      win.addEventListener('mousedown', handleMouseDown);
      win.addEventListener('keydown', handleKeyDown);
      win.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (win) {
        win.removeEventListener('wheel', handleWheel);
        win.removeEventListener('mousedown', handleMouseDown);
        win.removeEventListener('keydown', handleKeyDown);
        win.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [zoom, onZoomChange, templateHTML, onPanStart]);

  // Prevent browser zoom on container (gray background)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContainerWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        if (onZoomChange) {
           const delta = e.deltaY > 0 ? -5 : 5;
           const newZoom = Math.max(25, Math.min(200, zoom + delta));
           onZoomChange(newZoom);
        }
      }
    };

    container.addEventListener('wheel', handleContainerWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleContainerWheel);
    };
  }, [zoom, onZoomChange]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    deselectAll,
    setInternalHTML: (html) => {
        internalHtmlRef.current = html;
    }
  }));

  return (
    <div 
        ref={containerRef} 
        className="h-full flex flex-col bg-gray-100"
        onClick={(e) => {
            // Check if click is directly on the container or the flex wrapper (gray area)
            // ensuring we don't catch clicks that bubbled from the iframe (though iframe clicks don't bubble this way usually)
            if (e.target === containerRef.current || e.target.closest('.flex-1')) {
                deselectAll();
            }
        }}
    >
      {/* Template Preview Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center">
        <div 
          className="bg-white shadow-2xl"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            flexShrink: 0,
            transition: 'transform 0.2s ease'
          }}
        >
          <iframe
            ref={iframeRef}
            title="Template Editor"
            style={{
              width: '595px',
              height: '842px',
              border: 'none',
              display: !templateHTML ? 'none' : 'block', // Hide iframe if empty to show placeholder cleanly
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
            sandbox="allow-same-origin allow-scripts"
          />

          {/* Blank Page Placeholder - Text Only */}
          {!templateHTML && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50/50 transition-colors group"
                onClick={onOpenTemplateModal}
              >
                  <span className="text-sm text-gray-300 font-medium mb-1 group-hover:text-gray-400 transition-colors">A4 sheet (210 x 297 mm)</span>
                  <span className="text-lg text-gray-300 font-medium group-hover:text-gray-400 transition-colors">Choose Templets to Edit page</span>
              </div>
          )}
        </div>
      </div>


    </div>
  );
});

export default HTMLTemplateEditor;