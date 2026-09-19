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
  className = "w-full h-48 sm:h-56 rounded-3xl overflow-hidden",
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

  const dpr = useMemo(() => {
    if (isMobile) return 1.0;
    return Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  }, [isMobile]);

  if (!hasWebGL) {
    return (
      <div className={`relative bg-gradient-to-b from-white to-pearl-100 border border-slate-200/80 flex flex-col items-center justify-center p-6 shadow-luxury ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-electric-50 border border-electric-200 flex items-center justify-center text-electric-600 mb-2">
          <Car className="w-8 h-8" />
        </div>
        <div className="text-xs font-black text-navy-900">RYDO {vehicleType}</div>
        <div className="text-[10px] text-slate-400 font-medium">Light Luxury Mobility Tier</div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-b from-white via-pearl-100/80 to-pearl-200/90 border border-slate-200/80 shadow-luxury ${className}`}>
      {/* Subtle Pearl Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0284c7 1px, transparent 1px)',
          backgroundSize: '22px 22px'
        }}
      />

      <Canvas
        camera={{ position: [3.8, 2.2, 4.2], fov: 40 }}
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.8}
        />
        <directionalLight position={[-6, 4, -4]} intensity={1.2} color="#bae6fd" />
        <pointLight position={[0, -0.2, 2]} intensity={0.5} color="#0ea5e9" />

        <Suspense fallback={null}>
          <RydoVehicle3D vehicleType={vehicleType} isDriving={isDriving} scale={0.92} />
          
          {/* Soft Pearl Shadow Disc */}
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 1.9, 32]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.25} />
          </mesh>
        </Suspense>

        <OrbitControls
          enableZoom={false}
          autoRotate={!isDriving}
          autoRotateSpeed={1.2}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 3.8}
        />
      </Canvas>

      <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-[10px] text-slate-500 font-bold shadow-sm pointer-events-none select-none">
        3D Vehicle • Drag to orbit
      </div>
    </div>
  );
};

export default VehiclePreviewCanvas;
