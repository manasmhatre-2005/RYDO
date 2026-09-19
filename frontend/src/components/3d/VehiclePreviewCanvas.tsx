import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RydoVehicle3D } from './RydoVehicle3D';
import { Car } from 'lucide-react';

interface VehiclePreviewCanvasProps {
  vehicleType?: 'GO' | 'COMFORT' | 'XL' | 'PREMIUM';
  className?: string;
  isDriving?: boolean;
}

// Lightweight WebGL capability check
function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export const VehiclePreviewCanvas: React.FC<VehiclePreviewCanvasProps> = ({
  vehicleType = 'GO',
  className = "w-full h-44 sm:h-52 rounded-2xl overflow-hidden",
  isDriving = false,
}) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Safe DPR setting: 1.0 on mobile, max 1.5 on desktop
  const dpr = useMemo(() => {
    if (isMobile) return 1.0;
    return Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  }, [isMobile]);

  // Fallback 2D High-Performance View if WebGL is disabled or on low-end devices
  if (!hasWebGL) {
    return (
      <div className={`relative bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-slate-800/80 flex flex-col items-center justify-center p-6 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center text-electric-400 mb-2">
          <Car className="w-8 h-8" />
        </div>
        <div className="text-xs font-black text-white">RYDO {vehicleType}</div>
        <div className="text-[10px] text-slate-400">High-Efficiency Mobility Tier</div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-slate-800/80 ${className}`}>
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <Canvas
        camera={{ position: [3.8, 2.2, 4.2], fov: 42 }}
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.6}
        />
        <directionalLight position={[-6, 4, -4]} intensity={1.0} color="#38bdf8" />
        <pointLight position={[0, -0.2, 2]} intensity={0.6} color="#0ea5e9" />

        <Suspense fallback={null}>
          <RydoVehicle3D vehicleType={vehicleType} isDriving={isDriving} scale={0.92} />
          
          {/* Lightweight procedural contact shadow disc */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 1.8, 32]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.4} />
          </mesh>
        </Suspense>

        <OrbitControls
          enableZoom={false}
          autoRotate={!isDriving}
          autoRotateSpeed={1.3}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 3.8}
        />
      </Canvas>

      <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-obsidian-900/80 border border-slate-700/60 text-[9px] text-slate-400 pointer-events-none select-none">
        3D Interactive • Drag to rotate
      </div>
    </div>
  );
};

export default VehiclePreviewCanvas;
