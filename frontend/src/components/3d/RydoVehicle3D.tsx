import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RydoVehicle3DProps {
  vehicleType?: 'GO' | 'COMFORT' | 'XL' | 'PREMIUM';
  isDriving?: boolean;
  scale?: number;
}

export const RydoVehicle3D: React.FC<RydoVehicle3DProps> = ({
  vehicleType = 'GO',
  isDriving = false,
  scale = 1.0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);

  // Tier configuration
  const config = useMemo(() => {
    switch (vehicleType) {
      case 'COMFORT':
        return {
          bodyColor: '#1d4ed8',
          cabinLength: 2.1,
          bodyHeight: 0.65,
          glassColor: '#0f172a',
          isSuv: false,
        };
      case 'XL':
        return {
          bodyColor: '#2563eb',
          cabinLength: 2.5,
          bodyHeight: 0.82,
          glassColor: '#020617',
          isSuv: true,
        };
      case 'PREMIUM':
        return {
          bodyColor: '#090e1c',
          cabinLength: 2.3,
          bodyHeight: 0.62,
          glassColor: '#000000',
          isSuv: false,
        };
      case 'GO':
      default:
        return {
          bodyColor: '#0ea5e9',
          cabinLength: 1.9,
          bodyHeight: 0.62,
          glassColor: '#0f172a',
          isSuv: false,
        };
    }
  }, [vehicleType]);

  // Shared Materials for high performance & minimal draw calls
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({
        color: config.bodyColor,
        metalness: 0.85,
        roughness: 0.2,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: config.glassColor,
        metalness: 0.9,
        roughness: 0.05,
        transparent: true,
        opacity: 0.88,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: '#090d16',
        roughness: 0.85,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        metalness: 0.9,
        roughness: 0.2,
      }),
      cyanLed: new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0ea5e9',
        emissiveIntensity: 2.5,
      }),
      redLed: new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#ef4444',
        emissiveIntensity: 2.0,
      }),
    };
  }, [config]);

  // Optimized useFrame with tab visibility throttling
  useFrame((state, delta) => {
    // 1. Immediately skip work if tab is hidden
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();

    if (isDriving) {
      groupRef.current.position.y = Math.sin(t * 10) * 0.012;
      groupRef.current.rotation.z = Math.sin(t * 5) * 0.008;
      wheelsRef.current.forEach((wheel) => {
        if (wheel) wheel.rotation.x += delta * 12;
      });
    } else {
      // Smooth subtle floating hover
      groupRef.current.position.y = Math.sin(t * 1.6) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.04;
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, 0, 0]}>
      {/* 1. Lower Chassis */}
      <mesh position={[0, 0.35, 0]} material={materials.body} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.45, 3.8]} />
      </mesh>

      {/* 2. Front Hood Slope */}
      <mesh position={[0, 0.42, 1.2]} rotation={[-0.12, 0, 0]} material={materials.body}>
        <boxGeometry args={[1.45, 0.25, 1.2]} />
      </mesh>

      {/* 3. Cabin Glass Canopy */}
      <mesh
        position={[0, 0.72 + (config.isSuv ? 0.08 : 0), -0.2]}
        material={materials.glass}
        castShadow
      >
        <boxGeometry args={[1.3, config.bodyHeight, config.cabinLength]} />
      </mesh>

      {/* 4. Roof Aerodynamic Panel */}
      <mesh
        position={[0, 1.05 + (config.isSuv ? 0.08 : 0), -0.2]}
        material={materials.body}
      >
        <boxGeometry args={[1.22, 0.08, config.cabinLength - 0.2]} />
      </mesh>

      {/* 5. Front LED Lightstrip */}
      <mesh position={[0, 0.36, 1.91]} material={materials.cyanLed}>
        <boxGeometry args={[1.35, 0.06, 0.04]} />
      </mesh>

      {/* 6. Rear LED Taillight Bar */}
      <mesh position={[0, 0.44, -1.91]} material={materials.redLed}>
        <boxGeometry args={[1.35, 0.07, 0.04]} />
      </mesh>

      {/* 7. Four Wheels */}
      {[
        { x: -0.76, y: 0.22, z: 1.15 },
        { x: 0.76, y: 0.22, z: 1.15 },
        { x: -0.76, y: 0.22, z: -1.15 },
        { x: 0.76, y: 0.22, z: -1.15 },
      ].map((pos, idx) => (
        <group
          key={idx}
          position={[pos.x, pos.y, pos.z]}
          ref={(el) => {
            if (el) wheelsRef.current[idx] = el;
          }}
        >
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.tire}>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 14]} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.rim}>
            <cylinderGeometry args={[0.18, 0.18, 0.21, 12]} />
          </mesh>
          {/* Hubcap Accent */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.cyanLed}>
            <cylinderGeometry args={[0.07, 0.07, 0.22, 8]} />
          </mesh>
        </group>
      ))}

      {/* 8. Aerodynamic Side Mirrors */}
      <mesh position={[-0.78, 0.62, 0.4]} material={materials.body}>
        <boxGeometry args={[0.16, 0.08, 0.14]} />
      </mesh>
      <mesh position={[0.78, 0.62, 0.4]} material={materials.body}>
        <boxGeometry args={[0.16, 0.08, 0.14]} />
      </mesh>
    </group>
  );
};
