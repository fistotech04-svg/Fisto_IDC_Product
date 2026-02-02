import React, { useState, Suspense } from "react";
import { Icon } from "@iconify/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, GizmoHelper, GizmoViewport, Loader } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import MaterialList from "./MaterialList";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";


// 3D Model Loader
function Model({ url, wireframe }) {
  const { scene } = useGLTF(url);
  
  React.useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.wireframe = wireframe;
      }
    });
  }, [scene, wireframe]);

  return <primitive object={scene} scale={1} />;
}

export default function ThreedEditor() {
  const [modelUrl, setModelUrl] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isTextureOpen, setIsTextureOpen] = useState(true);
  
  // Visual Settings State
  const [settings, setSettings] = useState({
    backgroundColor: "#ffffff",
    baseColor: "#f9fafb",
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
          {modelUrl && <TopToolbar isSidebarCollapsed={isSidebarCollapsed} />}

          {modelUrl && (
            <MaterialList
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              isTextureOpen={isTextureOpen}
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


          {!modelUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-3 opacity-30">
                <Icon icon="ph:cube-focus-thin" width={80} className="text-gray-400" />
                <span className="text-[14px] font-medium text-gray-500">Uploaded 3D Model will be shown here</span>
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
                  {modelUrl && <Model url={modelUrl} wireframe={settings.wireframe} />}
              </Suspense>
              
              {modelUrl && settings.grid && <gridHelper args={[30, 30, 0xdddddd, 0xe5e7eb]} />}
              
              {modelUrl && settings.base && (
                 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                    <planeGeometry args={[30, 30]} />
                    <meshStandardMaterial color={settings.baseColor} />
                 </mesh>
              )}

              <OrbitControls autoRotate={autoRotate} makeDefault />

              {/* GIZMO HELPER */}
              {modelUrl && (
                <GizmoHelper
                  alignment="bottom-right"
                  margin={isTextureOpen ? [140, 280] : [140, 240]}
                >
                  <GizmoViewport
                    axisColors={["#ff3653", "#8adb00", "#2c8fff"]}
                    labelColor="white"
                  />
                </GizmoHelper>
              )}
            </Canvas>
          </div>
        </div>

        {/* RIGHT SETTINGS PANEL */}
        <div className="w-[22vw] h-full border-l border-gray-100 bg-white z-40 relative flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <RightPanel
            setModelUrl={setModelUrl}
            hasModel={!!modelUrl}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
          />
        </div>
      </div>
      <Loader />
    </div>
  );
}
