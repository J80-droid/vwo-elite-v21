import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Environment,
  Float,
  Grid,
  MeshReflectorMaterial,
  PivotControls,
  QuadraticBezierLine,
  RoundedBox,
  Stars,
  Text,
} from "@react-three/drei";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { ShortCircuitFX } from "./ShortCircuitFX";
import { CircuitComponent, useCircuitsEngine } from "./useCircuitsEngine";
import { VoltageProbe } from "./VoltageProbe";
import { WireModel } from "./WireModel";

// Define Interface for the optimized wire line
interface WireLineGeometry {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  nodeName1: string;
  nodeName2: string;
}

// SINGLETON AUDIO: Prevent memory leaks
const clickSound = new Audio("/sounds/switch_click.mp3");

const BatteryModel: React.FC = () => {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* 1. De Behuizing (Mat Zwart) */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.55, 32]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.6} // Mat plastic/label effect
          metalness={0.1}
        />
      </mesh>

      {/* 2. De "Copper Top" (Iconisch design) */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.15, 32]} />
        <meshStandardMaterial
          color="#b87333" // Koperkleur
          roughness={0.3}
          metalness={0.8} // Metaalglans
        />
      </mesh>

      {/* 3. Positieve Pool (Het knopje) */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={1} roughness={0.2} />
      </mesh>

      {/* 4. Negatieve Pool (Platte bodem) */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={1} roughness={0.2} />
      </mesh>

      {/* 5. Plus-teken (Visuele hint) */}
      <group position={[0, 0.25, 0.29]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.01]} />
          <meshBasicMaterial color="#b87333" />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.15}
          color="black"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          +
        </Text>
      </group>
    </group>
  );
};

