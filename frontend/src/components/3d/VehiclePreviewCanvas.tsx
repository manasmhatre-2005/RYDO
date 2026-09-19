import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { RydoVehicle3D } from './RydoVehicle3D';

interface VehiclePreviewCanvasProps {
  vehicleType?: 'GO' | 'COMFORT' | 'XL' | 'PREMIUM';
  className?: string;
  isDriving?: boolean;
}

export const VehiclePreviewCanvas: React.FC<VehiclePreviewCanvasProps> = ({
  vehicleType = 'GO',
  className = "w-full h-44 sm:h-52 rounded-2xl overflow-hidden",
  isDriving = false,
}) => {
  return (
    <div className={`relative bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-slate-800/80 ${className}`}>
      {/* Subtle background tech grid overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <Canvas
        camera={{ position: [3.8, 2.2, 4.2], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Cyan side rim light for futuristic mobility feel */}
        <directionalLight position={[-6, 4, -4]} intensity={1.2} color="#38bdf8" />
        <pointLight position={[0, -0.5, 2]} intensity={0.8} color="#0ea5e9" />

        <Suspense fallback={null}>
          <RydoVehicle3D vehicleType={vehicleType} isDriving={isDriving} scale={0.92} />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.65}
            scale={7}
            blur={1.8}
            far={3}
            color="#0284c7"
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          autoRotate={!isDriving}
          autoRotateSpeed={1.4}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 3.8}
        />
      </Canvas>

      {/* Floating 3D Interaction Badge */}
      <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-obsidian-900/80 border border-slate-700/60 text-[9px] text-slate-400 pointer-events-none select-none">
        3D Interactive • Drag to rotate
      </div>
    </div>
  );
};

export default VehiclePreviewCanvas;
