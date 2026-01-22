import React, { useState, useRef, useEffect, useCallback } from 'react';
import InteractionPanel from './InteractionPanel';
import {
  ChevronDown, PencilLine, AlignLeft, Bold, Minus, List,
  ChevronUp, Settings2, ArrowsUpFromLine,
  AlignCenter, AlignRight, AlignJustify, Italic, Underline,
  Strikethrough, Type, ListOrdered, RotateCcw, X, Pipette,
  ChevronLeft, ChevronRight, Star, Zap, Eye,
  ArrowLeftRight, ArrowUpDown, SlidersHorizontal,
  CaseUpper, CaseLower, Palette
} from 'lucide-react';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const fontWeights = [
  { name: 'Thin', value: '100' },
  { name: 'Light', value: '300' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Black', value: '900' }
];

// Color conversion helpers
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
};

const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
};

const hsvToRgb = (h, s, v) => {
  h /= 360;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    default: break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const parseGradient = (bgStr) => {
  if (!bgStr || bgStr === 'none') return null;

  // Match linear or radial gradient
  const typeMatch = bgStr.match(/(linear|radial)-gradient/);
  if (!typeMatch) return null;

  const type = typeMatch[1] === 'linear' ? 'Linear' : 'Radial';

  // Extract the content inside the parentheses
  let content = '';
  let startParen = bgStr.indexOf('(');
  if (startParen === -1) return null;

  let parenLevel = 0;
  for (let i = startParen; i < bgStr.length; i++) {
    const char = bgStr[i];
    if (char === '(') parenLevel++;
    if (char === ')') parenLevel--;
    if (i > startParen) content += char;
    if (parenLevel === 0) {
      content = content.slice(0, -1);
      break;
    }
  }

  // Split by comma, respecting internal parentheses
  const parts = [];
  let currentPart = '';
  parenLevel = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') parenLevel++;
    if (char === ')') parenLevel--;
    if (char === ',' && parenLevel === 0) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  parts.push(currentPart.trim());

  // Filter out non-color stops (directions like 'to right', '90deg', 'circle')
  const stopsRaw = parts.filter(p => {
    return p.includes('#') || p.includes('rgb') || p.includes('hsl') || /^[a-z]+$/i.test(p.split(' ')[0]);
  });

  const stops = stopsRaw.map((s, idx) => {
    // Try to split into color and offset
    // Handling colors like rgba(0, 0, 0, 1) and optional offsets like 0%
    const lastSpaceIdx = s.lastIndexOf(' ');
    let colorPart = s;
    let offsetPart = null;

    if (lastSpaceIdx !== -1) {
      const potentialOffset = s.substring(lastSpaceIdx + 1);
      if (potentialOffset.endsWith('%')) {
        colorPart = s.substring(0, lastSpaceIdx).trim();
        offsetPart = potentialOffset.replace('%', '');
      }
    }

    let hexColor = '#000000';
    let opacity = 100;

    const rgbaMatch = colorPart.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/);
    if (rgbaMatch) {
      hexColor = rgbToHex(parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]));
      if (rgbaMatch[4] !== undefined) opacity = Math.round(parseFloat(rgbaMatch[4]) * 100);
    } else if (colorPart.startsWith('#')) {
      hexColor = colorPart;
    }

    // Default offsets if missing
    const offset = offsetPart !== null ? parseInt(offsetPart) : (idx === 0 ? 0 : (idx === stopsRaw.length - 1 ? 100 : Math.round((idx / (stopsRaw.length - 1)) * 100)));

    return { color: hexColor, offset, opacity };
  }).filter(Boolean);

  if (stops.length < 2) return null;
  return { type, stops };
};

