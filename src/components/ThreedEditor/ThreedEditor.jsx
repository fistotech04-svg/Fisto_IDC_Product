import React, { useState, Suspense } from "react";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, GizmoHelper, GizmoViewport, Environment, Html } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";

import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";


// Helper component to choose the right model component
const RenderModel = ({ type, ...props }) => {
    switch(type) {
        case 'obj': return <OBJModel {...props} />;
        case 'fbx': return <FBXModel {...props} />;
        case 'stl': return <STLModel {...props} />;
        case 'step': return <StepModel {...props} />;
        default: return <GLBModel {...props} />;
    }
};


import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useLoader } from "@react-three/fiber";
import initOCCT from "occt-import-js";

// Shared Logic Component
const GenericModel = React.memo(({ scene, wireframe, setModelStats, setMaterialList }) => {
  const [position, setPosition] = React.useState([0, 0, 0]);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    if (!scene) return;

    // Reset position and scale
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    box.getSize(size);
    box.getCenter(center);

    // Auto-scale logic: Always normalize to a comfortable viewing size (e.g. 3 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    let targetScale = 1;

    if (maxDim > 0) {
        targetScale = 3 / maxDim;
    }

    setScale(targetScale);

    const centeredX = -center.x * targetScale;
    const centeredZ = -center.z * targetScale;
    const bottomY = -box.min.y * targetScale;
    
    setPosition([centeredX, bottomY, centeredZ]);

    // Calculate Stats & Materials
    let vertCount = 0;
    let polyCount = 0;
    const materials = new Set();
    const materialNames = new Set();
    let unnamedCount = 1;

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
             child.material.wireframe = wireframe;
        }

        const geom = child.geometry;
        if (geom) {
          vertCount += geom.attributes.position.count;
          if (geom.index) {
            polyCount += geom.index.count / 3;
          } else {
            polyCount += geom.attributes.position.count / 3;
          }
        }
        
        if (child.material) {
            const processMat = (m) => {
                materials.add(m.uuid);
                
                // FIX: Ensure material has a name for the list
                if (!m.name) {
                    m.name = `Material ${unnamedCount++}`;
                }
                materialNames.add(m.name);
                m.wireframe = wireframe;
            };

            if (Array.isArray(child.material)) {
                child.material.forEach(processMat);
            } else {
                processMat(child.material);
            }
        }
      }
    });

    // Update Stats
    setModelStats(prev => ({
        ...prev,
        vertexCount: vertCount.toLocaleString(),
        polygonCount: Math.round(polyCount).toLocaleString(),
        materialCount: materials.size,
        dimensions: `${Math.round(size.x * 100) / 100} X ${Math.round(size.y * 100) / 100} X ${Math.round(size.z * 100) / 100} unit`
    }));

    // Update Material List
    setMaterialList(Array.from(materialNames));

  }, [scene, wireframe, setModelStats, setMaterialList]);

  return <primitive object={scene} scale={scale} position={position} />;
});

// GLB Loader Component
function GLBModel({ url, ...props }) {
  const { scene } = useGLTF(url);
  return <GenericModel scene={scene} {...props} />;
}

// OBJ Loader Component
function OBJModel({ url, ...props }) {
  const scene = useLoader(OBJLoader, url);
  return <GenericModel scene={scene} {...props} />;
}

// FBX Loader Component
function FBXModel({ url, ...props }) {
  const scene = useLoader(FBXLoader, url);
  return <GenericModel scene={scene} {...props} />;
}

// STL Loader Component
function STLModel({ url, ...props }) {
  const geom = useLoader(STLLoader, url);
  
  const scene = React.useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({ 
          color: 'gray',
          name: 'Standard STL Material' // FIX: Name the STL material
      });
      const mesh = new THREE.Mesh(geom, mat);
      const group = new THREE.Group();
      group.add(mesh);
      return group;
  }, [geom]);

  return <GenericModel scene={scene} {...props} />;
}

