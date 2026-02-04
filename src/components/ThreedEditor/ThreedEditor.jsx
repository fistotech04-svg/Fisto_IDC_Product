import React, { useState, Suspense } from "react";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, GizmoHelper, GizmoViewport, Environment, useProgress, TransformControls } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useLoader } from "@react-three/fiber";
import initOCCT from "occt-import-js";


const TransformWrapper = ({ children, mode }) => {
    return (
        <React.Fragment>
             {mode && (
                <TransformControls mode={mode} size={0.8} space="local">
                    {children}
                </TransformControls>
             )}
             {!mode && children}
        </React.Fragment>
    );
};


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

// Shared Logic Component
const GenericModel = React.memo(({ scene, wireframe, setModelStats, setMaterialList, selectedMaterial, onSelectMaterial, modelName, transformMode }) => {
  const [position, setPosition] = React.useState([0, 0, 0]);
  const [scale, setScale] = React.useState(1);

  // 1. Initial Setup: Centering, Scaling, Stats, Material Naming
  React.useLayoutEffect(() => {
    // ... (same as before) ...
    // Note: To keep diff minimal, I will retain the logic but since this is replace_content, I must provide full body? 
    // Actually, I can just update the component start and end.
    // However, I need to insert the Transform logic.
    if (!scene) return;

    // Reset position and scale to calculate true bounding box
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    let targetScale = 1;

    if (maxDim > 0) {
        targetScale = 3 / maxDim;
    }

    setScale(targetScale);

    const centeredX = -center.x * targetScale;
    const centeredZ = -center.z * targetScale;
    const bottomY = -box.min.y * targetScale; // Align bottom of model to y=0
     
    setPosition([centeredX, bottomY, centeredZ]);

    // Stats & Material Naming
    let vertCount = 0;
    let polyCount = 0;
    const processedMaterials = new Map();
    const usedNames = new Set();
    let unnamedCount = 1;

    const groupMap = new Map(); // GroupName -> Set<MaterialName>
    const ungroupedMats = new Set();

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Geometry Stats
        const geom = child.geometry;
        if (geom) {
          vertCount += geom.attributes.position.count;
          if (geom.index) {
            polyCount += geom.index.count / 3;
          } else {
            polyCount += geom.attributes.position.count / 3;
          }
        }
        
        // Material Naming & Grouping logic
        if (child.material) {
            
            // Determine Group Name
            let groupName = null;
            if (child.parent && child.parent.isGroup && child.parent.name && child.parent.name !== 'Scene') {
                 groupName = child.parent.name;
            }

            const processMat = (m) => {
                let uniqueName = processedMaterials.get(m.uuid);

                if (!uniqueName) {
                    let name = m.name; 
                    if (!name || name.trim() === '') {
                        const suffix = String(unnamedCount++).padStart(2, '0');
                        name = `Material_${suffix}`;
                    }
                    
                    name = name.replace(/[:|]/g, " ").trim();
                    
                    uniqueName = name;
                    let conflictCount = 1;
                    while (usedNames.has(uniqueName)) {
                        uniqueName = `${name}_${String(conflictCount++).padStart(2, '0')}`;
                    }
                    
                    m.name = uniqueName;
                    processedMaterials.set(m.uuid, uniqueName);
                    usedNames.add(uniqueName);
                }

                // Add to Group or Ungrouped
                if (groupName) {
                    if (!groupMap.has(groupName)) groupMap.set(groupName, new Set());
                    groupMap.get(groupName).add(uniqueName);
                } else {
                    ungroupedMats.add(uniqueName);
                }
            };

            if (Array.isArray(child.material)) {
                child.material.forEach(processMat);
            } else {
                processMat(child.material);
            }
        }
      }
    });

    // Construct Structured List
    const structuredList = [];
    
    // Add Groups
    const sortedGroups = Array.from(groupMap.keys()).sort();
    sortedGroups.forEach(grp => {
        structuredList.push({
            group: grp,
            materials: Array.from(groupMap.get(grp)).sort()
        });
    });

    // Add Ungrouped (if any, merge them or add as separate category?)
    // If we have groups, usually we want everything in structure.
    // If we have ONLY ungrouped, we might just pass flat list? 
    // Let's standardize: ALWAYS pass structured list? Or Mixed?
    // Let's add "Ungrouped" if groups exist.
    if (ungroupedMats.size > 0) {
        if (structuredList.length > 0) {
             structuredList.push({
                 group: "Ungrouped",
                 materials: Array.from(ungroupedMats).sort()
             });
        } else {
             // No groups at all -> Just flat list (backward compat/simple view)
             // actually, let's keep it simple for MaterialList component.
             // If we return flat array, MaterialList renders flat.
             // If mixed? 
        }
    }
    
    // Simplify: If no groups found, return flat array. If groups found, return structured.
    if (structuredList.length === 0) {
         setMaterialList(Array.from(ungroupedMats).sort());
    } else {
         // If there are some ungrouped items in a mostly grouped scene, add them.
         if (ungroupedMats.size > 0 && !structuredList.find(x => x.group === "Ungrouped")) {
             structuredList.push({
                 group: "Models", // Better name than Ungrouped
                 materials: Array.from(ungroupedMats).sort()
             });
         }
         setMaterialList(structuredList);
    }

    setModelStats(prev => ({
        ...prev,
        vertexCount: vertCount.toLocaleString(),
        polygonCount: Math.round(polyCount).toLocaleString(),
        materialCount: processedMaterials.size,
        dimensions: `${Math.round(size.x * 100) / 100} X ${Math.round(size.y * 100) / 100} X ${Math.round(size.z * 100) / 100} unit`
    }));
    // setMaterialList set above in traversal logic

  }, [scene, setModelStats, setMaterialList]);

  // 2. Wireframe Update Effect
  React.useLayoutEffect(() => {
      if (!scene) return;
      scene.traverse((child) => {
          if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.wireframe = wireframe);
              } else {
                  child.material.wireframe = wireframe;
              }
          }
      });
  }, [scene, wireframe]);

  // 3. Material Highlight Effect
  React.useEffect(() => {
    if (!scene) return;
    
    const timeouts = [];

    // Logic: If selectedMaterial.name matches modelName, Blink ALL meshes.
    // If matches a material name, blink specific meshes.
    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const isFullModelSelect = (targetName && modelName && targetName === modelName);

    // Initial Flash color
    const FLASH_COLOR = new THREE.Color("#ff0000"); // Red
    const FLASH_INTENSITY = 1.5;
    const HIGHLIGHT_INTENSITY_LOW = 0.5;
    const HIGHLIGHT_INTENSITY_FINAL = 0; // Restore to original

    const processHighlight = (m) => {
        if (!m.emissive) return;

        const isTarget = isFullModelSelect || (m.name === targetName);

        if (isTarget) {
            // Save original state if not already saved
            if (!m.userData.originalEmissive) {
                    m.userData.originalEmissive = m.emissive.clone();
                    m.userData.originalIntensity = m.emissiveIntensity;
            }
            
            // Double Blink Animation Sequence
            // 1. Blink On (Immediate)
            m.emissive = FLASH_COLOR;
            m.emissiveIntensity = FLASH_INTENSITY; 

            // 2. Blink Off (150ms) - only if still selected
            timeouts.push(setTimeout(() => {
                    if (selectedMaterial && selectedMaterial.name === targetName) m.emissiveIntensity = HIGHLIGHT_INTENSITY_LOW;
            }, 150));

            // 3. Blink On (300ms)
            timeouts.push(setTimeout(() => {
                    if (selectedMaterial && selectedMaterial.name === targetName) m.emissiveIntensity = FLASH_INTENSITY;
            }, 300));

            // 4. Finish Blink (450ms) - Restore Original
            timeouts.push(setTimeout(() => {
                    // Check if *still* selected with same timestamp logic if needed, but essentially restore
                    if (m.userData.originalEmissive) {
                        m.emissive = m.userData.originalEmissive.clone();
                        m.emissiveIntensity = m.userData.originalIntensity;
                    } else {
                        m.emissive = new THREE.Color(0, 0, 0); 
                        m.emissiveIntensity = 0; 
                    }
            }, 450));

        } else {
            // Restore original state if not target
            if (m.userData.originalEmissive) {
                m.emissive = m.userData.originalEmissive.clone();
                m.emissiveIntensity = m.userData.originalIntensity;
            }
        }
    };

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(processHighlight);
            } else {
                 processHighlight(child.material);
            }
        }
    });

    return () => timeouts.forEach(clearTimeout);
  }, [scene, selectedMaterial, modelName]);

  // 4. Determine Transform Target
  const [transformTarget, setTransformTarget] = React.useState(null);

  React.useEffect(() => {
    if (!scene) return;

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const targetUuid = selectedMaterial ? selectedMaterial.uuid : null;
    
    // Default to Full Model (scene) if nothing selected or Model Name selected
    if (!targetName || (modelName && targetName === modelName)) {
        setTransformTarget(scene);
        return;
    }

    // Otherwise, try to find the mesh with the selected material
    let foundMesh = null;

    // Priority 1: UUID Match (Exact Mesh Selection)
    if (targetUuid) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.uuid === targetUuid) {
                foundMesh = child;
            }
        });
    }

    // Priority 2: Name Match (First found with material)
    if (!foundMesh) {
        scene.traverse((child) => {
            if (foundMesh) return; // Stop if already found
            if (child.isMesh && child.material) {
                 const m = child.material;
                 // Check single material or array
                 if (Array.isArray(m)) {
                     if (m.some(mat => mat.name === targetName)) foundMesh = child;
                 } else {
                     if (m.name === targetName) foundMesh = child;
                 }
            }
        });
    }

    if (foundMesh) {
         // Auto-Center Pivot Logic:
         // Ensure the mesh origin (pivot) is at the center of its geometry for perfect gizmo placement.
         if (!foundMesh.userData.originCentered) {
             // 1. Ensure unique geometry to prevent side effects on shared meshes
             foundMesh.geometry = foundMesh.geometry.clone();
             
             // 2. Compute current center
             foundMesh.geometry.computeBoundingBox();
             const center = new THREE.Vector3();
             foundMesh.geometry.boundingBox.getCenter(center);
             
             // 3. Only adjust if center is not already (0,0,0)
             if (center.lengthSq() > 0.000001) {
                 // Convert local center to world position using current transform
                 const worldCenter = foundMesh.localToWorld(center.clone());
                 
                 // Shift geometry vertices to be centered around (0,0,0) local
                 foundMesh.geometry.translate(-center.x, -center.y, -center.z);
                 
                 // Move mesh object to the world position where the center was
                 // compensating for the geometry shift so visual position doesn't change
                 if (foundMesh.parent) {
                     foundMesh.position.copy(foundMesh.parent.worldToLocal(worldCenter));
                 } else {
                     foundMesh.position.copy(worldCenter);
                 }
                 
                 foundMesh.updateMatrixWorld();
             }
             
             foundMesh.userData.originCentered = true;
         }
    }

    setTransformTarget(foundMesh || scene); // Fallback to scene if not found
  }, [scene, selectedMaterial, modelName]);

  return (
    <>
        {transformMode && transformTarget && (
             <TransformControls 
                key={transformTarget.uuid} // FORCE REMOUNT ON TARGET CHANGE
                object={transformTarget} 
                mode={transformMode} 
                size={0.8} 
                space="local" 
             />
        )}
        <primitive 
            object={scene} 
            scale={scale} 
            position={position} 
            onClick={(e) => {
                e.stopPropagation();
                // If gizmo is active, we might want to prevent selection? Or allow?
                // TransformControls handles its own events. This click is on the mesh.
                
                if (onSelectMaterial && e.object.material) {
                    let mat = e.object.material;
                    if (Array.isArray(mat)) {
                        if (e.face && e.face.materialIndex !== undefined) {
                             mat = mat[e.face.materialIndex];
                        } else {
                             mat = mat[0];
                        }
                    }
                    if (mat && mat.name) {
                        onSelectMaterial({ name: mat.name, uuid: e.object.uuid });
                    }
                }
            }}
        />
    </>
  );
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
          name: 'STL Material' // FIX: Name the STL material
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

                    // FIX: Bake rotation into geometry to ensure correct bounding box calculation
                    geometry.rotateX(-Math.PI / 2);

                    // Material
                    let color = '#a0a0a0';
                    const suffix = String(matIndex++).padStart(2, '0');
                    let matName = `Material_${suffix}`; // Default fallback
                    
                    if (meshData.name) {
                        matName = `${meshData.name}_Mat`;
                    }
                    
                    // Fallback again if mesh name was empty
                    if (!matName) matName = `Material_${suffix}`;

                    if (meshData.color) {
                         const c = meshData.color;
                         color = new THREE.Color(c[0], c[1], c[2]);
                         // Use Color Code ONLY if no other name exists ? No, user specifically requested NO color codes.
                         // So we stick to matName derived from index or mesh name.
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

                // group.rotation.x = -Math.PI / 2; // REMOVED: Rotation is now baked into geometry
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

    if (loading || !scene) return null;

    return <GenericModel scene={scene} {...props} />;
}