const LabPowerSupplyModel: React.FC<{
  voltage: number;
  frequency?: number;
}> = ({ voltage, frequency = 50 }) => {
  return (
    <group rotation={[0, Math.PI, 0]}>
      {" "}
      {/* Draai naar camera toe */}
      {/* 1. De Behuizing (Main Case) */}
      <RoundedBox
        args={[0.8, 0.5, 0.4]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.25, 0]}
        castShadow
      >
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.5} />
      </RoundedBox>
      {/* 2. Het Frontpaneel (Donker) */}
      <group position={[0, 0.25, 0.21]}>
        <mesh>
          <planeGeometry args={[0.75, 0.45]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>

        {/* 3. Het Display (LCD Scherm) */}
        <group position={[0, 0.1, 0.01]}>
          {/* Achtergrond scherm */}
          <mesh>
            <planeGeometry args={[0.6, 0.18]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          {/* Glas reflectie */}
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.6, 0.18]} />
            <meshPhysicalMaterial
              color="white"
              transmission={0.9}
              opacity={0.2}
              roughness={0}
              transparent
            />
          </mesh>

          {/* Live Data Tekst */}
          <Text
            position={[-0.25, 0.04, 0.01]}
            fontSize={0.05}
            color="#38bdf8"
            anchorX="left"
            font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff"
          >
            FREQ: {frequency.toFixed(1)} Hz
          </Text>
          <Text
            position={[-0.25, -0.04, 0.01]}
            fontSize={0.05}
            color="#f43f5e"
            anchorX="left"
            font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff"
          >
            AMPL: {voltage.toFixed(1)} V
          </Text>
        </group>

        {/* 4. Controls (Knoppen) */}
        {/* Frequentie Knop */}
        <group position={[-0.2, -0.12, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 32]} />
          <meshStandardMaterial color="#475569" />
          <mesh position={[0, 0.03, 0.04]}>
            <boxGeometry args={[0.01, 0.02, 0.04]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
        {/* Voltage Knop */}
        <group position={[0, -0.12, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 32]} />
          <meshStandardMaterial color="#475569" />
          <mesh position={[0, 0.03, 0.04]}>
            <boxGeometry args={[0.01, 0.02, 0.04]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>

        {/* 5. Output Terminals (BNC / Banana plugs) */}
        <group position={[0.25, -0.12, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Rode Terminal */}
          <mesh position={[-0.08, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08]} />
            <meshStandardMaterial color="#ef4444" metalness={0.5} />
          </mesh>
          {/* Zwarte Terminal */}
          <mesh position={[0.08, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08]} />
            <meshStandardMaterial color="#111" metalness={0.5} />
          </mesh>
        </group>

        {/* Power LED */}
        <mesh position={[0.32, 0.18, 0.01]}>
          <circleGeometry args={[0.015]} />
          <meshBasicMaterial color="#10b981" toneMapped={false} />
        </mesh>
      </group>
      {/* Rubberen voetjes */}
      <mesh position={[-0.35, 0.02, 0.15]}>
        {" "}
        <boxGeometry args={[0.05, 0.04, 0.05]} />{" "}
        <meshStandardMaterial color="#111" />{" "}
      </mesh>
      <mesh position={[0.35, 0.02, 0.15]}>
        {" "}
        <boxGeometry args={[0.05, 0.04, 0.05]} />{" "}
        <meshStandardMaterial color="#111" />{" "}
      </mesh>
      <mesh position={[-0.35, 0.02, -0.15]}>
        {" "}
        <boxGeometry args={[0.05, 0.04, 0.05]} />{" "}
        <meshStandardMaterial color="#111" />{" "}
      </mesh>
      <mesh position={[0.35, 0.02, -0.15]}>
        {" "}
        <boxGeometry args={[0.05, 0.04, 0.05]} />{" "}
        <meshStandardMaterial color="#111" />{" "}
      </mesh>
    </group>
  );
};

const RealisticSwitchModel: React.FC<{ isOpen?: boolean }> = ({ isOpen }) => {
  // Animatie logica kan hier later bij, nu statisch op basis van state
  const angle = isOpen ? Math.PI / 3 : 0; // 60 graden open of 0 dicht

  return (
    <group>
      {/* De Basis (Hout of Zwart Plastic) */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial color="#3f2e18" roughness={0.8} />{" "}
        {/* Donker hout */}
      </mesh>
      {/* Contactpunten (Koper) */}
      <mesh position={[-0.25, 0, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.2]} />
        <meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.15]} /> {/* De 'vanger' */}
        <meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* De Hendel (Draait) */}
      <group position={[-0.25, 0.05, 0]} rotation={[0, 0, angle]}>
        {/* Het mes (Koper) */}
        <mesh position={[0.25, 0, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#b87333"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Handvat (Zwart plastic/rubber) */}
        <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.03, 0.15]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

const ResistorModel: React.FC<{ power?: number }> = ({ power = 0 }) => {
  // Hitte logica (Thermal Runaway)
  const heat = Math.min(1, power / 10);

  // Basis kleur: Beige keramiek (klassiek)
  const baseColor = new THREE.Color("#f5f5dc");
  const glowColor = new THREE.Color("#ef4444"); // Roodgloeiend

  // Als hij heet wordt, mixen we de kleur
  const bodyColor = baseColor.clone().lerp(glowColor, heat);

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* 1. De Draden (Connecting leads) - Zilver/Metaal */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#d1d5db" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.4, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#d1d5db" metalness={1} roughness={0.3} />
      </mesh>

      {/* 2. De Body (Keramisch "Bone" shape) */}
      <group>
        {/* Middenstuk */}
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.5, 32]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.4} // Keramiek is niet heel glimmend
            metalness={0.1}
            emissive={glowColor}
            emissiveIntensity={heat * 3.0} // Gloei effect
          />
        </mesh>
        {/* Afgeronde uiteinden (Caps) */}
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry
            args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.4}
            emissive={glowColor}
            emissiveIntensity={heat * 3.0}
          />
        </mesh>
        <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry
            args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.4}
            emissive={glowColor}
            emissiveIntensity={heat * 3.0}
          />
        </mesh>
      </group>

      {/* 3. Kleurcodes (Banden) - Iets dikker (Torus) voor 3D effect */}
      {/* Goud (Tolerantie) */}
      <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.175, 0.015, 16, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Rood (Multiplier) */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.175, 0.015, 16, 32]} />
        <meshStandardMaterial color="#cc0000" roughness={0.3} />
      </mesh>
      {/* Zwart (Digit 2) */}
      <mesh position={[-0.08, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.175, 0.015, 16, 32]} />
        <meshStandardMaterial color="#111" roughness={0.3} />
      </mesh>
      {/* Bruin (Digit 1) */}
      <mesh position={[-0.16, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.175, 0.015, 16, 32]} />
        <meshStandardMaterial color="#8b4513" roughness={0.3} />
      </mesh>
    </group>
  );
};