const TextEditor = ({ selectedElement, selectedElementType, onUpdate, onPopupPreviewUpdate, closePanelsSignal, pages }) => {
  const [isTextOpen, setIsTextOpen] = useState(true);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(true);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showDashedPopup, setShowDashedPopup] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [colorMode, setColorMode] = useState('fill'); // 'fill' or 'stroke'
  const [fillOpacity, setFillOpacity] = useState(100);
  const [strokeOpacity, setStrokeOpacity] = useState(100);

  const [activePanel, setActivePanel] = useState(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showWeightDropdown, setShowWeightDropdown] = useState(false);
  const [showBorderStyleDropdown, setShowBorderStyleDropdown] = useState(false);
  const [showFillTypeDropdown, setShowFillTypeDropdown] = useState(false);
  const [showGradientTypeDropdown, setShowGradientTypeDropdown] = useState(false);
  const [showDetailedControls, setShowDetailedControls] = useState(false);
  const [fillType, setFillType] = useState('solid'); // 'solid' or 'gradient'
  const [gradientType, setGradientType] = useState('Linear'); // 'Linear' or 'Radial'
  const [gradientStops, setGradientStops] = useState([
    { color: '#63D0CD', offset: 0, opacity: 100 },
    { color: '#4B3EFE', offset: 100, opacity: 100 }
  ]);
  const [editingGradientStopIndex, setEditingGradientStopIndex] = useState(null);

  // Redesigned Color State (for Fill)
  // Redesigned Color State (for Fill)
  const [hsv, setHsv] = useState({ h: 0, s: 0, v: 0 });
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [hex, setHex] = useState('#000000');
  const [initialColor, setInitialColor] = useState('#000000');

  // Stroke Color State (separate from fill)
  const [strokeHsv, setStrokeHsv] = useState({ h: 0, s: 0, v: 0 });
  const [strokeRgb, setStrokeRgb] = useState({ r: 0, g: 0, b: 0 });

  // Gradient Stop Color State (for editing individual gradient stops)
  const [gradientStopHsv, setGradientStopHsv] = useState({ h: 0, s: 1, v: 1 });
  const [gradientStopRgb, setGradientStopRgb] = useState({ r: 255, g: 0, b: 0 });
  const [gradientStopHex, setGradientStopHex] = useState('#FF0000');

  // Guard refs to prevent unintended overwrites on mount
  const isFirstFillEffect = useRef(true);
  const isFirstStrokeEffect = useRef(true);

  // Refs
  const pipetteInputRef = useRef(null);
  const fillTypeRef = useRef(null);

  // Load initial color from element
  useEffect(() => {
    if (selectedElement) {
      const colorStyle = window.getComputedStyle(selectedElement).color || 'rgb(0, 0, 0)';
      let r = 0, g = 0, b = 0, a = 1;

      const rgbaMatch = colorStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        r = parseInt(rgbaMatch[1]);
        g = parseInt(rgbaMatch[2]);
        b = parseInt(rgbaMatch[3]);
        if (rgbaMatch[4] !== undefined) a = parseFloat(rgbaMatch[4]);
      }

      const rgbObj = { r, g, b };
      const hsvObj = rgbToHsv(r, g, b);
      const hexVal = rgbToHex(r, g, b);

      setRgb(rgbObj);
      setHsv(hsvObj);
      setHex(hexVal);
      setInitialColor(hexVal);
      setFillOpacity(Math.round(a * 100));

      // Check for gradient
      const bgStyle = window.getComputedStyle(selectedElement).backgroundImage;
      const parsedGrad = parseGradient(bgStyle);
      if (parsedGrad) {
        setFillType('gradient');
        setGradientType(parsedGrad.type);
        setGradientStops(parsedGrad.stops);
      } else {
        setFillType('solid');
      }

      // Ensure we don't trigger the update effect for this initial load
      isFirstFillEffect.current = true;
    }
  }, [selectedElement]);

  // Load initial stroke color from element border
  useEffect(() => {
    if (selectedElement) {
      const borderColorStyle = window.getComputedStyle(selectedElement).borderColor || 'rgb(0, 0, 0)';
      let r = 0, g = 0, b = 0, a = 1;

      const rgbaMatch = borderColorStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        r = parseInt(rgbaMatch[1]);
        g = parseInt(rgbaMatch[2]);
        b = parseInt(rgbaMatch[3]);
        if (rgbaMatch[4] !== undefined) a = parseFloat(rgbaMatch[4]);
      }

      const hexVal = rgbToHex(r, g, b);
      setStrokeColor(hexVal);
      setStrokeRgb({ r, g, b });
      setStrokeHsv(rgbToHsv(r, g, b));
      setStrokeOpacity(Math.round(a * 100));
      // Ensure we don't trigger the update effect for this initial load
      isFirstStrokeEffect.current = true;
    }
  }, [selectedElement]);

  // Reset panels when selectedElement or closePanelsSignal changes
  useEffect(() => {
    setActivePanel(null);
    setShowFontDropdown(false);
    setShowWeightDropdown(false);
    setShowBorderStyleDropdown(false);
    setShowFillTypeDropdown(false);
    setShowGradientTypeDropdown(false);
    setShowDashedPopup(false);
    setShowFillPicker(false);
    setShowStrokePicker(false);
  }, [selectedElement, closePanelsSignal]);

  // Reapply fill color when opacity changes
  useEffect(() => {
    if (isFirstFillEffect.current) {
      isFirstFillEffect.current = false;
      return;
    }
    if (hex) {
      applyFillColor(hex);
    }
  }, [fillOpacity, hex]);

  // Reapply stroke color when opacity changes
  useEffect(() => {
    if (isFirstStrokeEffect.current) {
      isFirstStrokeEffect.current = false;
      return;
    }
    if (strokeColor) {
      applyStrokeColor(strokeColor);
    }
  }, [strokeOpacity, strokeColor]);

  const resetColor = () => {
    updateColorFromHex(initialColor);
  };

  const handleEyeDropper = async () => {
    if (!window.EyeDropper) {
      console.warn('EyeDropper API not supported');
      return;
    }
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      updateColorFromHex(result.sRGBHex);
    } catch (e) {
      console.error(e);
    }
  };

  const updateFillType = (type) => {
    setFillType(type);
    setShowFillTypeDropdown(false);
    if (type === 'solid') {
      if (elementRef.current) {
        elementRef.current.style.backgroundImage = 'none';
        elementRef.current.style.webkitBackgroundClip = 'initial';
        elementRef.current.style.webkitTextFillColor = 'initial';
        elementRef.current.style.backgroundClip = 'initial';
        elementRef.current.style.color = hex;
      }
      if (onUpdate) onUpdate();
    } else {
      applyGradient();
    }
  };

  const applyGradient = (stops = gradientStops, type = gradientType) => {
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
    // Convert hex to rgba with opacity
    const stopsStr = sortedStops.map(s => {
      const rgb = hexToRgb(s.color);
      const opacity = (s.opacity || 100) / 100;
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
    }).join(', ');
    const gradStr = type === 'Linear'
      ? `linear-gradient(to right, ${stopsStr})`
      : `radial-gradient(circle, ${stopsStr})`;

    if (elementRef.current) {
      // Check if we have an existing dashed stroke to preserve
      let existingStroke = '';
      if (elementRef.current.style.backgroundImage && elementRef.current.style.backgroundImage.includes('svg')) {
        // Extract the url("data:image/svg+xml...") part
        // Simple crude extraction or regex match
        const match = elementRef.current.style.backgroundImage.match(/url\("data:image\/svg\+xml,[^"]+"\)/);
        if (match) existingStroke = `, ${match[0]}`;
      }

      elementRef.current.style.backgroundImage = `${gradStr}${existingStroke}`;
      // Ensure clips are set correctly for multiple backgrounds
      if (existingStroke) {
        elementRef.current.style.webkitBackgroundClip = 'text, border-box';
        elementRef.current.style.backgroundClip = 'text, border-box';
      } else {
        elementRef.current.style.webkitBackgroundClip = 'text';
        elementRef.current.style.backgroundClip = 'text';
      }

      elementRef.current.style.webkitTextFillColor = 'transparent';

      if (onUpdate) onUpdate();
    }
  };

  const updateGradientStop = (index, updates) => {
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], ...updates };
    setGradientStops(newStops);
    applyGradient(newStops);
  };

  const removeGradientStop = (index) => {
    if (gradientStops.length <= 2) return;
    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);
    applyGradient(newStops);
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));

    // Find closest stop colors to interpolate or just duplicate nearest
    // Simpler approach: default to a nice color or the one at visual position
    // For now, let's use a default white or copy the last color? 
    // Let's copy the color of the stop that comes 'before' this new one, or default to #6366f1

    const newStop = { color: '#6366f1', offset, opacity: 100 };
    const newStops = [...gradientStops, newStop].sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    applyGradient(newStops);
  };

  const reverseGradient = () => {
    const newStops = [...gradientStops].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    applyGradient(newStops);
  };

  const updateColorFromHsv = (newHsv) => {
    const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHsv(newHsv);
    setRgb(newRgb);
    setHex(newHex);
    updateStyle('color', newHex);
  };

  const updateColorFromRgb = (newRgb) => {
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setRgb(newRgb);
    setHsv(newHsv);
    setHex(newHex);
    updateStyle('color', newHex);
  };

  const updateColorFromHex = (newHex) => {
    setHex(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      const newRgb = hexToRgb(newHex);
      const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setRgb(newRgb);
      setHsv(newHsv);
      if (fillType === 'gradient') {
        updateFillType('solid');
      } else {
        applyFillColor(newHex);
      }
    }
  };

  const applyFillColor = (hexColor) => {
    const rgbColor = hexToRgb(hexColor);
    const opacity = fillOpacity / 100;
    const rgbaColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;
    updateStyle('color', rgbaColor);
  };

  // Stroke color update functions
  const updateStrokeColorFromHsv = (newHsv) => {
    const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setStrokeHsv(newHsv);
    setStrokeRgb(newRgb);
    setStrokeColor(newHex);
    applyStrokeColor(newHex);
  };

  const updateStrokeColorFromRgb = (newRgb) => {
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setStrokeRgb(newRgb);
    setStrokeHsv(newHsv);
    setStrokeColor(newHex);
    applyStrokeColor(newHex);
  };

  const updateStrokeColorFromHex = (newHex) => {
    setStrokeColor(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      const newRgb = hexToRgb(newHex);
      const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setStrokeRgb(newRgb);
      setStrokeHsv(newHsv);
      applyStrokeColor(newHex);
    }
  };

  const applyStrokeColor = (color) => {
    const el = elementRef.current;
    if (!el) return;

    const rgbColor = hexToRgb(color);
    const opacity = strokeOpacity / 100;
    const rgbaColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;

    // Apply to border or SVG stroke depending on style
    if (el.style.backgroundImage?.includes('svg')) {
      // Update dashed stroke color by reapplying with new color
      const lineCap = isRoundCorners ? 'round' : 'square';
      const svg = `
        <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
          <rect width='100%' height='100%' fill='none' 
          stroke='${rgbaColor}' stroke-width='${borderThickness}' 
          stroke-dasharray='${dashLength},${dashGap}' stroke-dashoffset='0' stroke-linecap='${lineCap}'/>
        </svg>
      `.replace(/\s+/g, ' ');
      el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    } else {
      // Update solid border color
      el.style.borderColor = rgbaColor;
    }
    if (onUpdate) onUpdate();
  };

  // Gradient Stop color update functions
  const updateGradientStopColorFromHsv = (newHsv) => {
    const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setGradientStopHsv(newHsv);
    setGradientStopRgb(newRgb);
    setGradientStopHex(newHex);
    if (editingGradientStopIndex !== null) {
      updateGradientStop(editingGradientStopIndex, { color: newHex });
    }
  };

  const updateGradientStopColorFromRgb = (newRgb) => {
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setGradientStopRgb(newRgb);
    setGradientStopHsv(newHsv);
    setGradientStopHex(newHex);
    if (editingGradientStopIndex !== null) {
      updateGradientStop(editingGradientStopIndex, { color: newHex });
    }
  };

  const updateGradientStopColorFromHex = (newHex) => {
    setGradientStopHex(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      const newRgb = hexToRgb(newHex);
      const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setGradientStopRgb(newRgb);
      setGradientStopHsv(newHsv);
      if (editingGradientStopIndex !== null) {
        updateGradientStop(editingGradientStopIndex, { color: newHex });
      }
    }
  };

  const openGradientStopPicker = (index) => {
    const stop = gradientStops[index];
    const rgbObj = hexToRgb(stop.color);
    const hsvObj = rgbToHsv(rgbObj.r, rgbObj.g, rgbObj.b);
    setGradientStopHex(stop.color);
    setGradientStopRgb(rgbObj);
    setGradientStopHsv(hsvObj);
    setEditingGradientStopIndex(index);
  };

  // Panel Refs
  const alignmentRef = useRef(null);
  const styleRef = useRef(null);
  const caseRef = useRef(null);
  const listRef = useRef(null);

  // Dashed / Border settings
  const [dashLength, setDashLength] = useState(4);
  const [dashGap, setDashGap] = useState(4);
  const [isRoundCorners, setIsRoundCorners] = useState(false);
  const [borderThickness, setBorderThickness] = useState(0);

  const elementLabel = selectedElementType === 'image' ? 'Image' : 'Text';

  const dropdownRef = useRef(null);
  const weightRef = useRef(null);
  const dashedRef = useRef(null);
  const borderStyleRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    elementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    if (!selectedElement) {
      setBorderThickness(0);
      return;
    }
    const el = selectedElement;
    let initialThickness = 0;
    if (el.style.backgroundImage?.includes('svg')) {
      const match = el.style.backgroundImage.match(/stroke-width='([^']+)'/);
      if (match) initialThickness = parseInt(match[1], 10) || 1;
      else initialThickness = 1;
    } else if (el.style.borderWidth) {
      initialThickness = parseInt(el.style.borderWidth) || 0;
    }
    setBorderThickness(initialThickness);
  }, [selectedElement]);

  const updateStyle = useCallback((property, value) => {
    const el = elementRef.current;
    if (!el) return;
    const currentVal = window.getComputedStyle(el)[property];
    let newValue = value;

    if (property === 'fontWeight') {
      const isCurrentlyBold = currentVal === '700' || currentVal === 'bold';
      newValue = isCurrentlyBold ? '400' : '700';
    } else if (property === 'fontStyle') {
      newValue = currentVal === 'italic' ? 'normal' : 'italic';
    } else if (property === 'textDecorationLine' || property === 'textDecoration') {
      const isUnderline = currentVal.includes('underline');
      const isLineThrough = currentVal.includes('line-through');
      let nextUnderline = isUnderline;
      let nextLineThrough = isLineThrough;

      if (value === 'underline') nextUnderline = !isUnderline;
      if (value === 'line-through') nextLineThrough = !isLineThrough;

      const parts = [];
      if (nextUnderline) parts.push('underline');
      if (nextLineThrough) parts.push('line-through');
      newValue = parts.join(' ') || 'none';
    } else if (property === 'textAlign') {
      newValue = currentVal === value ? 'left' : value; // Toggle logic if needed
    } else if (property === 'listStyleType') {
      newValue = currentVal === value ? 'none' : value;
      el.style.display = newValue === 'none' ? 'block' : 'list-item';
      el.style.marginLeft = newValue === 'none' ? '0px' : '20px';
    } else if (property === 'textTransform') {
      newValue = currentVal === value ? 'none' : value;
    }

    if (property === 'color') {
      // Background clipping is now managed by updateFillType to avoid unintended clears
    }

    el.style[property] = newValue;
    if (onUpdate) onUpdate();
  }, [onUpdate]);

  const applyDashedStyle = useCallback((thickness = borderThickness) => {
    const el = elementRef.current;
    if (!el) return;

    const color = strokeColor;
    const lineCap = isRoundCorners ? 'round' : 'square';

    const svg = `
      <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
        <rect width='100%' height='100%' fill='none' 
        stroke='${color}' stroke-width='${thickness}' 
        stroke-dasharray='${dashLength},${dashGap}' stroke-dashoffset='0' stroke-linecap='${lineCap}'/>
      </svg>
    `.replace(/\s+/g, ' ');

    el.style.border = 'none';

    // Check if we need to preserve a gradient
    if (fillType === 'gradient') {
      // Re-construct gradient string from current state
      const sortedStops = [...gradientStops].sort((a, b) => a.offset - b.offset);
      const stopsStr = sortedStops.map(s => {
        const rgb = hexToRgb(s.color);
        const opacity = (s.opacity || 100) / 100;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
      }).join(', ');
      const gradStr = gradientType === 'Linear'
        ? `linear-gradient(to right, ${stopsStr})`
        : `radial-gradient(circle, ${stopsStr})`;

      // Combine gradient (drawn on text) and SVG (drawn on border box)
      // Note: webkitTextFillColor transparent handles showing the gradient on text
      el.style.backgroundImage = `${gradStr}, url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      // background-clip needs to be set appropriately so gradient clips to text and SVG to border-box
      // However, standardized 'background-clip' takes comma-separated values matching background-image
      el.style.backgroundClip = 'text, border-box';
      el.style.webkitBackgroundClip = 'text, border-box';
    } else {
      el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      el.style.backgroundOrigin = 'border-box';
      el.style.backgroundClip = 'border-box';
      el.style.webkitBackgroundClip = 'border-box';
    }

    if (onUpdate) onUpdate();
  }, [dashLength, dashGap, isRoundCorners, borderThickness, strokeColor, fillType, gradientStops, gradientType, onUpdate]);

  useEffect(() => {
    if (elementRef.current && elementRef.current.style.backgroundImage.includes('svg')) {
      applyDashedStyle();
    }
  }, [dashLength, dashGap, isRoundCorners, applyDashedStyle]);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const getCurrentStyle = (prop) => {
    if (!selectedElement) return '';
    return window.getComputedStyle(selectedElement)[prop] || '';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowFontDropdown(false);
      if (weightRef.current && !weightRef.current.contains(event.target)) setShowWeightDropdown(false);
      if (borderStyleRef.current && !borderStyleRef.current.contains(event.target)) setShowBorderStyleDropdown(false);
      if (dashedRef.current && !dashedRef.current.contains(event.target)) {
        if (!event.target.closest('.dashed-selector-trigger')) setShowDashedPopup(false);
      }

      // Close panels if clicked outside
      if (activePanel) {
        if (activePanel === 'alignment' && alignmentRef.current && !alignmentRef.current.contains(event.target) && !event.target.closest('.alignment-trigger')) setActivePanel(null);
        if (activePanel === 'style' && styleRef.current && !styleRef.current.contains(event.target) && !event.target.closest('.style-trigger')) setActivePanel(null);
        if (activePanel === 'case' && caseRef.current && !caseRef.current.contains(event.target) && !event.target.closest('.case-trigger')) setActivePanel(null);
        if (activePanel === 'list' && listRef.current && !listRef.current.contains(event.target) && !event.target.closest('.list-trigger')) setActivePanel(null);
      }
      if (fillTypeRef.current && !fillTypeRef.current.contains(event.target)) setShowFillTypeDropdown(false);
      if (event.target.closest('.gradient-type-trigger') === null) setShowGradientTypeDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePanel, showFontDropdown, showWeightDropdown, showBorderStyleDropdown, showDashedPopup, showFillTypeDropdown, showGradientTypeDropdown]);

  if (!selectedElement) return null;

  return (
    <div className="relative flex items-start gap-4 justify-end font-sans">

      {/* DASHED POPUP */}
      <div ref={dashedRef} className={`fixed top-80 w-[270px] bg-white border border-gray-100 rounded-3xl shadow-2xl transition-all duration-300 z-50 overflow-hidden ${showDashedPopup ? 'right-[440px] opacity-100 scale-100' : 'right-[700px] opacity-0 scale-95 pointer-events-none'}`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-gray-800">Dashed Settings</span>
            <div className="h-[1px] flex-grow bg-gray-100"></div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Length</span>
              <input type="range" min="1" max="20" value={dashLength} onChange={(e) => setDashLength(parseInt(e.target.value))} className="w-24 accent-indigo-600" />
              <span className="text-sm font-bold w-6 text-center">{dashLength}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Gap</span>
              <input type="range" min="1" max="20" value={dashGap} onChange={(e) => setDashGap(parseInt(e.target.value))} className="w-24 accent-indigo-600" />
              <span className="text-sm font-bold w-6 text-center">{dashGap}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Round Corners</span>
              <input type="checkbox" checked={isRoundCorners} onChange={(e) => setIsRoundCorners(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* SIMPLE STROKE COLOR PICKER */}
      <div className={`fixed top-1/2 -translate-y-1/2 right-[330px] w-[240px] bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-300 z-50 overflow-hidden ${showStrokePicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-2">
            {[
              '#FFFFFF', '#000000', '#FF0000', '#FFA500', '#8B4513', '#FFFF00',
              '#00FF00', '#808000', '#006400', '#00FFFF', '#008080', '#008B8B',
              '#E6E6FA', '#0000FF', '#0000CD', '#000080', '#EE82EE', '#D8BFD8',
              '#FF00FF', '#FF1493', '#808080', '#D3D3D3', '#F5F5F5', '#696969'
            ].map((color) => (
              <button
                key={color}
                onClick={() => updateStrokeColorFromHex(color)}
                className="w-8 h-8  rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* GRADIENT STOP COLOR PICKER */}
      <div className={`fixed top-[50%] -translate-y-1/2 right-[50px] w-[250px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-2 border-blue-500 transition-all duration-300 z-[100] overflow-hidden ${editingGradientStopIndex !== null ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {/* Close Icon */}
        <button
          onClick={() => setEditingGradientStopIndex(null)}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors z-10"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="p-5 space-y-4">
          {/* Color Picker: Saturation/Value + Hue Slider */}
          <div className="flex gap-3">
            {/* Saturation/Value Picker */}
            <div
              className="w-[200px] h-[200px] rounded-lg relative cursor-crosshair overflow-hidden border border-gray-200"
              style={{ backgroundColor: `hsl(${gradientStopHsv.h}, 100%, 50%)` }}
              onMouseDown={(e) => {
                const handleMove = (moveEvent) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                  const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                  updateGradientStopColorFromHsv({ ...gradientStopHsv, s: x, v: 1 - y });
                };
                handleMove(e);
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${gradientStopHsv.s * 100}%`, top: `${(1 - gradientStopHsv.v) * 100}%` }}
              ></div>
            </div>

            {/* Vertical Hue Slider */}
            <div
              className="w-[40px] h-[200px] rounded-lg relative cursor-pointer border border-gray-200"
              style={{ background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
              onMouseDown={(e) => {
                const handleMove = (moveEvent) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                  updateGradientStopColorFromHsv({ ...gradientStopHsv, h: y * 360 });
                };
                handleMove(e);
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
              }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2 w-full h-2 border-2 border-white rounded-sm shadow-md"
                style={{ top: `${(gradientStopHsv.h / 360) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Color Code Input */}
          <div className="flex items-center gap-1 bg-white">
            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">Color Code :</span>
            <div className="flex-grow flex items-center gap-2 px-2 h-10 border border-gray-300 rounded-lg bg-white mr-1">
              <input
                type="text"
                value={gradientStopHex}
                onChange={(e) => updateGradientStopColorFromHex(e.target.value)}
                className="flex-grow text-sm font-mono text-gray-700 outline-none uppercase w-full"
                maxLength={7}
              />
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">Opacity :</span>
            <div className="flex-grow">
              <input
                type="range"
                min="0"
                max="100"
                value={editingGradientStopIndex !== null ? gradientStops[editingGradientStopIndex]?.opacity || 100 : 100}
                onChange={(e) => {
                  if (editingGradientStopIndex !== null) {
                    updateGradientStop(editingGradientStopIndex, { opacity: parseInt(e.target.value) });
                  }
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, transparent 0%, ${gradientStopHex} 100%)`,
                  accentColor: '#6366f1'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* COLOR FILL CONTAINER (Only for Fill, not Stroke) */}
      <div className={`fixed top-1/2 -translate-y-1/2 right-[320px] w-[280px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 z-50 overflow-hidden flex flex-col max-h-[90vh] ${showFillPicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <div className="relative" ref={fillTypeRef}>
              <button
                onClick={() => setShowFillTypeDropdown(!showFillTypeDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-w-[100px] justify-between shadow-sm"
              >
                <span className="capitalize">{fillType}</span> <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showFillTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-[120px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <button onClick={() => updateFillType('solid')} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Solid</button>
                  <button onClick={() => updateFillType('gradient')} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Gradient</button>
                </div>
              )}
            </div>

            {fillType === 'gradient' && (
              <div className="relative gradient-type-trigger">
                <button
                  onClick={() => setShowGradientTypeDropdown(!showGradientTypeDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-w-[100px] justify-between shadow-sm"
                >
                  {gradientType} <ChevronDown size={14} className="text-gray-400" />
                </button>
                {showGradientTypeDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-[120px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <button onClick={() => { setGradientType('Linear'); applyGradient(gradientStops, 'Linear'); setShowGradientTypeDropdown(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Linear</button>
                    <button onClick={() => { setGradientType('Radial'); applyGradient(gradientStops, 'Radial'); setShowGradientTypeDropdown(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Radial</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            {fillType === 'solid' && (
              <RotateCcw
                size={16}
                className="hover:text-indigo-500 cursor-pointer transition-colors"
                onClick={resetColor}
              />
            )}
            <X size={18} className="hover:text-gray-600 cursor-pointer transition-colors" onClick={() => setShowFillPicker(false)} />
          </div>
        </div>

        {fillType === 'solid' ? (
          <>
            {/* Detailed Controls Container */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showDetailedControls ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 space-y-4">
                {/* Saturation/Value Picker */}
                <div
                  className="w-full h-36 rounded-lg relative cursor-crosshair overflow-hidden"
                  style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                  onMouseDown={(e) => {
                    const handleMove = (moveEvent) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                      const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                      updateColorFromHsv({ ...hsv, s: x, v: 1 - y });
                    };
                    handleMove(e);
                    window.addEventListener('mousemove', handleMove);
                    window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <div
                    className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
                  ></div>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black rounded-tl-full"></div>
                </div>

                {/* Hue and Eyedropper row */}
                <div className="flex items-center gap-3">
                  <Pipette size={18} className="text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors" onClick={handleEyeDropper} />
                  <div className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: hex }}></div>
                  <div
                    className="flex-grow h-3 rounded-full relative cursor-pointer"
                    style={{ background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
                    onMouseDown={(e) => {
                      const handleMove = (moveEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                        updateColorFromHsv({ ...hsv, h: x * 360 });
                      };
                      handleMove(e);
                      window.addEventListener('mousemove', handleMove);
                      window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                    }}
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 border border-white rounded-full shadow-md -translate-x-1/2"
                      style={{ left: `${(hsv.h / 360) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* RGB Inputs */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 text-center">
                    <div className="h-10 border border-gray-200 rounded flex items-center justify-center font-medium text-sm text-gray-700 bg-white shadow-sm">
                      <input
                        type="number"
                        value={rgb.r}
                        onChange={(e) => updateColorFromRgb({ ...rgb, r: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })}
                        className="w-full text-center outline-none"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">R</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="h-10 border border-gray-200 rounded flex items-center justify-center font-medium text-sm text-gray-700 bg-white shadow-sm">
                      <input
                        type="number"
                        value={rgb.g}
                        onChange={(e) => updateColorFromRgb({ ...rgb, g: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })}
                        className="w-full text-center outline-none"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">G</div>
                  </div>
                  <div className="space-y-1 text-center flex flex-col">
                    <div className="h-10 border border-gray-200 rounded flex items-center justify-center font-medium text-sm text-gray-700 bg-white relative shadow-sm">
                      <input
                        type="number"
                        value={rgb.b}
                        onChange={(e) => updateColorFromRgb({ ...rgb, b: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })}
                        className="w-full text-center outline-none"
                      />
                      <div className="absolute right-1 flex flex-col grayscale opacity-40">
                        <ChevronUp size={10} />
                        <ChevronDown size={10} />
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">B</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="p-4 pt-2">
              <div className="grid grid-cols-6 gap-2">
                {[
                  '#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00',
                  '#ADFF2F', '#228B22', '#008080', '#40E0D0', '#00CED1', '#008B8B',
                  '#ADD8E6', '#87CEEB', '#0000FF', '#000080', '#E6E6FA', '#FF00FF',
                  '#A9A9A9', '#D3D3D3', '#F5F5F5', '#333333'
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: c }}
                    onClick={() => updateColorFromHex(c)}
                    className="w-full aspect-square rounded-[10px] border border-gray-100 cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-sm"
                  ></div>
                ))}
              </div>
            </div>

            {/* Footer Toggle */}
            <div className="p-3 border-t border-gray-100 flex items-center justify-center">
              <button
                onClick={() => setShowDetailedControls(!showDetailedControls)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors rounded-xl w-full"
              >
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                <span className="text-sm font-medium text-gray-600">Customize Colors</span>
              </button>
            </div>
          </>
        ) : (
          /* Gradient Content */
          <div className="p-4 space-y-6">
            {/* Gradient Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-gray-800 whitespace-nowrap">Gradient Colors</span>
                <div className="h-[1px] flex-grow bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[
                  'linear-gradient(to bottom, #ff5f6d, #ffc371)', // Red-Orange
                  'linear-gradient(to bottom, #6366f1, #a855f7)', // Blue-Purple
                  'linear-gradient(to bottom, #2dd4bf, #22d3ee)', // Teal-Cyan
                  'linear-gradient(to bottom, #84cc16, #4ade80)', // Green-LightGreen
                  'linear-gradient(to bottom, #fde047, #fef08a)', // Yellow-Cream
                  'linear-gradient(to bottom, #ec4899, #f472b6)', // Pink-Magenta
                  'linear-gradient(to bottom, #a5b4fc, #e0e7ff)', // Purple-White
                  'linear-gradient(to bottom, #d946ef, #f0abfc)', // DarkPink-LightPink
                  'linear-gradient(to bottom, #06b6d4, #67e8f9)', // Blue-Cyan
                  'linear-gradient(to bottom, #9ca3af, #d1d5db)', // Grey-Grey
                  'linear-gradient(to bottom, #a48d00, #71aa13)', // Olive-Green
                  'linear-gradient(to bottom, #db2777, #f43f5e)'  // Red-DeepRed
                ].map((g, i) => (
                  <div
                    key={i}
                    style={{ background: g }}
                    className="w-full aspect-square rounded-lg border border-gray-100 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                    onClick={() => {
                      const matches = g.match(/#[0-9a-fA-F]{6}/g);
                      if (matches && matches.length >= 2) {
                        const newStops = [
                          { color: matches[0], offset: 0, opacity: 100 },
                          { color: matches[1], offset: 100, opacity: 100 }
                        ];
                        setGradientStops(newStops);
                        applyGradient(newStops);
                      }
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Customize Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-grow">
                  <span className="text-[13px] font-bold text-gray-800">Customize</span>
                  <div className="h-[1px] flex-grow bg-gray-100"></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const initialStops = [
                      { color: '#63D0CD', offset: 0, opacity: 100 },
                      { color: '#4B3EFE', offset: 100, opacity: 100 }
                    ];
                    setGradientStops(initialStops);
                    applyGradient(initialStops);
                  }} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm transition-colors">
                    <RotateCcw size={15} />
                  </button>
                  <button onClick={reverseGradient} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm transition-colors">
                    <ArrowLeftRight size={15} />
                  </button>
                </div>
              </div>

              {/* Interactive Gradient Bar */}
              <div className="relative pt-6 pb-2 px-1">
                {/* Pins/Handles above the bar */}
                <div className="absolute top-0 left-0 w-full h-8 flex items-center pointer-events-none px-1">
                  {gradientStops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="absolute -translate-x-1/2 flex flex-col items-center group pointer-events-auto cursor-pointer"
                      style={{ left: `${stop.offset}%` }}
                      onClick={() => openGradientStopPicker(idx)}
                      title="Click to edit color"
                    >
                      <div className="w-5 h-5 rounded-md border-2 border-white shadow-md relative hover:scale-110 transition-transform" style={{ backgroundColor: stop.color }}>
                        <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[2px] h-[5px] bg-white shadow-sm"></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* The Bar */}
                <div
                  className="w-full h-8 rounded-lg shadow-inner border border-gray-100 cursor-copy"
                  onClick={addGradientStop}
                  title="Click to add a color stop"
                  style={{
                    background: `linear-gradient(to right, ${gradientStops.map(s => {
                      const rgb = hexToRgb(s.color);
                      const opacity = (s.opacity || 100) / 100;
                      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
                    }).join(', ')})`
                  }}
                ></div>
              </div>

              {/* Stop Detail Row List */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {gradientStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-grow flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm border border-gray-100 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: stop.color }}
                        onClick={() => openGradientStopPicker(idx)}
                        title="Click to customize color"
                      ></div>
                      <input
                        type="text"
                        value={stop.color}
                        onChange={(e) => updateGradientStop(idx, { color: e.target.value })}
                        className="text-[13px] font-medium text-gray-500 flex-grow uppercase font-mono tracking-tight bg-transparent outline-none w-20"
                        maxLength={7}
                      />

                    </div>
                    <button
                      onClick={() => removeGradientStop(idx)}
                      disabled={gradientStops.length <= 2}
                      className={`w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center transition-all shadow-sm ${gradientStops.length <= 2 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                    >
                      <Minus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="w-full max-w-[360px] space-y-4 z-10 text-[#333]">

        {/* TEXT SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsTextOpen(!isTextOpen)}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                <PencilLine size={16} className="text-indigo-600" />
              </div>
              <span className="font-semibold text-gray-800 text-sm">Text</span>
            </div>
            {isTextOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>

          {isTextOpen && (
            <div className="p-5 pt-0 space-y-5">

              {/* Text Area */}
              <div className="relative group">
                <textarea
                  value={selectedElement?.textContent || ''}
                  onChange={(e) => { if (elementRef.current) { elementRef.current.textContent = e.target.value; if (onUpdate) onUpdate(); } }}
                  placeholder="Enter your text here..."
                  className="w-full h-[90px] p-3.5 pr-9 bg-white border-2 border-gray-200 rounded-lg resize-none outline-none text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400"
                />
                <div className="absolute right-3 bottom-3 w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                  <PencilLine size={12} className="text-gray-500" />
                </div>
              </div>

              {/* Typography Header */}
              <div className="flex items-center gap-2.5 pt-1">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-700">Typography</span>
                <div className="h-px flex-grow bg-gradient-to-r from-gray-200 via-gray-100 to-transparent"></div>
              </div>

              {/* Font Controls */}
              <div className="space-y-3">
                {/* Row 1: Font Family & Size */}
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-grow h-10" ref={dropdownRef}>
                    <button onClick={() => setShowFontDropdown(!showFontDropdown)} className="w-full h-full flex items-center justify-between px-3.5 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                      <span className="truncate mr-2 text-gray-700" style={{ fontFamily: getCurrentStyle('fontFamily') }}>{getCurrentStyle('fontFamily').split(',')[0] || 'Arial'}</span>
                      <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    </button>
                    {showFontDropdown && (
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto custom-scrollbar">
                        {fontFamilies.map((font) => (
                          <div key={font} onClick={() => { updateStyle('fontFamily', font); setShowFontDropdown(false); }} className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors" style={{ fontFamily: font }}>{font}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative w-[88px] h-10">
                    <select value={parseInt(getCurrentStyle('fontSize')) || 12} onChange={(e) => updateStyle('fontSize', e.target.value + 'px')} className="w-full h-full pl-3 pr-8 bg-white border-2 border-gray-200 rounded-lg appearance-none text-sm font-semibold text-gray-700 outline-none cursor-pointer hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                      {[12, 14, 16, 18, 20, 24, 32, 48, 64, 72, 96].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Row 2: Weight, Spacing, LineHeight */}
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1 h-10" ref={weightRef}>
                    <button onClick={() => setShowWeightDropdown(!showWeightDropdown)} className="w-full h-full flex items-center justify-between px-3.5 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                      <span className="truncate text-gray-700">{fontWeights.find(w => w.value === getCurrentStyle('fontWeight'))?.name || 'Regular'}</span>
                      <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    </button>
                    {showWeightDropdown && (
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto custom-scrollbar">
                        {fontWeights.map((w) => (
                          <div key={w.value} onClick={() => { updateStyle('fontWeight', w.value); setShowWeightDropdown(false); }} className="px-4 py-2.5 cursor-pointer text-sm font-medium hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 transition-colors">{w.name}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Spacing */}
                  <div className="relative w-[106px] h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center px-1.5 hover:border-indigo-300 transition-colors group">
                    <button onClick={() => {
                      const current = parseInt(getCurrentStyle('letterSpacing')) || 0;
                      updateStyle('letterSpacing', (current - 1) + 'px');
                    }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">−</button>
                    <input readOnly className="w-full text-center text-xs font-semibold text-gray-700 outline-none bg-transparent" value={parseInt(getCurrentStyle('letterSpacing')) || 0} />
                    <button onClick={() => {
                      const current = parseInt(getCurrentStyle('letterSpacing')) || 0;
                      updateStyle('letterSpacing', (current + 1) + 'px');
                    }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">+</button>
                    <ArrowLeftRight size={13} className="text-gray-400 group-hover:text-indigo-400 flex-shrink-0 ml-1 transition-colors" />
                  </div>

                  {/* Line Height */}
                  <div className="relative w-[106px] h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center px-1.5 hover:border-indigo-300 transition-colors group">
                    <button onClick={() => {
                      const current = parseFloat(getCurrentStyle('lineHeight')) || 1.2;
                      updateStyle('lineHeight', (current - 0.1).toFixed(1));
                    }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">−</button>
                    <input readOnly className="w-full text-center text-xs font-semibold text-gray-700 outline-none bg-transparent" value={parseFloat(getCurrentStyle('lineHeight')) || 1.2} />
                    <button onClick={() => {
                      const current = parseFloat(getCurrentStyle('lineHeight')) || 1.2;
                      updateStyle('lineHeight', (current + 0.1).toFixed(1));
                    }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">+</button>
                    <ArrowUpDown size={13} className="text-gray-400 group-hover:text-indigo-400 flex-shrink-0 ml-1 transition-colors" />
                  </div>
                </div>

                {/* Row 3: Buttons with Popups */}
                <div className="flex items-center gap-2 pt-0.5 relative">

                  {/* Alignment */}
                  <div className="relative" ref={alignmentRef}>
                    <button
                      className={`alignment-trigger w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${activePanel === 'alignment' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('alignment')}
                    >
                      <AlignLeft size={17} />
                    </button>
                    {activePanel === 'alignment' && (
                      <div className="absolute top-10 left-0 z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('textAlign', 'left')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${elementRef.current?.style.textAlign === 'left' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignLeft size={20} /></button>
                        <button onClick={() => updateStyle('textAlign', 'center')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${elementRef.current?.style.textAlign === 'center' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignCenter size={20} /></button>
                        <button onClick={() => updateStyle('textAlign', 'right')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${elementRef.current?.style.textAlign === 'right' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignRight size={20} /></button>
                        <button onClick={() => updateStyle('textAlign', 'justify')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${elementRef.current?.style.textAlign === 'justify' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignJustify size={20} /></button>
                      </div>
                    )}
                  </div>

                  {/* Style */}
                  <div className="relative" ref={styleRef}>
                    <button
                      className={`style-trigger w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${activePanel === 'style' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('style')}
                    >
                      <Bold size={17} />
                    </button>
                    {activePanel === 'style' && (
                      <div className="absolute top-10 left-[-50px] z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('fontWeight', 'bold')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-gray-800 transition-colors ${elementRef.current?.style.fontWeight === '700' || elementRef.current?.style.fontWeight === 'bold' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>B</button>
                        <button onClick={() => updateStyle('fontStyle', 'italic')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg italic font-serif text-gray-800 transition-colors ${elementRef.current?.style.fontStyle === 'italic' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>I</button>
                        <button onClick={() => updateStyle('textDecoration', 'underline')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg underline text-gray-800 transition-colors ${elementRef.current?.style.textDecoration?.includes('underline') ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>U</button>
                        <button onClick={() => updateStyle('textDecoration', 'line-through')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg line-through text-gray-800 transition-colors ${elementRef.current?.style.textDecoration?.includes('line-through') ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><span className="line-through">S</span></button>
                      </div>
                    )}
                  </div>

                  {/* Case */}
                  <div className="relative" ref={caseRef}>
                    <button
                      className={`case-trigger w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${activePanel === 'case' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('case')}
                    >
                      <Type size={17} />
                    </button>
                    {activePanel === 'case' && (
                      <div className="absolute top-10 left-[-100px] z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('textTransform', 'none')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${elementRef.current?.style.textTransform === 'none' || !elementRef.current?.style.textTransform ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><Minus size={20} /></button>
                        <button onClick={() => updateStyle('textTransform', 'capitalize')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-gray-800 transition-colors ${elementRef.current?.style.textTransform === 'capitalize' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>Aa</button>
                        <button onClick={() => updateStyle('textTransform', 'uppercase')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-gray-800 transition-colors ${elementRef.current?.style.textTransform === 'uppercase' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>AB</button>
                        <button onClick={() => updateStyle('textTransform', 'lowercase')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-gray-800 transition-colors ${elementRef.current?.style.textTransform === 'lowercase' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>ab</button>
                      </div>
                    )}
                  </div>

                  {/* List */}
                  <div className="relative" ref={listRef}>
                    <button
                      className={`list-trigger w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${activePanel === 'list' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('list')}
                    >
                      <List size={17} />
                    </button>
                    {activePanel === 'list' && (
                      <div className="absolute top-10 right-0 z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('listStyleType', 'disc')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${elementRef.current?.style.listStyleType === 'disc' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><List size={20} /></button>
                        <button onClick={() => updateStyle('listStyleType', 'square')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${elementRef.current?.style.listStyleType === 'square' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><List size={20} /></button>
                        <button onClick={() => updateStyle('listStyleType', 'decimal')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${elementRef.current?.style.listStyleType === 'decimal' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><ListOrdered size={20} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Color Section */}
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-white to-gray-50 cursor-pointer hover:from-gray-50 hover:to-gray-100 border-b border-gray-200 transition-all" onClick={() => setIsColorOpen(!isColorOpen)}>
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-indigo-500" />
                    <span className="font-bold text-sm text-gray-800">Color</span>
                  </div>
                  {isColorOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>

                {isColorOpen && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Fill */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 w-12">Fill</span>
                      <div onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); setColorMode('fill'); }} className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer flex-shrink-0 hover:scale-105 transition-transform shadow-sm" style={{ backgroundColor: hex }}></div>
                      <div className="flex-grow flex items-center border-2 border-gray-200 rounded-lg overflow-hidden h-10 bg-white hover:border-indigo-300 transition-colors">
                        <input
                          type="text"
                          value={hex.toUpperCase()}
                          onChange={(e) => updateColorFromHex(e.target.value)}
                          className="w-[58px] h-full px-1 text-[11px] font-bold text-gray-700 outline-none flex-shrink-0 text-center"
                          maxLength={7}
                          placeholder="#000000"
                        />
                        <div className="flex-grow flex items-center border-l-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white h-full">
                          <button
                            onClick={() => setFillOpacity(Math.max(0, fillOpacity - 5))}
                            className="w-6 h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 border-r border-gray-200 font-bold transition-colors"
                          >−</button>
                          <span className="text-gray-700 text-[11px] px-1 min-w-[32px] text-center flex-grow font-bold bg-white h-full flex items-center justify-center">{fillOpacity}%</span>
                          <button
                            onClick={() => setFillOpacity(Math.min(100, fillOpacity + 5))}
                            className="w-6 h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 font-bold transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Stroke */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 w-12">Stroke</span>
                      <div
                        onClick={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); setColorMode('stroke'); }}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer flex-shrink-0 hover:scale-105 transition-transform shadow-sm"
                        style={{ backgroundColor: strokeColor }}
                      ></div>
                      <div className="flex-grow flex items-center border-2 border-gray-200 rounded-lg overflow-hidden h-10 bg-white hover:border-indigo-300 transition-colors">
                        <input
                          type="text"
                          value={strokeColor.toUpperCase()}
                          onChange={(e) => updateStrokeColorFromHex(e.target.value)}
                          className="w-[58px] h-full px-1 text-[11px] font-bold text-gray-700 outline-none flex-shrink-0 text-center"
                          maxLength={7}
                          placeholder="#000000"
                        />
                        <div className="flex-grow flex items-center border-l-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white h-full">
                          <button
                            onClick={() => setStrokeOpacity(Math.max(0, strokeOpacity - 5))}
                            className="w-6 h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 border-r border-gray-200 font-bold transition-colors"
                          >−</button>
                          <span className="text-gray-700 text-[11px] px-1 min-w-[32px] text-center flex-grow font-bold bg-white h-full flex items-center justify-center">{strokeOpacity}%</span>
                          <button
                            onClick={() => setStrokeOpacity(Math.min(100, strokeOpacity + 5))}
                            className="w-6 h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 font-bold transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Settings / Dashed */}
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <div className="p-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => setShowDashedPopup(!showDashedPopup)}>
                        <SlidersHorizontal size={18} className="text-gray-500 group-hover:text-indigo-600 dashed-selector-trigger transition-colors" />
                      </div>

                      <div className="relative" ref={borderStyleRef}>
                        <div className="h-8 px-2 border border-gray-300 rounded flex items-center gap-2 cursor-pointer min-w-[90px] justify-between" onClick={() => setShowBorderStyleDropdown(!showBorderStyleDropdown)}>
                          <span className="text-xs text-gray-700">{elementRef.current?.style.backgroundImage?.includes('svg') ? 'Dashed' : 'Solid'}</span>
                          <ChevronDown size={12} className="text-gray-500" />
                        </div>
                        {showBorderStyleDropdown && (
                          <div className="absolute right-0 bottom-full mb-1 w-[100px] bg-white border border-gray-200 rounded shadow-lg z-50">
                            <div onClick={() => {
                              if (elementRef.current) {
                                // If we have a gradient, we MUST preserve it and only remove the SVG
                                if (fillType === 'gradient') {
                                  // Re-construct just the gradient string
                                  const sortedStops = [...gradientStops].sort((a, b) => a.offset - b.offset);
                                  const stopsStr = sortedStops.map(s => {
                                    const rgb = hexToRgb(s.color);
                                    const opacity = (s.opacity || 100) / 100;
                                    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
                                  }).join(', ');
                                  const gradStr = gradientType === 'Linear'
                                    ? `linear-gradient(to right, ${stopsStr})`
                                    : `radial-gradient(circle, ${stopsStr})`;

                                  elementRef.current.style.backgroundImage = gradStr;
                                  elementRef.current.style.webkitBackgroundClip = 'text';
                                  elementRef.current.style.backgroundClip = 'text';
                                } else {
                                  elementRef.current.style.backgroundImage = 'none';
                                }

                                elementRef.current.style.borderStyle = 'solid';
                                const currentThickness = borderThickness || 1;
                                setBorderThickness(currentThickness);
                                elementRef.current.style.borderWidth = currentThickness + 'px';
                                const rgbColor = hexToRgb(strokeColor);
                                const opacity = strokeOpacity / 100;
                                elementRef.current.style.borderColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;
                              }
                              setShowBorderStyleDropdown(false);
                            }} className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer">Solid</div>
                            <div onClick={() => {
                              if (elementRef.current) {
                                const currentThickness = borderThickness || 1;
                                setBorderThickness(currentThickness);
                                applyDashedStyle(currentThickness);
                              }
                              setShowBorderStyleDropdown(false);
                            }} className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer">Dashed</div>
                          </div>
                        )}
                      </div>

                      <div className="h-8 w-24 border border-gray-300 rounded flex items-center px-1">
                        <button onClick={() => {
                          const val = Math.max(0, borderThickness - 1);
                          setBorderThickness(val);
                          if (elementRef.current?.style.backgroundImage?.includes('svg')) applyDashedStyle(val);
                          else if (elementRef.current) elementRef.current.style.borderWidth = val + 'px';
                        }} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">-</button>
                        <input type="number" readOnly value={borderThickness} className="w-full text-xs outline-none text-center bg-transparent" />
                        <button onClick={() => {
                          const val = borderThickness + 1;
                          setBorderThickness(val);
                          if (elementRef.current?.style.backgroundImage?.includes('svg')) applyDashedStyle(val);
                          else if (elementRef.current) elementRef.current.style.borderWidth = val + 'px';
                        }} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">+</button>
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* INTERACTION SECTION */}
        <InteractionPanel
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onPopupPreviewUpdate={onPopupPreviewUpdate}
        />

      </div>
    </div>
  );

};

export default TextEditor;