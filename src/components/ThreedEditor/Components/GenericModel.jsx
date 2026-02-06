import React, { useState, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { TransformControls } from "@react-three/drei";

const GenericModel = React.memo(({ scene, wireframe, setModelStats, setMaterialList, selectedMaterial, onSelectMaterial, modelName, transformMode, materialSettings, onTransformChange, transformValues, selectedTexture, onTextureApplied, onTextureIdentified, onUpdateMaterialSetting }) => {
  const [position, setPosition] = useState([0, 0, 0]);
  const [scale, setScale] = useState(1);
    
  // 0. Apply Texture to Selected Material
  useEffect(() => {
     if (!selectedTexture || !scene) return;
     
     // Use a separate LoadingManager to avoid triggering the global useProgress spinner
     const textureManager = new THREE.LoadingManager();
     const loader = new THREE.TextureLoader(textureManager);
     
     const loadMap = (url) => {
          if (!url) return null;
          return loader.load(url, (tex) => {
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              tex.flipY = false; 
              tex.needsUpdate = true;
          });
     }

     const newMaps = {};
     if (selectedTexture.maps.map) newMaps.map = loadMap(selectedTexture.maps.map);
     if (selectedTexture.maps.normalMap) newMaps.normalMap = loadMap(selectedTexture.maps.normalMap);
     if (selectedTexture.maps.roughnessMap) newMaps.roughnessMap = loadMap(selectedTexture.maps.roughnessMap);
     if (selectedTexture.maps.metalnessMap) newMaps.metalnessMap = loadMap(selectedTexture.maps.metalnessMap);
     if (selectedTexture.maps.aoMap) newMaps.aoMap = loadMap(selectedTexture.maps.aoMap);
     
     // Note: If no material is selected, texture applies to logic below (all matching standard materials)
     // To support "Specific Material" vs "Full Model", we check `selectedMaterial`.
     // If null, it applies to all? Yes, lines 40-45 handle this.
     
     // Check if we are in "Full Model" mode
     // Either no selection, or the selection matches the Model Name (from Material List header)
     const targetMatName = selectedMaterial ? selectedMaterial.name : null;
     const isFullModel = !targetMatName || (modelName && targetMatName === modelName);

     let appliedCount = 0;
     scene.traverse((child) => {
          if (child.isMesh && child.material) {
              const apply = (mat) => {
                   // Ensure we only modify Standard Materials or similar
                   if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) return;
                   
                   let isMatch = false;
                   if (!isFullModel) {
                       isMatch = mat.name === targetMatName;
                       // Group handling: if selectedMaterial is a group name
                       if (selectedMaterial && selectedMaterial.isGroup) {
                            isMatch = selectedMaterial.materials.includes(mat.name);
                       }
                   } else {
                       // Full Model: Apply to all
                       isMatch = true; 
                   }
                   
                   if (isMatch) {
                       // Forcefully replace maps (clearing old ones if new one doesn't exist)
                       mat.map = newMaps.map || null;
                       mat.normalMap = newMaps.normalMap || null;
                       mat.roughnessMap = newMaps.roughnessMap || null;
                       mat.metalnessMap = newMaps.metalnessMap || null;
                       mat.aoMap = newMaps.aoMap || null;
                       
                       
                       // Save the Texture ID for later identification
                       if (selectedTexture.id) {
                           mat.userData.appliedTextureId = selectedTexture.id;
                       } else {
                           delete mat.userData.appliedTextureId;
                       }
                       
                       mat.needsUpdate = true;
                       appliedCount++;
                   }
              };

              if (Array.isArray(child.material)) {
                  child.material.forEach(apply);
              } else {
                  apply(child.material);
              }
          }
     });
     
     // Update the UI immediately to reflect the new texture as "Active" for this material
     if (onTextureIdentified && selectedTexture.id) {
         onTextureIdentified(selectedTexture.id);
     }
     
     // Notify parent that texture has been processed so we can reset state
     if (onTextureApplied) {
         onTextureApplied();
     }
     
  }, [selectedTexture, scene, selectedMaterial, onTextureApplied, onTextureIdentified]);

  // 0.6. Sync UI with Selected Material (Fetch existing values)
  useEffect(() => {
    if (!scene || !selectedMaterial || !onUpdateMaterialSetting) return;
    
    // Skip if full model is selected explicitly (maybe? or use first mat?)
    // If Full Model is selected, it's ambiguous which material to read. 
    // Usually, we don't sync back for full model to avoid jumping UI.
    // BUT user asked "in base color fetch already applied color".
    
    const targetMatName = selectedMaterial.name;
    // Don't sync if selecting Model Node itself (Full Model) 
    if (modelName && targetMatName === modelName) return;

    let foundMat = null;
    const isGroup = selectedMaterial.isGroup;
    const groupMats = selectedMaterial.materials || [];

    // Find first matching material
    scene.traverse((child) => {
        if (foundMat) return;
        if (child.isMesh && child.material) {
             const mats = Array.isArray(child.material) ? child.material : [child.material];
             for (let m of mats) {
                 if (isGroup) {
                     if (groupMats.includes(m.name)) { foundMat = m; break; }
                 } else {
                     if (m.name === targetMatName) { foundMat = m; break; }
                 }
             }
        }
    });

    if (foundMat && foundMat.isMeshStandardMaterial) {
        // Sync values to UI - ONLY if distinct to prevent loops
        // We use the current materialSettings prop (closest available value) to check if update is needed
        
        // Color
        const hex = '#' + foundMat.color.getHexString();
        if (materialSettings.color !== hex) {
             onUpdateMaterialSetting('color', hex);
        }
        
        // Alpha
        const alphaVal = Math.round(foundMat.opacity * 100);
        if (Math.abs(materialSettings.alpha - alphaVal) > 1) {
             onUpdateMaterialSetting('alpha', alphaVal);
        }
        
        // Metallic
        const metalVal = Math.round(foundMat.metalness * 100);
        if (Math.abs(materialSettings.metallic - metalVal) > 1) {
             onUpdateMaterialSetting('metallic', metalVal);
        }
        
        // Roughness
        const roughVal = Math.round(foundMat.roughness * 100);
        if (Math.abs(materialSettings.roughness - roughVal) > 1) {
             onUpdateMaterialSetting('roughness', roughVal);
        }
        
        // Normal Scale (if exists)
        if (foundMat.normalMap) {
            const normVal = Math.round(foundMat.normalScale.x * 100);
            if (Math.abs(materialSettings.normal - normVal) > 1) {
                onUpdateMaterialSetting('normal', normVal);
            }
        }
    }

  }, [selectedMaterial, scene, modelName, onUpdateMaterialSetting]); // materialSettings excluded to avoid loop

  // 0.5 Detect Current Texture on Selection Change
  useEffect(() => {
      if (!scene || !onTextureIdentified) return;

      if (!selectedMaterial || (modelName && selectedMaterial.name === modelName)) {
          // Full Model or No Selection -> Clear Highlight
          onTextureIdentified(null);
          return;
      }

      const targetMatName = selectedMaterial.name;
      const isGroup = selectedMaterial.isGroup;
      const groupMats = selectedMaterial.materials || []; // Array of names
      
      let foundMat = null;

      // Find the material to check its userData
      scene.traverse((child) => {
          if (foundMat) return;
          if (child.isMesh && child.material) {
              const check = (m) => {
                  if (foundMat) return;
                  
                  let match = false;
                  if (isGroup) {
                      match = groupMats.includes(m.name);
                  } else {
                      match = m.name === targetMatName;
                  }
                  
                  if (match) {
                      foundMat = m;
                  }
              };

              if (Array.isArray(child.material)) {
                  child.material.forEach(check);
              } else {
                  check(child.material);
              }
          }
      });

      if (foundMat && foundMat.userData && foundMat.userData.appliedTextureId) {
          onTextureIdentified(foundMat.userData.appliedTextureId);
      } else {
          onTextureIdentified(null);
      }

  }, [selectedMaterial, scene, onTextureIdentified, modelName]);
  
  // 1. Initial Setup: Centering, Scaling, Stats, Material Naming
  useLayoutEffect(() => {
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

    // Filter Ungrouped Materials
    const allGroupedMaterialNames = new Set();
    groupMap.forEach((matSet) => {
        matSet.forEach(name => allGroupedMaterialNames.add(name));
    });

    for (const name of ungroupedMats) {
        if (allGroupedMaterialNames.has(name)) {
            ungroupedMats.delete(name);
        }
    }

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

    if (ungroupedMats.size > 0) {
        if (structuredList.length > 0) {
             structuredList.push({
                 group: "Ungrouped",
                 materials: Array.from(ungroupedMats).sort()
             });
        }
    }
    
    if (structuredList.length === 0) {
         setMaterialList(Array.from(ungroupedMats).sort());
    } else {
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

  }, [scene, setModelStats, setMaterialList]);

  // 2. Wireframe Update Effect
  useLayoutEffect(() => {
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
  useEffect(() => {
    if (!scene) return;
    
    const timeouts = [];

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const isGroup = selectedMaterial ? selectedMaterial.isGroup : false;
    const groupMaterials = (isGroup && selectedMaterial.materials) ? selectedMaterial.materials : [];

    const isFullModelSelect = (targetName && modelName && targetName === modelName);

    const FLASH_COLOR = new THREE.Color("#ff0000"); // Red
    const FLASH_INTENSITY = 1.5;
    const HIGHLIGHT_INTENSITY_LOW = 0.5;

    const processHighlight = (m) => {
        if (!m.emissive) return;

        let isTarget = isFullModelSelect;
        if (!isTarget) {
            if (isGroup) {
                isTarget = groupMaterials.includes(m.name);
            } else {
                isTarget = m.name === targetName;
            }
        }

        if (isTarget) {
            if (!m.userData.originalEmissive) {
                    m.userData.originalEmissive = m.emissive.clone();
                    m.userData.originalIntensity = m.emissiveIntensity;
            }
            
            m.emissive = FLASH_COLOR;
            m.emissiveIntensity = FLASH_INTENSITY; 

            timeouts.push(setTimeout(() => {
                    if (selectedMaterial && selectedMaterial.name === targetName) m.emissiveIntensity = HIGHLIGHT_INTENSITY_LOW;
            }, 150));

            timeouts.push(setTimeout(() => {
                    if (selectedMaterial && selectedMaterial.name === targetName) m.emissiveIntensity = FLASH_INTENSITY;
            }, 300));

            timeouts.push(setTimeout(() => {
                    if (m.userData.originalEmissive) {
                        m.emissive = m.userData.originalEmissive.clone();
                        m.emissiveIntensity = m.userData.originalIntensity;
                    } else {
                        m.emissive = new THREE.Color(0, 0, 0); 
                        m.emissiveIntensity = 0; 
                    }
            }, 450));

        } else {
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

  // 3.5. Apply Material Settings (Factor Adjustment)
  // 4. Determine Transform Target
  const [transformTarget, setTransformTarget] = useState(null);
  
  // Use Ref to access latest selection inside effects without triggering them
  const selectedMaterialRef = React.useRef(selectedMaterial);
  selectedMaterialRef.current = selectedMaterial;

  // 3.5. Apply Material Settings (Factor Adjustment - Scope Aware)
  useEffect(() => {
    if (!scene || !materialSettings) return;

    const alpha = materialSettings.alpha / 100;
    const metallic = materialSettings.metallic / 100;
    const roughness = materialSettings.roughness / 100;
    const normalScale = materialSettings.normal / 100;

    const bumpScale = materialSettings.bump / 100;
    const color = materialSettings.color;

    // Determine Scope
    const selMat = selectedMaterialRef.current;
    
    const targetMatName = selMat ? selMat.name : null;
    const isFullModel = !targetMatName || (modelName && targetMatName === modelName);

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            
            mats.forEach(m => {
                // Determine if this material matches the selection
                let isMatch = false;
                if (!isFullModel) {
                     isMatch = m.name === targetMatName;
                     if (selMat && selMat.isGroup) {
                          isMatch = selMat.materials.includes(m.name);
                     }
                } else {
                     isMatch = true; 
                }

                if (isMatch && m.isMeshStandardMaterial) {
                    m.transparent = alpha < 1;
                    m.opacity = alpha;
                    
                    m.metalness = metallic;
                    m.roughness = roughness;
                    
                    if (m.normalMap) m.normalScale.set(normalScale, normalScale);
                    if (m.bumpMap) m.bumpScale = bumpScale;
                    
                    // Only apply color override if enabled
                    if (materialSettings.useFactorColor && color) {
                         m.color.set(color);
                    } else if (!materialSettings.useFactorColor && m.userData.originalColor) {
                         m.color.copy(m.userData.originalColor);
                    }
                    
                    // Save original color on first pass
                    if (!m.userData.originalColor) {
                        m.userData.originalColor = m.color.clone();
                    }

                    m.needsUpdate = true;
                }
            });
        }
    });
  }, [scene, materialSettings, modelName]); // Removed selectedMaterial dependency

  // Sync transformValues (from UI) to Object
  // This was missing in the ThreedEditor code snippet I saw earlier (deleted?), but necessary.
  // Wait, I saw it re-added in previous turn.
  // I must include it here.
  useEffect(() => {
      if (!transformTarget || !transformValues) return;
      
      const EPS = 0.001;
      
      // Position
      if (Math.abs(transformTarget.position.x - transformValues.position.x) > EPS ||
          Math.abs(transformTarget.position.y - transformValues.position.y) > EPS ||
          Math.abs(transformTarget.position.z - transformValues.position.z) > EPS) {
            transformTarget.position.set(transformValues.position.x, transformValues.position.y, transformValues.position.z);
      }
      
      // Rotation
      if (Math.abs(transformTarget.rotation.x - transformValues.rotation.x) > EPS ||
          Math.abs(transformTarget.rotation.y - transformValues.rotation.y) > EPS ||
          Math.abs(transformTarget.rotation.z - transformValues.rotation.z) > EPS) {
            transformTarget.rotation.set(transformValues.rotation.x, transformValues.rotation.y, transformValues.rotation.z);
      }
      
      // Scale
      if (Math.abs(transformTarget.scale.x - transformValues.scale.x) > EPS ||
          Math.abs(transformTarget.scale.y - transformValues.scale.y) > EPS ||
          Math.abs(transformTarget.scale.z - transformValues.scale.z) > EPS) {
            transformTarget.scale.set(transformValues.scale.x, transformValues.scale.y, transformValues.scale.z);
      }
      
  }, [transformTarget, transformValues]);

  useEffect(() => {
    if (!scene) return;

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const targetUuid = selectedMaterial ? selectedMaterial.uuid : null;
    
    // Default to Full Model (scene) if nothing selected or Model Name selected
    if (!targetName || (modelName && targetName === modelName)) {
        setTransformTarget(scene);
        
        // Ensure UI stays in sync with Full Model transform
        if (onTransformChange) {
             onTransformChange({
                position: scene.position,
                rotation: scene.rotation,
                scale: scene.scale
            });
        }
        return;
    }

    // Priority 0: Group Selection
    if (selectedMaterial?.isGroup) {
        let groupObj = null;
        scene.traverse((child) => {
            if (groupObj) return;
            if (child.isGroup && child.name === targetName) {
                groupObj = child;
            }
        });
        
        if (groupObj) {
            setTransformTarget(groupObj);
            return; 
        }
    }

    // Otherwise, try to find the mesh with the selected material
    let foundMesh = null;

    // Priority 1: UUID Match
    if (targetUuid) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.uuid === targetUuid) {
                foundMesh = child;
            }
        });
    }

    // Priority 2: Name Match
    if (!foundMesh) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.isMesh && child.material) {
                 const m = child.material;
                 if (Array.isArray(m)) {
                     if (m.some(mat => mat.name === targetName)) foundMesh = child;
                 } else {
                     if (m.name === targetName) foundMesh = child;
                 }
            }
        });
    }

    if (foundMesh) {
         if (!foundMesh.userData.originCentered) {
             foundMesh.geometry = foundMesh.geometry.clone();
             
             foundMesh.geometry.computeBoundingBox();
             const center = new THREE.Vector3();
             foundMesh.geometry.boundingBox.getCenter(center);
             
             if (center.lengthSq() > 0.000001) {
                 const worldCenter = foundMesh.localToWorld(center.clone());
                 
                 foundMesh.geometry.translate(-center.x, -center.y, -center.z);
                 
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

    setTransformTarget(foundMesh || scene);
    
    // Update transform values initially
    if (onTransformChange) {
        const target = foundMesh || scene;
        onTransformChange({
            position: target.position,
            rotation: target.rotation,
            scale: target.scale
        });
    }
  }, [scene, selectedMaterial, modelName, onTransformChange]);

  return (
    <>
        {transformMode && transformTarget && (
             <TransformControls 
                key={transformTarget.uuid}
                object={transformTarget} 
                mode={transformMode} 
                size={0.8} 
                space="local" 
                onChange={() => {
                    if (onTransformChange && transformTarget) {
                        onTransformChange({
                            position: transformTarget.position,
                            rotation: transformTarget.rotation,
                            scale: transformTarget.scale
                        });
                    }
                }}
             />
        )}
        <primitive 
            object={scene} 
            scale={scale} 
            position={position} 
            onClick={(e) => {
                e.stopPropagation();
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

export default GenericModel;