const BulbModel: React.FC<{ power: number; maxPower?: number }> = ({
  power,
  maxPower = 60,
}) => {
  // State om bij te houden of hij stuk is
  const [isBurnt, setIsBurnt] = useState(false);

  // Effect om te checken of hij doorbrandt
  useFrame(() => {
    if (!isBurnt && power > maxPower) {
      setIsBurnt(true);
      // Optioneel: Speel 'poof' geluidje af hier of kleine rookwolk
    }
  });

  // Intensiteit logica: gloeit op basis van vermogen (0 als stuk)
  const intensity = isBurnt ? 0 : Math.min(1.5, power / 10);
  const isOn = intensity > 0.05;

  // Kleur van de gloeidraad: van koud grijs naar heet oranje/wit
  const filamentColor = new THREE.Color("#444"); // Uit
  const glowColor = new THREE.Color("#ffaa00"); // Aan
  if (isOn) filamentColor.lerp(glowColor, intensity);

  // Glas eigenschappen verandern als hij stuk is
  const glassColor = isBurnt ? "#333" : "#ffffff";
  const glassOpacity = isBurnt ? 0.9 : 0.3; // Rook binnenin
  const glassRoughness = isBurnt ? 0.8 : 0.05; // Dof vs Glad

  return (
    <group>
      {/* 1. De Glazen Bol (Fysisch Glas) */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshPhysicalMaterial
          color={glassColor}
          transmission={isBurnt ? 0 : 0.95}
          opacity={glassOpacity}
          roughness={glassRoughness}
          thickness={0.1}
          ior={1.5}
          transparent
        />
      </mesh>

      {/* 2. De Gloeidraad (Het 'hart' van de lamp) */}
      <group position={[0, 0.45, 0]}>
        {/* De filament spoel (Visueel gebroken als stuk?) - Voor nu gewoon uit */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.005, 16, 32, Math.PI * 1.5]} />
          <meshStandardMaterial
            color={isBurnt ? "#111" : filamentColor}
            emissive={glowColor}
            emissiveIntensity={isOn ? intensity * 3 : 0}
            toneMapped={false}
          />
        </mesh>
        {/* De steunpootjes in de lamp */}
        <mesh position={[-0.1, -0.15, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.4]} />
          <meshStandardMaterial color="#888" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, -0.15, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.4]} />
          <meshStandardMaterial color="#888" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* 3. De Fitting (Schroefdraad metaal) */}
      <group position={[0, 0.05, 0]}>
        {/* Hoofd fitting */}
        <mesh receiveShadow>
          <cylinderGeometry args={[0.18, 0.16, 0.35, 32]} />
          <meshStandardMaterial
            color="#d4af37" // Goud/Messing
            metalness={1}
            roughness={0.3}
          />
        </mesh>
        {/* Schroefdraad ringen voor detail */}
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.185, 0.01, 16, 32]} />
          <meshStandardMaterial color="#b8962e" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.175, 0.01, 16, 32]} />
          <meshStandardMaterial color="#b8962e" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* 4. Isolator puntje onderaan */}
      <mesh position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.04, 0.01, 0.05]} />
        <meshStandardMaterial color="#888" metalness={1} />
      </mesh>

      {/* 5. Het Licht zelf (Onzichtbaar, maar belicht de omgeving) */}
      {isOn && (
        <pointLight
          position={[0, 0.5, 0]}
          intensity={intensity * 1.5}
          distance={4}
          color="#ffaa00"
          castShadow
          shadow-bias={-0.001}
        />
      )}
    </group>
  );
};

