import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Upload, X, Check, Replace } from "lucide-react";

export default function VideoGalleryModal({ onClose, onUpdate, selectedElement, currentPageVId, flipbookVId, folderName, flipbookName }) {
  const [tempSelectedVideo, setTempSelectedVideo] = useState(null);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const galleryInputRef = useRef(null);

  // Fetch gallery videos when modal opens
  useEffect(() => {
    const fetchGalleryAssets = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      try {
        const res = await axios.get(`${backendUrl}/api/flipbook/get-gallery-assets`, {
          params: {
            emailId: user.emailId,
            type: 'video'
          }
        });
        
        if (res.data.assets) {
          // Convert backend assets to the format expected by the UI
          const formattedAssets = res.data.assets.map(asset => ({
            id: asset.name, // Use filename as ID
            name: asset.name.replace(/\.[^/.]+$/, ''), // Remove extension
            url: `${backendUrl}${asset.url}`,
            type: asset.type,
            uploadedAt: asset.uploadedAt
          }));
          
          setUploadedVideos(formattedAssets);
        }
      } catch (err) {
        console.error('Failed to fetch gallery assets:', err);
      }
    };
    
    fetchGalleryAssets();
  }, []); // Run once when component mounts

  const handleModalFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's a video or gif
    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';
    
    if (!isVideo && !isGif) {
      alert('Please select a valid Video or GIF file');
      return;
    }

    // Immediate local preview
    const videoUrl = URL.createObjectURL(file);
    const newVideoData = {
      id: Date.now(),
      name: file.name.split('.')[0],
      url: videoUrl,
      type: file.type,
      file: file  // Store the file object for later upload
    };
    
    setUploadedVideos((prev) => [newVideoData, ...prev]);
    setTempSelectedVideo(newVideoData);
    e.target.value = '';

    // Upload to gallery (user workspace folder) only
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        formData.append('isGallery', 'true');
        formData.append('type', 'video');
        formData.append('file', file);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);

            if (res.data.url) {
                const serverUrl = `${backendUrl}${res.data.url}`;
                // Update the local item with the server URL and file_v_id
                setUploadedVideos((prev) => prev.map(v => v.id === newVideoData.id ? { ...v, url: serverUrl, file_v_id: res.data.file_v_id } : v));
                setTempSelectedVideo(prev => prev && prev.id === newVideoData.id ? { ...prev, url: serverUrl, file_v_id: res.data.file_v_id } : prev);
                console.log("Gallery Video uploaded:", serverUrl);
            }
        } catch (err) {
            console.error("Gallery Upload Error:", err);
        }
    }
  };

  const handleReplace = async () => {
    if (!selectedElement || !tempSelectedVideo) return;
    
    const existingFileVid = selectedElement.dataset.fileVid;
    
    // If the gallery video has a file object (newly uploaded), upload it to flipbook assets
    if (tempSelectedVideo.file) {
      // Set temporary preview
      if (selectedElement.tagName === "VIDEO") {
        selectedElement.src = tempSelectedVideo.url;
        const source = selectedElement.querySelector("source");
        if (source) source.src = tempSelectedVideo.url;
        selectedElement.load();
      } else {
        selectedElement.src = tempSelectedVideo.url;
      }
      if (onUpdate) onUpdate();
      
      // Upload to flipbook assets
      const storedUser = localStorage.getItem('user');
      if (storedUser && (flipbookVId || (folderName && flipbookName))) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (flipbookVId) formData.append('v_id', flipbookVId);
        if (folderName) formData.append('folderName', folderName);
        if (flipbookName) formData.append('flipbookName', flipbookName);
        formData.append('type', 'video');
        formData.append('page_v_id', currentPageVId || 'global');
        if (existingFileVid) formData.append('replacing_file_v_id', existingFileVid);
        formData.append('file', tempSelectedVideo.file);
        
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          
          if (res.data.url) {
            const serverUrl = `${backendUrl}${res.data.url}`;
            if (selectedElement.tagName === "VIDEO") {
              selectedElement.src = serverUrl;
              selectedElement.dataset.fileVid = res.data.file_v_id;
              const source = selectedElement.querySelector("source");
              if (source) source.src = serverUrl;
              selectedElement.load();
            } else {
              selectedElement.src = serverUrl;
              selectedElement.dataset.fileVid = res.data.file_v_id;
            }
            if (onUpdate) onUpdate();
          }
        } catch (err) {
          console.error("Failed to upload video to flipbook assets:", err);
        }
      }
    } else {
      // If it's an already uploaded video from gallery, fetch and re-upload to flipbook assets
      try {
        const response = await fetch(tempSelectedVideo.url);
        const blob = await response.blob();
        const file = new File([blob], tempSelectedVideo.name || 'video.mp4', { type: blob.type });
        
        // Set temporary preview
        if (selectedElement.tagName === "VIDEO") {
          selectedElement.src = tempSelectedVideo.url;
          const source = selectedElement.querySelector("source");
          if (source) source.src = tempSelectedVideo.url;
          selectedElement.load();
        } else {
          selectedElement.src = tempSelectedVideo.url;
        }
        if (onUpdate) onUpdate();
        
        // Upload to flipbook assets
        const storedUser = localStorage.getItem('user');
        if (storedUser && (flipbookVId || (folderName && flipbookName))) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (flipbookVId) formData.append('v_id', flipbookVId);
          if (folderName) formData.append('folderName', folderName);
          if (flipbookName) formData.append('flipbookName', flipbookName);
          formData.append('type', 'video');
          formData.append('page_v_id', currentPageVId || 'global');
          if (existingFileVid) formData.append('replacing_file_v_id', existingFileVid);
          formData.append('file', file);
          
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
            
            if (res.data.url) {
              const serverUrl = `${backendUrl}${res.data.url}`;
              if (selectedElement.tagName === "VIDEO") {
                selectedElement.src = serverUrl;
                selectedElement.dataset.fileVid = res.data.file_v_id;
                const source = selectedElement.querySelector("source");
                if (source) source.src = serverUrl;
                selectedElement.load();
              } else {
                selectedElement.src = serverUrl;
                selectedElement.dataset.fileVid = res.data.file_v_id;
              }
              if (onUpdate) onUpdate();
            }
          } catch (err) {
            console.error("Failed to upload video to flipbook assets:", err);
          }
        }
      } catch (error) {
        console.error('Failed to fetch and upload gallery video:', error);
        // Fallback: just use the gallery URL
        if (selectedElement.tagName === "VIDEO") {
          selectedElement.src = tempSelectedVideo.url;
          const source = selectedElement.querySelector("source");
          if (source) source.src = tempSelectedVideo.url;
          selectedElement.load();
        } else {
          selectedElement.src = tempSelectedVideo.url;
        }
        if (onUpdate) onUpdate();
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed z-[10000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans"
      style={{
        width: '320px',
        height: '540px',
        top: '55%',
        left: '80%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h2 className="text-mg font-bold text-gray-900">Video Gallery</h2>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Upload Section */}
        <div className="px-4 py-2 mt-2">
          <h3 className="text-[13px] font-bold text-gray-900 mb-1">Upload your Video</h3>
          <p className="text-[11px] text-gray-400 mb-4"><span>You Can Reuse The File Which Is Uploaded In Gallery</span><span className="text-red-500">*</span></p>
          
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-2"
          >
            <p className="text-[13px] text-gray-500 font-normal mb-3">
              Drag & Drop or <span className="text-blue-600 font-semibold">Upload</span>
            </p>
            <Upload size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
            <p className="text-[11px] text-gray-400 text-center px-4">
              Supported Files : <span className="font-medium">MP4, WEBM, GIF</span>
            </p>
          </div>
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleModalFileUpload}
            accept="video/*,image/gif"
            className="hidden"
          />
        </div>

        <div className="px-5 py-4">
          <h3 className="text-[13px] font-bold text-gray-900 mb-4">Your Uploads</h3>

          {/* Grid View */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            {uploadedVideos.map((item, i) => (
              <div
                key={i}
                onClick={() => setTempSelectedVideo(item)}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className={`relative aspect-video w-full rounded-xl overflow-hidden border-2 transition-all shadow-sm ${tempSelectedVideo?.url === item.url ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-transparent hover:border-gray-200'}`}>
                  {/* Thumbnail / Preview */}
                  {item.url.match(/\.(mp4|webm)$/i) ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  )}
                  
                  {/* Selection Overlay */}
                  {tempSelectedVideo?.url === item.url && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check size={14} className="text-indigo-600" />
                        </div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium text-center truncate w-full px-1">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
          
          {uploadedVideos.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No uploaded videos yet</p>
              <p className="text-xs mt-1">Upload a video or GIF to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex justify-end gap-2 bg-white">
        <button
          onClick={onClose}
          className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"
        >
          <X size={12} /> Close
        </button>
        <button
          disabled={!tempSelectedVideo}
          onClick={handleReplace}
          className="flex-1 h-8 bg-black text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-zinc-800 disabled:opacity-50"
        >
          <Replace size={12} /> Replace
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
}