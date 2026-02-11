import React, { useState, useRef, useEffect, useCallback, startTransition } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Upload,
    RotateCcw,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Edit3,
    ArrowRightLeft,
    Link as LinkIcon,
    Link2Off,
    Plus,
    Trash2,
    X,
    Pencil,
    File,
    Check
} from 'lucide-react';

// Reused components from ImageEditor
const RadiusBox = ({ corner, value, onChange, radiusStyle }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startValRef = useRef(0);

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (e) => {
            const dx = e.clientX - startXRef.current;
            const newVal = Math.max(0, startValRef.current + Math.round(dx));
            onChange(corner, newVal);
        };
        const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        document.body.style.cursor = 'ew-resize';
        return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
    }, [isDragging, onChange, corner]);

    const onMouseDown = (e) => {
        e.preventDefault(); setIsDragging(true);
        startXRef.current = e.clientX; startValRef.current = Number(value) || 0;
    };

    return (
        <div className={`relative flex items-center bg-white border border-gray-200 ${radiusStyle} w-24 h-12 shadow-sm px-2`}>
            <div className="flex items-center justify-between w-full">
                <button onClick={() => onChange(corner, value - 1)} className="text-gray-300 hover:text-indigo-500 transition-colors p-1"><ChevronLeft size={14} strokeWidth={1.5} /></button>
                <div onMouseDown={onMouseDown} className="flex-1 h-full flex items-center justify-center cursor-ew-resize">
                    <span className="text-[13px] font-bold text-gray-800 select-none block w-full text-center">{value}</span>
                </div>
                <button onClick={() => onChange(corner, value + 1)} className="text-gray-300 hover:text-indigo-500 transition-colors p-1"><ChevronRight size={14} strokeWidth={1.5} /></button>
            </div>
        </div>
    );
};

const EffectControlRow = ({ label, value, onChange, min = -100, max = 100 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startValRef = useRef(0);

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (e) => {
            const dx = e.clientX - startXRef.current;
            const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
            onChange(newVal);
        };
        const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        document.body.style.cursor = 'ew-resize';
        return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
    }, [isDragging, onChange, min, max]);

    const onMouseDown = (e) => {
        e.preventDefault(); setIsDragging(true);
        startXRef.current = e.clientX; startValRef.current = Number(value);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-800 w-12 cursor-ew-resize select-none" onMouseDown={onMouseDown}>{label} :</span>
            <div className="flex items-center gap-1">
                <button onClick={() => onChange(Math.max(min, value - 1))} className="w-4 h-8 flex items-center justify-center text-gray-500 hover:text-gray-600 transition-colors"><ChevronLeft size={18} strokeWidth={2} /></button>
                <div onMouseDown={onMouseDown} className="w-15 h-8 flex items-center justify-center border border-gray-500 rounded-sm text-[14px] text-gray-800 bg-white cursor-ew-resize select-none">
                    {value}
                </div>
                <button onClick={() => onChange(Math.min(max, value + 1))} className="w-4 h-8 flex items-center justify-center text-gray-500 hover:text-gray-600 transition-colors"><ChevronRight size={18} strokeWidth={2} /></button>
            </div>
        </div>
    );
};

const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startValRef = useRef(0);

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (e) => {
            const dx = e.clientX - startXRef.current;
            const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
            onChange(newVal);
        };
        const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        document.body.style.cursor = 'ew-resize';
        return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
    }, [isDragging, onChange, min, max]);

    const onMouseDown = (e) => {
        e.preventDefault(); setIsDragging(true);
        startXRef.current = e.clientX; startValRef.current = Number(value);
    };

    return (
        <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
    );
};