const RealisticCapacitorModel: React.FC = () => {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* 1. De Body (Blauw Plastic) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.6, 32]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* 2. De Negatieve Streep (Grijs vlak op zijkant) */}
      <mesh position={[0, 0, 0.215]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.15, 0.55]} />
        <meshStandardMaterial color="#94a3b8" />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.15}
          color="black"
          rotation={[0, 0, Math.PI / 2]}
        >
          - - -
        </Text>
      </mesh>

      {/* 3. De Aluminium Top (Met veiligheids-inkeping) */}
      <group position={[0, 0.301, 0]}>
        <mesh>
          <circleGeometry args={[0.22, 32]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* De Inkeping (Kruis) */}
        <mesh position={[0, 0.001, 0]}>
          <planeGeometry args={[0.25, 0.02]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 0.001, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[0.25, 0.02]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
      </group>

      {/* 4. De Draden */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
        <meshStandardMaterial color="#d1d5db" metalness={1} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
        <meshStandardMaterial color="#d1d5db" metalness={1} />
      </mesh>
    </group>
  );
};

const RealisticInductorModel: React.FC = () => {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {" "}
      {/* Plat op de tafel */}
      {/* 1. De Kern (Ferriet - Donkergrijs/Zwart) */}
      <mesh castShadow>
        <torusGeometry args={[0.25, 0.08, 16, 32]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      {/* 2. De Koperwikkelingen */}
      {/* We genereren procedureel een reeks ringen om de torus heen */}
      {Array.from({ length: 24 }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i / 24) * Math.PI * 2]}>
          <mesh position={[0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.085, 0.015, 8, 16]} />
            <meshStandardMaterial
              color="#b87333"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
      {/* 3. Aansluitdraden (Verticaal omhoog stekend of opzij) */}
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4]} />
        <meshStandardMaterial color="#b87333" metalness={0.8} />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4]} />
        <meshStandardMaterial color="#b87333" metalness={0.8} />
      </mesh>
    </group>
  );
};

const NTCModel: React.FC<{ factor: number }> = ({ factor }) => (
  <group rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.5]} />
      <meshStandardMaterial color="#f43f5e" />
    </mesh>
    <mesh position={[0, 0, 0.051]}>
      <planeGeometry args={[0.3, 0.4]} />
      <meshStandardMaterial
        color="#1e293b"
        emissive="#f43f5e"
        emissiveIntensity={factor * 2}
      />
    </mesh>
  </group>
);

const GroundModel: React.FC = () => (
  <group>
    {/* Connection Pulse */}
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.5]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.8} />
    </mesh>
    {/* Ground Symbol */}
    <group position={[0, -0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.5, 0.02]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.02]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.05, 0.2, 0.02]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
    </group>
  </group>
);

const WireConnections: React.FC<{
  components: CircuitComponent[];
  showElectrons: boolean;
}> = ({ components, showElectrons }) => {
  const connections = useMemo(() => {
    const SNAP_THRESHOLD = 0.4;
    const pins: {
      pos: [number, number, number];
      compId: string;
      nodeName?: string;
    }[] = [];

    components.forEach((c) => {
      const rot = c.rotation || 0;
      const dx = Math.cos(rot) * 0.5;
      const dz = Math.sin(rot) * 0.5;
      pins.push({
        pos: [c.pos[0] - dx, c.pos[1], c.pos[2] - dz],
        compId: c.id,
        nodeName: c.nodes?.[0],
      });
      pins.push({
        pos: [c.pos[0] + dx, c.pos[1], c.pos[2] + dz],
        compId: c.id,
        nodeName: c.nodes?.[1],
      });
    });

    const lines: WireLineGeometry[] = [];

    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const p1 = pins[i];
        const p2 = pins[j];
        if (!p1 || !p2) continue;
        if (p1.compId === p2.compId) continue;

        const dist = Math.sqrt(
          (p1.pos[0] - p2.pos[0]) ** 2 + (p1.pos[2] - p2.pos[2]) ** 2,
        );

        if (dist < SNAP_THRESHOLD) {
          const sortedIds = [p1.compId, p2.compId].sort();
          const stableId = `wire_${sortedIds[0]}_${sortedIds[1]}`;

          lines.push({
            id: stableId,
            start: p1.pos,
            end: p2.pos,
            nodeName1: p1.nodeName || "",
            nodeName2: p2.nodeName || "",
          });
        }
      }
    }
    return lines;
    // Cruciaal: We gebruiken topologySignature als dependency, niet 'components' direct.
    // Hierdoor wordt de zware loop niet getriggerd bij voltage changes.
  }, [components]);

  return (
    <group>
      {connections.map((line) => (
        <HangingWire
          key={line.id}
          line={line}
          showElectrons={showElectrons}
          components={components}
        />
      ))}
    </group>
  );
};

