import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import PreDefined from "./PreDefined";
import Customized from "./Customized";

export default function RightPanel({ 
    onFileProcess, 
    hasModel, 
    onExport,
    autoRotate, 
    setAutoRotate, 
    isLoading, 
    materialSettings, 
    onUpdateMaterialSetting,
    activeTab = "pre",
    setActiveTab,
    activeAccordion,
    setActiveAccordion,
    transformValues,
    onManualTransformChange,
    onResetTransform,
    onResetFactorSettings,
    onUvUnwrap
}) {
  const fileRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
        onFileProcess(file);
        e.target.value = null; // Reset input
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
        onFileProcess(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden border-l border-gray-300">
      {/* TOP CONTROLS BAR (Always Visible) */}
      <div className="p-4 flex items-center justify-between bg-white shrink-0">
        {/* Auto Rotate Toggle */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => hasModel && setAutoRotate(!autoRotate)}
            className={`w-11 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${
              hasModel 
                ? `cursor-pointer ${autoRotate ? "bg-[#5d5efc]" : "bg-gray-200"}` 
                : "bg-gray-100 cursor-not-allowed opacity-50"
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${autoRotate ? "translate-x-5" : "translate-x-0"}`} />
          </div>
          <span className={`text-[14px] font-semibold ${hasModel ? "text-gray-800" : "text-gray-400"}`}>Auto Rotate</span>
        </div>

        {/* Export Button */}
        <button 
          onClick={onExport}
          disabled={!hasModel}
          className={`py-2.5 px-6 rounded-lg text-[14px] font-semibold flex items-center gap-2 transition-all ${
            hasModel 
              ? "bg-[#5d5efc] text-white shadow-lg shadow-[#5d5efc]/20 active:scale-95 cursor-pointer hover:bg-[#4d4eec]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
          }`}
        >
          <Icon icon="bitcoin-icons:export-outline" width="24" height="24" className="stroke-2" />
          Export 3D
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasModel ? (
          <div className="flex-1 bg-[#f5f6f7] rounded-t-[24px] p-8 flex flex-col">
            {/* Header */}
            <h1 className="text-[18px] font-semibold text-gray-900 mb-8 leading-tight">
              Upload your 3D Object
            </h1>

            {/* Subtitle with line */}
            <div className="flex items-center gap-3 mb-10">
              <span className="text-[14px] font-semibold text-gray-900 whitespace-nowrap">Your Model</span>
              <div className="h-[2px] flex-1 bg-gray-300"></div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => !isLoading && fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`w-[90%] mx-auto h-[160px] border-2 border-dashed rounded-[20px] bg-white flex flex-col items-center justify-center p-4 transition-all group shadow-sm 
                ${isLoading 
                    ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-300 grayscale" 
                    : isDragOver 
                        ? "border-blue-500 bg-blue-50 cursor-copy scale-[1.02]" 
                        : "border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md"
                }`}
            >
              <div className="text-[14px] font-semibold text-gray-500 mb-6 tracking-tight">
                {isDragOver ? (
                    <span className="text-blue-600 font-bold">Drop to Upload</span>
                ) : (
                    <>Drag & Drop or <span className="text-blue-600 font-bold">Upload</span></>
                )}
              </div>

              <div className={`mb-6 transition-colors ${isDragOver ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"}`}>
                <Icon icon="heroicons:arrow-up-tray" width={28} />
              </div>

              <div className="text-center">
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Supported File
                </div>
                <div className="text-[9px] text-gray-400 leading-relaxed uppercase max-w-[200px] font-medium text-center">
                  STEP, OBJ, FBX, GLB, GLTF
                </div>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".glb,.gltf,.obj,.fbx,.stl,.step,.stp"
              hidden
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full bg-gray-50">
            {/* TABS (Segmented Pill Style) */}
            <div className="px-4 pt-4 pb-3 bg-white">
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setActiveTab("pre")}
                  className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "pre"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div
                    className="w-4 h-4 border-[1.5px] border-current rounded-sm relative opacity-70"
                    style={{
                      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 1px, currentColor 1px, currentColor 2px)",
                      backgroundSize: "4px 4px",
                    }}
                  ></div>
                  Pre Defined
                </button>

                <button
                  onClick={() => setActiveTab("custom")}
                  className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "custom"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon icon="heroicons:pencil-square" width={16} height={16} className="opacity-70" />
                  Customized
                </button>
              </div>
            </div>

            {/* TAB CONTENT (Scrollable Area with Animation) */}
            <div className="flex-1 overflow-hidden relative">
              {/* Pre Defined Tab */}
              <div
                className={`absolute inset-0 overflow-y-auto p-4 custom-scrollbar transition-all duration-300 ${
                  activeTab === "pre"
                    ? "opacity-100 translate-x-0 pointer-events-auto"
                    : "opacity-0 -translate-x-4 pointer-events-none"
                }`}
              >
                <PreDefined 
                    controls={materialSettings} 
                    updateControl={onUpdateMaterialSetting}
                    activePanel={activeAccordion}
                    setActivePanel={setActiveAccordion}
                    transformValues={transformValues}
                    onManualTransformChange={onManualTransformChange}
                    onResetTransform={onResetTransform}
                    onResetFactor={onResetFactorSettings}
                    onUvUnwrap={onUvUnwrap}
                />
              </div>

              {/* Customized Tab */}
              <div
                className={`absolute inset-0 overflow-y-auto p-4 custom-scrollbar transition-all duration-300 ${
                  activeTab === "custom"
                    ? "opacity-100 translate-x-0 pointer-events-auto"
                    : "opacity-0 translate-x-4 pointer-events-none"
                }`}
              >
                <Customized />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