// Global Loader Component
const GlobalLoader = ({ manualLoading }) => {
  const { active, progress } = useProgress();
  const show = active || manualLoading;
  
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black pointer-events-auto">
        <LoadingSpinner text={`Loading Model... ${Math.round(progress)}%`} dark={true} />
    </div>
  );
};

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
  
  const [showWarning, setShowWarning] = useState(false);

  // Transform Tools State
  const [transformMode, setTransformMode] = useState(null); // 'translate', 'rotate', 'scale', null
  const [modelName, setModelName] = useState("");

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

    let type = 'glb';
    if (name.endsWith('.obj')) type = 'obj';
    else if (name.endsWith('.stl')) type = 'stl';
    else if (name.endsWith('.fbx')) type = 'fbx';
    else if (name.endsWith('.step') || name.endsWith('.stp')) type = 'step';
    
    setModelType(type);

    const url = URL.createObjectURL(file);
    setModelUrl(url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    setModelStats({
        vertexCount: "0",
        polygonCount: "0",
        materialCount: "0",
        fileSize: "0 MB",
        dimensions: "0 X 0 X 0 unit"
    });
  };

  const handleResetView = () => {
    if (controlsRef.current) {
        controlsRef.current.reset();
        // Reset state manually as well to be sure, though controls reset handles target
        setTargetPosition({ x: 0, y: 0, z: 0 });
    }
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
              selectedMaterial={selectedMaterial?.name}
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
            setTransformMode={setTransformMode}
          />

          {modelUrl && (
            <TextureGalleryBar
              isOpen={isTextureOpen}
              setIsOpen={setIsTextureOpen}
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
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <directionalLight position={[-5, 5, 5]} intensity={0.5} />
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
                            if (typeof val === 'object' && val.name) {
                                setSelectedMaterial({ name: val.name, uuid: val.uuid, ts: Date.now() });
                            } else {
                                setSelectedMaterial({ name: val, uuid: null, ts: Date.now() });
                            }
                        }}
                        modelName={modelName}
                        transformMode={transformMode}
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
          />
        </div>
      </div>

    </div>
  );
}