const HangingWire: React.FC<{
  line: WireLineGeometry;
  showElectrons: boolean;
  components: CircuitComponent[];
}> = ({ line, showElectrons, components }) => {
  const { latestVoltagesRef } = useCircuitsEngine();
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Bereken huidige stroom dynamisch voor dit specifieke draadstuk
  // Dit is nodig omdat 'line' niet meer elke frame ververst
  const current = useMemo(() => {
    // Zoek de componenten die bij dit draad horen om de stroom te bepalen
    const parts = line.id.split("_");
    const c1 = components.find((c) => c.id === parts[1]);
    const c2 = components.find((c) => c.id === parts[2]);
    return Math.max(Math.abs(c1?.current || 0), Math.abs(c2?.current || 0));
  }, [components, line.id]); // Dit update wel elke frame, maar is O(1) lookup, geen O(N^2) geometrie check.

  const start = new THREE.Vector3(...line.start);
  const end = new THREE.Vector3(...line.end);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  mid.y -= distance * 0.2;

  useFrame(() => {
    if (!latestVoltagesRef.current || !materialRef.current) return;
    const v1 = latestVoltagesRef.current[line.nodeName1] || 0;
    const v2 = latestVoltagesRef.current[line.nodeName2] || 0;
    const avgV = (v1 + v2) / 2;
    const t = Math.min(Math.max(avgV, 0), 12) / 12;
    const hue = 0.66 - t * 0.66;
    materialRef.current.color.setHSL(hue, 1, 0.5);
  });

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={mid}
        lineWidth={3}
        dashed={false}
      >
        <lineBasicMaterial ref={materialRef} color="blue" />
      </QuadraticBezierLine>
      {showElectrons && (
        <CurvedElectronFlow
          start={start}
          end={end}
          mid={mid}
          current={current}
        />
      )}
    </group>
  );
};

const CurvedElectronFlow: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  mid: THREE.Vector3;
  current: number;
}> = ({ start, end, mid, current }) => {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 20;

  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Accumulate time based on current speed
    // This prevents jumps when current changes, and avoids float precision issues
    timeRef.current += delta * (current * 2);

    // Keep timeRef small to avoid precision loss
    if (Math.abs(timeRef.current) > 1000) {
      timeRef.current %= 1;
    }

    const tBase = timeRef.current;

    for (let i = 0; i < count; i++) {
      // Verspreid deeltjes over de curve (0..1)
      let t = (tBase + i / count) % 1;
      if (t < 0) t += 1; // Handle negative direction if needed

      // Quadratic Bezier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
      const p = new THREE.Vector3()
        .copy(start)
        .multiplyScalar((1 - t) * (1 - t))
        .add(mid.clone().multiplyScalar(2 * (1 - t) * t))
        .add(end.clone().multiplyScalar(t * t));

      dummy.position.copy(p);
      dummy.scale.setScalar(0.05); // Kleine bolletjes
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffff00" />
    </instancedMesh>
  );
};

const LDRModel: React.FC<{ factor: number }> = ({ factor }) => (
  <group rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.1]} />
      <meshStandardMaterial
        color="#fcd34d"
        emissive="#fcd34d"
        emissiveIntensity={factor}
      />
    </mesh>
    <mesh position={[0, 0.1, 0]}>
      <boxGeometry args={[0.3, 0.02, 0.3]} />
      <meshStandardMaterial color="#ef4444" wireframe />
    </mesh>
    <mesh position={[0, -0.1, 0]}>
      <cylinderGeometry args={[0.08, 0.08, 0.1]} />
      <meshStandardMaterial
        color="#fcd34d"
        emissive="#fcd34d"
        emissiveIntensity={factor}
      />
    </mesh>
  </group>
);

