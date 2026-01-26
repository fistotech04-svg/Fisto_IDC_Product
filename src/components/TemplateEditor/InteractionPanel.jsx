import React, { useState, useEffect } from 'react';
import {
  MousePointerClick,
  ChevronUp,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  ZoomIn,
  MessageSquare,
  Download,
  Info,
  Check,
  FileText,
  Type,
  Maximize,

  Edit2,
  Zap,
  Eye,
  Upload,
} from 'lucide-react';

const InteractionPanel = ({ selectedElement, onUpdate, onPopupPreviewUpdate, isOpen, onToggle }) => {
  const popupFileInputRef = React.useRef(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Determine if open based on prop or internal state
  const isInteractionsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const [interactionType, setInteractionType] = useState('none');
  const [interactionTrigger, setInteractionTrigger] = useState('click');
  const [zoomLevel, setZoomLevel] = useState(2);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showTriggerDropdown, setShowTriggerDropdown] = useState(false);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const dropdownRef = React.useRef(null);

  // Values for inputs
  const [linkUrl, setLinkUrl] = useState('');
  const [navPage, setNavPage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // Advanced State for Popup & Tooltip
  const [popupText, setPopupText] = useState('');
  const [popupFont, setPopupFont] = useState('Poppins');
  const [popupSize, setPopupSize] = useState('24');
  const [popupWeight, setPopupWeight] = useState('Semi Bold');
  const [popupFillColor, setPopupFillColor] = useState('#000000');
  const [popupFit, setPopupFit] = useState('Fit');
  const [popupAutoWidth, setPopupAutoWidth] = useState(true);
  const [popupAutoHeight, setPopupAutoHeight] = useState(true);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(true);
  const [showPopupPreview, setShowPopupPreview] = useState(false);

  const [tooltipText, setTooltipText] = useState('');
  const [tooltipTextColor, setTooltipTextColor] = useState('#ffffff');
  const [tooltipFillColor, setTooltipFillColor] = useState('#000000'); // Default black background for tooltip

  // Sync state with selected element attributes on mount/change
  useEffect(() => {
    if (selectedElement) {
      setInteractionType(selectedElement.getAttribute('data-interaction') || 'none');
      setInteractionTrigger(selectedElement.getAttribute('data-interaction-trigger') || 'click');
      const val = selectedElement.getAttribute('data-interaction-value') || '';
      const content = selectedElement.getAttribute('data-interaction-content') || '';

      setIsHighlighted(selectedElement.getAttribute('data-interaction-highlight') !== 'false');

      // Set specific input based on type
      const type = selectedElement.getAttribute('data-interaction');
      if (type === 'link') setLinkUrl(val);
      if (type === 'navigation') setNavPage(val);
      if (type === 'call') setPhoneNumber(val);
      if (type === 'zoom') setZoomLevel(Number(val) || 2);

      if (type === 'download') {
        setDownloadUrl(val || '');
      }

      if (type === 'popup') {
        setPopupText(content);
        setPopupFont(selectedElement.getAttribute('data-popup-font') || 'Poppins');
        setPopupSize(selectedElement.getAttribute('data-popup-size') || '24');
        setPopupWeight(selectedElement.getAttribute('data-popup-weight') || 'Semi Bold');
        setPopupFillColor(selectedElement.getAttribute('data-popup-fill') || '#000000');
        setPopupFit(selectedElement.getAttribute('data-popup-fit') || 'Fit');
        setPopupAutoWidth(selectedElement.getAttribute('data-popup-auto-width') !== 'false');
        setPopupAutoHeight(selectedElement.getAttribute('data-popup-auto-height') !== 'false');
        setPopupImageSrc(selectedElement.getAttribute('data-popup-image-src') || (selectedElement.tagName.toLowerCase() === 'img' ? selectedElement.src : ''));
      }

      if (type === 'tooltip') {
        setTooltipText(content);
        setTooltipTextColor(selectedElement.getAttribute('data-tooltip-text-color') || '#ffffff');
        setTooltipFillColor(selectedElement.getAttribute('data-tooltip-fill-color') || '#000000');
      }

      if (onPopupPreviewUpdate) {
        if (type === 'popup' && showPopupPreview) {
          onPopupPreviewUpdate({
            isOpen: true,
            content: content || selectedElement.innerText || selectedElement.textContent || '',
            elementType: selectedElement.tagName.toLowerCase() === 'img' ? 'image' : 'text',
            elementSource: selectedElement.getAttribute('data-popup-image-src') || (selectedElement.tagName.toLowerCase() === 'img' ? selectedElement.src : (selectedElement.innerText || selectedElement.textContent)),
            styles: {
              font: selectedElement.getAttribute('data-popup-font') || 'Poppins',
              size: selectedElement.getAttribute('data-popup-size') || '24',
              weight: selectedElement.getAttribute('data-popup-weight') || 'Semi Bold',
              fill: selectedElement.getAttribute('data-popup-fill') || '#000000',
              autoWidth: selectedElement.getAttribute('data-popup-auto-width') !== 'false',
              autoHeight: selectedElement.getAttribute('data-popup-auto-height') !== 'false',
              fit: selectedElement.getAttribute('data-popup-fit') || 'Fit'
            }
          });
        } else {
          onPopupPreviewUpdate({ isOpen: false });
        }
      }
    } else {
      if (onPopupPreviewUpdate) onPopupPreviewUpdate({ isOpen: false });
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
        setShowTriggerDropdown(false);
        setShowFitDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup: Close preview on unmount
    return () => {
      if (onPopupPreviewUpdate) onPopupPreviewUpdate({ isOpen: false });
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedElement, onPopupPreviewUpdate, showPopupPreview]);

  if (!selectedElement) return null;

  // Helper to get element display name
  const getElementLabel = () => {
    if (!selectedElement) return 'Element';
    const tag = selectedElement.tagName.toLowerCase();

    // Check if it's text-like
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em'].includes(tag)) {
      return 'Text';
    }

    if (tag === 'img') return 'Image';
    if (tag === 'button') return 'Button';
    if (tag === 'a') return 'Link';
    if (tag === 'div') return 'Container';
    return 'Element';
  };

  const formattedElementName = getElementLabel();


  // ================= APPLY INTERACTIONS =================

  const applyInteraction = (type, value, content = '', triggerOverride = null, highlightOverride = null, styleOverrides = {}) => {
    setInteractionType(type);
    const trigger = triggerOverride || interactionTrigger;
    const highlight = highlightOverride !== null ? highlightOverride : isHighlighted;

    // Send update to parent preview if it's a popup
    if (onPopupPreviewUpdate) {
      if (type === 'popup' && (showPopupPreview || triggerOverride === 'immediate')) {
        onPopupPreviewUpdate({
          isOpen: true,
          content: content || popupText, // Use existing state if content is empty
          elementType: selectedElement.tagName.toLowerCase() === 'img' ? 'image' : 'text',
          elementSource: styleOverrides.imageSrc || popupImageSrc || (selectedElement.tagName.toLowerCase() === 'img' ? selectedElement.src : (selectedElement.innerText || selectedElement.textContent)),
          styles: {
            font: styleOverrides.font || popupFont,
            size: styleOverrides.size || popupSize,
            weight: styleOverrides.weight || popupWeight,
            fill: styleOverrides.fill || popupFillColor,
            fit: styleOverrides.fit || popupFit,
            autoWidth: styleOverrides.autoWidth !== undefined ? styleOverrides.autoWidth : popupAutoWidth,
            autoHeight: styleOverrides.autoHeight !== undefined ? styleOverrides.autoHeight : popupAutoHeight
          }
        });
      } else if (type !== 'popup' || (!showPopupPreview && triggerOverride !== 'immediate')) {
        onPopupPreviewUpdate({ isOpen: false });
      }
    }

    if (type === 'none') {
      selectedElement.removeAttribute('data-interaction');
      selectedElement.removeAttribute('data-interaction-value');
      selectedElement.removeAttribute('data-interaction-content');
      selectedElement.removeAttribute('data-interaction-trigger');
      selectedElement.removeAttribute('data-interaction-highlight');
      selectedElement.removeAttribute('data-filename');

      // Remove extra attributes
      selectedElement.removeAttribute('data-popup-font');
      selectedElement.removeAttribute('data-popup-size');
      selectedElement.removeAttribute('data-popup-weight');
      selectedElement.removeAttribute('data-popup-fill');
      selectedElement.removeAttribute('data-tooltip-text-color');
      selectedElement.removeAttribute('data-tooltip-fill-color');
      selectedElement.removeAttribute('data-popup-auto-width');
      selectedElement.removeAttribute('data-popup-auto-height');
      selectedElement.removeAttribute('data-popup-fit');
      selectedElement.removeAttribute('data-popup-image-src');

      selectedElement.style.cursor = '';
    } else {
      selectedElement.setAttribute('data-interaction', type);
      selectedElement.setAttribute('data-interaction-trigger', trigger);
      selectedElement.setAttribute('data-interaction-highlight', highlight);

      if (value) selectedElement.setAttribute('data-interaction-value', value);
      else selectedElement.removeAttribute('data-interaction-value');

      if (content) selectedElement.setAttribute('data-interaction-content', content);
      else selectedElement.removeAttribute('data-interaction-content');

      // Save filename if it's a download
      if (type === 'download' && value) {
        const isImage = selectedElement.tagName.toLowerCase() === 'img';
        let fname = 'Document.txt';
        if (isImage) {
          const src = selectedElement.src || '';
          fname = src.startsWith('data:') ? 'image.png' : (src.split('/').pop().split('?')[0] || 'image.png');
        } else {
          const text = (selectedElement.innerText || selectedElement.textContent || '').trim();
          fname = text ? (text.substring(0, 10).replace(/[^a-z0-9]/gi, '_') + '.txt') : 'document.txt';
        }
        selectedElement.setAttribute('data-filename', fname);

        // Save to local storage as requested
        localStorage.setItem('flipbook_last_download', JSON.stringify({
          id: selectedElement.id,
          name: fname,
          data: value,
          timestamp: new Date().toISOString()
        }));
      } else {
        selectedElement.removeAttribute('data-filename');
      }

      // Save extra attributes for specific types
      if (type === 'popup') {
        selectedElement.setAttribute('data-popup-font', styleOverrides.font || popupFont);
        selectedElement.setAttribute('data-popup-size', styleOverrides.size || popupSize);
        selectedElement.setAttribute('data-popup-weight', styleOverrides.weight || popupWeight);
        selectedElement.setAttribute('data-popup-fill', styleOverrides.fill || popupFillColor);
        selectedElement.setAttribute('data-popup-fit', styleOverrides.fit || popupFit);
        selectedElement.setAttribute('data-popup-auto-width', styleOverrides.autoWidth !== undefined ? styleOverrides.autoWidth : popupAutoWidth);
        selectedElement.setAttribute('data-popup-auto-height', styleOverrides.autoHeight !== undefined ? styleOverrides.autoHeight : popupAutoHeight);
        if (styleOverrides.imageSrc || popupImageSrc) {
          selectedElement.setAttribute('data-popup-image-src', styleOverrides.imageSrc || popupImageSrc);
        }
      }
      if (type === 'tooltip') {
        selectedElement.setAttribute('data-tooltip-text-color', tooltipTextColor);
        selectedElement.setAttribute('data-tooltip-fill-color', tooltipFillColor);
      }

      selectedElement.style.cursor = 'pointer';
    }

    onUpdate(selectedElement.id, {
      interactions: { type, value, content, trigger: trigger, highlight: highlight }
    });
  };

  // Wrapper to trigger updates when advanced inputs change
  const updateAdvanced = (type, styleOverrides = {}) => {
    let value = null;
    let content = '';
    if (type === 'popup') content = popupText;
    if (type === 'tooltip') content = tooltipText;

    applyInteraction(type, value, content, null, null, styleOverrides);
  };

  const handleTypeChange = (newType) => {
    setInteractionType(newType);
    let finalTrigger = interactionTrigger;

    // Reset trigger if switching to link and currently on hover (as hover is not allowed for links)
    if (newType === 'link' && interactionTrigger === 'hover') {
      finalTrigger = 'click';
      setInteractionTrigger('click');
    }
    if (newType === 'none') {
      applyInteraction('none', null);
    } else {
      let currentValue =
        newType === 'link' ? linkUrl :
          newType === 'navigation' ? navPage :
            newType === 'call' ? phoneNumber :
              newType === 'zoom' ? zoomLevel :
                newType === 'download' ? downloadUrl : null;

      // Automatically set download URL if missing
      if (newType === 'download' && !currentValue) {
        if (selectedElement.tagName.toLowerCase() === 'img') {
          currentValue = selectedElement.src;
        } else {
          const textContent = selectedElement.innerText || selectedElement.textContent || '';
          currentValue = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
        }
        setDownloadUrl(currentValue);
        // Immediately apply the interaction with the generated value
        applyInteraction(newType, currentValue, '', null, null, {});
        return;
      }

      let currentContent =
        newType === 'popup' ? (popupText || (selectedElement.tagName.toLowerCase() !== 'img' ? (selectedElement.innerText || selectedElement.textContent) : '')) :
          newType === 'tooltip' ? tooltipText : '';

      const styleOverrides = {};

      if (newType === 'popup') {
        setShowPopupPreview(true);
        // Auto-inherit styles if not already set
        if (!selectedElement.getAttribute('data-popup-font')) {
          const compStyle = window.getComputedStyle(selectedElement);
          const fFamily = compStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          const fSize = parseInt(compStyle.fontSize) || 24;
          const fWeight = compStyle.fontWeight;
          const fColor = compStyle.color;

          // Convert weight number or name to label
          let weightLabel = 'Regular';
          const weightVal = String(fWeight).toLowerCase();
          if (weightVal === 'bold' || parseInt(fWeight) >= 700) weightLabel = 'Bold';
          else if (weightVal === 'semibold' || weightVal === '600' || parseInt(fWeight) >= 600) weightLabel = 'Semi Bold';

          // Convert color to hex
          const rgb = fColor.match(/\d+/g);
          const hexColor = rgb ? `#${((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1)}` : '#000000';

          const validFonts = ['Poppins', 'Roboto', 'Open Sans'];
          const matchedFont = validFonts.find(f => fFamily.includes(f)) || 'Poppins';

          setPopupFont(matchedFont);
          setPopupSize(String(fSize));
          setPopupWeight(weightLabel);
          setPopupFillColor(hexColor);

          styleOverrides.font = matchedFont;
          styleOverrides.size = String(fSize);
          styleOverrides.weight = weightLabel;
          styleOverrides.fill = hexColor;
        }

        if (!popupText && selectedElement.tagName.toLowerCase() !== 'img') {
          const content = selectedElement.innerText || selectedElement.textContent;
          setPopupText(content);
          applyInteraction(newType, currentValue, content, 'immediate', null, styleOverrides);
          return;
        }
      }

      applyInteraction(newType, currentValue, currentContent, newType === 'popup' ? 'immediate' : finalTrigger, null, styleOverrides);
    }
  };

  const handleImageReplace = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSrc = event.target.result;
      setPopupImageSrc(newSrc);
      applyInteraction('popup', null, popupText, null, null, { imageSrc: newSrc });

      // Update preview immediately if open
      if (onPopupPreviewUpdate && showPopupPreview) {
        onPopupPreviewUpdate({
          isOpen: true,
          content: popupText,
          elementType: 'image',
          elementSource: newSrc,
          styles: {
            font: popupFont,
            size: popupSize,
            weight: popupWeight,
            fill: popupFillColor,
            fit: popupFit
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerChange = (newTrigger) => {
    setInteractionTrigger(newTrigger);
    // Explicitly update the attribute and trigger a full apply
    selectedElement.setAttribute('data-interaction-trigger', newTrigger);

    const currentValue =
      interactionType === 'link' ? linkUrl :
        interactionType === 'navigation' ? navPage :
          interactionType === 'call' ? phoneNumber :
            interactionType === 'zoom' ? zoomLevel :
              interactionType === 'download' ? downloadUrl : null;

    const currentContent =
      interactionType === 'popup' ? popupText :
        interactionType === 'tooltip' ? tooltipText : '';

    applyInteraction(interactionType, currentValue, currentContent, newTrigger);
  };

  // ================= RENDER INTERFACE =================

  const renderTargetInput = () => {
    // This renders the RIGHT side of the flow (the target input OR visual representation)
    switch (interactionType) {
      case 'none':
        return (
          <div className="w-[2.5vw] h-[2.5vw] bg-gray-100 rounded-[0.4vw] flex items-center justify-center text-gray-400">
            ?
          </div>
        );

        return (
          <div className="flex items-center gap-[0.5vw]">
            <button
              className="w-[2vw] h-[2vw] flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
              onClick={() => {
                const newZoom = Math.max(1.1, zoomLevel - 0.1);
                setZoomLevel(newZoom);
                applyInteraction('zoom', newZoom);
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="border border-gray-400 rounded-[0.25vw] px-[0.75vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-900 min-w-[2.6vw] text-center bg-white cursor-default">
              {Number(zoomLevel).toFixed(0)}X
            </div>

            <button
              className="w-[2vw] h-[2vw] flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
              onClick={() => {
                const newZoom = Math.min(5, zoomLevel + 0.1);
                setZoomLevel(newZoom);
                applyInteraction('zoom', newZoom);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        );

      case 'link':
        return (
          <div className="flex flex-col items-end gap-[0.5vw] flex-grow min-w-[10.5vw]">
            <div className="relative w-full">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onBlur={() => applyInteraction('link', linkUrl)}
                placeholder="https://example.com"
                className="w-full border border-gray-400 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className="border border-gray-400 rounded-[0.4vw] px-[0.5vw] py-[0.4vw] bg-white flex items-center gap-[0.5vw] min-w-[5.2vw]">
            <select
              value={navPage}
              onChange={(e) => {
                setNavPage(e.target.value);
                applyInteraction('navigation', e.target.value);
              }}
              className="appearance-none bg-transparent text-sm text-gray-700 font-medium outline-none w-full pr-4"
              style={{ backgroundImage: 'none' }}
            >
              <option value="" disabled>Select Page</option>
              <option value="1">Page 1</option>
              <option value="2">Page 2</option>
              <option value="3">Page 3</option>
              <option value="4">Page 4</option>
            </select>
            <ChevronUp size={14} className="text-gray-500 rotate-180 flex-shrink-0" />
          </div>
        );

      case 'call':
        return (
          <div className="flex flex-col items-end gap-[0.5vw]">
            <div className="border border-gray-400 rounded-[0.4vw] flex items-center bg-white overflow-hidden p-[0.25vw]">
              <div className="flex items-center gap-1 px-[0.5vw] border-r border-gray-200 bg-gray-50 rounded-[0.2vw] mx-[0.25vw] py-[0.15vw]">
                <span className="text-[0.65vw] text-gray-600 font-medium">+91</span>
                <ChevronUp size={10} className="text-gray-400 rotate-180" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => applyInteraction('call', phoneNumber)}
                placeholder="1234567890"
                className="w-[6vw] px-[0.5vw] py-[0.25vw] text-[0.75vw] text-gray-700 outline-none"
              />
            </div>
            <button
              className="bg-black text-white text-[0.65vw] font-semibold px-[1vw] py-[0.4vw] rounded-[0.4vw] flex items-center gap-1 hover:bg-gray-800 transition-colors"
              onClick={() => applyInteraction('call', phoneNumber)}
            >
              <Check size={12} strokeWidth={3} />
              Done
            </button>
          </div>
        );

      case 'popup':
        // Display actual element thumbnail or text snippet
        const isElementImage = selectedElement.tagName.toLowerCase() === 'img';

        return (
          <div className="flex flex-col items-center">
            <div
              className="border border-gray-400 border-dashed rounded-[14px] p-2 bg-white shadow-sm overflow-hidden mb-1 flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors group relative"
              onClick={() => popupFileInputRef.current?.click()}
              title="Click to replace image"
            >
              <input
                ref={popupFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageReplace}
              />
              <div className="w-[4vw] h-[4vw] bg-gray-50 rounded-[0.4vw] flex items-center justify-center overflow-hidden mb-1">
                {isElementImage || popupImageSrc ? (
                  <img src={popupImageSrc || selectedElement.src} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-green-50 flex items-center justify-center p-1">
                    <Type size={24} className="text-green-400" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              {isElementImage || popupImageSrc ? 'Image' : 'Text'}
            </span>
          </div>
        );

      case 'download':
        // Download File Card UI - Matching Screenshot
        const isImage = selectedElement.tagName.toLowerCase() === 'img';
        let filename = 'Document.txt';

        if (isImage) {
          const src = selectedElement.src || '';
          if (src.startsWith('data:')) {
            filename = 'image.png';
          } else {
            filename = src.split('/').pop().split('?')[0] || 'image.png';
          }
        } else {
          const text = (selectedElement.innerText || selectedElement.textContent || '').trim();
          filename = text ? (text.substring(0, 10).replace(/[^a-z0-9]/gi, '_') + '.txt') : 'document.txt';
        }

        return (
          <div className="flex flex-col items-center">
            <div className="border border-gray-400 border-dashed rounded-[14px] p-2 bg-white shadow-sm overflow-hidden mb-1 flex flex-col items-center">
              <div className="w-[4vw] h-[4vw] bg-gray-50 rounded-[0.4vw] flex items-center justify-center overflow-hidden mb-1">
                {isImage ? (
                  <img src={selectedElement.src} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-50 flex items-center justify-center p-1">
                    <FileText size={24} className="text-indigo-400" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{filename}</span>
          </div>
        )

      case 'tooltip':
        // Tooltip Visual
        return (
          <div className="border border-gray-400 rounded-[0.4vw] p-[0.75vw] min-w-[5.2vw] h-[4.2vw] flex items-center justify-center bg-white relative">
            <div className="relative">
              <MessageSquare size={32} className="text-gray-400 fill-gray-100" />
              <div className="absolute top-1 right-1 w-[0.4vw] h-[0.4vw] bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )

      default:
        return null;
    }
  };

  const renderAdvancedEditor = () => {
    if (interactionType === 'popup') {
      return (
        <div className="animate-fadeIn">
          {/* Text Editor Box */}
          <div className="relative mb-3">
            <textarea
              value={popupText}
              onChange={(e) => {
                const newText = e.target.value;
                setPopupText(newText);
                // Trigger preview update immediately
                applyInteraction('popup', null, newText);
              }}
              onBlur={() => updateAdvanced('popup')}
              className="w-full border border-gray-400 rounded-xl p-3 text-xs text-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              placeholder='"Enhance your flipbook with rich visual elements...'
            />
            <Edit2 size={14} className="absolute bottom-3 right-3 text-gray-400" />
          </div>

          {/* Font Controls Row 1 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border border-gray-400 rounded-lg px-3 py-2 bg-white flex items-center justify-between">
              <select
                value={popupFont}
                onChange={(e) => {
                  const val = e.target.value;
                  setPopupFont(val);
                  applyInteraction('popup', null, popupText, null, null, { font: val });
                }}
                className="text-sm text-gray-700 font-medium w-full outline-none appearance-none bg-transparent"
              >
                <option>Poppins</option>
                <option>Roboto</option>
                <option>Open Sans</option>
              </select>
              <ChevronUp size={14} className="rotate-180 text-gray-500" />
            </div>
            <div className="w-24 border border-gray-400 rounded-lg px-3 py-2 bg-white flex items-center justify-between">
              <select
                value={popupSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setPopupSize(val);
                  applyInteraction('popup', null, popupText, null, null, { size: val });
                }}
                className="text-sm text-gray-700 font-medium w-full outline-none appearance-none bg-transparent"
              >
                <option>16</option>
                <option>24</option>
                <option>32</option>
                <option>48</option>
              </select>
              <ChevronUp size={14} className="rotate-180 text-gray-500" />
            </div>
          </div>

          {/* Font Controls Row 2 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border border-gray-400 rounded-lg px-3 py-2 bg-white flex items-center justify-between">
              <select
                value={popupWeight}
                onChange={(e) => {
                  const val = e.target.value;
                  setPopupWeight(val);
                  applyInteraction('popup', null, popupText, null, null, { weight: val });
                }}
                className="text-sm text-gray-700 font-medium w-full outline-none appearance-none bg-transparent"
              >
                <option>Regular</option>
                <option>Semi Bold</option>
                <option>Bold</option>
              </select>
              <ChevronUp size={14} className="rotate-180 text-gray-500" />
            </div>
          </div>

          {/* Fill Color */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">Fill Color :</span>
            <div className="w-8 h-8 rounded-md bg-black border border-gray-300 relative overflow-hidden">
              <input
                type="color"
                value={popupFillColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setPopupFillColor(newColor);
                  applyInteraction('popup', null, popupText, null, null, { fill: newColor });
                }}
                onBlur={() => updateAdvanced('popup')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full" style={{ backgroundColor: popupFillColor }}></div>
            </div>
            <div className="flex-grow border border-gray-400 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
              <span className="text-sm text-gray-500 uppercase">{popupFillColor}</span>
              <span className="text-sm text-gray-500">100%</span>
            </div>
          </div>
        </div>
      )
    }

    if (interactionType === 'tooltip') {
      return (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-gray-800">Edit Tooltip</label>
          </div>

          {/* Preview Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl h-24 flex items-center justify-center mb-4 relative">
            {/* Simulated Tooltip */}
            <div className="relative">
              <div
                className="px-3 py-1.5 rounded text-xs whitespace-nowrap"
                style={{
                  backgroundColor: tooltipFillColor,
                  color: tooltipTextColor
                }}
              >
                {tooltipText || 'Centered Tooltip'}
              </div>
              {/* Triangle pointer */}
              <div
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] absolute left-1/2 -translate-x-1/2 top-full"
                style={{ borderTopColor: tooltipFillColor }}
              ></div>
            </div>
          </div>

          {/* Text Input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              onBlur={() => updateAdvanced('tooltip')}
              placeholder="Centered Tooltip"
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
            />
            <Edit2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Colors */}
          <div className="space-y-2">
            {/* Text Color */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-800 w-10">Text :</span>
              <div className="w-8 h-8 rounded-md border border-gray-300 relative overflow-hidden">
                <input
                  type="color"
                  value={tooltipTextColor}
                  onChange={(e) => { setTooltipTextColor(e.target.value); }}
                  onBlur={() => updateAdvanced('tooltip')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: tooltipTextColor }}></div>
              </div>
              <div className="flex-grow border border-gray-400 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
                <span className="text-sm text-gray-500 uppercase">{tooltipTextColor}</span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
            </div>

            {/* Fill Color */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-800 w-10">Fill :</span>
              <div className="w-8 h-8 rounded-md border border-gray-300 relative overflow-hidden">
                <input
                  type="color"
                  value={tooltipFillColor}
                  onChange={(e) => { setTooltipFillColor(e.target.value); }}
                  onBlur={() => updateAdvanced('tooltip')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: tooltipFillColor }}></div>
              </div>
              <div className="flex-grow border border-gray-400 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
                <span className="text-sm text-gray-500 uppercase">{tooltipFillColor}</span>
                <span className="text-sm text-gray-500">80%</span>
              </div>
            </div>
          </div>

        </div>
      )
    }
    return null;
  }

  const getInteractionLabel = () => {
    switch (interactionType) {
      case 'none': return 'None';
      case 'link': return 'Open Link';
      case 'navigation': return 'Navigate to';
      case 'call': return 'Call';
      case 'zoom': return 'Zoom';
      case 'popup': return 'PopUp';
      case 'tooltip': return 'Tooltip';
      case 'download': return 'Download';
      case '3dviewer': return '3D Viewer';
      case 'slideshow': return 'Slideshow';
      default: return 'None';
    }
  }

  const getTriggerLabel = () => {
    return interactionTrigger === 'click' ? 'On Click' : 'On Hover';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[15px] shadow-sm relative">

      {/* ================= HEADER ================= */}
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
        onClick={() => {
          if (onToggle) onToggle();
          else setInternalIsOpen(!internalIsOpen);
        }}
      >
        <div className="flex items-center gap-2">
          <MousePointerClick size={20} className="text-gray-600" />
          <span className="font-medium text-gray-700 text-sm">
            Interaction
          </span>
        </div>
        <ChevronUp
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isInteractionsOpen ? '' : 'rotate-180'}`}
        />
      </div>

      {isInteractionsOpen && (
        <div className="p-4 pt-0 animate-fadeIn space-y-4">

          {/* ================= TOP SELECTORS ================= */}
          <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-50 pb-2" ref={dropdownRef}>
            {/* Type Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowTriggerDropdown(false); }}
                className="flex items-center justify-between min-w-[115px] px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="text-[13px] font-bold text-gray-700">{getInteractionLabel()}</span>
                <ChevronUp size={14} className={`text-gray-500 transition-transform ${showTypeDropdown ? '' : 'rotate-180'}`} />
              </button>

              {showTypeDropdown && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowTypeDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-30 bg-white border border-gray-300 rounded-[15px] shadow-2xl overflow-hidden z-[9999] flex flex-col py-2 animate-in fade-in zoom-in-95 duration-150 no-scrollbar">
                    <div className="flex flex-col">
                      {[
                        { id: 'link', label: 'Open Link' },
                        { id: 'navigation', label: 'Navigate to' },
                        { id: 'call', label: 'Call' },
                        { id: 'zoom', label: 'Zoom' },
                        { id: 'popup', label: 'Popup' },
                        { id: 'tooltip', label: 'Tooltip' },
                        { id: 'download', label: 'Download' },
                        { id: '3dviewer', label: '3D Viewer' },
                        { id: 'slideshow', label: 'Slideshow' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { handleTypeChange(opt.id); setShowTypeDropdown(false); }}
                          className={`px-4 py-2.5 text-[15px] font-normal transition-colors text-center w-full ${interactionType === opt.id ? 'bg-gray-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Trigger Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowTriggerDropdown(!showTriggerDropdown); setShowTypeDropdown(false); }}
                className="flex items-center justify-between min-w-[100px] px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="text-[13px] font-bold text-gray-700">{getTriggerLabel()}</span>
                <ChevronUp size={14} className={`text-gray-500 transition-transform ${showTriggerDropdown ? '' : 'rotate-180'}`} />
              </button>

              {showTriggerDropdown && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowTriggerDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-[9999] flex flex-col py-1 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: 'click', label: 'On Click' },
                      { id: 'hover', label: 'On Hover' }
                    ].filter(opt => !(interactionType === 'link' && opt.id === 'hover')).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { handleTriggerChange(opt.id); setShowTriggerDropdown(false); }}
                        className={`px-4 py-2 text-[13px] font-medium transition-colors text-center w-full ${interactionTrigger === opt.id ? 'bg-gray-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                        >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Fit Selector (only for popup) */}
            {interactionType === 'popup' && (
              <div className="flex-grow flex justify-end">
                <div className="relative">
                  <button
                    onClick={() => { setShowFitDropdown(!showFitDropdown); setShowTypeDropdown(false); setShowTriggerDropdown(false); }}
                    className="flex items-center justify-between w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[13px] font-bold text-gray-700 capitalize">{popupFit}</span>
                    <ChevronUp size={14} className={`text-gray-500 transition-transform ${showFitDropdown ? '' : 'rotate-180'}`} />
                  </button>
                  {showFitDropdown && (
                    <>
                      <div className="fixed inset-0 z-[9998]" onClick={() => setShowFitDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-[9999] flex flex-col py-1 animate-in fade-in zoom-in-95 duration-150">
                        {['Fit', 'Fill', 'Stretch'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setPopupFit(type);
                              applyInteraction('popup', null, popupText, null, null, { fit: type });
                              setShowFitDropdown(false);
                            }}
                            className={`px-4 py-2 text-[13px] font-medium transition-colors text-center w-full ${popupFit === type ? 'bg-gray-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= FLOW GRAPH / PREVIEW ================= */}
          <div className="flex items-center justify-between mb-2 mt-4 px-1 min-h-[70px]">
            {/* Source */}
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
              {formattedElementName}
            </div>

            {/* Connection Arrow */}
            <div className="flex-grow flex items-center relative min-w-[3vw]">
              <div className="flex-grow border-b border-gray-300 border-dashed mr-[-1px]"></div>
              <div className="flex-shrink-0 -ml-[7px] text-gray-400">
                <ChevronRight size={15} strokeWidth={2.5} />
              </div>
            </div>

            {/* Target */}
            <div className="flex-shrink-0">
              {renderTargetInput()}
            </div>
          </div>

          {/* ================= SECTION HEADER: Replace Text ================= */}
          {interactionType === 'popup' && (
            <div className="flex items-center justify-between mt-4 mb-4">
              <div className="flex items-center gap-3 flex-grow">
                <h3 className="text-sm font-bold text-gray-900 whitespace-nowrap">Replace Text</h3>
                <div className="h-[1px] flex-grow bg-gray-200"></div>
              </div>
              <button
                onClick={() => {
                  const newState = !showPopupPreview;
                  setShowPopupPreview(newState);
                  // Manually trigger the preview update
                  if (onPopupPreviewUpdate) {
                    if (newState) {
                      onPopupPreviewUpdate({
                        isOpen: true,
                        content: popupText,
                        elementType: selectedElement.tagName.toLowerCase() === 'img' ? 'image' : 'text',
                        elementSource: popupImageSrc || (selectedElement.tagName.toLowerCase() === 'img' ? selectedElement.src : (selectedElement.innerText || selectedElement.textContent)),
                        styles: {
                          font: popupFont,
                          size: popupSize,
                          weight: popupWeight,
                          fill: popupFillColor,
                          autoWidth: popupAutoWidth,
                          autoHeight: popupAutoHeight,
                          fit: popupFit
                        }
                      });
                    } else {
                      onPopupPreviewUpdate({ isOpen: false });
                    }
                  }
                }}
                className={`ml-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all
                  ${showPopupPreview
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'}`}
              >
                {showPopupPreview ? (
                  <><Maximize size={12} /> Hide Preview</>
                ) : (
                  <><Eye size={12} /> Preview Popup</>
                )}
              </button>
            </div>
          )}

          {/* ================= ADVANCED EDITOR ================= */}
          {renderAdvancedEditor()}

          {/* ================= FOOTER ================= */}
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[13px] text-gray-600 font-medium tracking-tight">
              Highlight the Component
            </span>
            <div
              onClick={() => {
                const newVal = !isHighlighted;
                setIsHighlighted(newVal);
                // Trigger an update to save this state
                const currentValue =
                  interactionType === 'link' ? linkUrl :
                    interactionType === 'navigation' ? navPage :
                      interactionType === 'call' ? phoneNumber :
                        interactionType === 'zoom' ? zoomLevel :
                          interactionType === 'download' ? downloadUrl : null;

                const currentContent =
                  interactionType === 'popup' ? popupText :
                    interactionType === 'tooltip' ? tooltipText : '';

                // Apply immediately
                setTimeout(() => applyInteraction(interactionType, currentValue, currentContent, null, newVal), 0);
              }}
              className={`w-8 h-[18px] rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out flex items-center ${isHighlighted ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${isHighlighted ? 'translate-x-[14px]' : 'translate-x-0'}`} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default InteractionPanel;