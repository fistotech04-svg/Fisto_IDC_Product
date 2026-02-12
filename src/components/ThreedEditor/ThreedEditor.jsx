import React, { useState, Suspense, useEffect, useCallback, useRef } from "react";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useProgress, ContactShadows } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";
import AnimatedGizmo from "./Components/AnimatedGizmo";
import { GlobalLoader } from "./Components/GlobalLoader";
import RenderModel from "./Components/ModelLoaders";
import useModalHistory from "./hooks/useModalHistory";
import ExportModal from "./Components/ExportModal";


import { useOutletContext } from "react-router-dom";

export default function ThreedEditor() {
  const { threedState, setThreedState } = useOutletContext();

  const [modelUrl, setModelUrl] = useState(threedState.modelUrl);
  const [modelFile, setModelFile] = useState(threedState.modelFile); // Persistence: Store the file object
  const [modelType, setModelType] = useState(threedState.modelType);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!threedState.modelUrl); // If model exists, don't collapse
  const [isTextureOpen, setIsTextureOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  // Sync manual loading with useProgress active state
  const { active } = useProgress();
  React.useEffect(() => {
    if (active && manualLoading) {
        setManualLoading(false);
    }
  }, [active, manualLoading]);

  const isGlobalLoading = manualLoading || active;
  
  // Model Statistics State
  const [modelStats, setModelStats] = useState(threedState.modelStats);
  
  const controlsRef = React.useRef(null);
  const modelRef = React.useRef(null);
  const lastUpdateRef = React.useRef(0);

  // Target Position State
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, z: 0 });
  const [materialList, setMaterialList] = useState(threedState.materialList || []);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  
  useEffect(() => {
      // Debug log to confirm texture selection
      if (selectedTexture) console.log("Texture Selected:", selectedTexture.name);
  }, [selectedTexture]);

  const [showWarning, setShowWarning] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Right Panel & Sidebar State
  const [activeRightTab, setActiveRightTab] = useState("pre"); // "pre" | "custom"
  const [activeAccordion, setActiveAccordion] = useState("factor"); // "factor" | "position" | "lighting"

  // Transform Tools State
  const [transformMode, setTransformMode] = useState(null); // 'translate', 'rotate', 'scale', null
  const [transformValues, setTransformValues] = useState(threedState.transformValues);

  // --- History Management ---
  const [modelName, setModelName] = useState(threedState.modelName);
  const [selectedTextureId, setSelectedTextureId] = useState(null);

  const [materialSettings, setMaterialSettings] = useState(threedState.materialSettings);

  const [resetKey, setResetKey] = useState(0);
  
  const { 
    state: historyState, 
    set: pushHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    resetHistory
  } = useModalHistory({
      transformValues: threedState.transformValues,
      materialSettings: threedState.materialSettings,
      modelName: threedState.modelName
  });

  // Keep a ref of current state components for constructing history entries
  const stateRef = useRef({ transformValues, materialSettings, modelName });
  useEffect(() => {
      stateRef.current = { transformValues, materialSettings, modelName };
  }, [transformValues, materialSettings, modelName]);

  // Sync State changes to Context (Debounced or on change)
  useEffect(() => {
      setThreedState(prev => ({
          ...prev,
          modelUrl,
          modelFile, // Sync file to context
          modelType,
          modelStats,
          transformValues,
          materialSettings,
          modelName,
          materialList
      }));
  }, [modelUrl, modelFile, modelType, modelStats, transformValues, materialSettings, modelName, materialList, setThreedState]);

  const handleUndo = () => {
      const prevState = undo();
      if (prevState) {
          setTransformValues(prevState.transformValues);
          setMaterialSettings(prevState.materialSettings);
          setModelName(prevState.modelName);
      }
  };

  const handleRedo = () => {
      const nextState = redo();
      if (nextState) {
          setTransformValues(nextState.transformValues);
          setMaterialSettings(nextState.materialSettings);
          setModelName(nextState.modelName);
      }
  };

  const handleRename = (newName) => {
      setModelName(newName);
      pushHistory({
          ...stateRef.current,
          modelName: newName
      });
  };

  const updateMaterialSetting = useCallback((key, val, fromSync = false) => {
    setMaterialSettings((prev) => {
      // optimization: prevent update if value is same
      if (prev[key] === val) return prev;
      
      const next = { ...prev, [key]: val };
      
      if (!fromSync) {
          pushHistory({
              transformValues: stateRef.current.transformValues,
              modelName: stateRef.current.modelName,
              materialSettings: next
          });
      }
      
      return next;
    });
  }, [pushHistory]); // Depends on pushHistory (stable)

  // Memoized handler for syncing from model (GenericModel) to avoid loop
  const handleMaterialSync = useCallback((key, val) => {
      updateMaterialSetting(key, val, true);
  }, [updateMaterialSetting]);

  // Memoized handler for UI updates (RightPanel)
  const handleMaterialUIUpdate = useCallback((key, val) => {
      updateMaterialSetting(key, val, false);
  }, [updateMaterialSetting]);

  const processFile = (file) => {
    if (!file) return;

    const name = file.name.toLowerCase();
    setModelName(file.name.replace(/\.[^/.]+$/, "")); // Set model name without extension

    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.step', '.stp'];
    
    if (!validExtensions.some(ext => name.endsWith(ext))) {
        setShowWarning(true);
        return;
    }
    
    setManualLoading(true);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setModelStats(prev => ({
        ...prev,
        fileSize: `${sizeInMB} MB`
    }));

    if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
    }

    const url = URL.createObjectURL(file);
    setModelUrl(url);
    setModelFile(file); // Set file to state

    if (name.endsWith('.obj')) setModelType('obj');
    else if (name.endsWith('.fbx')) setModelType('fbx');
    else if (name.endsWith('.stl')) setModelType('stl');
    else if (name.endsWith('.step') || name.endsWith('.stp')) setModelType('step');
    else setModelType('glb');
    
    setIsSidebarCollapsed(false); 
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleClearModel = () => {
    // Revoke URL
    if (modelUrl) {
         URL.revokeObjectURL(modelUrl);
    }

    setModelUrl(null);
    setModelFile(null); // Clear file to prevent restoration
    setModelType('glb');
    setMaterialList([]);
    setSelectedMaterial(null);
    setModelName("");
    setSelectedTexture(null);
    setIsSidebarCollapsed(true);
    setModelStats({
        vertexCount: "0",
        polygonCount: "0",
        materialCount: "0",
        fileSize: "0 MB",
        dimensions: "0 X 0 X 0 unit"
    });
    // Reset transform
    const defaultTransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    };
    setTransformValues(defaultTransform);
    
    // Reset History
    resetHistory({
        transformValues: defaultTransform,
        materialSettings: materialSettings, 
        modelName: ""
    });
  };

  const handleResetView = () => {
    if (controlsRef.current) {
        controlsRef.current.reset();
        // Reset state manually as well to be sure, though controls reset handles target
        setTargetPosition({ x: 0, y: 0, z: 0 });
    }
  };

  const handleManualTransformChange = (type, axis, value) => {
    setTransformValues(prev => {
        const next = { ...prev };
        
        let numVal = parseFloat(value);
        if (isNaN(numVal)) return prev; 

        // Rotation: Input is Degrees, Store as Radians
        if (type === 'rotation') {
            numVal = numVal * (Math.PI / 180);
        }

        next[type] = {
            ...prev[type],
            [axis]: numVal
        };
        
        pushHistory({
            ...stateRef.current,
            transformValues: next
        });
        
        return next;
    });
  };

  const originalTransformRef = useRef(null);

  const [sceneResetTrigger, setSceneResetTrigger] = useState(0);
  const [uvUnwrapTrigger, setUvUnwrapTrigger] = useState(0);

  const handleResetTransform = (type) => {
    if (type === 'all') {
        setSceneResetTrigger(prev => prev + 1);
    }

    setTransformValues(prev => {
        const next = { ...prev };
        
        // Use stored original values if available, otherwise default to 0/0/0
        const defaults = originalTransformRef.current || {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        };

        const getXYZ = (obj) => ({ x: obj.x, y: obj.y, z: obj.z });

        if (!type || type === 'all') {
             next.position = getXYZ(defaults.position);
             next.rotation = getXYZ(defaults.rotation);
             next.scale = getXYZ(defaults.scale);
        } else if (type === 'position') {
             next.position = getXYZ(defaults.position);
        } else if (type === 'rotation') {
             next.rotation = getXYZ(defaults.rotation);
        } else if (type === 'scale') {
             next.scale = getXYZ(defaults.scale);
        }
        
        pushHistory({
            ...stateRef.current,
            transformValues: next
        });

        return next;
    });
  };
  
  const handleTransformEnd = () => {
     // Called when drag ends. We push the current validated state to history.
     pushHistory({
         ...stateRef.current,
         transformValues: stateRef.current.transformValues // ensure we capture latest
     });
  };

  // Visual Settings State
  const [settings, setSettings] = useState({
    backgroundColor: "#393939", // Blender default dark grey
    baseColor: "#2c2c2c",
    base: false, // Blender doesn't have a solid floor plane by default
    grid: true,
    wireframe: false,
  });

  // Memoized Handlers to prevent infinite loops in child Effects
  const handleTextureIdentified = useCallback((id) => {
      setSelectedTextureId(id);
  }, []);

  const handleTextureApplied = useCallback(() => {
      setSelectedTexture(null);
  }, []);

  const handleSelectMaterial = useCallback((val) => {
      if (typeof val === 'object') {
          // Preserve full object (including isGroup, materials)
          setSelectedMaterial({ ...val, uuid: val.uuid || null, ts: Date.now() });
      } else {
          setSelectedMaterial({ name: val, uuid: null, ts: Date.now() });
      }
  }, []);

  const handleTransformChange = useCallback((t) => {
      if (t.original) {
          originalTransformRef.current = t.original;
      } else {
          originalTransformRef.current = null; // Clear if not provided (e.g. wrapper)
      }
      setTransformValues({
          position: { x: t.position.x, y: t.position.y, z: t.position.z },
          rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
          scale: { x: t.scale.x, y: t.scale.y, z: t.scale.z }
      });
  }, []);

  return (
    <div 
        className="flex h-[92vh] w-full bg-white overflow-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <GlobalLoader manualLoading={manualLoading} />
      
      {/* --- WARNING MODAL --- */}
      {showWarning && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
                   <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Icon icon="ph:warning-circle-bold" className="text-red-600 text-2xl" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Unsupported File Type</h3>
                   <p className="text-sm text-gray-600 mb-6">
                       Please upload a 3D model in one of the following formats: <br/>
                       <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">.glb, .gltf, .obj, .fbx, .stl, .step</span>
                   </p>
                   <button 
                       onClick={() => setShowWarning(false)}
                       className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                   >
                       Got it
                   </button>
               </div>
           </div>
      )}

      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
          <ExportModal 
              onClose={() => setShowExportModal(false)}
              onExport={(format) => {
                  if (modelRef.current) {
                      modelRef.current.exportModel(format);
                      setShowExportModal(false);
                  }
              }}
          />
      )}

      {isSidebarCollapsed && modelUrl && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute left-6 top-6 z-30 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-[#3b4190] hover:border-blue-100 transition-all"
          >
            <Icon icon="ph:list-bold" width={20} />
          </button>
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* CENTER EDITOR AREA */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">

          {/* SIDEBARS & FLOATING PANELS */}
          {modelUrl && (
            <TopToolbar 
              isSidebarCollapsed={isSidebarCollapsed} 
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              isTextureOpen={isTextureOpen}
              onReset={handleResetView}
              targetPosition={targetPosition}
              materialList={materialList}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={(name) => handleSelectMaterial(name)}
              modelName={modelName} // Pass filename
              onRename={handleRename}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )}


          <EditorToolbar 
            hasModel={!!modelUrl}
            settings={settings}
            setSettings={setSettings}
            onClear={handleClearModel}
            transformMode={transformMode}
            setTransformMode={(mode) => {
                setTransformMode(mode);
                if (mode) {
                    setActiveRightTab("pre");
                    setActiveAccordion("position");
                }
            }}
          />

          {modelUrl && (
            <TextureGalleryBar
              isOpen={isTextureOpen}
              setIsOpen={setIsTextureOpen}
              onSelectTexture={(textureData) => setSelectedTexture({ ...textureData, ts: Date.now() })}
            />
          )}

          {modelUrl && (
            <div 
              className={`absolute left-6 z-20 p-1 transition-all duration-500 ease-in-out overflow-hidden w-[200px] pointer-events-none select-none
                ${isTextureOpen ? "bottom-[220px]" : "bottom-[80px]"}
              `}
            > 
                <EditorInfoBox stats={modelStats} />
            </div>
          )}


          {!modelUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-3 opacity-50">
                <Icon icon="ph:cube-focus-thin" width={80} className="text-gray-50" />
                <span className="text-[14px] font-medium text-gray-50">Uploaded 3D Model will be shown here</span>
              </div>
            </div>
          )}

          {/* 3D CANVAS */}
          <div className="flex-1 h-full w-full">
            <Canvas camera={{ position: [0, 1, 5] }} shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
              <color attach="background" args={[settings.backgroundColor]} />
              
              <ambientLight intensity={0.6 * ((materialSettings.specular ?? 50) / 50)} />
              <spotLight 
                position={[
                  materialSettings.lightPosition.x, 
                  materialSettings.lightPosition.y, 
                  materialSettings.lightPosition.z
                ]} 
                angle={0.15} 
                penumbra={1} 
                intensity={1.5 * ((materialSettings.specular ?? 50) / 50)} 
                castShadow 
                shadow-bias={-0.0001}
              />
              <directionalLight 
                position={[
                  -materialSettings.lightPosition.x / 2, 
                  materialSettings.lightPosition.y / 2, 
                  materialSettings.lightPosition.z / 2
                ]} 
                intensity={0.5 * ((materialSettings.specular ?? 50) / 50)} 
                castShadow
              />

              <Suspense fallback={null}>
                  {modelUrl && (
                    <RenderModel 
                        ref={modelRef}
                        type={modelType}  
                        url={modelUrl}
                        wireframe={settings.wireframe}
                        setModelStats={setModelStats}
                        setMaterialList={setMaterialList}
                        selectedMaterial={selectedMaterial}
                        onSelectMaterial={handleSelectMaterial}
                        modelName={modelName}
                        transformMode={transformMode}
                        transformValues={transformValues}
                        materialSettings={materialSettings}
                        onUpdateMaterialSetting={handleMaterialSync}
                        selectedTexture={selectedTexture}
                        resetKey={resetKey}
                        sceneResetTrigger={sceneResetTrigger}
                        uvUnwrapTrigger={uvUnwrapTrigger}
                        onTextureApplied={handleTextureApplied}
                        onTextureIdentified={handleTextureIdentified}
                        onTransformEnd={handleTransformEnd}
                        onTransformChange={handleTransformChange}
                    />
                  )}
              </Suspense>
              
              {/* Blender-style Grid: Darker lines on dark background. 
                  Color 1 (Center): Transparent/Same as grid since we draw custom axes. 
                  Color 2 (Grid): #222222 or similar dark grey. 
              */}
              {settings.grid && <gridHelper args={[30, 30, 0x222222, 0x222222]} position={[0, -0.01, 0]} />}
              
              {/* Custom Center Lines: Red for X-axis, Green for Z-axis (User requested Red & Green) */}
              {settings.grid && (
                <group position={[0, 0.01, 0]}>
                    {/* X Axis - Red */}
                    <line>
                        <bufferGeometry attach="geometry">
                            <bufferAttribute
                                attach="attributes-position"
                                count={2}
                                array={new Float32Array([-15, 0, 0, 15, 0, 0])} 
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial attach="material" color="red" linewidth={2} />
                    </line>
                    
                    {/* Z Axis - Green (User asked for green center line) */}
                    <line>
                        <bufferGeometry attach="geometry">
                             <bufferAttribute
                                attach="attributes-position"
                                count={2}
                                array={new Float32Array([0, 0, -15, 0, 0, 15])} 
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial attach="material" color="green" linewidth={2} />
                    </line>
                </group>
              )}
              
              {settings.base && (
                 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
                    <planeGeometry args={[30, 30]} />
                    <meshStandardMaterial color={settings.baseColor} />
                 </mesh>
              )}

              <OrbitControls 
                ref={controlsRef} 
                autoRotate={autoRotate} 
                makeDefault 
                enableDamping={true}
                dampingFactor={0.05}
                onChange={(e) => {
                  // Throttle UI updates to prevent "hanging" (lag) caused by excessive re-renders
                  const now = Date.now();
                  if (now - lastUpdateRef.current > 60) {
                     if (e?.target?.target) {
                        const { x, y, z } = e.target.target;
                        setTargetPosition({ 
                          x: parseFloat(x.toFixed(2)), 
                          y: parseFloat(y.toFixed(2)), 
                          z: parseFloat(z.toFixed(2)) 
                        });
                     }
                     lastUpdateRef.current = now;
                  }
                }}
              />

              {/* GIZMO HELPER */}
              {modelUrl && <AnimatedGizmo isTextureOpen={isTextureOpen} />}
              
              {modelUrl && (
                  <ContactShadows 
                      position={[0, -0.01, 0]} 
                      opacity={(materialSettings.shadow ?? 50) / 100} 
                      scale={50} 
                      blur={2} 
                      far={5} 
                      resolution={512} 
                      color="#000000" 
                  />
              )}
              
              <Environment 
                  preset={materialSettings.environment} 
                  rotation={[0, (materialSettings.envRotation || 0) * (Math.PI / 180), 0]}
                  environmentIntensity={(materialSettings.reflection ?? 50) / 50}
              />
            </Canvas>
          </div>
        </div>

        {/* RIGHT SETTINGS PANEL */}
        <div className="w-[22vw] h-full border-l border-gray-100 bg-white z-40 relative flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <RightPanel
            onFileProcess={processFile}
            hasModel={!!modelUrl}
            onExport={() => setShowExportModal(true)}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            isLoading={isGlobalLoading}
            materialSettings={materialSettings}
            onUpdateMaterialSetting={handleMaterialUIUpdate}
            activeTab={activeRightTab}
            setActiveTab={setActiveRightTab}
            activeAccordion={activeAccordion}
            setActiveAccordion={setActiveAccordion}
            transformValues={transformValues}
            onManualTransformChange={handleManualTransformChange}
            onResetTransform={handleResetTransform}
            onResetFactorSettings={() => {
                setMaterialSettings(prev => {
                    const next = {
                        ...prev,
                        alpha: 100,
                        metallic: 0,
                        roughness: 50,
                        normal: 100,
                        bump: 100,
                        scale: 100,
                        scaleY: 100,
                        rotation: 0,
                        offset: { x: 0, y: 0 },
                        color: '#000000',
                        useFactorColor: false
                    };
                    pushHistory({ ...stateRef.current, materialSettings: next });
                    return next;
                });
                setResetKey(prev => prev + 1);
            }}
            onUvUnwrap={() => setUvUnwrapTrigger(prev => prev + 1)}
          />
        </div>
      </div>

    </div>
  );
}
