// FlipbookPreview.jsx - Full Tailwind CSS Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize, Minimize, Download, LayoutGrid, Share2, Play, Pause,
  Music, Loader2, BookOpen, FileText, Bookmark, List, X
} from 'lucide-react';
import logo from '../../assets/logo/Fisto_logo.png';

const FlipbookPreview = ({ pages, pageName = "Name of the Book", onClose, isMobile = false, isDoublePage }) => {
  const flipbookRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const turnInstanceRef = useRef(null);
  const initializationRef = useRef(false);

  // State
  const [isSingleView, setIsSingleView] = useState(isMobile || (isDoublePage === false));
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentView, setCurrentView] = useState([1]);
  const [centerOffset, setCenterOffset] = useState(0);
  const [animationTargetView, setAnimationTargetView] = useState(null);
  const [popupData, setPopupData] = useState({
    isOpen: false,
    content: '',
    styles: {},
    elementType: 'text',
    elementSource: ''
  });

  const [spreadZoom, setSpreadZoom] = useState({
    active: false,
    scale: 1,
    x: 0,
    y: 0,
    elementId: null,
    originalRect: null,
    page: null,
    centerOffset: 0,
    isEntering: false,
    isSingleView: false
  });

  const spreadZoomRef = useRef(spreadZoom);
  useEffect(() => { spreadZoomRef.current = spreadZoom; }, [spreadZoom]);

  const currentInitIdRef = useRef(0);

  const animationEndTimerRef = useRef(null);

  const totalPages = pages.length;

  // Page dimensions (A4 ratio)
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  // Calculate the target offset based on view
  const calculateTargetOffset = useCallback((view) => {
    if (isSingleView || !view) return 0;

    const visiblePages = Array.isArray(view) ? view.filter(p => p > 0) : [view];

    if (visiblePages.length === 1 && visiblePages[0] === 1) {
      return -PAGE_WIDTH / 2;
    }

    if (visiblePages.length === 1 && visiblePages[0] === totalPages && totalPages % 2 === 0) {
      return PAGE_WIDTH / 2;
    }

    if (Array.isArray(view) && view.length === 2 && view[0] === 0 && view[1] > 0) {
      return -PAGE_WIDTH / 2;
    }

    if (Array.isArray(view) && view.length === 2 && view[1] === 0 && view[0] > 0) {
      return PAGE_WIDTH / 2;
    }

    return 0;
  }, [isSingleView, totalPages, PAGE_WIDTH]);

  // Handle centering offset
  useEffect(() => {
    if (animationEndTimerRef.current) {
      clearTimeout(animationEndTimerRef.current);
      animationEndTimerRef.current = null;
    }

    if (!isReady) {
      setCenterOffset(0);
      return;
    }

    if (isAnimating) {
      if (animationTargetView) {
        const targetOffset = calculateTargetOffset(animationTargetView);
        setCenterOffset(targetOffset);
      }
      return;
    }

    animationEndTimerRef.current = setTimeout(() => {
      const targetOffset = calculateTargetOffset(currentView);
      setCenterOffset(targetOffset);
    }, 50);

    return () => {
      if (animationEndTimerRef.current) {
        clearTimeout(animationEndTimerRef.current);
      }
    };
  }, [isAnimating, isReady, currentView, animationTargetView, calculateTargetOffset]);

  // Initial offset on ready
  useEffect(() => {
    if (isReady && !isAnimating) {
      const targetOffset = calculateTargetOffset(currentView);
      setCenterOffset(targetOffset);
    }
  }, [isReady]);

  // React to prop changes for view mode
  useEffect(() => {
    if (isMobile) setIsSingleView(true);
  }, [isMobile]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/page-flip.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playFlipSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Flip sound failed:", e));
    }
  }, []);

  // Load Script Helper
  const loadScript = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        if (window.jQuery && window.jQuery.fn.turn) {
          resolve();
          return;
        }
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => setTimeout(resolve, 100);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  // Destroy Turn.js instance safely
  const destroyTurn = useCallback(() => {
    if (turnInstanceRef.current && window.jQuery) {
      try {
        const $el = turnInstanceRef.current;
        if ($el.data && $el.data('turn')) {
          $el.turn('destroy');
        }
      } catch (e) {
        console.warn('Turn.js cleanup:', e);
      }
    }
    turnInstanceRef.current = null;

    if (flipbookRef.current) {
      flipbookRef.current.innerHTML = '';
      flipbookRef.current.removeAttribute('style');
      flipbookRef.current.className = '';
    }
  }, []);



  // Sanitize HTML content
  const sanitizeHTML = useCallback((html, pageNumber) => {

    // Interaction Handler Script
    // Interaction Handler Script
    const interactionScript = `
      <script>
        (function() {
          const init = () => {
            if (window._interactionInitialized) return;
            window._interactionInitialized = true;
            window._pageNumber = ${pageNumber};
            console.log("Interaction Script: Initializing for page", window._pageNumber);

            window.addEventListener('message', (e) => {
              if (e.data && e.data.type === 'set-zoom-state') {
                if (e.data.active) document.body.classList.add('page-is-zoomed');
                else document.body.classList.remove('page-is-zoomed');
              }
            });

            const showTooltip = (el, content, textColor = '#fff', fillColor = 'rgba(0,0,0,0.8)') => {
              let tooltip = document.getElementById('interaction-tooltip');
              if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'interaction-tooltip';
                Object.assign(tooltip.style, {
                  position: 'fixed', background: fillColor, color: textColor,
                  padding: '8px 14px', borderRadius: '12px', fontSize: '13px',
                  fontWeight: '500', pointerEvents: 'none', zIndex: '10000', display: 'none',
                  maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'system-ui, -apple-system, sans-serif'
                });
                
                // Add a transparent bridge and hover effects to the tooltip
                const s = document.createElement('style');
                s.innerHTML = \`
                  #interaction-tooltip::after { 
                    content: ""; position: absolute; top: 100%; left: 0; width: 100%; height: 30px; background: transparent; pointer-events: auto; 
                  }
                  #interaction-tooltip:hover { 
                    filter: brightness(1.15); transform: translateY(-2px) scale(1.02) !important; 
                  }
                  #interaction-tooltip:active {
                    transform: translateY(0px) scale(0.98) !important;
                  }
                \`;
                document.head.appendChild(s);
                
                document.body.appendChild(tooltip);
              }
              
              const type = el.dataset.interaction;
              const isLink = type === 'link';
              const isDownload = type === 'download';
              
              tooltip.style.pointerEvents = (isLink || isDownload) ? 'auto' : 'none';
              tooltip.style.cursor = (isLink || isDownload) ? 'pointer' : 'default';
              tooltip.style.backgroundColor = fillColor || 'rgba(0,0,0,0.8)';
              tooltip.style.color = textColor || '#fff';
              
              if (isLink || isDownload) {
                tooltip.onclick = (e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  console.log("Interaction Script: Tooltip clicked", type);
                  window.executeInteraction(el, 'click'); 
                };
                if (isLink) {
                   const urlToDisp = content || el.dataset.interactionValue || '';
                   const urlDisp = urlToDisp.replace(/^https?:\\/\\/(www\\.)?/, '').split('/')[0];
                   tooltip.innerHTML = '<span style="opacity:0.7;margin-right:6px">Visit</span> <span style="text-decoration:underline">' + urlDisp + '</span>';
                } else {
                   tooltip.textContent = content;
                }
              } else {
                tooltip.onclick = null;
                tooltip.textContent = content;
              }
              
              tooltip.style.display = 'block';
              tooltip.style.transform = 'translateY(0) scale(1)';
              
              const rect = el.getBoundingClientRect();
              const tooltipRect = tooltip.getBoundingClientRect();
              tooltip.style.left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, rect.left + (rect.width / 2) - (tooltipRect.width / 2))) + 'px';
              tooltip.style.top = (rect.top - tooltipRect.height - 12) + 'px';
            };

            const showPopup = (el, content, styles = {}, imageSrc = null) => {
              console.log("Interaction Script: Sending popup message to parent", { content, styles, imageSrc });
              window.parent.postMessage({
                type: 'flipbook-popup',
                data: {
                  content: content,
                  styles: styles,
                  elementType: el.tagName.toLowerCase() === 'img' ? 'image' : 'text',
                  elementSource: imageSrc || (el.tagName.toLowerCase() === 'img' ? el.src : null)
                }
              }, '*');
            };

            window.executeInteraction = (el, eventType) => {
              const type = el.dataset.interaction;
              const trigger = el.dataset.interactionTrigger || 'click';
              const value = el.dataset.interactionValue;
              const content = el.dataset.interactionContent;
              
              console.log("Interaction Script: Executing", type, "Event:", eventType, "Trigger:", trigger);

              if (type === 'tooltip') { 
                if (eventType !== 'hover') return; 
              } else if (type === 'download') {
                if (eventType === 'hover' || eventType === 'click') showTooltip(el, 'Download');
                if (eventType !== 'click' && trigger !== eventType) return;
              } else if (type === 'link') {
                // Link interaction: If trigger is hover, showing a 'Visit Link' bubble is the best way 
                // to satisfy browser security (popups are strictly blocked on auto-hover).
                if (eventType === 'hover' && trigger === 'hover') {
                  showTooltip(el, value);
                  return;
                }
                // If it's a click, we always try to open the link.
                if (eventType !== 'click' && (trigger !== eventType || eventType === 'hover')) return;
              } else if (trigger !== eventType) {
                return;
              }

              if (type === 'link' && value) {
                const url = value.startsWith('http') ? value : 'https://' + value;
                console.log("Interaction Script: Opening link", url, "Trigger:", eventType);
                
                // On hover, browsers strictly block popups. We try window.open, 
                // but we also log it clearly for the user if it might be blocked.
                const win = window.open(url, '_blank');
                if (!win) {
                  console.warn("Interaction Script: Popup might be blocked. Trigger type:", eventType);
                  const a = document.createElement('a');
                  a.href = url;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              } else if (type === 'call' && value) {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                  location.href = 'tel:' + value;
                } else {
                  // Desktop: Redirect to WhatsApp Web
                  let cleanNumber = value.replace(/\D/g, '');
                  // If number is 10 digits, assume +91 as per Interaction Panel UI context
                  if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;
                  window.open('https://web.whatsapp.com/send?phone=' + cleanNumber, '_blank');
                }
              } else if (type === 'navigation' && value) {
                window.parent.postMessage({ type: 'flipbook-navigate', page: value }, '*');
              } else if (type === 'popup') {
                showPopup(el, content, {
                  font: el.dataset.popupFont, size: el.dataset.popupSize,
                  weight: el.dataset.popupWeight, fill: el.dataset.popupFill,
                  autoWidth: el.dataset.popupAutoWidth, autoHeight: el.dataset.popupAutoHeight,
                  fit: el.dataset.popupFit
                }, el.dataset.popupImageSrc);
              } else if (type === 'download' && value) {
                  const triggerDownload = (url, name) => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = name || 'download';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  };

                  const filename = el.dataset.filename || 'download';
                  console.log("Interaction Script: Starting download", { filename, value });
                  
                  if (value.startsWith('data:')) {
                    triggerDownload(value, filename);
                  } else {
                    fetch(value)
                      .then(response => response.blob())
                      .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        triggerDownload(blobUrl, filename);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
                      })
                      .catch(err => {
                        console.warn("Fetch download failed, falling back:", err);
                        triggerDownload(value, filename);
                      });
                  }
              } else if (type === 'zoom' && value) {
                if (eventType === 'click') {
                  const scale = parseFloat(value) || 2;
                  const rect = el.getBoundingClientRect();
                  const elementId = el.id || 'zoom-' + Math.random().toString(36).substr(2, 9);
                  if (!el.id) el.id = elementId;
                  
                  window.parent.postMessage({
                    type: 'flipbook-spread-zoom',
                    data: {
                      elementId,
                      scale,
                      rect: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                      },
                      page: window._pageNumber
                    }
                  }, '*');
                }
              } else if (type === 'tooltip' && content) {
                showTooltip(el, content, el.dataset.tooltipTextColor, el.dataset.tooltipFillColor);
              }
            };

            document.addEventListener('mousemove', (e) => {
              const el = e.target.closest('[data-interaction="zoom"]');
              if (!el) return;
              if (document.body.classList.contains('page-is-zoomed')) {
                const rect = el.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / rect.width;
                const mouseY = (e.clientY - rect.top) / rect.height;
                window.parent.postMessage({
                  type: 'flipbook-zoom-move',
                  data: {
                    mouseX: Math.max(0, Math.min(1, mouseX)),
                    mouseY: Math.max(0, Math.min(1, mouseY))
                  }
                }, '*');
              }
            });

            document.addEventListener('click', (e) => {
              const el = e.target.closest('[data-interaction]');
              if (el) {
                window.executeInteraction(el, 'click');
              } else if (document.body.classList.contains('page-is-zoomed')) {
                // Clicking background also resets zoom
                document.body.style.transform = 'none';
                document.body.classList.remove('page-is-zoomed');
                document.body.style.cursor = 'default';
                setTimeout(() => { document.body.style.transition = ''; document.body.style.willChange = ''; }, 600);
              }
            });

            let lastHovered = null;
            document.addEventListener('mouseover', (e) => {
              const el = e.target.closest('[data-interaction]');
              if (!el || el === lastHovered) return;
              lastHovered = el;
              
              if (el.dataset.interaction === 'zoom') {
                el.style.cursor = 'zoom-in';
                if (!document.body.classList.contains('page-is-zoomed')) {
                  showTooltip(el, 'Click to zoom');
                } else {
                  showTooltip(el, 'Move to pan');
                }
              }
              
              window.executeInteraction(el, 'hover');
            });

            document.addEventListener('mouseout', (e) => {
              const tooltip = document.getElementById('interaction-tooltip');
              const related = e.relatedTarget;
              
              if (related && (related.closest('[data-interaction]') || related.closest('#interaction-tooltip'))) {
                return;
              }

              if (tooltip) tooltip.style.display = 'none';
              
              const el = e.target.closest('[data-interaction]');
              if (el && el.dataset.interaction === 'zoom' && el.dataset.interactionTrigger === 'hover' && (!related || !related.closest('[data-interaction]'))) {
                 el.style.transform = 'none'; el.style.zIndex = '';
              }
              lastHovered = null;
            });
          };

          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
          else init();
        })();
      </script>
    `;

    if (!html) return `
      <!DOCTYPE html>
      <html>
        <head><style>body{margin:0;padding:40px;font-family:Arial,sans-serif;background:#fff;}</style></head>
        <body><p style="color:#999;text-align:center;margin-top:40%;">Empty Page</p></body>
      </html>
    `;

    let content = html;

    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
              * { box-sizing: border-box; }
              #flipbook .page iframe {
                pointer-events: auto;
                user-select: text;
              }
              
              #flipbook *:focus {
                outline: none !important;
                box-shadow: none !important;
              }
              /* Cursor styles for interactive elements */
              [data-interaction] {
                  cursor: pointer;
              }
              
              /* Interaction Highlights */
              [data-interaction-highlight="true"] {
                  transition: all 0.2s ease;
              }
              [data-interaction-highlight="true"]:hover {
                  box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.1);
                  transform: scale(0.97);
              }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
            ${interactionScript}
          </head>
          <body>${html}</body>
        </html>
      `;
    } else {
      // Inject script into existing Head
      const styleString = `
        <style>
            * {
            outline: none !important;
            -webkit-touch-callout: none !important;
            }
            /* Allow interaction and selection */
            *::selection { background: rgba(59, 130, 246, 0.3); }
            *::-moz-selection { background: rgba(59, 130, 246, 0.3); }
            [data-interaction] { cursor: pointer; }
            
            /* Interaction Highlights */
            [data-interaction-highlight="true"] {
                transition: all 0.2s ease;
            }
            [data-interaction-highlight="true"]:hover {
                box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.1);
                transform: scale(0.97);
            }
        </style>
        ${interactionScript}
        `;

      if (content.includes('</head>')) {
        content = content.replace('</head>', `${styleString}</head>`);
      } else if (content.includes('<body')) {
        content = content.replace('<body', `<head>${styleString}</head><body`);
      } else {
        content = styleString + content;
      }
    }

    return content
      .replace(/contenteditable="true"/gi, 'contenteditable="false"');
  }, []);

  // Store calculateTargetOffset in a ref
  const calculateTargetOffsetRef = useRef(calculateTargetOffset);
  useEffect(() => {
    calculateTargetOffsetRef.current = calculateTargetOffset;
  }, [calculateTargetOffset]);

  // Initialize Turn.js
  const initializeTurnJs = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      setIsReady(false);
      setLoadingError(null);

      if (!window.jQuery) {
        await loadScript('/lib/jquery.min.js?v=3.7.1');
      }

      if (!window.jQuery?.fn?.turn) {
        await loadScript('/lib/turn.min.js?v=4.1.0');
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      if (!window.jQuery || !window.jQuery.fn.turn) {
        throw new Error('Turn.js library failed to initialize');
      }

      if (!flipbookRef.current) {
        throw new Error('Flipbook container not found');
      }

      const $ = window.jQuery;
      const $flipbook = $(flipbookRef.current);

      $flipbook.empty();
      $flipbook.removeAttr('style').removeClass();

      const bookWidth = isSingleView ? PAGE_WIDTH : PAGE_WIDTH * 2;
      const bookHeight = PAGE_HEIGHT;

      const initId = ++currentInitIdRef.current;
      setSpreadZoom({ active: false, scale: 1, x: 0, y: 0, elementId: null });

      if (pages.length === 0) return;

      // Build pages
      pages.forEach((pageHTML, index) => {
        const pageNumber = index + 1;

        const $page = $('<div />', {
          'class': `page page-${pageNumber}`,
          'data-page-number': pageNumber,
          css: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            position: 'relative'
          }
        });

        const $wrapper = $('<div />', {
          'class': 'page-wrapper',
          css: {
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }
        });

        const $iframe = $('<iframe />', {
          srcDoc: sanitizeHTML(pageHTML, pageNumber),
          css: {
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: 'auto', // Allow interaction
            backgroundColor: '#ffffff'
          },
          title: `Page ${pageNumber}`,
          scrolling: 'no' // Keep no scrolling to maintain book look, but content is interactive
        });

        const $pageNum = $('<div />', {
          'class': 'page-number-overlay',
          text: pageNumber,
          css: {
            position: 'absolute',
            bottom: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: '#aaa',
            fontWeight: '500',
            zIndex: 10
          }
        });

        $wrapper.append($iframe);
        $page.append($wrapper, $pageNum);
        $flipbook.append($page);
      });

      // Initialize Turn.js
      $flipbook.turn({
        width: bookWidth,
        height: bookHeight,
        autoCenter: true,
        display: isSingleView ? 'single' : 'double',
        acceleration: true,
        gradients: true,
        elevation: 50,
        duration: 800,
        page: 1,
        pages: pages.length,
        direction: 'ltr',

        when: {
          turning: function (event, page, view) {
            const $this = $(this);
            if ($this.data('isAnimating')) {
              event.preventDefault();
              return;
            }

            $this.data('isAnimating', true);
            setIsAnimating(true);
            setAnimationTargetView(view);
            playFlipSound();
          },

          turned: function (event, page, view) {
            const $this = $(this);

            setCurrentPage(page);
            setCurrentView(view || [page]);
            setAnimationTargetView(null);

            setTimeout(() => {
              $this.data('isAnimating', false);
              setIsAnimating(false);
            }, 100);
          },

          start: function (event, pageObject, corner) { },

          end: function (event, pageObject, turned) {
            if (!turned) {
              const $this = $(this);
              $this.data('isAnimating', false);
              setIsAnimating(false);
              setAnimationTargetView(null);
            }
          }
        }
      });

      // Race condition guard: Check if this init attempt is still the current one
      if (initId !== currentInitIdRef.current) {
        console.warn('Turn.js: Initialization superseded by newer call');
        destroyTurn();
        return;
      }

      turnInstanceRef.current = $flipbook;

      const initialView = $flipbook.turn('view');
      setCurrentView(initialView || [1]);
      setCurrentPage(1);
      setIsReady(true);
      initializationRef.current = false;

      console.log('Turn.js initialized:', isSingleView ? 'single' : 'double', 'view');

    } catch (error) {
      console.error('Turn.js error:', error);
      setLoadingError(error.message || 'Failed to initialize flipbook');
      initializationRef.current = false;
    }
  }, [isSingleView, pages, loadScript, sanitizeHTML, playFlipSound]);

  // Initialize on mount and view change
  useEffect(() => {
    destroyTurn();
    initializationRef.current = false;
    setCenterOffset(0);
    setAnimationTargetView(null);

    const timer = setTimeout(() => {
      initializeTurnJs();
    }, 200);

    return () => {
      clearTimeout(timer);
      destroyTurn();
    };
  }, [isSingleView, pages]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    const targetPage = Math.max(1, Math.min(totalPages, page));
    turnInstanceRef.current.turn('page', targetPage);
  }, [isReady, isAnimating, totalPages]);

  const nextPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage < totalPages) {
      turnInstanceRef.current.turn('next');
    }
  }, [isReady, isAnimating, currentPage, totalPages]);

  // Listen for navigation messages from iframes
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'flipbook-navigate') {
        const pageNum = Number(event.data.page);
        if (!isNaN(pageNum)) {
          goToPage(pageNum);
        }
      }
      if (event.data && event.data.type === 'flipbook-popup') {
        setPopupData({
          isOpen: true,
          ...event.data.data
        });
      }
      if (event.data && event.data.type === 'flipbook-spread-zoom') {
        const { elementId, scale, rect, page } = event.data.data;
        const current = spreadZoomRef.current;

        if (current.active && current.elementId === elementId) {
          setSpreadZoom({ active: false, scale: 1, x: 0, y: 0, elementId: null, originalRect: null, page: null, centerOffset: 0, isEntering: false, isSingleView: false });
        } else {
          const elementCenterX = rect.left + rect.width / 2;
          const elementCenterY = rect.top + rect.height / 2;

          // In Single View, we subtract PAGE_WIDTH/2 because the iframe's left=0 starts half-width from viewport center 
          const relX = isSingleView ? (elementCenterX - PAGE_WIDTH / 2) : ((page % 2 === 0) ? (elementCenterX - PAGE_WIDTH) : elementCenterX);
          const relY = elementCenterY - PAGE_HEIGHT / 2;

          const dx = -(relX + centerOffset) * scale;
          const dy = -relY * scale;

          setSpreadZoom({
            active: true,
            scale: scale,
            x: dx,
            y: dy,
            elementId,
            originalRect: rect,
            page,
            centerOffset,
            isEntering: true,
            isSingleView: isSingleView
          });

          // After initial transition, mark as no longer entering to enable fast hover follow
          setTimeout(() => {
            setSpreadZoom(prev => ({ ...prev, isEntering: false }));
          }, 750);
        }
      }

      if (event.data && event.data.type === 'flipbook-zoom-move') {
        const { mouseX, mouseY } = event.data.data;
        const current = spreadZoomRef.current;

        if (current.active && current.originalRect) {
          const { originalRect, page, scale, centerOffset, isSingleView: zoomIsSingle } = current;

          // Amazon-style: Pan within the element based on cursor position
          const panX = (mouseX - 0.5) * (originalRect.width * 0.8);
          const panY = (mouseY - 0.5) * (originalRect.height * 0.8);

          const elementCenterX = originalRect.left + originalRect.width / 2;
          const elementCenterY = originalRect.top + originalRect.height / 2;

          // Use stored view mode from when zoom started
          const relX = zoomIsSingle ? (elementCenterX - PAGE_WIDTH / 2) : ((page % 2 === 0) ? (elementCenterX - PAGE_WIDTH) : elementCenterX);
          const relY = elementCenterY - PAGE_HEIGHT / 2;

          const dx = -(relX + centerOffset + panX) * scale;
          const dy = -(relY + panY) * scale;

          setSpreadZoom(prev => ({
            ...prev,
            x: dx,
            y: dy
          }));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [goToPage]);

  // Sync zoom state to all iframess
  useEffect(() => {
    const iframes = document.querySelectorAll('#flipbook iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'set-zoom-state',
        active: spreadZoom.active
      }, '*');
    });
  }, [spreadZoom.active]);

  const prevPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage > 1) {
      turnInstanceRef.current.turn('previous');
    }
  }, [isReady, isAnimating, currentPage]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    if (isMobile) return;
    const currentPageNum = currentPage;
    destroyTurn();
    setIsSingleView(prev => !prev);

    setTimeout(() => {
      if (turnInstanceRef.current) {
        turnInstanceRef.current.turn('page', currentPageNum);
      }
    }, 600);
  }, [isMobile, currentPage, destroyTurn]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isReady) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages);
          break;
        case 'Escape':
          if (isFullscreen) toggleFullscreen();
          else if (showThumbnails) setShowThumbnails(false);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, nextPage, prevPage, goToPage, totalPages, isFullscreen, showThumbnails]);

  // Autoplay
  useEffect(() => {
    let interval;
    if (isPlaying && isReady && !isAnimating) {
      interval = setInterval(() => {
        if (currentPage < totalPages) {
          nextPage();
        } else {
          setIsPlaying(false);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isReady, isAnimating, currentPage, totalPages, nextPage]);

  // Zoom
  const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.1));

  // Handle Ctrl + Scroll for zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom(prev => Math.min(1.5, prev + 0.05));
        } else {
          setZoom(prev => Math.max(0.4, prev - 0.05));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Display info
  const getDisplayInfo = () => {
    if (isSingleView) {
      return `${currentPage} / ${totalPages}`;
    }
    const view = currentView.filter(p => p > 0);
    if (view.length === 2) {
      return `${view[0]}-${view[1]} / ${totalPages}`;
    }
    return `${currentPage} / ${totalPages}`;
  };

  // Inject Turn.js styles
  useEffect(() => {
    const styleId = 'flipbook-turnjs-styles';

    // Check if styles already exist
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Turn.js Dynamic Class Styles */
      #flipbook .page {
        background: #fff;
        position: absolute;
        top: 0;
      }
      
      #flipbook.single-mode .page {
        background: linear-gradient(to right, #f5f5f5 0%, #ffffff 3%, #ffffff 100%);
        box-shadow: 
          inset 12px 0 25px -8px rgba(0, 0, 0, 0.15),
          inset 6px 0 10px -4px rgba(0, 0, 0, 0.08),
          inset 3px 0 6px -2px rgba(0, 0, 0, 0.05),
          -4px 0 15px rgba(0, 0, 0, 0.08),
          0 8px 30px rgba(0, 0, 0, 0.12);
        border-radius: 3px;
      }
      
      #flipbook.single-mode .page::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(to right,
          rgba(0, 0, 0, 0.06) 0%,
          rgba(0, 0, 0, 0.03) 30%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook.double-mode .odd {
        background: linear-gradient(to right, #e5e5e5 0%, #f0f0f0 2%, #f8f8f8 4%, #ffffff 8%, #ffffff 100%);
        border-radius: 0 3px 3px 0;
        box-shadow: 
          inset 15px 0 30px -10px rgba(0, 0, 0, 0.18),
          inset 8px 0 15px -5px rgba(0, 0, 0, 0.1),
          inset 4px 0 8px -2px rgba(0, 0, 0, 0.06),
          4px 0 12px rgba(0, 0, 0, 0.06),
          0 6px 20px rgba(0, 0, 0, 0.1);
      }
      
      #flipbook.double-mode .odd::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to right,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.04) 40%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook.double-mode .even {
        background: linear-gradient(to left, #e5e5e5 0%, #f0f0f0 2%, #f8f8f8 4%, #ffffff 8%, #ffffff 100%);
        border-radius: 3px 0 0 3px;
        box-shadow: 
          inset -15px 0 30px -10px rgba(0, 0, 0, 0.18),
          inset -8px 0 15px -5px rgba(0, 0, 0, 0.1),
          inset -4px 0 8px -2px rgba(0, 0, 0, 0.06),
          -4px 0 12px rgba(0, 0, 0, 0.06),
          0 6px 20px rgba(0, 0, 0, 0.1);
      }
      
      #flipbook.double-mode .even::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to left,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.04) 40%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook .page-1,
      #flipbook .p1 {
        border-radius: 0 4px 4px 0 !important;
        background: linear-gradient(to right, #e0e0e0 0%, #ebebeb 2%, #f5f5f5 5%, #ffffff 10%, #ffffff 100%) !important;
        box-shadow: 
          inset 20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset 10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset 5px 0 10px -3px rgba(0, 0, 0, 0.08),
          6px 0 18px rgba(0, 0, 0, 0.1),
          0 10px 35px rgba(0, 0, 0, 0.15) !important;
      }
      
      #flipbook .page:last-child {
        border-radius: 4px 0 0 4px;
        background: linear-gradient(to left, #e0e0e0 0%, #ebebeb 2%, #f5f5f5 5%, #ffffff 10%, #ffffff 100%);
        box-shadow: 
          inset -20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset -10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset -5px 0 10px -3px rgba(0, 0, 0, 0.08),
          -6px 0 18px rgba(0, 0, 0, 0.1),
          0 10px 35px rgba(0, 0, 0, 0.15);
      }
      
      #flipbook.double-mode::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 8px;
        transform: translateX(-50%);
        background: linear-gradient(to right, 
          rgba(0, 0, 0, 0.15) 0%, 
          rgba(0, 0, 0, 0.08) 20%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(0, 0, 0, 0.08) 80%,
          rgba(0, 0, 0, 0.15) 100%
        );
        z-index: 1000;
        pointer-events: none;
      }
      
      #flipbook.double-mode::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.3);
        z-index: 1001;
        pointer-events: none;
      }
      
      #flipbook .gradient {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
      
      #flipbook * {
        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;
      }
      
      #flipbook .page {
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
      }
      
      #flipbook .turn-page {
        z-index: 500 !important;
      }
      
      #flipbook .page.turning {
        z-index: 1000 !important;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25), 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#F5F5F5] z-[100] flex flex-col font-sans text-gray-800"
      onClick={(e) => {
        if (spreadZoom.active) {
          setSpreadZoom({ active: false, scale: 1, x: 0, y: 0, elementId: null });
        }
      }}
    >
      {/* Top Bar */}
      <div className={`flex items-center justify-between px-6 py-4 bg-[#F5F5F5] z-20 transition-all duration-500 ${spreadZoom.active ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center w-64">
          <div className="bg-white p-2 border border-gray-200 shadow-sm">
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain bg-blend-multiply" />
          </div>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-normal text-gray-900 tracking-wide">{pageName}</h1>
        </div>
        <div className="w-64 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-gray-200 border border-black rounded-md text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to work
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#F5F5F5]">

        {/* Loading State */}
        {!isReady && !loadingError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F5F5F5] z-50">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">Preparing flipbook...</p>
          </div>
        )}

        {/* Error State */}
        {loadingError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <p className="text-red-500 mb-4">{loadingError}</p>
            <button
              onClick={() => {
                setLoadingError(null);
                initializationRef.current = false;
                initializeTurnJs();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation Arrows - Only show when not zoomed */}
        {isReady && !spreadZoom.active && (
          <>
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || isAnimating}
              className={`absolute left-6 z-10 p-2 rounded-full transition-colors
                ${currentPage <= 1 || isAnimating
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200'}`}
            >
              <ChevronLeft size={40} className="text-gray-700" strokeWidth={1} />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || isAnimating}
              className={`absolute right-6 z-10 p-2 rounded-full transition-colors
                ${currentPage >= totalPages || isAnimating
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200'}`}
            >
              <ChevronRight size={40} className="text-gray-700" strokeWidth={1} />
            </button>
          </>
        )}

        {/* Backdrop for Zoom Focus */}
        <div
          className={`absolute inset-0 z-[5] bg-black transition-all duration-700 ease-in-out ${spreadZoom.active ? 'bg-opacity-40 backdrop-blur-[2px] opacity-100' : 'bg-opacity-0 opacity-0 pointer-events-none'}`}
        />

        {/* Flipbook Wrapper with Smooth Centering */}
        <div
          className="flex items-center justify-center relative z-10 will-change-transform"
          style={{
            transform: spreadZoom.active
              ? `translate(${spreadZoom.x}px, ${spreadZoom.y}px) scale(${spreadZoom.scale})`
              : `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: spreadZoom.active
              ? (spreadZoom.isEntering ? 'transform 0.7s ease-out' : 'transform 0.1s linear')
              : 'transform 0.7s ease-out'
          }}
        >
          {/* Center wrapper - handles offset for single page centering */}
          <div
            className="flex items-center justify-center will-change-transform"
            style={{
              transform: `translateX(${centerOffset}px)`,
              transition: isAnimating
                ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Turn.js target element */}
            <div
              id="flipbook"
              ref={flipbookRef}
              className={`relative shadow-[0_10px_40px_rgba(0,0,0,0.2)] ${isSingleView ? 'single-mode' : 'double-mode'}`}
              style={{
                visibility: isReady ? 'visible' : 'hidden'
              }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <div className="absolute bottom-16 left-0 right-0 bg-[#333]/95 backdrop-blur-sm z-40 p-4 border-t border-gray-700">
          <div className="flex gap-4 overflow-x-auto pb-2 justify-center scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {pages.map((html, idx) => {
              const pageNum = idx + 1;
              const isVisible = currentView.includes(pageNum);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    goToPage(pageNum);
                    setShowThumbnails(false);
                  }}
                  className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 w-20 h-28
                    ${isVisible
                      ? 'ring-2 ring-indigo-500 scale-105'
                      : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className="w-full h-full bg-white rounded-sm overflow-hidden flex items-center justify-center text-gray-500 font-bold shadow-md">
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`h-14 bg-[#3E3E3E] text-gray-300 flex items-center px-4 justify-between z-30 select-none transition-all duration-500 ${spreadZoom.active ? 'opacity-30 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <div className="w-16 flex justify-start">
          <button className="p-2 hover:text-white transition-colors">
            <List size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Thumbnails & Autoplay */}
          <div className="flex items-center gap-2 border-r border-gray-600 pr-6">
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${showThumbnails ? 'text-white bg-gray-600' : ''}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${isPlaying ? 'text-green-400' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>

          {/* Page Slider */}
          <div className="flex items-center gap-3 w-64">
            <span className="text-xs text-gray-400 w-12 text-right">{getDisplayInfo()}</span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              disabled={isAnimating}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:bg-[#6C63FF] 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:bg-[#6C63FF]
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-none"
            />
          </div>

          {/* View Mode & Features */}
          <div className="flex items-center gap-4 border-l border-gray-600 pl-6 border-r pr-6">
            {!isMobile && (
              <button
                className="p-1.5 hover:text-white transition-colors"
                onClick={toggleViewMode}
                title={isSingleView ? "Switch to Double" : "Switch to Single"}
              >
                {isSingleView ? <BookOpen size={18} /> : <FileText size={18} />}
              </button>
            )}
            <button className="p-1.5 hover:text-white transition-colors">
              <Bookmark size={18} />
            </button>
            <button className="p-1.5 hover:text-white transition-colors">
              <Music size={18} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.4}
              className="hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              className="hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="w-auto flex justify-end gap-3 pl-6 border-l border-gray-600">
          <button className="hover:text-white transition-colors">
            <Share2 size={18} />
          </button>
          <button className="hover:text-white transition-colors">
            <Download size={18} />
          </button>
          <button className="hover:text-white transition-colors" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Global Popup Message Overlay - Covers entire screen */}
      {popupData.isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPopupData({ ...popupData, isOpen: false })}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&display=swap');
          `}</style>
          <div
            className="bg-white relative border border-[#00a2ff] shadow-2xl flex flex-col items-center justify-center p-12 animate-scaleUp overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '85%',
              maxWidth: '95%',
              maxHeight: '95vh',
              minWidth: '320px',
              minHeight: '400px'
            }}
          >
            <button
              onClick={() => setPopupData({ ...popupData, isOpen: false })}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm bg-white"
            >
              <X size={24} />
            </button>

            <div className="w-full flex flex-col items-center justify-center gap-10">
              {popupData.elementType === 'image' && (
                <img
                  src={popupData.elementSource}
                  alt="Popup"
                  className="max-w-full max-h-[55vh] shadow-md rounded-sm"
                  style={{
                    objectFit: popupData.styles.fit === 'Fill' ? 'cover' : (popupData.styles.fit === 'Stretch' ? 'fill' : 'contain')
                  }}
                />
              )}

              {popupData.content && (
                <div
                  className="w-full text-center px-8"
                  style={{
                    fontFamily: `'${popupData.styles.font || 'Poppins'}', sans-serif`,
                    fontSize: `${popupData.styles.size || '32'}px`,
                    fontWeight: popupData.styles.weight === 'Bold' ? '700' : (popupData.styles.weight === 'Semi Bold' ? '600' : '400'),
                    color: popupData.styles.fill || '#000000',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {popupData.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles for scaleUp animation */}
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FlipbookPreview;