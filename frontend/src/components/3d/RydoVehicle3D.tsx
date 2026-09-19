import React, { useRef } from 'react';
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

  // Tier color & scale customizations
  const getTierConfig = () => {
    switch (vehicleType) {
      case 'COMFORT':
        return {
          bodyColor: '#1d4ed8', // Sapphire Metallic
          cabinLength: 2.1,
          bodyHeight: 0.65,
          glassColor: '#0f172a',
          isSuv: false,
        };
      case 'XL':
        return {
          bodyColor: '#2563eb', // Rich Electric Blue
          cabinLength: 2.6,
          bodyHeight: 0.85,
          glassColor: '#020617',
          isSuv: true,
        };
      case 'PREMIUM':
        return {
          bodyColor: '#0b1120', // Midnight Obsidian
          cabinLength: 2.3,
          bodyHeight: 0.62,
          glassColor: '#000000',
          isSuv: false,
        };
      case 'GO':
      default:
        return {
          bodyColor: '#0ea5e9', // Core RYDO Electric Blue
          cabinLength: 1.9,
          bodyHeight: 0.62,
          glassColor: '#0f172a',
          isSuv: false,
        };
    }
  };

  const config = getTierConfig();

  // Smooth subtle hover and wheel spin animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (isDriving) {
      // Driving motion: subtle road vibration
      groupRef.current.position.y = Math.sin(t * 12) * 0.015;
      groupRef.current.rotation.z = Math.sin(t * 6) * 0.01;
      // Spin wheels
      wheelsRef.current.forEach((wheel) => {
        if (wheel) wheel.rotation.x += delta * 12;
      });
    } else {
      // Idle motion: very smooth, calm floating hover
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.035;
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.05;
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, 0, 0]}>
      {/* 1. Lower Chassis / Aerodynamic Body */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.45, 3.8]} />
        <meshStandardMaterial
          color={config.bodyColor}
          metalness={0.85}
          roughness={0.2}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 2. Front Hood Slope */}
      <mesh position={[0, 0.42, 1.2]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.45, 0.25, 1.2]} />
        <meshStandardMaterial
          color={config.bodyColor}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* 3. Cabin & Tinted Glass Canopy */}
      <mesh position={[0, 0.72 + (config.isSuv ? 0.08 : 0), -0.2]} castShadow>
        <boxGeometry args={[1.3, config.bodyHeight, config.cabinLength]} />
        <meshStandardMaterial
          color={config.glassColor}
          metalness={0.95}
          roughness={0.05}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 4. Roof Aerodynamic Accent */}
      <mesh position={[0, 1.05 + (config.isSuv ? 0.08 : 0), -0.2]} castShadow>
        <boxGeometry args={[1.22, 0.08, config.cabinLength - 0.2]} />
        <meshStandardMaterial
          color={config.bodyColor}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* 5. Front LED Lightstrip (Signature RYDO Cyan Glow) */}
      <mesh position={[0, 0.36, 1.91]}>
        <boxGeometry args={[1.35, 0.06, 0.04]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Front Headlights */}
      <mesh position={[-0.58, 0.38, 1.88]}>
        <boxGeometry args={[0.22, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#38bdf8"
          emissiveIntensity={3.0}
        />
      </mesh>
      <mesh position={[0.58, 0.38, 1.88]}>
        <boxGeometry args={[0.22, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#38bdf8"
          emissiveIntensity={3.0}
        />
      </mesh>

      {/* 6. Rear LED Taillight Bar */}
      <mesh position={[0, 0.44, -1.91]}>
        <boxGeometry args={[1.35, 0.07, 0.04]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* 7. Wheels & Alloy Rims (4 wheels) */}
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
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 24]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>
          {/* Alloy Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.21, 16]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Center Hubcap Accent */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.22, 12]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      ))}

      {/* 8. Aerodynamic Side Mirrors */}
      <mesh position={[-0.78, 0.62, 0.4]}>
        <boxGeometry args={[0.16, 0.08, 0.14]} />
        <meshStandardMaterial color={config.bodyColor} metalness={0.8} />
      </mesh>
      <mesh position={[0.78, 0.62, 0.4]}>
        <boxGeometry args={[0.16, 0.08, 0.14]} />
        <meshStandardMaterial color={config.bodyColor} metalness={0.8} />
      </mesh>
    </group>
  );
};
