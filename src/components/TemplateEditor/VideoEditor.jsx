// VideoEditor.jsx - Context-sensitive video editing panel
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

import {
  Video as VideoIcon,
  Upload,
  RefreshCw,
  Trash2,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Replace,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import VideoGalleryModal from "./VideoGalleryModal";
import InteractionPanel from './InteractionPanel';


const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const autoPickThumbnailFromVideo = (selectedElement, onUpdate) => {
  if (!selectedElement || selectedElement.tagName !== "VIDEO") return;

  const video = selectedElement;
  const currentTime = video.currentTime;

  const capture = () => {
    requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailDataUrl = canvas.toDataURL("image/png");
      video.setAttribute("poster", thumbnailDataUrl);

      video.currentTime = currentTime;
      onUpdate?.();
    });
  };

  if (video.readyState >= 2) {
    video.currentTime = Math.min(1, video.duration / 10);
    capture();
  } else {
    video.addEventListener(
      "loadeddata",
      () => {
        video.currentTime = Math.min(1, video.duration / 10);
        capture();
      },
      { once: true }
    );
  }
};

const VideoEditor = ({ selectedElement, onUpdate, onPopupPreviewUpdate }) => {
  const fileInputRef = useRef(null);
  const [openGallery, setOpenGallery] = useState(false);
  const [tab, setTab] = useState("gallery");
  // Set default to true so it is open by default
  const [open, setOpen] = useState(true);
  const coverInputRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [posterSrc, setPosterSrc] = useState(null);
  const [videoType, setVideoType] = useState("fit");

  // Memoize the debounced update function to prevent recreation
  const debouncedUpdate = useMemo(
    () => debounce((...args) => onUpdate?.(...args), 150),
    [onUpdate]
  );

  // Memoize static gallery previews - this prevents re-creation on every render
  const galleryPreviews = useMemo(() => [
    "https://www.abcconsultants.in/wp-content/uploads/2023/07/Industrial.jpg",
    "https://www.shutterstock.com/image-photo/engineers-discussing-project-outdoors-industrial-260nw-2624485537.jpg",
    "https://thumbs.dreamstime.com/b/professional-people-workers-working-modern-technology-robotic-industry-automation-manufacturing-engineer-robot-arm-assembly-413769130.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjnXGV5m5a_3qpSA5aZOiTI2cxP12fiECP7A&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2X_82Pzp2MyE0HXq_4QFvxUkjSlLByIkpdg&s",
    "https://7409217.fs1.hubspotusercontent-na1.net/hubfs/7409217/Imported_Blog_Media/10556694-scaled.jpg",
  ], []);

  // Consolidate all element sync into one effect to prevent multiple re-renders
  useEffect(() => {
    if (!selectedElement) {
      setPreviewSrc(null);
      setPosterSrc(null);
      return;
    }

    // Update preview source
    if (selectedElement.tagName === "VIDEO") {
      const src = selectedElement.currentSrc ||
        selectedElement.src ||
        selectedElement.querySelector("source")?.src ||
        null;
      setPreviewSrc(src);
      setPosterSrc(selectedElement.poster || null);
      
      // controls must be enabled for hover to work
      selectedElement.controls = true;
      // always hide by default
      selectedElement.classList.add("hide-controls");
    } else if (selectedElement.tagName === "IFRAME") {
      setPreviewSrc(selectedElement.src || null);
      setPosterSrc(null);
    } else {
      setPreviewSrc(null);
      setPosterSrc(null);
    }
  }, [selectedElement]);

  // Memoize replaceTemplateWithUrl to prevent re-creation
  const replaceTemplateWithUrl = useCallback((url) => {
    if (!selectedElement || !url) return;
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i);
    let newElement;

    if (isYouTube) {
      let embedUrl = url;
      if (url.includes("watch?v="))
        embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
      if (url.includes("youtu.be"))
        embedUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
      newElement = document.createElement("iframe");
      newElement.src = embedUrl;
      newElement.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newElement.allowFullscreen = true;
    } else if (isDirectVideo) {
      newElement = document.createElement("video");
      newElement.src = url;
      newElement.controls = true;
    } else {
      newElement = document.createElement("iframe");
      newElement.src = url;
      newElement.allowFullscreen = true;
    }

    newElement.style.width = selectedElement.style.width || "560px";
    newElement.style.height = selectedElement.style.height || "315px";
    selectedElement.replaceWith(newElement);
    debouncedUpdate(newElement);
  }, [selectedElement, debouncedUpdate]);

  const handleVideoTypeChange = useCallback(
    (type) => {
      if (!selectedElement || selectedElement.tagName !== "VIDEO") return;
 
      setVideoType(type);
 
      // Apply object-fit styles
      const objectFitMap = {
        fit: "contain",
        fill: "cover",
        crop: "cover",
      };
 
      selectedElement.style.objectFit = objectFitMap[type];
      selectedElement.style.objectPosition = "center";
 
      debouncedUpdate();
    },
    [selectedElement, debouncedUpdate],
  );

  // Memoize toggleAttribute to prevent re-creation
  const toggleAttribute = useCallback((attr) => {
    if (!selectedElement) return;
    const isEnabled = selectedElement.hasAttribute(attr);
    if (isEnabled) {
      selectedElement.removeAttribute(attr);
    } else {
      selectedElement.setAttribute(attr, "");
    }
    switch (attr) {
      case "autoplay":
        selectedElement.autoplay = !isEnabled;
        break;
      case "loop":
        selectedElement.loop = !isEnabled;
        break;
      case "muted":
        selectedElement.muted = !isEnabled;
        break;
      case "controls":
        selectedElement.controls = !isEnabled;
        break;
      default:
        break;
    }
    debouncedUpdate();
  }, [selectedElement, debouncedUpdate]);

  // Memoize hasAttribute to prevent re-creation
  const hasAttribute = useCallback((attr) => selectedElement?.hasAttribute(attr), [selectedElement]);

  // Memoize handleVideoUpload to prevent re-creation
  const handleVideoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    // Use Object URL for better performance (avoids base64 conversion)
    const videoURL = URL.createObjectURL(file);

    if (selectedElement.tagName === "VIDEO") {
      selectedElement.src = videoURL;
      selectedElement.setAttribute("data-filename", file.name);
      const source = selectedElement.querySelector("source");
      if (source) source.src = videoURL;
      selectedElement.load();

      // Update preview immediately
      setPreviewSrc(videoURL);

      debouncedUpdate();
    }
  }, [selectedElement, debouncedUpdate]);

  // Memoize handleCoverUpload to prevent re-creation
  const handleCoverUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    if (selectedElement.tagName !== "VIDEO") {
      alert("Cover image works only for video files");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target.result;

      // set poster on video
      selectedElement.poster = result;

      // update UI preview
      setPosterSrc(result);

      // persist in editor state
      debouncedUpdate({
        poster: result,
      });
    };

    reader.readAsDataURL(file);
  }, [selectedElement, debouncedUpdate]);

  // Memoize autoPickThumbnailFromVideo callback
  const handleAutoPickThumbnail = useCallback(() => {
    if (!selectedElement || selectedElement.tagName !== "VIDEO") return;

    // ensure metadata is loaded
    if (selectedElement.readyState < 2) {
      selectedElement.onloadeddata = () => handleAutoPickThumbnail();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = selectedElement.videoWidth;
    canvas.height = selectedElement.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(selectedElement, 0, 0, canvas.width, canvas.height);

    const thumbnail = canvas.toDataURL("image/png");

    // 🔥 FIX poster on video
    selectedElement.poster = thumbnail;

    // 🔥 update UI preview box
    setPosterSrc(thumbnail);

    // 🔥 persist in editor/store
    debouncedUpdate({
      poster: thumbnail,
    });
  }, [selectedElement, debouncedUpdate]);


  // Early return if no element is selected
  if (!selectedElement) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-4 text-center text-gray-400 text-sm">
        <VideoIcon className="mx-auto mb-2" size={32} />
        <p>Click on a video to edit</p>
      </div>
    );
  }

  return (

    <>
    
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm mb-3">
      {/* SECTION HEADER WITH TOGGLE */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-3 font-medium bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <VideoIcon size={18} className="text-gray-700" />
          <span className="text-gray-900">Video</span>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
      </button>

      {/* COLLAPSIBLE CONTENT */}
      {open && (
        <div className="space-y-3 p-4 animate-in fade-in duration-200">
          {/* Upload your Video Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Upload your Video
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleCoverUpload}
            />

            {/* SELECT IMAGE TYPE DROPDOWN */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              Select the Video type :
            </label>
            <select
              value={videoType}
              onChange={(e) => handleVideoTypeChange(e.target.value)}
              className="flex-1 px-2 py-1 mt-3 mb-3 border border-gray-300 rounded-md text-sm focus:border-transparent bg-white cursor-pointer"
            >
              <option value="fit">Fit</option>
              <option value="fill">Fill</option>
              <option value="crop">Crop</option>
            </select>
          </div>

            {/* Upload Area */}
            <div className="flex gap-3 items-center">
              {/* Video Preview Thumbnail */}
              <div className="relative w-20 h-16 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                {previewSrc ? (
                  <>
                    <video
                      src={previewSrc}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <Play size={14} className="text-gray-800 ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400">No Video</div>
                )}
              </div>

              {/* Replace Icon */}
              <div className="text-gray-300">
                <Replace size={18} />
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition bg-white"
              >
                <Upload size={16} className="mb-0.5" />
                <p className="text-xs">
                  Drag & <span className="text-indigo-600 font-medium">Upload</span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-right">
              Supported File Format : MP4
            </p>
          </div>



          {/* OR Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* URL Input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 font-medium whitespace-nowrap">URL :</label>
            <input
              type="text"
              placeholder="https://"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onBlur={(e) => replaceTemplateWithUrl(e.target.value)}
            />
          </div>

          {/* GALLERY PREVIEW BOX */}
          <div
            onClick={() => setOpenGallery(true)}
            className="relative w-full h-28 border border-gray-200 rounded-lg cursor-pointer overflow-hidden bg-gray-100 mt-2"
          >
            {/* Preview thumbnails */}
            <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-1">
              {galleryPreviews.slice(0, 3).map((src, i) => (
                <div key={i} className="relative overflow-hidden rounded-md">
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute bottom-1 left-1 right-1 text-[8px] text-white text-center truncate">
                    {i === 0 ? "Gaming Monster" : i === 1 ? "Letter Mockup" : "Outdoor"}
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full bg-gradient-to-t from-black/70 to-black/30">
              <div className="flex items-center gap-2 text-white bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                <VideoIcon size={18} />
                <p className="text-sm font-semibold">Video Gallery</p>
              </div>
            </div>
          </div>

          {/* Video Playback Settings */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Video Playback Settings
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-700">
                  AutoPlay (Play video automatically)
                </p>
                <button
                  onClick={() => toggleAttribute("autoplay")}
                  className={`relative w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                    hasAttribute("autoplay") ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      hasAttribute("autoplay") ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-700">
                  Loop (Repeat video continuously)
                </p>
                <button
                  onClick={() => toggleAttribute("loop")}
                  className={`relative w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                    hasAttribute("loop") ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      hasAttribute("loop") ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Cover Image Upload Options */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Cover Image Upload Options
            </h3>

            <div className="flex items-start justify-between gap-4">
              {/* Radio Options */}
              <div className="space-y-3 flex-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="cover"
                    onChange={() => coverInputRef.current?.click()}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900">
                    Upload from your File
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="cover"
                    defaultChecked
                    onChange={handleAutoPickThumbnail}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900">
                    Auto Pick from video
                  </span>
                </label>
              </div>

              {/* Upload Box */}
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition overflow-hidden bg-white"
              >
                {posterSrc ? (
                  <img
                    src={posterSrc}
                    alt="Video Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 hover:text-indigo-500">
                    <Upload size={16} className="mb-1" />
                    <p className="text-[10px] text-center px-2">
                      File Format : JPG, PNG
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY MODAL */}
      {openGallery && (
        <VideoGalleryModal
          tab={tab}
          setTab={setTab}
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onClose={() => setOpenGallery(false)}
        />
      )}

      
    </div>

    {/* INTERACTION PANEL */}
      <InteractionPanel
        selectedElement={selectedElement}
        onUpdate={onUpdate}
        onPopupPreviewUpdate={onPopupPreviewUpdate}
      />
    </>
    
  );
};

export default VideoEditor;