// =========================================================================================
// MAIN EXPORT (Moved to bottom to resolve Hoisting issues with const Models)
// =========================================================================================

const ComponentModels: React.FC<{
  component: CircuitComponent;
  isMultimeterActive: boolean;
}> = ({ component, isMultimeterActive }) => {
  const hasPotential = (component.voltageDrop || 0) > 0.01;
  const isConnected = hasPotential;
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <group>
      {component.type === "battery" && <BatteryModel />}
      {component.type === "ac_source" && (
        <LabPowerSupplyModel
          voltage={component.value}
          {...(component.frequency !== undefined
            ? { frequency: component.frequency }
            : {})}
        />
      )}
      {component.type === "resistor" && (
        <ResistorModel
          {...(component.power !== undefined ? { power: component.power } : {})}
        />
      )}
      {component.type === "bulb" && <BulbModel power={component.power || 0} />}
      {component.type === "switch" && (
        <RealisticSwitchModel
          {...(component.isOpen !== undefined
            ? { isOpen: component.isOpen }
            : {})}
        />
      )}
      {component.type === "capacitor" && <RealisticCapacitorModel />}
      {component.type === "inductor" && <RealisticInductorModel />}
      {component.type === "ldr" && (
        <LDRModel factor={component.externalFactor || 0.5} />
      )}
      {component.type === "ntc" && (
        <NTCModel factor={component.externalFactor || 0.5} />
      )}
      {component.type === "ground" && <GroundModel />}
      {component.type === "wire" && (
        <WireModel
          {...(component.current !== undefined
            ? { current: component.current }
            : {})}
          {...(component.nodes?.[0]
            ? { nodeName1: component.nodes[0] as string }
            : {})}
          {...(component.nodes?.[1]
            ? { nodeName2: component.nodes[1] as string }
            : {})}
        />
      )}

      {/* Node Indicators */}
      <mesh
        position={[-0.5, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredNode(component.nodes?.[0] || null);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredNode(null);
        }}
      >
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial
          color={isConnected ? "#10b981" : "#fbbf24"}
          emissive={isConnected ? "#10b981" : "#fbbf24"}
          emissiveIntensity={isConnected ? 3 : 1}
        />
      </mesh>
      <mesh
        position={[0.5, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredNode(component.nodes?.[1] || null);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredNode(null);
        }}
      >
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial
          color={isConnected ? "#10b981" : "#fbbf24"}
          emissive={isConnected ? "#10b981" : "#fbbf24"}
          emissiveIntensity={isConnected ? 3 : 1}
        />
      </mesh>

      {/* Multimeter Probe */}
      {isMultimeterActive && hoveredNode && (
        <VoltageProbe
          position={
            hoveredNode === component.nodes?.[0]
              ? [-0.5, 0.5, 0]
              : [0.5, 0.5, 0]
          }
          nodeName={hoveredNode}
        />
      )}

      {/* Short Circuit / Overload VFX */}
      {Math.abs(component.current || 0) > 10 && <ShortCircuitFX />}
    </group>
  );
};

