import React, { useState, Suspense, useEffect, useCallback, useRef } from "react";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useProgress } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";
import AnimatedGizmo from "./Components/AnimatedGizmo";
import { GlobalLoader } from "./Components/GlobalLoader";
import RenderModel from "./Components/ModelLoaders";


export default function ThreedEditor() {
  const [modelUrl, setModelUrl] = useState(null);
  const [modelType, setModelType] = useState('glb');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
  const [modelStats, setModelStats] = useState({
    vertexCount: "0",
    polygonCount: "0",
    materialCount: "0",
    fileSize: "0 MB",
    dimensions: "0 X 0 X 0 unit"
  });
  
  const controlsRef = React.useRef(null);
  const lastUpdateRef = React.useRef(0);

  // Target Position State
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, z: 0 });
  const [materialList, setMaterialList] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  
  useEffect(() => {
      // Debug log to confirm texture selection
      if (selectedTexture) console.log("Texture Selected:", selectedTexture.name);
  }, [selectedTexture]);

  const [showWarning, setShowWarning] = useState(false);

  // Right Panel & Sidebar State
  const [activeRightTab, setActiveRightTab] = useState("pre"); // "pre" | "custom"
  const [activeAccordion, setActiveAccordion] = useState("factor"); // "factor" | "position" | "lighting"

  // Transform Tools State
  const [transformMode, setTransformMode] = useState(null); // 'translate', 'rotate', 'scale', null
  const [transformValues, setTransformValues] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });
  const [modelName, setModelName] = useState("");
  const [selectedTextureId, setSelectedTextureId] = useState(null);

  const [materialSettings, setMaterialSettings] = useState({
    alpha: 100,
    metallic: 0,
    roughness: 50,
    normal: 100,
    bump: 100,
    scale: 100,
    rotation: 0,
    specular: 50,
    reflection: 50,
    shadow: 50,
    softness: 50,
    ao: 100,

    environment: 'city',
    color: '#000000',
    useFactorColor: false, // New Toggle
    
    // Light position controls (spherical coordinates)
    lightPosition: { x: 10, y: 10, z: 10 }
  });

  const updateMaterialSetting = useCallback((key, val) => {
    setMaterialSettings((prev) => {
      // optimization: prevent update if value is same
      if (prev[key] === val) return prev;
      return { ...prev, [key]: val };
    });
  }, []);

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

    const url = URL.createObjectURL(file);
    setModelUrl(url);

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
    setModelUrl(null);
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
    setTransformValues({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
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
        
        return next;
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

  return (
    <div 
        className="flex h-[92vh] w-full bg-white overflow-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <GlobalLoader manualLoading={manualLoading} />
      
      {/* Unsupported Format Warning Modal */}
      {showWarning && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Icon icon="heroicons:exclamation-triangle-solid" width={32} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Format Not Supported</h3>
                    
                    <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
                        Oops! We currently don't support this file format. Please upload one of the following:
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                        {['.GLB', '.OBJ', '.FBX', '.STL', '.STEP'].map((ext) => (
                            <span key={ext} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md border border-gray-200">
                                {ext}
                            </span>
                        ))}
                    </div>

                    <button 
                        onClick={() => setShowWarning(false)}
                        className="w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
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
              onSelectMaterial={(name) => setSelectedMaterial({ name, ts: Date.now() })}
              modelName={modelName} // Pass filename
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
            <Canvas camera={{ position: [0, 1, 5] }} shadows>
              <color attach="background" args={[settings.backgroundColor]} />
              
              <ambientLight intensity={0.6} />
              <spotLight 
                position={[
                  materialSettings.lightPosition.x, 
                  materialSettings.lightPosition.y, 
                  materialSettings.lightPosition.z
                ]} 
                angle={0.15} 
                penumbra={1} 
                intensity={1} 
                castShadow 
              />
              <directionalLight 
                position={[
                  -materialSettings.lightPosition.x / 2, 
                  materialSettings.lightPosition.y / 2, 
                  materialSettings.lightPosition.z / 2
                ]} 
                intensity={0.5} 
              />
              <Suspense fallback={null}>
                <Environment preset="city" />
              </Suspense>

              <Suspense fallback={null}>
                  {modelUrl && (
                    <RenderModel 
                        type={modelType}  
                        url={modelUrl}
                        wireframe={settings.wireframe}
                        setModelStats={setModelStats}
                        setMaterialList={setMaterialList}
                        selectedMaterial={selectedMaterial}
                        onSelectMaterial={(val) => {
                            if (typeof val === 'object') {
                                // Preserve full object (including isGroup, materials)
                                setSelectedMaterial({ ...val, uuid: val.uuid || null, ts: Date.now() });
                            } else {
                                setSelectedMaterial({ name: val, uuid: null, ts: Date.now() });
                            }
                        }}
                        modelName={modelName}
                        transformMode={transformMode}
                        materialSettings={materialSettings}
                        onUpdateMaterialSetting={updateMaterialSetting}
                        selectedTexture={selectedTexture}
                        onTextureApplied={() => setSelectedTexture(null)}
                        onTextureIdentified={(id) => setSelectedTextureId(id)}
                        onTransformChange={(t) => {
                            // Convert Euler/Vector3 to plain objects if needed, or structured state
                            // ThreeJS Euler is radians. We might want degrees for UI.
                            setTransformValues({
                                position: { x: t.position.x, y: t.position.y, z: t.position.z },
                                rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
                                scale: { x: t.scale.x, y: t.scale.y, z: t.scale.z }
                            });
                        }}
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
                 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
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
              
              <Environment preset={materialSettings.environment} />
            </Canvas>
          </div>
        </div>

        {/* RIGHT SETTINGS PANEL */}
        <div className="w-[22vw] h-full border-l border-gray-100 bg-white z-40 relative flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <RightPanel
            onFileProcess={processFile}
            hasModel={!!modelUrl}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            isLoading={isGlobalLoading}
            materialSettings={materialSettings}
            onUpdateMaterialSetting={updateMaterialSetting}
            activeTab={activeRightTab}
            setActiveTab={setActiveRightTab}
            activeAccordion={activeAccordion}
            setActiveAccordion={setActiveAccordion}
            transformValues={transformValues}
            onManualTransformChange={handleManualTransformChange}
          />
        </div>
      </div>

    </div>
  );
}
