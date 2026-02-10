import React, { useState, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { TransformControls } from "@react-three/drei";
import { GLTFExporter } from "three-stdlib";
import { OBJExporter } from "three-stdlib";
import { STLExporter } from "three-stdlib";

const GenericModel = React.memo(React.forwardRef(({ scene, wireframe, setModelStats, setMaterialList, selectedMaterial, onSelectMaterial, modelName, transformMode, materialSettings, onTransformChange, onTransformEnd, transformValues, selectedTexture, onTextureApplied, onTextureIdentified, onUpdateMaterialSetting, resetKey, sceneResetTrigger, uvUnwrapTrigger }, ref) => {
  const [position, setPosition] = useState([0, 0, 0]);
  const [scale, setScale] = useState(1);
  const groupRef = React.useRef(null);
  const [modelGroup, setModelGroup] = useState(null);
  const syncedSelectionSignature = React.useRef(null);


  // Expose Export Functionality
  React.useImperativeHandle(ref, () => ({
      exportModel: (format) => {
          if (!scene) return;
          
          const exporterOptions = {
             binary: true // for GLB
          };

          const download = (blob, filename) => {
               const link = document.createElement('a');
               link.style.display = 'none';
               link.href = URL.createObjectURL(blob);
               link.download = filename;
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
          };

          const saveString = (text, filename) => {
               const blob = new Blob([text], { type: 'text/plain' });
               download(blob, filename);
          };

          const saveArrayBuffer = (buffer, filename) => {
               const blob = new Blob([buffer], { type: 'application/octet-stream' });
               download(blob, filename);
          };
          
          const name = modelName || "model";

          if (format === 'glb') {
              const exporter = new GLTFExporter();
              exporter.parse(scene, (result) => {
                   if (result instanceof ArrayBuffer) {
                       saveArrayBuffer(result, `${name}.glb`);
                   } else {
                       const output = JSON.stringify(result, null, 2);
                       saveString(output, `${name}.gltf`);
                   }
              }, (err) => console.error(err), exporterOptions);
          } else if (format === 'obj') {
              const exporter = new OBJExporter();
              const result = exporter.parse(scene);
              saveString(result, `${name}.obj`);
          } else if (format === 'stl') {
              const exporter = new STLExporter();
              const result = exporter.parse(scene);
              saveString(result, `${name}.stl`);
          }
      }
  }));
    
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
     if (selectedTexture.maps.bumpMap) newMaps.bumpMap = loadMap(selectedTexture.maps.bumpMap);
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
                   // Ensure we only modify Standard Materials, Physical, or Phong
                   if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial && !mat.isMeshPhongMaterial) return;
                   
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
                       mat.aoMap = newMaps.aoMap || null;
                       // Use normal map as bump map if no bump map is provided to allow bump scale adjustment
                       mat.bumpMap = newMaps.bumpMap || newMaps.normalMap || null; 
                       if (mat.bumpMap && !mat.bumpScale) mat.bumpScale = 1;
                       
                       if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                           mat.roughnessMap = newMaps.roughnessMap || null;
                           mat.metalnessMap = newMaps.metalnessMap || null;
                       }
                       
                       
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
  // 3.5. New Approach: Split Load (Selection -> UI) and Apply (UI -> Material)

  // Use a ref to access the sync function without triggering effects
  const onUpdateMaterialSettingRef = React.useRef(onUpdateMaterialSetting);
  useEffect(() => {
      onUpdateMaterialSettingRef.current = onUpdateMaterialSetting;
  });

  // A. Load Settings when Selection Changes
  useEffect(() => {
      // Don't check !onUpdateMaterialSetting here as we use ref, checking scene is enough
      if (!scene) return;

      const timerId = setTimeout(() => {
          const targetMatName = selectedMaterial ? selectedMaterial.name : modelName;
          const isFullModel = !selectedMaterial || (modelName && selectedMaterial.name === modelName);
    
          // Helper via ref
          const safeUpdate = (key, val) => {
               if (onUpdateMaterialSettingRef.current) {
                   onUpdateMaterialSettingRef.current(key, val);
               }
          };
    
          if (isFullModel) {
              // Optional: You could reset to defaults here if you want "Clean Slate" for full model
              // OR iterate scene, find first material, and load its settings?
              // Let's load the FIRST available material to populate UI so it's not stale
              let firstMat = null;
              scene.traverse((child) => {
                  if (firstMat) return;
                  if (child.isMesh && child.material) {
                       firstMat = Array.isArray(child.material) ? child.material[0] : child.material;
                  }
              });
              
               if (firstMat) {
                    // Load from first mat as representative
                    if (firstMat.opacity !== undefined) safeUpdate('alpha', Math.round(firstMat.opacity * 100));
                    
                    if (firstMat.isMeshStandardMaterial || firstMat.isMeshPhysicalMaterial) {
                         if (firstMat.metalness !== undefined) safeUpdate('metallic', Math.round(firstMat.metalness * 100));
                         if (firstMat.roughness !== undefined) safeUpdate('roughness', Math.round(firstMat.roughness * 100));
                    } else {
                         safeUpdate('metallic', 0);
                         safeUpdate('roughness', 50);
                    }
                    
                    if (firstMat.normalMap && firstMat.normalScale) safeUpdate('normal', Math.round(firstMat.normalScale.x * 100));
                    if (firstMat.bumpMap && firstMat.bumpScale !== undefined) safeUpdate('bump', Math.round(firstMat.bumpScale * 100));
         
                    if (firstMat.map) {
                        safeUpdate('scale', Math.round(firstMat.map.repeat.x * 100));
                        safeUpdate('scaleY', Math.round(firstMat.map.repeat.y * 100));
                        safeUpdate('rotation', Math.round(firstMat.map.rotation * (180/Math.PI)));
                        safeUpdate('offset', { x: firstMat.map.offset.x, y: firstMat.map.offset.y });
                    } else {
                        safeUpdate('scale', 100);
                        safeUpdate('scaleY', 100);
                        safeUpdate('rotation', 0);
                        safeUpdate('offset', { x: 0, y: 0 });
                    }
         
                    if (firstMat.color) {
                        if (firstMat.userData.originalColor && !firstMat.color.equals(firstMat.userData.originalColor)) {
                            safeUpdate('color', '#' + firstMat.color.getHexString());
                            safeUpdate('useFactorColor', true);
                        } else {
                            safeUpdate('color', '#' + firstMat.color.getHexString());
                            safeUpdate('useFactorColor', false); // Do not force factor use if same
                        }
                    }
               }
              return;
          }
    
          // Search for specific material
          let foundMat = null;
          scene.traverse((child) => {
              if (foundMat) return;
              if (child.isMesh && child.material) {
                  const m = Array.isArray(child.material) ? child.material[0] : child.material;
                  if (m.name === targetMatName) {
                      foundMat = m;
                  }
              }
          });
    
          if (foundMat) {
               const m = foundMat;
    
               if (m.opacity !== undefined) safeUpdate('alpha', Math.round(m.opacity * 100));
               
               if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                    if (m.metalness !== undefined) safeUpdate('metallic', Math.round(m.metalness * 100));
                    if (m.roughness !== undefined) safeUpdate('roughness', Math.round(m.roughness * 100));
               } else {
                    safeUpdate('metallic', 0);
                    safeUpdate('roughness', 50);
               }
               
               if (m.normalMap && m.normalScale) safeUpdate('normal', Math.round(m.normalScale.x * 100));
               if (m.bumpMap && m.bumpScale !== undefined) safeUpdate('bump', Math.round(m.bumpScale * 100));
    
               if (m.map) {
                   safeUpdate('scale', Math.round(m.map.repeat.x * 100));
                   safeUpdate('scaleY', Math.round(m.map.repeat.y * 100));
                   safeUpdate('rotation', Math.round(m.map.rotation * (180/Math.PI)));
                   safeUpdate('offset', { x: m.map.offset.x, y: m.map.offset.y });
               } else {
                   safeUpdate('scale', 100);
                   safeUpdate('scaleY', 100);
                   safeUpdate('rotation', 0);
                   safeUpdate('offset', { x: 0, y: 0 });
               }
    
               if (m.color) {
                   if (m.userData.originalColor && !m.color.equals(m.userData.originalColor)) {
                       safeUpdate('color', '#' + m.color.getHexString());
                       safeUpdate('useFactorColor', true);
                   } else {
                       safeUpdate('color', '#' + m.color.getHexString());
                       safeUpdate('useFactorColor', false);
                   }
               }
          }
          
          // Mark this selection as synced so the "Apply" effect can proceed
          const sig = `${modelName || ''}_${selectedMaterial ? (selectedMaterial.uuid || selectedMaterial.name) : 'FULL'}`;
          syncedSelectionSignature.current = sig;

      }, 50);

      return () => clearTimeout(timerId);

  }, [selectedMaterial, scene, modelName]); // Removed onUpdateMaterialSetting from dependencies


  // B. Apply Settings when UI changes (or initially applied)
  useEffect(() => {
    if (!scene || !materialSettings) return;

    // Prevent applying default/stale settings if we haven't synced with the model yet
    const currentSig = `${modelName || ''}_${selectedMaterial ? (selectedMaterial.uuid || selectedMaterial.name) : 'FULL'}`;
    if (syncedSelectionSignature.current !== currentSig) {
         return;
    }


    const alpha = materialSettings.alpha / 100;
    const metallic = materialSettings.metallic / 100;
    const roughness = materialSettings.roughness / 100;
    const normalScale = materialSettings.normal / 100;
    const bumpScale = materialSettings.bump / 100;
    const color = materialSettings.color;

    const selMat = selectedMaterial; 
    
    const targetMatName = selMat ? selMat.name : null;
    const isFullModel = !targetMatName || (modelName && targetMatName === modelName);

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            
            mats.forEach(m => {
                let isMatch = false;
                if (!isFullModel) {
                     isMatch = m.name === targetMatName;
                     if (selMat && selMat.isGroup) {
                          isMatch = selMat.materials.includes(m.name);
                     }
                } else {
                     isMatch = true; 
                }

                if (isMatch && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshPhongMaterial)) {
                    m.transparent = alpha < 1;
                    m.opacity = alpha;
                    
                    if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                        m.metalness = metallic;
                        m.roughness = roughness;
                    }
                    
                    if (m.normalMap) m.normalScale.set(normalScale, normalScale);
                    if (m.bumpMap) m.bumpScale = bumpScale;

                    const texScaleX = materialSettings.scale !== undefined ? materialSettings.scale / 100 : 1;
                    const texScaleY = materialSettings.scaleY !== undefined ? materialSettings.scaleY / 100 : texScaleX;
                    const texRotation = materialSettings.rotation !== undefined ? (materialSettings.rotation * (Math.PI / 180)) : 0;
                    const texOffset = materialSettings.offset || { x: 0, y: 0 };
                    
                    [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.bumpMap, m.alphaMap, m.emissiveMap].forEach(tex => {
                        if (tex) {
                             tex.wrapS = THREE.RepeatWrapping;
                             tex.wrapT = THREE.RepeatWrapping;

                             tex.repeat.set(texScaleX, texScaleY);
                             tex.center.set(0.5, 0.5);
                             tex.rotation = texRotation;
                             
                             if (texOffset) {
                                  tex.offset.set(texOffset.x, texOffset.y);
                             }
                             tex.needsUpdate = true;
                        }
                    });
                    
                    if (!m.userData.originalColor) {
                        m.userData.originalColor = m.color.clone();
                    }

                    if (materialSettings.useFactorColor && color) {
                         m.color.set(color);
                    } else if (!materialSettings.useFactorColor && m.userData.originalColor) {
                         m.color.copy(m.userData.originalColor);
                    }

                    m.needsUpdate = true;
                }
            });
        }
    });
  }, [scene, materialSettings, modelName, selectedMaterial, resetKey]);

  // Sync transformValues (from UI) to Object
  useEffect(() => {
      if (!transformTarget || !transformValues) return;
      
      // Apply position
      transformTarget.position.set(
          transformValues.position.x, 
          transformValues.position.y, 
          transformValues.position.z
      );
      
      // Apply rotation
      transformTarget.rotation.set(
          transformValues.rotation.x, 
          transformValues.rotation.y, 
          transformValues.rotation.z
      );
      
      // Apply scale
      transformTarget.scale.set(
          transformValues.scale.x, 
          transformValues.scale.y, 
          transformValues.scale.z
      );
      
  }, [transformTarget, transformValues.position.x, transformValues.position.y, transformValues.position.z, 
      transformValues.rotation.x, transformValues.rotation.y, transformValues.rotation.z,
      transformValues.scale.x, transformValues.scale.y, transformValues.scale.z]);

  useEffect(() => {
    if (!scene) return;

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const targetUuid = selectedMaterial ? selectedMaterial.uuid : null;
    
    // Default to Full Model (modelGroup) if nothing selected or Model Name selected
    if (!targetName || (modelName && targetName === modelName)) {
        if (modelGroup) {
            setTransformTarget(modelGroup);
            
            // Ensure UI stays in sync with Full Model transform
            if (onTransformChange) {
                 if (!modelGroup.userData.originalTransform) {
                       modelGroup.userData.originalTransform = {
                            position: modelGroup.position.clone(),
                            rotation: modelGroup.rotation.clone(),
                            scale: modelGroup.scale.clone()
                       };
                 }
                 onTransformChange({
                    position: modelGroup.position,
                    rotation: modelGroup.rotation,
                    scale: modelGroup.scale,
                    original: modelGroup.userData.originalTransform
                });
            }
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

    setTransformTarget(foundMesh || modelGroup);
    
    // Update transform values initially
    if (onTransformChange) {
        const target = foundMesh || modelGroup;
        if (target) {
             // Store original transform if not present (for both ModelGroup and Meshes)
             if (!target.userData.originalTransform) {
                   target.userData.originalTransform = {
                        position: target.position.clone(),
                        rotation: target.rotation.clone(),
                        scale: target.scale.clone()
                   };
             }
             
             onTransformChange({
                position: target.position,
                rotation: target.rotation,
                scale: target.scale,
                original: target.userData.originalTransform
            });
        }
    }
  }, [scene, selectedMaterial, modelName, onTransformChange, modelGroup]);

  // 5. Scene-Wide Reset Effect
  useEffect(() => {
    if (sceneResetTrigger > 0 && scene) {
        // Reset all individual meshes that have been moved
        scene.traverse((child) => {
             if (child.userData && child.userData.originalTransform) {
                 const original = child.userData.originalTransform;
                 child.position.copy(original.position);
                 child.rotation.copy(original.rotation);
                 child.scale.copy(original.scale);
             }
        });

        // Reset the main model group wrapper if it was moved
        if (modelGroup && modelGroup.userData && modelGroup.userData.originalTransform) {
             const original = modelGroup.userData.originalTransform;
             modelGroup.position.copy(original.position);
             modelGroup.rotation.copy(original.rotation);
             modelGroup.scale.copy(original.scale);
        }
        
        // Force update of TransformControls if active
        // Logic handled by parent re-render mostly, but if using internal ref, useful
    }
  }, [sceneResetTrigger, scene, modelGroup]);

  // 6. UV Unwrap Logic (Auto Default)
  useEffect(() => {
    if (scene) {
        const targetMatName = selectedMaterial ? selectedMaterial.name : null;
        const isFullModel = !targetMatName || (modelName && targetMatName === modelName);
        const isGroup = selectedMaterial?.isGroup;
        const groupMats = selectedMaterial?.materials || [];

        const applyBoxUV = (mesh) => {
            if (!mesh.geometry) return;
            
            // Clone geometry to avoid messing up shared geometries if any (though usually unique per mesh in loader)
            // But usually we want to modify the existing one so it persists.
            const geometry = mesh.geometry;
            geometry.computeBoundingBox();
            
            const { min, max } = geometry.boundingBox;
            // Avoid zero-division
            const range = new THREE.Vector3().subVectors(max, min);
            if(range.x === 0) range.x = 1;
            if(range.y === 0) range.y = 1;
            if(range.z === 0) range.z = 1;

            const posAttribute = geometry.attributes.position;
            // Normals are needed for box mapping projection direction
            if (!geometry.attributes.normal) geometry.computeVertexNormals();
            const normalAttribute = geometry.attributes.normal;

            const uvAttribute = geometry.attributes.uv || new THREE.BufferAttribute(new Float32Array(posAttribute.count * 2), 2);
            
            for (let i = 0; i < posAttribute.count; i++) {
                const x = posAttribute.getX(i);
                const y = posAttribute.getY(i);
                const z = posAttribute.getZ(i);
                
                const nx = Math.abs(normalAttribute.getX(i));
                const ny = Math.abs(normalAttribute.getY(i));
                const nz = Math.abs(normalAttribute.getZ(i));
                
                let u = 0, v = 0;

                // Box Mapping Logic
                if (nx >= ny && nx >= nz) {
                    // X-axis dominant (Side) -> map Z/Y
                    // Use z for u, y for v
                    u = (z - min.z) / range.z;
                    v = (y - min.y) / range.y;
                } else if (ny >= nx && ny >= nz) {
                    // Y-axis dominant (Top/Bottom) -> map X/Z
                    u = (x - min.x) / range.x;
                    v = (z - min.z) / range.z;
                } else {
                    // Z-axis dominant (Front/Back) -> map X/Y
                    u = (x - min.x) / range.x;
                    v = (y - min.y) / range.y;
                }
                
                uvAttribute.setXY(i, u, v);
            }
            
            geometry.setAttribute('uv', uvAttribute);
            geometry.attributes.uv.needsUpdate = true;
            
            // Re-calc tangents if needed (for normal maps)
            // Only if geometry has tangent attribute or we added one. 
            // computeTangents() might crash if no index, so usage depends on geometry type.
            // Safe to skip for now unless requested, as simple box mapping usually implies diffuse fix.
            if (geometry.hasAttribute('tangent') && geometry.computeTangents) {
                 geometry.computeTangents();
            }
        };

        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                let shouldApply = false;
                
                if (isFullModel) {
                    shouldApply = true;
                } else {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    
                    if (isGroup) {
                         shouldApply = mats.some(m => groupMats.includes(m.name));
                    } else {
                         shouldApply = mats.some(m => m.name === targetMatName);
                    }
                }
                
                if (shouldApply) {
                    applyBoxUV(child);
                }
            }
        });
    }
  }, [uvUnwrapTrigger, scene, selectedMaterial, modelName]);


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
                 onMouseUp={onTransformEnd}
              />
         )}
        <group ref={setModelGroup}>
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
        </group>
    </>
  );
}));

export default GenericModel;