const Component3D: React.FC<{
  component: CircuitComponent;
  isSelected: boolean;
  isMultimeterActive: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onMove: (pos: [number, number, number]) => void;
  setIsDragging: (val: boolean) => void;
}> = ({
  component,
  isSelected,
  isMultimeterActive,
  onSelect,
  onToggle,
  onMove,
  setIsDragging,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleDrag = (l: THREE.Matrix4) => {
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(l);
    const SNAP = 1.0;
    const snappedX = Math.round(pos.x / SNAP) * SNAP;
    const snappedZ = Math.round(pos.z / SNAP) * SNAP;
    if (
      Math.abs(snappedX - component.pos[0]) > 0.01 ||
      Math.abs(snappedZ - component.pos[2]) > 0.01
    ) {
      onMove([snappedX, pos.y, snappedZ]);
    }
  };

  return (
    <group>
      {isSelected ? (
        <group position={component.pos}>
          <PivotControls
            activeAxes={[true, false, true]}
            depthTest={false}
            anchor={[0, 0, 0]}
            onDrag={handleDrag}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            scale={0.75}
          >
            <group
              onClick={(e) => {
                if (component.type === "switch") {
                  e.stopPropagation();
                  onToggle();
                  new Audio("/sounds/switch_click.mp3").play().catch(() => {});
                }
              }}
            >
              <ComponentModels
                component={component}
                isMultimeterActive={isMultimeterActive}
              />
            </group>
          </PivotControls>
        </group>
      ) : (
        <group
          position={component.pos}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            if (component.type === "switch") {
              onToggle();
              clickSound.currentTime = 0;
              clickSound.play().catch(() => {});
            }
            onSelect();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <Float
            speed={1.5}
            rotationIntensity={0.2}
            floatIntensity={isSelected ? 0 : 0.5}
          >
            <group rotation={[0, component.rotation || 0, 0]}>
              <ComponentModels
                component={component}
                isMultimeterActive={isMultimeterActive}
              />
              {hovered && (
                <mesh scale={1.2}>
                  <boxGeometry args={[1, 0.5, 0.5]} />
                  <meshBasicMaterial
                    color="amber"
                    transparent
                    opacity={0.1}
                    wireframe
                  />
                </mesh>
              )}
            </group>
          </Float>
        </group>
      )}
    </group>
  );
};

export const CircuitsStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    state,
    setParam,
    updateComponentPos,
    updateComponentRotation,
    toggleSwitch,
    resetFuse,
  } = useCircuitsEngine();
  const [isMultimeterActive, setIsMultimeterActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") setIsMultimeterActive(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") setIsMultimeterActive(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && state.selectedId) {
        const comp = state.components?.find((c) => c.id === state.selectedId);
        if (comp) {
          updateComponentRotation(comp.id, (comp.rotation || 0) + Math.PI / 2);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedId, state.components, updateComponentRotation]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#020617]">
      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        shadows
        camera={{ position: [5, 5, 5], fov: 45 }}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Environment preset="city" />
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <group position={[0, -0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={1024}
              mixBlur={1}
              mixStrength={60}
              roughness={1}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#020617"
              metalness={0.5}
              mirror={0}
            />
          </mesh>
          <Grid
            infiniteGrid
            fadeDistance={40}
            fadeStrength={5}
            cellColor="#1e293b"
            sectionColor="#334155"
            sectionSize={5}
            cellSize={1}
            position={[0, 0.01, 0]}
          />
        </group>
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={4.5}
        />
        <group>
          {state.components?.map((comp: CircuitComponent) => (
            <Component3D
              key={comp.id}
              component={comp}
              isSelected={state.selectedId === comp.id}
              isMultimeterActive={isMultimeterActive}
              onSelect={() => setParam("selectedId", comp.id)}
              onToggle={() => toggleSwitch(comp.id)}
              onMove={(pos) => updateComponentPos(comp.id, pos)}
              setIsDragging={setIsDragging}
            />
          ))}
          <WireConnections
            components={state.components || []}
            showElectrons={state.showElectrons}
          />
        </group>
        <SceneStabilizer />
        <SafeOrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
          enabled={!state.selectedId && !isDragging}
        />
        <EffectComposer enableNormalPass={false}>
          <React.Fragment>
            <Bloom
              luminanceThreshold={1}
              mipmapBlur
              intensity={1.5}
              radius={0.6}
            />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </React.Fragment>
        </EffectComposer>
      </Canvas>
      {/* Short Circuit Overlay */}
      {state.isTripped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
          <div className="bg-red-900/90 border border-red-500 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">
              Short Circuit
            </h2>
            <p className="text-red-200 mb-6 font-mono">
              Current exceeded limit ({">"}20A). System halted.
            </p>
            <button
              onClick={resetFuse}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition-all"
            >
              Reset Fuse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
