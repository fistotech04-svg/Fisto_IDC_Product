import React, { useState, useRef, useEffect, useCallback } from 'react';
import InteractionPanel from './InteractionPanel';
import { Icon } from '@iconify/react';
import {
  ChevronDown, PencilLine, AlignLeft, Bold, Minus, List,
  ChevronUp, Settings2, ArrowsUpFromLine,
  AlignCenter, AlignRight, AlignJustify, Italic, Underline,
  Strikethrough, Type, ListOrdered, RotateCcw, X, Pipette,
  ChevronLeft, ChevronRight, Star, Zap, Eye,
  ArrowLeftRight, ArrowUpDown, SlidersHorizontal,
  CaseUpper, CaseLower, Palette, Edit3
} from 'lucide-react';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const fontWeights = [
  { name: 'Thin', value: '200' },
  { name: 'Light', value: '400' },
  { name: 'Regular', value: '600' },
  { name: 'Semi Bold', value: '800' },
  { name: 'Bold', value: '1000' }
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
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const isTextOpen = activeSection === 'main';
  const isInteractionOpen = activeSection === 'interaction';
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showDashedPopup, setShowDashedPopup] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [colorMode, setColorMode] = useState('fill'); // 'fill' or 'stroke'
  const [fillOpacity, setFillOpacity] = useState(100);
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [strokeType, setStrokeType] = useState('solid'); // 'solid' or 'dashed'
  const [strokePosition, setStrokePosition] = useState('outside'); // 'outside', 'center', 'inside'
  const [showStrokePositionDropdown, setShowStrokePositionDropdown] = useState(false);

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
  const [isSyncing, setIsSyncing] = useState(false);

  // Color State (Fill)
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

  // Dashed / Border settings
  const [dashLength, setDashLength] = useState(4);
  const [dashGap, setDashGap] = useState(4);
  const [isRoundCorners, setIsRoundCorners] = useState(false);
  const [borderThickness, setBorderThickness] = useState(0);
  const strokePositionRef = useRef(null);

  // Guard ref to track current syncing status
  const lastSelectedElementRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Refs
  const pipetteInputRef = useRef(null);
  const fillTypeRef = useRef(null);
  const dropdownRef = useRef(null);
  const weightRef = useRef(null);
  const dashedRef = useRef(null);
  const borderStyleRef = useRef(null);

  const alignmentRef = useRef(null);
  const styleRef = useRef(null);
  const caseRef = useRef(null);
  const listRef = useRef(null);
  const fillPickerRef = useRef(null);
  const strokePickerRef = useRef(null);
  const gradientStopPickerRef = useRef(null);

  // --- HELPER FUNCTIONS ---

  const escapeSvg = (str) => {
    return str.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return m;
      }
    });
  };

  const applyDesign = useCallback(() => {
    const el = selectedElement;
    if (!el) return;

    const styles = window.getComputedStyle(el);
    const text = el.innerText || '';
    const fontSize = styles.fontSize;
    const fontFamily = styles.fontFamily;
    const fontWeight = styles.fontWeight;
    const textAlign = styles.textAlign;
    const letterSpacing = styles.letterSpacing;
    const lineHeight = styles.lineHeight === 'normal' ? parseFloat(fontSize) * 1.2 : parseFloat(styles.lineHeight);

    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const width = el.offsetWidth;
    const height = el.offsetHeight;

    // --- Fill Prep ---
    const fillRgb = hexToRgb(hex);
    const rgbaFill = `rgba(${fillRgb.r}, ${fillRgb.g}, ${fillRgb.b}, ${fillOpacity / 100})`;

    let gradStr = '';
    if (fillType === 'gradient') {
      const stopsStr = gradientStops.map(s => {
        const rgb = hexToRgb(s.color);
        const op = (s.opacity || 100) / 100;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${op}) ${s.offset}%`;
      }).join(', ');
      gradStr = gradientType === 'Linear'
        ? `linear-gradient(to right, ${stopsStr})`
        : `radial-gradient(circle, ${stopsStr})`;
    }

    // --- Stroke Prep ---
    const sRgb = hexToRgb(strokeColor);
    const rgbaStroke = `rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, ${strokeOpacity / 100})`;

    if (strokeType === 'dashed') {
      // DASHED MODE: All-in-one SVG Background
      if (width === 0 || height === 0) return;

      const lineCap = isRoundCorners ? 'round' : 'square';
      let textAnchor = 'start';
      let x = paddingLeft;
      if (textAlign === 'center') { textAnchor = 'middle'; x = width / 2; }
      else if (textAlign === 'right') { textAnchor = 'end'; x = width - paddingRight; }

      let finalStrokeWidth = borderThickness;
      let paintOrder = 'fill stroke';
      if (strokePosition === 'outside') {
        finalStrokeWidth = borderThickness * 2;
        paintOrder = 'stroke fill';
      } else if (strokePosition === 'inside') {
        finalStrokeWidth = borderThickness * 2;
        paintOrder = 'fill stroke';
      }

      let svgFill = rgbaFill;
      let gradDef = '';
      if (fillType === 'gradient') {
        const stopsXml = gradientStops.map(s => `<stop offset="${s.offset}%" stop-color="${s.color}" stop-opacity="${(s.opacity || 100) / 100}" />`).join('');
        const id = `tg-${Math.random().toString(36).substr(2, 9)}`;
        gradDef = gradientType === 'Linear'
          ? `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">${stopsXml}</linearGradient>`
          : `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stopsXml}</radialGradient>`;
        svgFill = `url(#${id})`;
      }

      // Helper to wrap text based on width
      const getWrappedLines = (textContent, maxWidth, fontString) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = fontString;

        const lines = [];
        const paragraphs = textContent.split('\n');

        paragraphs.forEach(paragraph => {
          const words = paragraph.split(' ');
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
              currentLine += " " + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);
        });
        return lines;
      };

      const cleanFontFamily = fontFamily.replace(/['"]/g, "");
      // Canvas font string requires quotes for multi-word font names (e.g. "Times New Roman")
      const fontString = `${fontWeight} ${fontSize} "${cleanFontFamily}"`;

      const availableWidth = width - paddingLeft - paddingRight;
      const wrappedLines = getWrappedLines(text, availableWidth, fontString);

      const tspans = wrappedLines.map((line, i) => {
        const yLine = paddingTop + (i + 1) * lineHeight - (lineHeight * 0.15);
        // Use clean font family for SVG attribute (attribute quotes handle the spaces)
        return `<tspan x="${x}" y="${yLine}">${escapeSvg(line)}</tspan>`;
      }).join('');

      const svg = `
        <svg width='${width}' height='${height}' viewBox='0 0 ${width} ${height}' xmlns='http://www.w3.org/2000/svg'>
          <defs>${gradDef}</defs>
          <text text-anchor='${textAnchor}' font-family='${cleanFontFamily}' font-size='${fontSize}' font-weight='${fontWeight}' letter-spacing='${letterSpacing}' fill='${svgFill}' stroke='${rgbaStroke}' stroke-width='${finalStrokeWidth}' stroke-dasharray='${dashLength},${dashGap}' stroke-linecap='${lineCap}' style="paint-order: ${paintOrder};">
            ${tspans}
          </text>
        </svg>
      `.replace(/\s+/g, ' ');

      el.style.color = 'transparent';
      el.style.webkitTextFillColor = 'transparent';
      el.style.webkitTextStrokeWidth = '0px';
      el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      el.style.backgroundClip = 'initial';
      el.style.webkitBackgroundClip = 'initial';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      // SOLID MODE: Standard CSS Properties
      el.style.color = rgbaFill;
      el.style.webkitTextFillColor = fillType === 'gradient' ? 'transparent' : rgbaFill;

      if (fillType === 'gradient') {
        el.style.backgroundImage = gradStr;
        el.style.backgroundClip = 'text';
        el.style.webkitBackgroundClip = 'text';
      } else {
        el.style.backgroundImage = 'none';
        el.style.backgroundClip = 'initial';
        el.style.webkitBackgroundClip = 'initial';
      }

      let finalWidth = borderThickness;
      if (strokePosition === 'outside') {
        finalWidth = borderThickness * 2;
        el.style.paintOrder = 'stroke fill';
      } else if (strokePosition === 'inside') {
        finalWidth = borderThickness * 2;
        el.style.paintOrder = 'fill stroke';
      } else {
        el.style.paintOrder = 'normal';
      }

      el.style.webkitTextStrokeWidth = finalWidth + 'px';
      el.style.webkitTextStrokeColor = rgbaStroke;
    }
    el.style.border = 'none';

    // Save metadata for accurate retrieval on re-selection
    el.setAttribute('data-fill-color', hex);
    el.setAttribute('data-fill-opacity', fillOpacity);
    el.setAttribute('data-fill-type', fillType);
    el.setAttribute('data-stroke-color', strokeColor);
    el.setAttribute('data-stroke-opacity', strokeOpacity);
    el.setAttribute('data-dash-length', dashLength);
    el.setAttribute('data-dash-gap', dashGap);
    el.setAttribute('data-round-corners', isRoundCorners);
    el.setAttribute('data-stroke-type', strokeType);
    el.setAttribute('data-stroke-position', strokePosition);
    el.setAttribute('data-border-thickness', borderThickness);

    if (onUpdate) onUpdate();
  }, [selectedElement, hex, fillOpacity, fillType, gradientStops, gradientType, strokeColor, strokeOpacity, strokeType, strokePosition, borderThickness, dashLength, dashGap, isRoundCorners, onUpdate]);

  const applyGradient = useCallback((stops, type = gradientType) => {
    if (!selectedElement) return;
    setGradientStops(stops);
    setGradientType(type);
  }, [selectedElement, gradientType]);

  const updateFillType = (type) => {
    setFillType(type);
    setShowFillTypeDropdown(false);
    if (type === 'solid' && selectedElement) {
      selectedElement.style.backgroundImage = 'none';
      selectedElement.style.webkitBackgroundClip = 'initial';
      selectedElement.style.webkitTextFillColor = 'initial';
      selectedElement.style.backgroundClip = 'initial';
      selectedElement.style.color = hex;
      if (onUpdate) onUpdate();
    }
  };

  const updateGradientStop = (index, updates) => {
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], ...updates };
    setGradientStops(newStops);
  };

  const removeGradientStop = (index) => {
    if (gradientStops.length <= 2) return;
    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
    const newStop = { color: '#6366f1', offset, opacity: 100 };
    const newStops = [...gradientStops, newStop].sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
  };

  const reverseGradient = () => {
    const newStops = [...gradientStops].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
  };

  const updateColorFromHsv = (newHsv) => {
    const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHsv(newHsv);
    setRgb(newRgb);
    setHex(newHex);
  };

  const updateColorFromRgb = (newRgb) => {
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setRgb(newRgb);
    setHsv(newHsv);
    setHex(newHex);
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
      }
    }
  };

  const updateStrokeColorFromHsv = (newHsv) => {
    const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setStrokeHsv(newHsv);
    setStrokeRgb(newRgb);
    setStrokeColor(newHex);
  };

  const updateStrokeColorFromRgb = (newRgb) => {
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setStrokeRgb(newRgb);
    setStrokeHsv(newHsv);
    setStrokeColor(newHex);
  };

  const updateStrokeColorFromHex = (newHex) => {
    // Auto-apply thickness 1 if currently 0
    if (borderThickness === 0) setBorderThickness(1);
    setStrokeColor(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      const newRgb = hexToRgb(newHex);
      const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setStrokeRgb(newRgb);
      setStrokeHsv(newHsv);
    }
  };

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

  const updateStyle = useCallback((property, value) => {
    const el = selectedElement;
    if (!el) return;
    const currentVal = window.getComputedStyle(el)[property];
    let newValue = value;

    if (property === 'fontWeight') {
      // If value is 'bold' (from B button), toggle. Otherwise (from dropdown), set specific value.
      if (value === 'bold') {
        const isCurrentlyBold = currentVal === '700' || currentVal === 'bold' || parseInt(currentVal) >= 700;
        newValue = isCurrentlyBold ? '400' : '700';
      } else {
        newValue = value;
      }
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

    // If this is a typography change and the element has stroke/dashed styles,
    // we need to regenerate the SVG background
    const typographyProps = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textAlign'];
    if (typographyProps.includes(property) && (strokeType === 'dashed' || borderThickness > 0)) {
      // Use double requestAnimationFrame to ensure the browser recalculates layout before regenerating SVG
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyDesign();
        });
      });
    }

    if (onUpdate) onUpdate();
  }, [selectedElement, onUpdate, strokeType, borderThickness, applyDesign]);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const getCurrentStyle = (prop) => {
    if (!selectedElement) return '';
    return window.getComputedStyle(selectedElement)[prop] || '';
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (selectedElement !== lastSelectedElementRef.current) {
      isSyncingRef.current = true;
      setIsSyncing(true);
      lastSelectedElementRef.current = selectedElement;
    }
  }, [selectedElement]);

  // Consolidated style sync: Read ALL properties from element or reset to defaults
  useEffect(() => {
    if (selectedElement) {
      // Batch all state updates together
      const styles = window.getComputedStyle(selectedElement);

      // --- 1. FILL SYNC ---
      const attrFillColor = selectedElement.getAttribute('data-fill-color');
      const attrFillOpacity = selectedElement.getAttribute('data-fill-opacity');
      const attrFillType = selectedElement.getAttribute('data-fill-type');

      let newHex = '#000000';
      let newRgb = { r: 0, g: 0, b: 0 };
      let newHsv = { h: 0, s: 0, v: 0 };
      let newFillOpacity = 100;
      let newFillType = 'solid';
      let newGradientType = 'Linear';
      let newGradientStops = [
        { color: '#63D0CD', offset: 0, opacity: 100 },
        { color: '#4B3EFE', offset: 100, opacity: 100 }
      ];

      if (attrFillColor) {
        newHex = attrFillColor;
        const rgbObj = hexToRgb(attrFillColor);
        newRgb = rgbObj;
        newHsv = rgbToHsv(rgbObj.r, rgbObj.g, rgbObj.b);
      } else {
        const colorStyle = styles.color || 'rgb(0, 0, 0)';
        if (colorStyle !== 'transparent' && colorStyle !== 'rgba(0, 0, 0, 0)') {
          let rf = 0, gf = 0, bf = 0;
          const rgbaMatchF = colorStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbaMatchF) {
            rf = parseInt(rgbaMatchF[1]); gf = parseInt(rgbaMatchF[2]); bf = parseInt(rgbaMatchF[3]);
          }
          newHex = rgbToHex(rf, gf, bf);
          newRgb = { r: rf, g: gf, b: bf };
          newHsv = rgbToHsv(rf, gf, bf);
        }
      }

      if (attrFillOpacity) {
        newFillOpacity = parseInt(attrFillOpacity);
      } else {
        const colorStyle = styles.color || 'rgb(0, 0, 0)';
        if (colorStyle !== 'transparent' && colorStyle !== 'rgba(0, 0, 0, 0)') {
          const rgbaMatchF = colorStyle.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
          const af = rgbaMatchF ? parseFloat(rgbaMatchF[1]) : 1;
          newFillOpacity = Math.round(af * 100);
        }
      }

      const bgStyle = styles.backgroundImage;
      const parsedGrad = parseGradient(bgStyle);
      if (attrFillType === 'gradient' || parsedGrad) {
        newFillType = 'gradient';
        if (parsedGrad) {
          newGradientType = parsedGrad.type;
          newGradientStops = parsedGrad.stops;
        }
      }

      // --- 2. STROKE SYNC ---
      const attrStrokeColor = selectedElement.getAttribute('data-stroke-color');
      const attrStrokeOpacity = selectedElement.getAttribute('data-stroke-opacity');

      let newStrokeColor = '#000000';
      let newStrokeRgb = { r: 0, g: 0, b: 0 };
      let newStrokeHsv = { h: 0, s: 0, v: 0 };
      let newStrokeOpacity = 100;

      if (attrStrokeColor) {
        newStrokeColor = attrStrokeColor;
        const sRgb = hexToRgb(attrStrokeColor);
        newStrokeRgb = sRgb;
        newStrokeHsv = rgbToHsv(sRgb.r, sRgb.g, sRgb.b);
      } else {
        const sColorStyle = styles.webkitTextStrokeColor || styles.borderColor || 'rgb(0, 0, 0)';
        let rs = 0, gs = 0, bs = 0;
        const rgbaMatchS = sColorStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbaMatchS) {
          rs = parseInt(rgbaMatchS[1]); gs = parseInt(rgbaMatchS[2]); bs = parseInt(rgbaMatchS[3]);
        }
        newStrokeColor = rgbToHex(rs, gs, bs);
        newStrokeRgb = { r: rs, g: gs, b: bs };
        newStrokeHsv = rgbToHsv(rs, gs, bs);
      }

      if (attrStrokeOpacity) {
        newStrokeOpacity = parseInt(attrStrokeOpacity);
      } else {
        const sColorStyle = styles.webkitTextStrokeColor || styles.borderColor || 'rgb(0, 0, 0)';
        if (sColorStyle !== 'transparent' && sColorStyle !== 'rgba(0, 0, 0, 0)') {
          const rgbaMatchS = sColorStyle.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
          const as = rgbaMatchS ? parseFloat(rgbaMatchS[1]) : 1;
          newStrokeOpacity = Math.round(as * 100);
        }
      }

      // --- 3. ADVANCED STROKE PROPERTIES ---
      const hasSvgBg = bgStyle && bgStyle.includes('data:image/svg+xml');
      const attrStrokeType = selectedElement.getAttribute('data-stroke-type');
      const newStrokeType = attrStrokeType || (hasSvgBg ? 'dashed' : 'solid');

      const strokeWidth = parseFloat(styles.webkitTextStrokeWidth) || parseFloat(styles.borderWidth) || 0;
      const paintOrder = styles.paintOrder || 'normal';
      const attrStrokePos = selectedElement.getAttribute('data-stroke-position');
      const attrThickness = selectedElement.getAttribute('data-border-thickness');

      let newStrokePosition = 'outside';
      let newBorderThickness = 0;

      if (attrStrokePos) {
        newStrokePosition = attrStrokePos;
        newBorderThickness = parseInt(attrThickness) || 0;
      } else {
        let bThick = strokeWidth;
        if (paintOrder.includes('stroke fill')) { newStrokePosition = 'outside'; bThick = strokeWidth / 2; }
        else if (paintOrder.includes('fill stroke')) { newStrokePosition = 'inside'; bThick = strokeWidth / 2; }
        else { newStrokePosition = 'center'; bThick = strokeWidth; }
        newBorderThickness = Math.round(bThick);
      }

      const newDashLength = parseInt(selectedElement.getAttribute('data-dash-length')) || 4;
      const newDashGap = parseInt(selectedElement.getAttribute('data-dash-gap')) || 4;
      const newIsRoundCorners = selectedElement.getAttribute('data-round-corners') === 'true';

      // Apply all state updates in one batch
      setHex(newHex);
      setInitialColor(newHex);
      setRgb(newRgb);
      setHsv(newHsv);
      setFillOpacity(newFillOpacity);
      setFillType(newFillType);
      setGradientType(newGradientType);
      setGradientStops(newGradientStops);

      setStrokeColor(newStrokeColor);
      setStrokeRgb(newStrokeRgb);
      setStrokeHsv(newStrokeHsv);
      setStrokeOpacity(newStrokeOpacity);
      setStrokeType(newStrokeType);
      setStrokePosition(newStrokePosition);
      setBorderThickness(newBorderThickness);
      setDashLength(newDashLength);
      setDashGap(newDashGap);
      setIsRoundCorners(newIsRoundCorners);

      // Use requestAnimationFrame to ensure all state updates are committed before ending sync
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
        setIsSyncing(false);
      });
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


  // Master Design Update Effect - Only apply when style values change AND sync is complete
  useEffect(() => {
    if (!isSyncingRef.current && !isSyncing && selectedElement) {
      applyDesign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSyncing,
    selectedElement,
    hex,
    fillOpacity,
    fillType,
    gradientStops,
    gradientType,
    strokeColor,
    strokeOpacity,
    strokeType,
    strokePosition,
    borderThickness,
    dashLength,
    dashGap,
    isRoundCorners
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowFontDropdown(false);
      if (weightRef.current && !weightRef.current.contains(event.target)) setShowWeightDropdown(false);
      if (borderStyleRef.current && !borderStyleRef.current.contains(event.target)) setShowBorderStyleDropdown(false);
      if (strokePositionRef.current && !strokePositionRef.current.contains(event.target)) setShowStrokePositionDropdown(false);
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
      if (fillPickerRef.current && !fillPickerRef.current.contains(event.target) && !event.target.closest('.fill-picker-trigger')) setShowFillPicker(false);
      if (strokePickerRef.current && !strokePickerRef.current.contains(event.target) && !event.target.closest('.stroke-picker-trigger')) setShowStrokePicker(false);
      if (gradientStopPickerRef.current && !gradientStopPickerRef.current.contains(event.target)) setEditingGradientStopIndex(null);
      if (event.target.closest('.gradient-type-trigger') === null) setShowGradientTypeDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePanel, showFontDropdown, showWeightDropdown, showBorderStyleDropdown, showDashedPopup, showFillTypeDropdown, showGradientTypeDropdown, showStrokePositionDropdown]);

  if (!selectedElement) return null;

  return (
    <div className="relative flex items-start gap-4 justify-end font-sans">

      {/* DASHED POPUP (Redesigned per Screenshot 4) */}
      {showDashedPopup && (
        <div ref={dashedRef} className="fixed top-80 w-[18.75vw] right-[23.5vw] bg-white border border-gray-200 rounded-[1.5vw] shadow-2xl z-50 overflow-hidden">
          <div className="p-[1.25vw] space-y-[1.25vw]">
            <div className="flex items-center gap-[0.75vw]">
              <span className="font-bold text-[0.9vw] text-gray-800">Dashed</span>
              <div className="h-[1px] flex-grow bg-gray-200"></div>
            </div>

            <div className="space-y-[1vw]">
              {/* Position Dropdown */}
              <div className="flex items-center justify-between">
                <span className="text-[0.8vw] font-medium text-gray-700">Position :</span>
                <div className="relative" ref={strokePositionRef}>
                  <div
                    onClick={() => setShowStrokePositionDropdown(!showStrokePositionDropdown)}
                    className="w-[8vw] h-[2.5vw] px-[0.75vw] bg-gray-50 border border-gray-200 rounded-[0.75vw] flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                  >
                    <span className="text-[0.75vw] font-bold text-gray-700 capitalize">{strokePosition}</span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </div>
                  {showStrokePositionDropdown && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-[0.75vw] shadow-xl z-50 py-1">
                      {['outside', 'center', 'inside'].map(pos => (
                        <div
                          key={pos}
                          onClick={() => {
                            setStrokePosition(pos);
                            setShowStrokePositionDropdown(false);
                          }}
                          className="px-[0.75vw] py-[0.5vw] text-[0.75vw] hover:bg-blue-50 hover:text-blue-600 cursor-pointer capitalize font-medium"
                        >
                          {pos}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[1px] w-full bg-gray-100"></div>

              {/* Length Stepper */}
              <div className="flex items-center justify-between">
                <span className="text-[0.8vw] font-medium text-gray-700">Length :</span>
                <div className="flex items-center gap-[0.25vw]">
                  <button
                    onClick={() => setDashLength(Math.max(1, dashLength - 1))}
                    className="w-[1.5vw] h-[1.5vw] flex items-center justify-center hover:text-blue-600 transition-colors text-gray-400"
                  ><ChevronLeft size={16} /></button>
                  <div className="w-[3.2vw] h-[2.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center font-bold text-[0.85vw] text-gray-800 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                    {dashLength}
                  </div>
                  <button
                    onClick={() => setDashLength(dashLength + 1)}
                    className="w-[1.5vw] h-[1.5vw] flex items-center justify-center hover:text-blue-600 transition-colors text-gray-400"
                  ><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Gap Stepper */}
              <div className="flex items-center justify-between">
                <span className="text-[0.8vw] font-medium text-gray-700">Gap :</span>
                <div className="flex items-center gap-[0.25vw]">
                  <button
                    onClick={() => setDashGap(Math.max(1, dashGap - 1))}
                    className="w-[1.5vw] h-[1.5vw] flex items-center justify-center hover:text-blue-600 transition-colors text-gray-400"
                  ><ChevronLeft size={16} /></button>
                  <div className="w-[3.2vw] h-[2.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center font-bold text-[0.85vw] text-gray-800 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                    {dashGap}
                  </div>
                  <button
                    onClick={() => setDashGap(dashGap + 1)}
                    className="w-[1.5vw] h-[1.5vw] flex items-center justify-center hover:text-blue-600 transition-colors text-gray-400"
                  ><ChevronRight size={16} /></button>
                </div>
              </div>

              <div className="h-[1px] w-full bg-gray-100"></div>

              {/* Round Corners Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[0.8vw] font-medium text-gray-700">Round Corners :</span>
                <div
                  onClick={() => setIsRoundCorners(!isRoundCorners)}
                  className={`w-[2.8vw] h-[1.4vw] rounded-full p-[0.2vw] cursor-pointer transition-colors duration-200 ${isRoundCorners ? 'bg-blue-600' : 'bg-gray-200 border border-gray-300'}`}
                >
                  <div className={`w-[1vw] h-[1vw] bg-white rounded-full transition-transform duration-200 ${isRoundCorners ? 'translate-x-[1.3vw] shadow-sm' : 'translate-x-0 border border-gray-200'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE STROKE COLOR PICKER */}
      <div ref={strokePickerRef} className={`fixed top-1/2 -translate-y-1/2 right-[22.9vw] w-[16.7vw] bg-white border border-gray-200 rounded-[1vw] shadow-xl transition-all duration-300 z-50 overflow-hidden ${showStrokePicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="p-[1vw]">
          <div className="grid grid-cols-6 gap-[0.5vw]">
            {[
              '#FFFFFF', '#000000', '#FF0000', '#FFA500', '#8B4513', '#FFFF00',
              '#00FF00', '#808000', '#006400', '#00FFFF', '#008080', '#008B8B',
              '#E6E6FA', '#0000FF', '#0000CD', '#000080', '#EE82EE', '#D8BFD8',
              '#FF00FF', '#FF1493', '#808080', '#D3D3D3', '#F5F5F5', '#696969'
            ].map((color) => (
              <button
                key={color}
                onClick={() => updateStrokeColorFromHex(color)}
                className="w-[2vw] h-[2vw] rounded-[0.25vw] border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* GRADIENT STOP COLOR PICKER */}
      <div ref={gradientStopPickerRef} className={`fixed top-[50%] -translate-y-1/2 right-[3.5vw] w-[17.4vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-2 border-blue-500 transition-all duration-300 z-[100] overflow-hidden ${editingGradientStopIndex !== null ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {/* Close Icon */}
        <button
          onClick={() => setEditingGradientStopIndex(null)}
          className="absolute top-[0.5vw] right-[0.5vw] w-[1.75vw] h-[1.75vw] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors z-10"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="p-[1.25vw] space-y-[1vw]">
          {/* Color Picker: Saturation/Value + Hue Slider */}
          <div className="flex gap-3">
            {/* Saturation/Value Picker */}
            <div
              className="w-[13.9vw] h-[13.9vw] rounded-lg relative cursor-crosshair overflow-hidden border border-gray-200"
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
              className="w-[2.8vw] h-[13.9vw] rounded-lg relative cursor-pointer border border-gray-200"
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
          <div className="flex items-center gap-[0.25vw] bg-white">
            <span className="text-[0.85vw] font-medium text-gray-800 whitespace-nowrap">Color Code :</span>
            <div className="flex-grow flex items-center gap-[0.5vw] px-[0.5vw] h-[2.5vw] border border-gray-300 rounded-[0.5vw] bg-white mr-[0.25vw]">
              <input
                type="text"
                value={gradientStopHex}
                onChange={(e) => updateGradientStopColorFromHex(e.target.value)}
                className="flex-grow text-[0.85vw] font-mono text-gray-700 outline-none uppercase w-full"
                maxLength={7}
              />
              <svg className="w-[1vw] h-[1vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div ref={fillPickerRef} className={`fixed top-1/2 -translate-y-1/2 right-[22.2vw] w-[19.4vw] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 z-50 overflow-hidden flex flex-col max-h-[90vh] ${showFillPicker ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <div className="relative" ref={fillTypeRef}>
              <button
                onClick={() => setShowFillTypeDropdown(!showFillTypeDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-w-[6.9vw] justify-between shadow-sm"
              >
                <span className="capitalize">{fillType}</span> <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showFillTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-[8.3vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <button onClick={() => updateFillType('solid')} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Solid</button>
                  <button onClick={() => updateFillType('gradient')} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Gradient</button>
                </div>
              )}
            </div>

            {fillType === 'gradient' && (
              <div className="relative gradient-type-trigger">
                <button
                  onClick={() => setShowGradientTypeDropdown(!showGradientTypeDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white min-w-[6.9vw] justify-between shadow-sm"
                >
                  {gradientType} <ChevronDown size={14} className="text-gray-400" />
                </button>
                {showGradientTypeDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-[8.3vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
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
              <div className="relative pt-[1.5vw] pb-[0.5vw] px-[0.25vw]">
                {/* Pins/Handles above the bar */}
                <div className="absolute top-0 left-0 w-full h-[2vw] flex items-center pointer-events-none px-[0.25vw]">
                  {gradientStops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="absolute -translate-x-1/2 flex flex-col items-center group pointer-events-auto cursor-pointer"
                      style={{ left: `${stop.offset}%` }}
                      onClick={() => openGradientStopPicker(idx)}
                      title="Click to edit color"
                    >
                      <div className="w-[1.25vw] h-[1.25vw] rounded-[0.4vw] border-2 border-white shadow-md relative hover:scale-110 transition-transform" style={{ backgroundColor: stop.color }}>
                        <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[2px] h-[5px] bg-white shadow-sm"></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* The Bar */}
                <div
                  className="w-full h-[2vw] rounded-[0.5vw] shadow-inner border border-gray-100 cursor-copy"
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
              <div className="space-y-[0.5vw] max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {gradientStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-[0.5vw]">
                    <div className="flex-grow flex items-center gap-[0.75vw] px-[0.75vw] py-[0.6vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm hover:border-gray-300 transition-all">
                      <div
                        className="w-[2vw] h-[2vw] rounded-[0.5vw] shadow-sm border border-gray-100 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: stop.color }}
                        onClick={() => openGradientStopPicker(idx)}
                        title="Click to customize color"
                      ></div>
                      <input
                        type="text"
                        value={stop.color}
                        onChange={(e) => updateGradientStop(idx, { color: e.target.value })}
                        className="text-[0.75vw] font-medium text-gray-500 flex-grow uppercase font-mono tracking-tight bg-transparent outline-none w-[5vw]"
                        maxLength={7}
                      />

                    </div>
                    <button
                      onClick={() => removeGradientStop(idx)}
                      disabled={gradientStops.length <= 2}
                      className={`w-[3vw] h-[3vw] rounded-[0.75vw] border border-gray-200 flex items-center justify-center transition-all shadow-sm ${gradientStops.length <= 2 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
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

      <div className="w-full max-w-[25vw] space-y-4 z-10 text-[#333]">

        {/* TEXT SECTION */}
        <div className="bg-white border border-gray-200 rounded-[15px] shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setActiveSection(activeSection === 'main' ? null : 'main')}>
            <div className="flex items-center gap-2">
              <Edit3 size={20} className="text-gray-600" />
              <span className="font-bold text-gray-900 text-sm">Text</span>
            </div>
            <ChevronUp size={20} className={`text-gray-900 transition-transform duration-200 ${activeSection === 'main' ? '' : 'rotate-180'}`} strokeWidth={2.5} />
          </div>

          {activeSection === 'main' && (
            <div className="p-[1.25vw] pt-0 space-y-[1.25vw] pt-4">

              {/* Text Area */}
              <div className="relative group">
                <textarea
                  value={selectedElement?.textContent || ''}
                  onChange={(e) => { if (selectedElement) { selectedElement.textContent = e.target.value; if (onUpdate) onUpdate(); } }}
                  placeholder="Enter your text here..."
                  className="w-full h-[6vw] p-[0.9vw] pr-[2.5vw] bg-white border-2 border-gray-200 rounded-[0.5vw] resize-none outline-none text-gray-700 text-[0.85vw] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400"
                />
                <div className="absolute right-[0.75vw] bottom-[0.75vw] w-[1.5vw] h-[1.5vw] rounded-[0.35vw] bg-gray-100 flex items-center justify-center">
                  <PencilLine size={12} className="text-gray-500" />
                </div>
              </div>

              {/* Typography Header */}
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-sm tracking-wide text-gray-900">Typography</span>
                <div className="h-px flex-grow bg-gradient-to-r from-gray-200 via-gray-100 to-transparent"></div>
              </div>

              {/* Font Controls */}
              <div className="space-y-[0.75vw]">
                {/* Row 1: Font Family & Size */}
                <div className="flex items-center gap-[0.65vw]">
                  <div className="relative flex-grow h-[2.5vw]" ref={dropdownRef}>
                    <button onClick={() => setShowFontDropdown(!showFontDropdown)} className="w-full h-full flex items-center justify-between px-[0.9vw] bg-white border-2 border-gray-200 rounded-[0.5vw] text-[0.85vw] font-medium hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
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
                  <div className="relative w-[6.1vw] h-[2.5vw]">
                    <select value={parseInt(getCurrentStyle('fontSize')) || 12} onChange={(e) => updateStyle('fontSize', e.target.value + 'px')} className="w-full h-full pl-[0.75vw] pr-[2vw] bg-white border-2 border-gray-200 rounded-[0.5vw] appearance-none text-[0.85vw] font-semibold text-gray-700 outline-none cursor-pointer hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                      {[12, 14, 16, 18, 20, 24, 32, 48, 64, 72, 96].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Row 2: Weight, Spacing, LineHeight */}
                <div className="flex items-center gap-[0.65vw]">
                  <div className="relative w-[6.5vw] h-[2.5vw]" ref={weightRef}>
                    <button onClick={() => setShowWeightDropdown(!showWeightDropdown)} className="w-full h-full flex items-center justify-between px-[0.9vw] bg-white border-2 border-gray-200 rounded-[0.5vw] text-[0.85vw] font-medium hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                      <span className="truncate text-gray-700">{fontWeights.find(w => w.value === getCurrentStyle('fontWeight'))?.name || 'Regular'}</span>
                      <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    </button>
                    {showWeightDropdown && (
                      <div className="absolute z-50 mt-2 w-[9vw] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto custom-scrollbar">
                        {fontWeights.map((w) => {
                          const isSelected = getCurrentStyle('fontWeight') === w.value || (w.value === '400' && getCurrentStyle('fontWeight') === 'normal');
                          return (
                            <div
                              key={w.value}
                              onClick={() => { updateStyle('fontWeight', w.value); setShowWeightDropdown(false); }}
                              className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}
                            >
                              {w.name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Spacing */}
                  <div className="relative w-[7.4vw] h-[2.5vw] border-2 border-gray-200 rounded-[0.5vw] bg-white flex items-center px-1.5 hover:border-indigo-300 transition-colors group">
                    <button onClick={() => {
                      const current = parseInt(getCurrentStyle('letterSpacing')) || 0;
                      updateStyle('letterSpacing', (current - 1) + 'px');
                    }} className="w-[1.75vw] h-[1.75vw] flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">−</button>
                    <input readOnly className="w-full text-center text-[0.75vw] font-semibold text-gray-700 outline-none bg-transparent" value={parseInt(getCurrentStyle('letterSpacing')) || 0} />
                    <button onClick={() => {
                      const current = parseInt(getCurrentStyle('letterSpacing')) || 0;
                      updateStyle('letterSpacing', (current + 1) + 'px');
                    }} className="w-[1.75vw] h-[1.75vw] flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">+</button>
                    <ArrowLeftRight size={13} className="text-gray-400 group-hover:text-indigo-400 flex-shrink-0 ml-1 transition-colors" />
                  </div>

                  {/* Line Height */}
                  <div className="relative w-[7.4vw] h-[2.5vw] border-2 border-gray-200 rounded-[0.5vw] bg-white flex items-center px-1.5 hover:border-indigo-300 transition-colors group">
                    <button onClick={() => {
                      const current = parseFloat(getCurrentStyle('lineHeight')) || 1.2;
                      updateStyle('lineHeight', (current - 0.1).toFixed(1));
                    }} className="w-[1.75vw] h-[1.75vw] flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">−</button>
                    <input readOnly className="w-full text-center text-[0.75vw] font-semibold text-gray-700 outline-none bg-transparent" value={parseFloat(getCurrentStyle('lineHeight')) || 1.2} />
                    <button onClick={() => {
                      const current = parseFloat(getCurrentStyle('lineHeight')) || 1.2;
                      updateStyle('lineHeight', (current + 0.1).toFixed(1));
                    }} className="w-[1.75vw] h-[1.75vw] flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors font-bold">+</button>
                    <ArrowUpDown size={13} className="text-gray-400 group-hover:text-indigo-400 flex-shrink-0 ml-1 transition-colors" />
                  </div>
                </div>

                {/* Row 3: Buttons with Popups */}
                <div className="flex items-center gap-2 pt-0.5 relative">

                  {/* Alignment */}
                  <div className="relative" ref={alignmentRef}>
                    <button
                      className={`alignment-trigger w-[2.5vw] h-[2.5vw] flex items-center justify-center rounded-[0.5vw] border-2 transition-all ${activePanel === 'alignment' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('alignment')}
                    >
                      <AlignLeft size={17} />
                    </button>
                    {activePanel === 'alignment' && (
                      <div className="absolute top-10 left-0 z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('textAlign', 'left')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${selectedElement?.style.textAlign === 'left' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignLeft size={20} /></button>
                        <button onClick={() => updateStyle('textAlign', 'center')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${selectedElement?.style.textAlign === 'center' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignCenter size={20} /></button>
                        <button onClick={() => updateStyle('textAlign', 'right')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${selectedElement?.style.textAlign === 'right' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignRight size={20} /></button>
                        <button onClick={() => updateStyle('textAlign', 'justify')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-800 transition-colors ${selectedElement?.style.textAlign === 'justify' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><AlignJustify size={20} /></button>
                      </div>
                    )}
                  </div>

                  {/* Style */}
                  <div className="relative" ref={styleRef}>
                    <button
                      className={`style-trigger w-[2.5vw] h-[2.5vw] flex items-center justify-center rounded-[0.5vw] border-2 transition-all ${activePanel === 'style' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('style')}
                    >
                      <Bold size={17} />
                    </button>
                    {activePanel === 'style' && (
                      <div className="absolute top-10 left-[-50px] z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('fontWeight', 'bold')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-gray-800 transition-colors ${selectedElement?.style.fontWeight === '700' || selectedElement?.style.fontWeight === 'bold' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>B</button>
                        <button onClick={() => updateStyle('fontStyle', 'italic')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg italic font-serif text-gray-800 transition-colors ${selectedElement?.style.fontStyle === 'italic' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>I</button>
                        <button onClick={() => updateStyle('textDecoration', 'underline')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg underline text-gray-800 transition-colors ${selectedElement?.style.textDecoration?.includes('underline') ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>U</button>
                        <button onClick={() => updateStyle('textDecoration', 'line-through')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg line-through text-gray-800 transition-colors ${selectedElement?.style.textDecoration?.includes('line-through') ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><span className="line-through">S</span></button>
                      </div>
                    )}
                  </div>

                  {/* Case */}
                  <div className="relative" ref={caseRef}>
                    <button
                      className={`case-trigger w-[2.5vw] h-[2.5vw] flex items-center justify-center rounded-[0.5vw] border-2 transition-all ${activePanel === 'case' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('case')}
                    >
                      <Type size={17} />
                    </button>
                    {activePanel === 'case' && (
                      <div className="absolute top-10 left-[-100px] z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('textTransform', 'none')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${selectedElement?.style.textTransform === 'none' || !selectedElement?.style.textTransform ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><Minus size={20} /></button>
                        <button onClick={() => updateStyle('textTransform', 'capitalize')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-gray-800 transition-colors ${selectedElement?.style.textTransform === 'capitalize' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>Aa</button>
                        <button onClick={() => updateStyle('textTransform', 'uppercase')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-gray-800 transition-colors ${selectedElement?.style.textTransform === 'uppercase' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>AB</button>
                        <button onClick={() => updateStyle('textTransform', 'lowercase')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-gray-800 transition-colors ${selectedElement?.style.textTransform === 'lowercase' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}>ab</button>
                      </div>
                    )}
                  </div>

                  {/* List */}
                  <div className="relative" ref={listRef}>
                    <button
                      className={`list-trigger w-[2.5vw] h-[2.5vw] flex items-center justify-center rounded-[0.5vw] border-2 transition-all ${activePanel === 'list' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      onClick={() => togglePanel('list')}
                    >
                      <List size={17} />
                    </button>
                    {activePanel === 'list' && (
                      <div className="absolute top-10 right-0 z-50 p-2 bg-[#1a1a1a] rounded-xl flex gap-2 shadow-xl whitespace-nowrap">
                        <button onClick={() => updateStyle('listStyleType', 'disc')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${selectedElement?.style.listStyleType === 'disc' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><List size={20} /></button>
                        <button onClick={() => updateStyle('listStyleType', 'square')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${selectedElement?.style.listStyleType === 'square' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><List size={20} /></button>
                        <button onClick={() => updateStyle('listStyleType', 'decimal')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-gray-800 transition-colors ${selectedElement?.style.listStyleType === 'decimal' ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'}`}><ListOrdered size={20} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Color Section */}
              <div className="border border-gray-200 rounded-[15px] overflow-hidden bg-white shadow-sm font-sans mb-3">
                <div 
                  className="w-full flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50" 
                  onClick={() => setIsColorOpen(!isColorOpen)}
                >
                  <span className="text-sm font-bold text-gray-900">Color</span>
                  <ChevronUp size={20} className={`text-gray-900 transition-transform duration-200 ${isColorOpen ? '' : 'rotate-180'}`} strokeWidth={2.5} />
                </div>

                {isColorOpen && (
                  <div className="p-[1vw] space-y-[1vw] bg-white">
                    {/* Fill */}
                    <div className="flex items-center gap-[0.5vw]">
                      <span className="text-[0.7vw] font-bold text-gray-700 w-[3vw]">Fill</span>
                      <div onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); setColorMode('fill'); }} className="fill-picker-trigger w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border-2 border-gray-300 cursor-pointer flex-shrink-0 hover:scale-105 transition-transform shadow-sm" style={{ backgroundColor: hex }}></div>
                      <div className="flex-grow flex items-center border-2 border-gray-200 rounded-[0.5vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-300 transition-colors">
                        <input
                          type="text"
                          value={hex.toUpperCase()}
                          onChange={(e) => updateColorFromHex(e.target.value)}
                          className="w-[3.5vw] h-full px-1 text-[0.7vw] font-bold text-gray-700 outline-none flex-shrink-0 text-center"
                          maxLength={7}
                          placeholder="#000000"
                        />
                        <div className="flex-grow flex items-center border-l-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white h-full">
                          <button
                            onClick={() => setFillOpacity(Math.max(0, fillOpacity - 5))}
                            className="w-[1.5vw] h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 border-r border-gray-200 font-bold transition-colors"
                          >−</button>
                          <span className="text-gray-700 text-[0.7vw] px-1 min-w-[2vw] text-center flex-grow font-bold bg-white h-full flex items-center justify-center">{fillOpacity}%</span>
                          <button
                            onClick={() => setFillOpacity(Math.min(100, fillOpacity + 5))}
                            className="w-[1.5vw] h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 font-bold transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Stroke */}
                    <div className="flex items-center gap-[0.5vw]">
                      <span className="text-[0.7vw] font-bold text-gray-700 w-[3vw]">Stroke</span>
                      <div
                        onClick={() => {
                          setShowStrokePicker(!showStrokePicker);
                          setShowFillPicker(false);
                          setColorMode('stroke');
                          if (borderThickness === 0) setBorderThickness(1);
                        }}
                        className="stroke-picker-trigger w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border-2 border-gray-300 cursor-pointer flex-shrink-0 hover:scale-105 transition-transform shadow-sm"
                        style={{ backgroundColor: strokeColor }}
                      ></div>
                      <div className="flex-grow flex items-center border-2 border-gray-200 rounded-[0.5vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-300 transition-colors">
                        <input
                          type="text"
                          value={strokeColor.toUpperCase()}
                          onChange={(e) => updateStrokeColorFromHex(e.target.value)}
                          className="w-[3.5vw] h-full px-1 text-[0.7vw] font-bold text-gray-700 outline-none flex-shrink-0 text-center"
                          maxLength={7}
                          placeholder="#000000"
                        />
                        <div className="flex-grow flex items-center border-l-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white h-full">
                          <button
                            onClick={() => setStrokeOpacity(Math.max(0, strokeOpacity - 5))}
                            className="w-[1.5vw] h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 border-r border-gray-200 font-bold transition-colors"
                          >−</button>
                          <span className="text-gray-700 text-[0.7vw] px-1 min-w-[2vw] text-center flex-grow font-bold bg-white h-full flex items-center justify-center">{strokeOpacity}%</span>
                          <button
                            onClick={() => setStrokeOpacity(Math.min(100, strokeOpacity + 5))}
                            className="w-[1.5vw] h-full flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0 font-bold transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Settings / Dashed */}
                    <div className="flex items-center justify-end gap-[0.65vw] pt-[0.25vw]">
                      <div className="p-[0.5vw] rounded-[0.5vw] hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => setShowDashedPopup(!showDashedPopup)}>
                        <SlidersHorizontal size={18} className={`dashed-selector-trigger transition-colors ${showDashedPopup ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                      </div>

                      <div className="relative" ref={borderStyleRef}>
                        <div className="h-[2vw] px-[0.5vw] border border-gray-300 rounded-[0.25vw] flex items-center gap-[0.5vw] cursor-pointer min-w-[4.6vw] justify-between group hover:border-blue-400 transition-all font-bold" onClick={() => setShowBorderStyleDropdown(!showBorderStyleDropdown)}>
                          <span className="text-[0.7vw] text-gray-700 ">{strokeType}</span>
                          <ChevronDown size={12} className="text-gray-500 group-hover:text-blue-600" />
                        </div>
                        {showBorderStyleDropdown && (
                          <div className="absolute right-0 bottom-full mb-1 w-[6.9vw] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2">
                            <div onClick={() => {
                              setStrokeType('solid');
                              setShowBorderStyleDropdown(false);
                            }} className={`px-3 py-2 text-[0.7vw] font-bold transition-colors cursor-pointer ${strokeType === 'solid' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Solid</div>
                            <div onClick={() => {
                              setStrokeType('dashed');
                              setShowBorderStyleDropdown(false);
                            }} className={`px-3 py-2 text-[0.7vw] font-bold transition-colors cursor-pointer ${strokeType === 'dashed' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Dashed</div>
                          </div>
                        )}
                      </div>

                      {/* Figma-style Thickness Control with Drag */}
                      <div
                        className="h-[2vw] min-w-[6.5vw] border border-gray-300 rounded-[0.25vw] flex items-center px-[0.25vw] gap-[0.25vw] bg-white hover:border-blue-500 transition-colors cursor-ew-resize select-none shadow-sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startVal = borderThickness || 0;

                          const handleMove = (moveEvent) => {
                            const diff = Math.round(moveEvent.clientX - startX);
                            const newVal = Math.max(0, startVal + diff);
                            setBorderThickness(newVal);
                          };

                          const handleUp = () => {
                            window.removeEventListener('mousemove', handleMove);
                            window.removeEventListener('mouseup', handleUp);
                          };

                          window.addEventListener('mousemove', handleMove);
                          window.addEventListener('mouseup', handleUp);
                        }}
                      >
                        <Icon icon="material-symbols:line-weight" width="18" height="18" className="text-gray-500 flex-shrink-0" />
                        <div className="w-[1px] h-[1vw] bg-gray-200 mx-[0.15vw]"></div>

                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setBorderThickness(Math.max(0, borderThickness - 1))}
                          className="w-[1.25vw] h-[1.25vw] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-[0.25vw] cursor-pointer"
                        >−</button>

                        <input
                          type="number"
                          readOnly
                          value={borderThickness}
                          className="w-full text-[0.7vw] font-bold outline-none text-center bg-transparent cursor-ew-resize pointer-events-none text-gray-700"
                        />

                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setBorderThickness(borderThickness + 1)}
                          className="w-[1.25vw] h-[1.25vw] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-[0.25vw] cursor-pointer"
                        >+</button>
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
          pages={pages}
          isOpen={activeSection === 'interaction'}
          onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
        />

      </div>
    </div >
  );

};

export default TextEditor;