// Reusable Loading Spinner
const LoadingSpinner = ({ text = "Loading...", dark = false }) => (
    <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-6 backdrop-blur-sm ${dark ? 'bg-black' : 'bg-white'}`}>
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${dark ? 'border-white border-t-transparent' : 'border-[#5d5efc] border-t-transparent'}`}></div>
            <span className={`text-lg font-medium tracking-wide animate-pulse ${dark ? 'text-white' : 'text-gray-700'}`}>{text}</span>
    </div>
);

// STEP Loader Component
function StepModel({ url, ...props }) {
    const [scene, setScene] = useState(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        let isMounted = true;
        async function loadStep() {
            THREE.DefaultLoadingManager.itemStart(url);
            try {
                setLoading(true);
                
                // 1. Fetch file buffer
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                
                if (!isMounted) {
                    THREE.DefaultLoadingManager.itemEnd(url);
                    return;
                }

                // 2. Initialize OCCT
                const occt = await initOCCT({
                    locateFile: (name) => {
                        return '/occt-import-js.wasm'; 
                    }
                });

                // 3. Read STEP file
                const fileData = new Uint8Array(buffer);
                const result = occt.ReadStepFile(fileData, null);

                if (!result || !result.meshes || result.meshes.length === 0) {
                     throw new Error("No meshes found in STEP file.");
                }

                // 4. Convert to Three.js
                const group = new THREE.Group();
                
                // Track material counts for naming
                let matIndex = 1;

                for (const meshData of result.meshes) {
                    const geometry = new THREE.BufferGeometry();
                    
                    // Attributes
                    if (meshData.attributes.position) {
                        geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
                    }
                    if (meshData.attributes.normal) {
                        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
                    }
                    if (meshData.attributes.uv) {
                        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.attributes.uv.array, 2));
                    }
                    
                    // Index
                    if (meshData.index) {
                        geometry.setIndex(new THREE.Uint16BufferAttribute(meshData.index.array, 1));
                    }

                    // Compute vital geometry data
                    geometry.computeBoundingBox();
                    geometry.computeBoundingSphere();
                    
                    if (!meshData.attributes.normal) {
                         geometry.computeVertexNormals();
                    }

                    // Material
                    let color = '#a0a0a0';
                    let matName = `Material_${matIndex++}`;

                    if (meshData.color) {
                         const c = meshData.color;
                         color = new THREE.Color(c[0], c[1], c[2]);
                         // Generate a nicer name based on color
                         const hex = color.getHexString();
                         matName = `Color #${hex.slice(0,6)}`;
                    }
                    
                    const material = new THREE.MeshStandardMaterial({ 
                        color: color,
                        roughness: 0.5,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                        name: matName // FIX: Explicitly name the material
                    });
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    if (meshData.name) mesh.name = meshData.name;
                    
                    group.add(mesh);
                }

                group.rotation.x = -Math.PI / 2;
                group.updateMatrixWorld(true);

                if (isMounted) {
                    setScene(group);
                }

            } catch (err) {
                console.error("STEP Load Error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    THREE.DefaultLoadingManager.itemEnd(url);
                }
            }
        }

        loadStep();
        return () => { isMounted = false; };
    }, [url]);

    if (loading) {
        return (
             <Html fullscreen zIndexRange={[100, 0]}>
                <LoadingSpinner text="Please Wait Converting STEP to GLB" dark={true} />
            </Html>
        );
    }

    if (!scene) return null;

    return <GenericModel scene={scene} {...props} />;
}