const FileInteractionEditor = ({
    selectedElement,
    onUpdate,
    onStartInteractionDraw,
    pages,
    currentPage,
    onPopupPreviewUpdate,
    activePopupElement,
    onPopupUpdate,
    InteractionPanelComponent,
    onPDFUpload,
    onElementSelect,
    TextEditorComponent,
    ImageEditorComponent,
    VideoEditorComponent,
    GifEditorComponent,
    IconEditorComponent
}) => {
    const [activeSection, setActiveSection] = useState('files');
    const [isFitDropdownOpen, setIsFitDropdownOpen] = useState(false);
    const fitDropdownRef = useRef(null);
    const [nestedSection, setNestedSection] = useState(null);

    const [opacity, setOpacity] = useState(100);
    const [imageType, setImageType] = useState('Fit');
    const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
    const [isRadiusLinked, setIsRadiusLinked] = useState(false);
    const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
    const [previewSrc, setPreviewSrc] = useState(selectedElement?.src || '');

    // Effect States
    const [activeEffects, setActiveEffects] = useState(['effect']); // 'effect' is a placeholder/marker
    const [activePopup, setActivePopup] = useState(null);
    const [effectSettings, setEffectSettings] = useState({
        'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 8, spread: 0 },
        'Inner Shadow': { color: '#000000', opacity: 35, x: 0, y: 0, blur: 10, spread: 0 },
        'Blur': { blur: 5, spread: 0 },
        'Background Blur': { blur: 10, spread: 0 }
    });


    // Interaction Frame States
    const [frames, setFrames] = useState([]);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [collapsedIds, setCollapsedIds] = useState([]);

    // Auto-open interaction section if any frame is selected
    useEffect(() => {
        const hasSelectedFrame = frames.some(frame => selectedElement && selectedElement.id === frame.id);
        if (hasSelectedFrame) {
            setActiveSection('interaction');
        }
    }, [selectedElement, frames]);

    const isUpdatingDOM = useRef(false);
    const fileInputRef = useRef(null);

    // Scan for frames on the current page
    const scanForFrames = useCallback(() => {
        const iframes = document.querySelectorAll('iframe');
        let currentDoc = null;

        // Strategy 1: strict page match
        iframes.forEach(ifrm => {
            if (ifrm.title.includes(`Page ${currentPage + 1}`) || ifrm.title === "Template Editor") {
                currentDoc = ifrm.contentDocument;
            }
        });

        // Strategy 2: Fallback to any iframe containing frames if strict match fails (safeguard)
        if (!currentDoc) {
            for (const ifrm of iframes) {
                if (ifrm.contentDocument && ifrm.contentDocument.querySelectorAll('[data-interaction-type="frame"]').length > 0) {
                    currentDoc = ifrm.contentDocument;
                    break;
                }
            }
        }

        if (!currentDoc) return;

        const frameElements = currentDoc.querySelectorAll('[data-interaction-type="frame"]');

        const foundFrames = Array.from(frameElements).map((el, index) => ({
            id: el.id,
            label: el.getAttribute('data-frame-label') || `Frame ${index + 1}`,
            interaction: el.getAttribute('data-interaction') || 'none'
        }));

        // Only update state if frames actually changed
        const frameDataString = JSON.stringify(foundFrames);
        setFrames(prev => {
            if (JSON.stringify(prev) === frameDataString) return prev;
            return foundFrames;
        });
    }, [currentPage]);

    // Initial scan and sync
    useEffect(() => {
        scanForFrames();

        // Optional: Setup mutation observer to detect new frames or deletions
        const iframes = document.querySelectorAll('iframe');
        const observers = [];

        iframes.forEach(ifrm => {
            if (ifrm.contentDocument) {
                const observer = new MutationObserver(() => scanForFrames());
                observer.observe(ifrm.contentDocument.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['id', 'data-interaction', 'data-interaction-type', 'data-frame-label']
                });
                observers.push(observer);
            }
        });

        return () => observers.forEach(o => o.disconnect());
    }, [scanForFrames]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fitDropdownRef.current && !fitDropdownRef.current.contains(event.target)) {
                setIsFitDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync from selected element
    useEffect(() => {
        if (!selectedElement) return;

        const syncFromDOM = () => {
            if (isUpdatingDOM.current) return;

            // Handle Preview Source (Image src or Background Image)
            let currentSrc = selectedElement.src || '';
            if (!currentSrc && selectedElement.style.backgroundImage) {
                // Extract URL from "url('...')"
                const match = selectedElement.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
                if (match) currentSrc = match[1];
            }
            setPreviewSrc(currentSrc);

            const domOpacity = selectedElement.style.opacity || '1';
            setOpacity(Math.round(parseFloat(domOpacity) * 100));

            // Sync Radius
            const borderRadius = selectedElement.style.borderRadius;
            const radiusVal = parseFloat(borderRadius) || 0;
            setRadius({ tl: radiusVal, tr: radiusVal, br: radiusVal, bl: radiusVal });

            // Sync Fit
            const objectFit = selectedElement.style.objectFit || '';
            const bgSize = selectedElement.style.backgroundSize || '';
            const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Stretch' };
            const bgMapRev = { 'contain': 'Fit', 'cover': 'Fill', '100% 100%': 'Stretch' };

            setImageType(fitMapRev[objectFit] || bgMapRev[bgSize] || 'Fit');

            // Sync Size for frames
            if (selectedElement.getAttribute('data-interaction-type') === 'frame') {
                setWidth(Math.round(selectedElement.offsetWidth));
                setHeight(Math.round(selectedElement.offsetHeight));
            }

            // Sync Effects - Advanced Sync
            const filterStr = selectedElement.style.filter || '';
            const backdropStr = selectedElement.style.backdropFilter || '';

            // Parse filters to avoid resetting sliders to 0 on re-select
            const newFilters = { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 };

            // Brightness parsing (Exposure + Highlights)
            const brightnessMatch = filterStr.match(/brightness\((\d+)%\)/g);
            if (brightnessMatch) {
                const vals = brightnessMatch.map(m => parseInt(m.match(/\d+/)[0]));
                if (vals.length >= 1) newFilters.exposure = vals[0] - 100;
                if (vals.length >= 2) newFilters.highlights = Math.round((vals[1] - 100) * 5);
            }

            // Contrast parsing (Contrast + Shadows)
            const contrastMatch = filterStr.match(/contrast\((\d+)%\)/g);
            if (contrastMatch) {
                const vals = contrastMatch.map(m => parseInt(m.match(/\d+/)[0]));
                if (vals.length >= 1) newFilters.contrast = vals[0] - 100;
                if (vals.length >= 2) newFilters.shadows = Math.round((vals[1] - 100) * 5);
            }

            const saturateMatch = filterStr.match(/saturate\((\d+)%\)/);
            if (saturateMatch) newFilters.saturation = parseInt(saturateMatch[1]) - 100;

            const hueMatch = filterStr.match(/hue-rotate\((-?\d+)deg\)/);
            if (hueMatch) newFilters.tint = parseInt(hueMatch[1]);

            const sepiaMatch = filterStr.match(/sepia\((\d+)%\)/);
            if (sepiaMatch) newFilters.temperature = parseInt(sepiaMatch[1]);

            setFilters(newFilters);

            const newEffects = ['effect'];
            if (/blur\(\d+px\)/.test(filterStr)) newEffects.push('Blur');
            if (filterStr.includes('drop-shadow')) newEffects.push('Drop Shadow');
            if (backdropStr.includes('blur')) newEffects.push('Background Blur');
            // Inner shadow sync
            if (selectedElement.style.boxShadow || (selectedElement.parentElement && selectedElement.parentElement.style.boxShadow)) {
                newEffects.push('Inner Shadow');
            }
            setActiveEffects(newEffects);

        };

        const observer = new MutationObserver((mutations) => {
            if (isUpdatingDOM.current) return;
            const hasRelevantChange = mutations.some(m =>
                m.type === 'attributes' &&
                (m.attributeName === 'style' || m.attributeName === 'src')
            );
            if (hasRelevantChange) syncFromDOM();
        });

        observer.observe(selectedElement, { attributes: true, attributeFilter: ['style', 'src'] });
        syncFromDOM();

        return () => observer.disconnect();
    }, [selectedElement]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (isPDF) {
            if (onPDFUpload) {
                onPDFUpload([file]);
            }
            return;
        }

        const imageUrl = URL.createObjectURL(file);

        isUpdatingDOM.current = true;
        setPreviewSrc(imageUrl);

        if (selectedElement) {
            if (selectedElement.tagName.toLowerCase() === 'img') {
                selectedElement.src = imageUrl;
            } else {
                selectedElement.style.backgroundImage = `url('${imageUrl}')`;
                selectedElement.style.backgroundSize = 'contain'; // Default to fit
                selectedElement.style.backgroundPosition = 'center';
                selectedElement.style.backgroundRepeat = 'no-repeat';
            }

            if (onUpdate) onUpdate({ shouldRefresh: true, newElement: selectedElement });
        }

        // Release lock shortly after
        setTimeout(() => { isUpdatingDOM.current = false; }, 500);
    };

    const handleOpacityChange = (e) => {
        isUpdatingDOM.current = true;
        const val = parseInt(e.target.value);
        setOpacity(val);
        if (selectedElement) {
            selectedElement.style.opacity = val / 100;
            if (onUpdate) onUpdate({ opacity: val / 100, newElement: selectedElement });
        }
        setTimeout(() => { isUpdatingDOM.current = false; }, 100);
    };

    const handleFitChange = (val) => {
        isUpdatingDOM.current = true;
        setImageType(val);
        if (selectedElement) {
            const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill' };
            const bgMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': '100% 100%' };

            if (selectedElement.tagName.toLowerCase() === 'img') {
                selectedElement.style.objectFit = fitMap[val];
                if (onUpdate) onUpdate({ fit: fitMap[val], newElement: selectedElement });
            } else {
                selectedElement.style.backgroundSize = bgMap[val];
                if (onUpdate) onUpdate({ backgroundSize: bgMap[val], newElement: selectedElement });
            }
        }
        setTimeout(() => { isUpdatingDOM.current = false; }, 100);
    };

    const updateRadius = (corner, value) => {
        isUpdatingDOM.current = true;
        const val = Math.max(0, Number(value) || 0);
        const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };

        setRadius(next);
        if (selectedElement) {
            selectedElement.style.borderRadius = `${next.tl}px ${next.tr}px ${next.br}px ${next.bl}px`;
            if (onUpdate) onUpdate({ radius: selectedElement.style.borderRadius, newElement: selectedElement });
        }
        setTimeout(() => { isUpdatingDOM.current = false; }, 100);
    };

    // Apply strict Visuals logic similar to ImageEditor
    const applyVisuals = useCallback(() => {
        if (!selectedElement) return;
        
        // Check for default state to avoid unnecessary updates
        const isDefaultFilters = 
            filters.exposure === 0 && 
            filters.contrast === 0 && 
            filters.saturation === 0 && 
            filters.temperature === 0 && 
            filters.tint === 0 && 
            filters.highlights === 0 && 
            filters.shadows === 0;

        const isDefaultEffects = 
            !activeEffects.includes('Blur') && 
            !activeEffects.includes('Drop Shadow') && 
            !activeEffects.includes('Background Blur') && 
            !activeEffects.includes('Inner Shadow');

        const currentFilter = selectedElement.style.filter;
        const currentBackdrop = selectedElement.style.backdropFilter || selectedElement.style.webkitBackdropFilter;
        const currentBoxShadow = selectedElement.style.boxShadow;

        // If we are in default state and the element is already clean, stop here without triggering updates
        if (isDefaultFilters && isDefaultEffects && !currentFilter && !currentBackdrop && !currentBoxShadow) {
            isUpdatingDOM.current = false;
            return;
        }

        isUpdatingDOM.current = true;

        let filterString = `brightness(${100 + filters.exposure}%) contrast(${100 + filters.contrast}%) saturate(${100 + filters.saturation}%) hue-rotate(${filters.tint}deg) sepia(${filters.temperature > 0 ? filters.temperature : 0}%)`;
        const highlightEffect = filters.highlights / 5;
        const shadowEffect = filters.shadows / 5;
        filterString += ` brightness(${100 + highlightEffect}%) contrast(${100 + shadowEffect}%)`;

        if (activeEffects.includes('Blur')) filterString += ` blur(${effectSettings['Blur'].blur}px)`;
        if (activeEffects.includes('Drop Shadow')) {
            const s = effectSettings['Drop Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            filterString += ` drop-shadow(${s.x}px ${s.y}px ${s.blur}px ${colorWithAlpha})`;
        }

        // Only update if filter actually changed
        if (selectedElement.style.filter !== filterString) {
            selectedElement.style.setProperty('filter', filterString, 'important');
        }

        // Background Blur
        if (activeEffects.includes('Background Blur')) {
            const s = effectSettings['Background Blur'];
            const blurVal = `blur(${s.blur}px)`;
            if (selectedElement.style.backdropFilter !== blurVal) {
                selectedElement.style.setProperty('backdrop-filter', blurVal, 'important');
                selectedElement.style.setProperty('-webkit-backdrop-filter', blurVal, 'important');
            }
        } else {
            if (currentBackdrop) {
                selectedElement.style.removeProperty('backdrop-filter');
                selectedElement.style.removeProperty('-webkit-backdrop-filter');
            }
        }

        // Inner Shadow
        let shadowString = "";
        if (activeEffects.includes('Inner Shadow')) {
            const s = effectSettings['Inner Shadow'];
            const alpha = Math.round((s.opacity / 100) * 255).toString(16).padStart(2, '0');
            const colorWithAlpha = s.color + (s.color.length === 7 ? alpha : '');
            shadowString += `inset ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${colorWithAlpha}`;
        }

        // Handling Box Shadow (Inner Shadow) - only update if changed
        if (selectedElement.tagName !== 'IMG') {
            if (selectedElement.style.boxShadow !== shadowString) {
                selectedElement.style.setProperty('box-shadow', shadowString, 'important');
            }
        } else {
            // Apply to parent wrapper if it's an image to make it visible
            const parent = selectedElement.parentElement;
            if (parent && (parent.tagName === 'DIV' || parent.className.includes('wrapper'))) {
                if (parent.style.boxShadow !== shadowString) {
                    parent.style.setProperty('box-shadow', shadowString, 'important');
                    parent.style.setProperty('overflow', 'hidden', 'important');
                    parent.style.setProperty('border-radius', selectedElement.style.borderRadius, 'important');
                }
            }
        }

        // Only call onUpdate if there was an actual change (not in default state)
        if (!isDefaultFilters || !isDefaultEffects) {
            if (onUpdate) onUpdate({ filter: filterString, newElement: selectedElement });
        }
        
        setTimeout(() => { isUpdatingDOM.current = false; }, 100);

    }, [filters, activeEffects, effectSettings, selectedElement]);

    // Use a ref to track if this is the initial mount to prevent running on first render
    const isInitialMount = useRef(true);
    
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        applyVisuals();
    }, [filters, activeEffects, effectSettings]);

    const updateFilter = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const updateEffectSetting = (effect, key, value) => {
        setEffectSettings(prev => ({ ...prev, [effect]: { ...prev[effect], [key]: value } }));
    };

    const handleColorPick = async (effectName) => {
        if (!window.EyeDropper) return;
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            updateEffectSetting(effectName, 'color', result.sRGBHex);
        } catch (e) {
            console.error('Color selection cancelled or failed', e);
        }
    };


    const handleSizeUpdate = (type, val) => {
        isUpdatingDOM.current = true;
        const newVal = Math.max(1, parseInt(val) || 0);
        if (type === 'width') {
            setWidth(newVal);
            if (selectedElement) {
                selectedElement.style.width = `${newVal}px`;
            }
        } else {
            setHeight(newVal);
            if (selectedElement) {
                selectedElement.style.height = `${newVal}px`;
            }
        }
        if (onUpdate && selectedElement) {
            onUpdate({ [type === 'width' ? 'width' : 'height']: newVal, newElement: selectedElement });
        }
        setTimeout(() => { isUpdatingDOM.current = false; }, 100);
    };

    // Stable handler for frame updates
    const handleFrameUpdate = useCallback((id, data) => {
        let activeEl = null;

        // Optimization: if the update is for the currently selected element, use the prop directly
        if (selectedElement && selectedElement.id === id) {
            activeEl = selectedElement;
        } else {
            // Find active element dynamically to avoid closure staleness and allow memoization
            const iframes = document.querySelectorAll('iframe');
            
            for (const ifrm of iframes) {
                if (ifrm.contentDocument) {
                    const el = ifrm.contentDocument.getElementById(id);
                    if (el) {
                        activeEl = el;
                        break;
                    }
                }
            }
        }

        if (onUpdate) {
            // Ensure we pass the element reference
            if (data && data.deleted) {
                 onUpdate({ ...data, newElement: null }); 
            } else {
                 onUpdate({ ...data, newElement: activeEl });
            }
        }
    }, [onUpdate, selectedElement]);

    return (
        <div className="flex flex-col gap-2">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
                input[type='range']::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
                input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #6366f1; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-top: -5px; cursor: pointer; }
            `}</style>

            {/* Files Panel - ImageEditor Style */}
            <div className="bg-white border border-gray-200 rounded-[15px] shadow-sm relative font-sans">
                <div 
                    className={`flex items-center justify-between px-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeSection === 'files' ? 'rounded-t-[15px]' : 'rounded-[15px]'}`}
                    onClick={() => setActiveSection(activeSection === 'files' ? null : 'files')}
                >
                    <div className="flex items-center gap-2.5">
                        <File size={16} className="text-gray-800"/>
                        <span className="font-medium text-gray-700 text-sm">Files</span>
                    </div>
                    <ChevronUp size={16} className={`text-gray-500 transition-transform duration-200 ${activeSection === 'files' ? '' : 'rotate-180'}`} />
                </div>

                {activeSection === 'files' && (
                    <div className="space-y-5 px-5 pb-5 pt-4">
                        {/* Upload Section */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">Upload your File</span>
                                <div className="h-[1px] flex-grow bg-gray-200"></div>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[13px] font-medium text-gray-700">Select the File type :</span>
                                <div className="relative" ref={fitDropdownRef}>
                                    <button
                                        onClick={() => setIsFitDropdownOpen(!isFitDropdownOpen)}
                                        className="flex items-center justify-between w-32 bg-white border border-gray-100 shadow-sm rounded-md px-4 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium">{imageType}</span>
                                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isFitDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isFitDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            {['Fit', 'Fill', 'Stretch'].map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        handleFitChange(option);
                                                        setIsFitDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between
                                                        ${imageType === option ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                                                    `}
                                                >
                                                    {option}
                                                    {imageType === option && <Check size={12} />} 
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-2">
                                {/* Preview Box */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-[120px] h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-1 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                        {previewSrc ? (
                                            <img src={previewSrc} className="w-full h-full object-contain" alt="Current" />
                                        ) : (
                                            <span className="text-xs text-gray-400">Empty</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400">Temp 1</span>
                                </div>

                                {/* Swap Icon */}
                                <div className="text-gray-400 flex flex-col items-center gap-0.5">
                                    <ArrowRightLeft size={16} />
                                </div>

                                {/* Upload Box */}
                                <div className="flex flex-col items-center w-full">
                                    <div
                                        className="w-full h-[80px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors bg-white relative"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={18} className="text-gray-400 mb-1" />
                                        <span className="text-[10px] text-gray-500">Drag & Drop or <span className="text-indigo-600 font-medium">Upload</span></span>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                                    </div>
                                    <span className="text-[9px] text-gray-400 mt-1">Supported File Format : PDF, JPG, PNG</span>
                                </div>
                            </div>
                        </div>

                        {/* Opacity Section */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">Opacity</span>
                                <div className="h-[1px] flex-grow bg-gray-200"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={opacity}
                                    onChange={handleOpacityChange}
                                    className="flex-1 h-1 rounded- appearance-none cursor-pointer"
                                    style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${opacity}%, #f3f4f6 ${opacity}%, #f3f4f6 100%)` }}
                                />
                                <span className="text-sm font-medium text-gray-700 w-10 text-right">{opacity} %</span>
                            </div>
                        </div>

                        {/* Adjustments Collapsible */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <button
                                onClick={() => setNestedSection(nestedSection === 'adjustments' ? null : 'adjustments')}
                                className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-[14px] font-semibold text-gray-700">Adjustments</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${nestedSection === 'adjustments' ? 'rotate-180' : ''}`} />
                            </button>
                            {nestedSection === 'adjustments' && (
                                <div className="relative px-6 pb-5 pt-5 border-t border-gray-100">
                                    <div className="px-1 pb-2 space-y-2  text-xs animate-in slide-in-from-top-2">
                                        {[
                                            ['Exposure', 'exposure', -100, 100], ['Contrast', 'contrast', -100, 100], ['Saturation', 'saturation', -100, 100], ['Temperature', 'temperature', -100, 100], ['Tint', 'tint', -180, 180], ['Highlights', 'highlights', -100, 100], ['Shadows', 'shadows', -100, 100],
                                        ].map(([label, key, min, max]) => (
                                            <div key={key} className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <DraggableSpan label={label} value={filters[key]} onChange={(v) => startTransition(() => setFilters((f) => ({ ...f, [key]: v })))} min={min} max={max} className="text-[13px] font-medium text-gray-700" />
                                                        <button
                                                            onClick={() => setFilters((f) => ({ ...f, [key]: 0 }))}
                                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                            title={`Reset ${label}`}
                                                        >
                                                            <RotateCcw size={12} />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900">{filters[key]}</span>
                                                </div>
                                                <input type="range" min={min} max={max} value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: +e.target.value }))} style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((filters[key] - min) / (max - min)) * 100}%, #f3f4f6 ${((filters[key] - min) / (max - min)) * 100}%, #f3f4f6 100%)` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Corner Radius Collapsible */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <button
                                onClick={() => setNestedSection(nestedSection === 'radius' ? null : 'radius')}
                                className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-[14px] font-semibold text-gray-700">Corner Radius</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${nestedSection === 'radius' ? 'rotate-180' : ''}`} />
                            </button>
                            {nestedSection === 'radius' && (
                                <div className="relative px-6 pb-5 pt-5 border-t border-gray-100">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="flex items-center gap-6">
                                            <RadiusBox onChange={updateRadius} corner="tl" value={radius.tl} radiusStyle="rounded-tl-3xl rounded-tr-md rounded-br-md rounded-bl-md" />
                                            <RadiusBox onChange={updateRadius} corner="tr" value={radius.tr} radiusStyle="rounded-tr-3xl rounded-tl-md rounded-br-md rounded-bl-md" />
                                        </div>
                                        <div className="absolute left-1/2 top-20 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                            <button onClick={() => setIsRadiusLinked(!isRadiusLinked)} className="pointer-events-auto p-1.5 transition-colors bg-white rounded-full">{isRadiusLinked ? <LinkIcon size={20} className="text-gray-900" /> : <Link2Off size={20} className="text-gray-400" />}</button>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <RadiusBox onChange={updateRadius} corner="bl" value={radius.bl} radiusStyle="rounded-bl-3xl rounded-tr-md rounded-br-md rounded-tl-md" />
                                            <RadiusBox onChange={updateRadius} corner="br" value={radius.br} radiusStyle="rounded-br-3xl rounded-tr-md rounded-tl-md rounded-bl-md" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Effect Collapsible */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <button
                                onClick={() => setNestedSection(nestedSection === 'effects' ? null : 'effects')}
                                className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-[14px] font-semibold text-gray-700">Effect</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${nestedSection === 'effects' ? 'rotate-180' : ''}`} />
                            </button>
                            {nestedSection === 'effects' && (
                                <div className="relative px-6 pb-5 pt-5 border-t border-gray-100">
                                    <div className="p-0 pt-0 space-y-2  bg-white border-t border-gray-50">
                                        {['Drop Shadow', 'Inner Shadow', 'Blur', 'Background Blur'].map((eff) => (
                                            <div key={eff} className="relative">
                                                <div
                                                    onClick={() => {
                                                        const isActive = activeEffects.includes(eff);
                                                        if (!isActive) {
                                                            setActiveEffects(prev => [...prev, eff]);
                                                            setActivePopup(eff);
                                                        } else {
                                                            setActivePopup(activePopup === eff ? null : eff);
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${activePopup === eff ? 'border-black-800 bg-indigo-50/20' : 'bg-gray-50/80 border-gray-100 hover:border-gray-300'}`}
                                                >
                                                    <span className="text-xs font-bold text-gray-700 flex-1">{eff}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const isActive = activeEffects.includes(eff);
                                                            if (isActive) {
                                                                setActiveEffects(prev => prev.filter(e => e !== eff));
                                                                if (activePopup === eff) setActivePopup(null);
                                                            } else {
                                                                setActiveEffects(prev => [...prev, eff]);
                                                                setActivePopup(eff);
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                                    >
                                                        {activeEffects.includes(eff) ? <Trash2 size={16} className="text-red-500" /> : <Plus size={16} className="text-gray-400" />}
                                                    </button>
                                                </div>
                                                {activePopup === eff && (
                                                    <div className="fixed z-[50] bg-white rounded-lg shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-right-4 fade-in duration-200" style={{ width: '300px', top: '35%', left: '92%', transform: 'translateX(-120%)' }}>
                                                        <div className="flex items-center mb-4">
                                                            <span className="text-sm font-bold text-gray-800">{eff}</span>
                                                            <div className="h-[1px] flex-1 mx-3 bg-gray-100" />
                                                            <button onClick={() => setActivePopup(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition" aria-label="Close"><X size={16} className="text-gray-500" /></button></div>
                                                        <div className="space-y-3">
                                                            {eff.includes('Shadow') && (
                                                                <><div className="flex items-start gap-2"><div className="relative"><div className="w-[65px] h-[65px] rounded-sm flex items-center justify-center text-white text-sm font-semibold cursor-pointer overflow-hidden" style={{ background: `linear-gradient(to right, ${effectSettings[eff].color} 0%, ${effectSettings[eff].color}88 50%, transparent 100%)` }}><span className="relative z-10">{effectSettings[eff].opacity} %</span><input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div><div className="flex-1 space-y-3"><div className="flex items-center gap-2"><span className="text-xs text-gray-800 font-normal whitespace-nowrap">Code :</span><div className="flex-1 relative"><input type="text" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="w-full text-[14px] text-gray-800 outline-none bg-transparent border border-gray-300 rounded-lg px-3 pr-8 h-9" />
                                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer"><Pencil size={16} className="text-gray-400" strokeWidth={2} />{'EyeDropper' in window ? <button onClick={() => handleColorPick(eff)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /> : <input type="color" value={effectSettings[eff].color} onChange={(e) => updateEffectSetting(eff, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />}</div></div></div>
                                                                    <div className="flex items-center gap-2">
                                                                        <DraggableSpan label="Opacity :" value={effectSettings[eff].opacity} onChange={(v) => updateEffectSetting(eff, 'opacity', v)} className="text-xs text-gray-800 font-normal whitespace-nowrap" />
                                                                        <div className="flex-1 flex items-center gap-2">
                                                                            <input type="range" min="0" max="100" value={effectSettings[eff].opacity} onChange={(e) => updateEffectSetting(eff, 'opacity', Number(e.target.value))} className="flex-1 w-1 h-1 appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${effectSettings[eff].opacity}%, #e5e7eb ${effectSettings[eff].opacity}%, #e5e7eb 100%)` }} />
                                                                            <span className="text-xs text-gray-800">{effectSettings[eff].opacity} %</span></div></div></div></div>

                                                                    <div className="space-y-3 pt-2"><EffectControlRow label="X Axis" value={effectSettings[eff].x} onChange={(v) => updateEffectSetting(eff, 'x', v)} min={-100} max={100} />
                                                                        <EffectControlRow label="Y Axis" value={effectSettings[eff].y} onChange={(v) => updateEffectSetting(eff, 'y', v)} min={-100} max={100} />
                                                                        <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} />
                                                                        <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div></>
                                                            )}
                                                            {!eff.includes('Shadow') && (
                                                                <div className="space-y-3">
                                                                    <EffectControlRow label="Blur %" value={effectSettings[eff].blur} onChange={(v) => updateEffectSetting(eff, 'blur', v)} min={0} max={100} />
                                                                    <EffectControlRow label="Spread" value={effectSettings[eff].spread} onChange={(v) => updateEffectSetting(eff, 'spread', v)} min={0} max={100} /></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                )}
            </div>

            {/* Interaction Panel - ImageEditor Style */}
            <div className="bg-white border border-gray-200 rounded-[15px] shadow-sm relative font-sans">
                <div 
                    className={`flex items-center justify-between px-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeSection === 'interaction' ? 'rounded-t-[15px]' : 'rounded-[15px]'}`}
                    onClick={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
                >
                    <div className="flex items-center gap-2.5">
                        <Sparkles size={16} className="text-gray-800" />
                        <span className="font-medium text-gray-700 text-sm">Interaction</span>
                    </div>
                    <ChevronUp size={16} className={`text-gray-500 transition-transform duration-200 ${activeSection === 'interaction' ? '' : 'rotate-180'}`} />
                </div>

                {activeSection === 'interaction' && (
                    <div className="space-y-4 px-5 pb-5 pt-4">


                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-800 whitespace-nowrap">Add Frame to Interact</span>
                            <div className="h-[1px] flex-grow bg-gray-200"></div>
                        </div>
                        <div
                            className="border border-dashed border-gray-400 p-8 rounded-lg flex flex-col items-center justify-center bg-white relative h-28 cursor-pointer hover:bg-gray-50 transition-colors group mt-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartInteractionDraw && onStartInteractionDraw();
                            }}
                        >
                            {/* Corner Markers */}
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black"></div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black"></div>

                            <p className="text-[13px] text-gray-400 text-center font-medium leading-tight pointer-events-none group-hover:text-gray-500">
                                Click And Drag Frame On Page<br />To Activate Interaction
                            </p>
                        </div>

                        {/* Size Controls */}
                        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg justify-center">
                            <span className="text-sm font-semibold text-gray-800 text-nowrap">Size :</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 font-bold">W</span>
                                <button onClick={() => handleSizeUpdate('width', width - 1)} className="p-1 hover:text-indigo-600 transition-colors"><ChevronLeft size={16} /></button>
                                <input
                                    type="text"
                                    value={width}
                                    onChange={(e) => handleSizeUpdate('width', e.target.value)}
                                    className="w-12 h-8 bg-white border border-gray-300 rounded text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button onClick={() => handleSizeUpdate('width', width + 1)} className="p-1 hover:text-indigo-600 transition-colors"><ChevronRight size={16} /></button>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 font-bold">H</span>
                                <button onClick={() => handleSizeUpdate('height', height - 1)} className="p-1 hover:text-indigo-600 transition-colors"><ChevronLeft size={16} /></button>
                                <input
                                    type="text"
                                    value={height}
                                    onChange={(e) => handleSizeUpdate('height', e.target.value)}
                                    className="w-12 h-8 bg-white border border-gray-300 rounded text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button onClick={() => handleSizeUpdate('height', height + 1)} className="p-1 hover:text-indigo-600 transition-colors"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        {/* List of Interaction Frames */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            {frames.length > 0 ? (
                                frames.map((frame, index) => {
                                    const isSelected = selectedElement && selectedElement.id === frame.id;

                                    // Find active element in iframes (optimized)
                                    let activeEl = null;
                                    const iframes = document.querySelectorAll('iframe');
                                    for (const ifrm of iframes) {
                                        if (ifrm.contentDocument) {
                                            const el = ifrm.contentDocument.getElementById(frame.id);
                                            if (el) {
                                                activeEl = el;
                                                break;
                                            }
                                        }
                                    }

                                    return (
                                        <div key={frame.id} className={`transition-all duration-300 ${isSelected ? 'scale-[1.02]' : ''}`}>
                                            {activeEl && InteractionPanelComponent && (
                                                <InteractionPanelComponent
                                                    selectedElement={activeEl}
                                                    onUpdate={handleFrameUpdate}
                                                    onPopupPreviewUpdate={onPopupPreviewUpdate}
                                                    activePopupElement={activePopupElement}
                                                    onPopupUpdate={onPopupUpdate}
                                                    pages={pages}
                                                    isOpen={isSelected && !collapsedIds.includes(frame.id)}
                                                    onToggle={() => {
                                                        if (!isSelected && activeEl) {
                                                            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

                                                            // Use onElementSelect if available, otherwise fallback to event dispatch
                                                            if (onElementSelect) {
                                                                onElementSelect(activeEl, 'file-interaction', currentPage - 1);
                                                            } else {
                                                                const clickEvent = new MouseEvent('click', {
                                                                    view: activeEl.ownerDocument.defaultView || window,
                                                                    bubbles: true,
                                                                    cancelable: true
                                                                });
                                                                activeEl.dispatchEvent(clickEvent);
                                                            }
                                                            // Ensure it's not collapsed when selecting
                                                            setCollapsedIds(prev => prev.filter(id => id !== frame.id));
                                                        } else if (isSelected) {
                                                            // Toggle collapse state if already selected
                                                            setCollapsedIds(prev => {
                                                                if (prev.includes(frame.id)) {
                                                                    return prev.filter(id => id !== frame.id);
                                                                } else {
                                                                    return [...prev, frame.id];
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    isFrame={true}
                                                    frameLabel={frame.label}
                                                    TextEditorComponent={TextEditorComponent}
                                                    ImageEditorComponent={ImageEditorComponent}
                                                    VideoEditorComponent={VideoEditorComponent}
                                                    GifEditorComponent={GifEditorComponent}
                                                    IconEditorComponent={IconEditorComponent}
                                                />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-gray-400 italic text-xs">
                                    No interaction frames found on this page.
                                </div>
                            )}
                        </div>
                    </div>

                )}
            </div>
        </div>
    );
};

export default FileInteractionEditor;