// Animated Gizmo Component for smooth transitions
function AnimatedGizmo({ isTextureOpen }) {
  const [margin, setMargin] = useState(isTextureOpen ? [140, 280] : [100, 150]);
  
  useFrame((state, delta) => {
    const target = isTextureOpen ? [140, 280] : [100, 150];
    
    // Calculate distance to target
    const dist = Math.sqrt(Math.pow(target[0] - margin[0], 2) + Math.pow(target[1] - margin[1], 2));
    
    // Stop updating if close enough
    if (dist < 1) {
       if (margin[0] !== target[0] || margin[1] !== target[1]) {
           setMargin(target);
       }
       return;
    }
    
    // Smooth interpolation speed (higher is faster)
    const speed = 9;
    
    setMargin([
      margin[0] + (target[0] - margin[0]) * speed * delta,
      margin[1] + (target[1] - margin[1]) * speed * delta
    ]);
  });

  return (
    <GizmoHelper
      alignment="bottom-right"
      margin={margin}
    >
      <GizmoViewport
        axisColors={["#ff3653", "#8adb00", "#2c8fff"]}
        labelColor="white"
      />
    </GizmoHelper>
  );
}

export default function ThreedEditor() {
  const [modelUrl, setModelUrl] = useState(null);
  const [modelType, setModelType] = useState('glb');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isTextureOpen, setIsTextureOpen] = useState(false);
  
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

  const handleResetView = () => {
    if (controlsRef.current) {
        controlsRef.current.reset();
        // Reset state manually as well to be sure, though controls reset handles target
        setTargetPosition({ x: 0, y: 0, z: 0 });
    }
  };

  // Visual Settings State
  const [settings, setSettings] = useState({
    backgroundColor: "rgba(146, 146, 146, 1)",
    baseColor: "rgba(106, 106, 106, 1)",
    base: true,
    grid: true,
    wireframe: false,
  });

  return (
    <div className="flex h-[92vh] w-full bg-white overflow-hidden">

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
            />
          )}

          <EditorToolbar 
            hasModel={!!modelUrl}
            settings={settings}
            setSettings={setSettings}
          />

          {modelUrl && (
            <TextureGalleryBar
              isOpen={isTextureOpen}
              setIsOpen={setIsTextureOpen}
            />
          )}

          {modelUrl && (
            <div 
              className={`absolute left-6 z-20 p-1 transition-all duration-500 ease-in-out bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden w-[200px] pointer-events-none select-none
                ${isTextureOpen ? "bottom-[220px]" : "bottom-[80px]"}
              `}
            > 
                <EditorInfoBox stats={modelStats} />
            </div>
          )}


          {!modelUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-3 opacity-30">
                <Icon icon="ph:cube-focus-thin" width={80} className="text-gray-600" />
                <span className="text-[14px] font-medium text-gray-700">Uploaded 3D Model will be shown here</span>
              </div>
            </div>
          )}

          {/* 3D CANVAS */}
          <div className="flex-1 h-full w-full">
            <Canvas camera={{ position: [0, 1, 5] }} shadows>
              <color attach="background" args={[modelUrl ? settings.backgroundColor : "#ffffff"]} />
              
              <ambientLight intensity={0.6} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <directionalLight position={[-5, 5, 5]} intensity={0.5} />
              <Environment preset="city" />

              <Suspense fallback={modelType === 'step' ? null : <Html fullscreen><LoadingSpinner text="Loading 3D Model..." /></Html>}>
                  {modelUrl && (
                    <RenderModel 
                        type={modelType}  
                        url={modelUrl}
                        wireframe={settings.wireframe}
                        setModelStats={setModelStats}
                        setMaterialList={setMaterialList}
                    />
                  )}
              </Suspense>
              
              {modelUrl && settings.grid && <gridHelper args={[30, 60, 0xaaaaaa, 0x666666]} />}
              
              {modelUrl && settings.base && (
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
            </Canvas>
          </div>
        </div>

        {/* RIGHT SETTINGS PANEL */}
        <div className="w-[22vw] h-full border-l border-gray-100 bg-white z-40 relative flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <RightPanel
            setModelUrl={setModelUrl}
            setModelStats={setModelStats}
            setModelType={setModelType}
            hasModel={!!modelUrl}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
          />
        </div>
      </div>

    </div>
  );
}
