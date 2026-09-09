import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import * as THREE from "three";
import { getHeightData } from "../utils/terrainUtils";

const TerrainMesh = ({
  heightmapBase64,
  textureBase64,
  heightMin,
  heightMax,
  verticalExaggeration,
}) => {
  const [terrainData, setTerrainData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTerrain = async () => {
      try {
        const data = await getHeightData(heightmapBase64, heightMin, heightMax);

        if (isMounted) {
          setTerrainData(data);
        }
      } catch (error) {
        console.error("Terrain loading failed:", error);
      }
    };

    loadTerrain();

    return () => {
      isMounted = false;
    };
  }, [heightmapBase64, heightMin, heightMax]);

  const geometry = useMemo(() => {
    if (!terrainData) return null;

    const { heights, width, height } = terrainData;

    const geometry = new THREE.PlaneGeometry(12, 12, width - 1, height - 1);

    const position = geometry.attributes.position;

    for (let i = 0; i < heights.length; i++) {
      const currentHeight = heights[i];

      position.setZ(i, currentHeight * verticalExaggeration);
    }

    position.needsUpdate = true;

    geometry.computeVertexNormals();

    return geometry;
  }, [terrainData, verticalExaggeration]);

  const texture = useMemo(() => {
    if (!textureBase64) return null;

    const loader = new THREE.TextureLoader();

    return loader.load(`data:image/png;base64,${textureBase64}`);
  }, [textureBase64]);

  if (!geometry) {
    return null;
  }

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      {texture ? (
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
      ) : (
        <meshStandardMaterial
          color="#64748B"
          roughness={0.85}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
};

const TerrainViewer = ({ resultData, verticalExaggeration = 1 }) => {
  if (!resultData?.heightmap_png_b64) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <p className="text-sm font-semibold text-white">
            Terrain data unavailable
          </p>

          <p className="mt-1 text-xs text-white/50">
            No heightmap was returned by the pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 7, 9]} fov={45} />

      <ambientLight intensity={1.2} />

      <directionalLight position={[5, 10, 5]} intensity={2} castShadow />

      <directionalLight position={[-5, 4, -5]} intensity={0.6} />

      <TerrainMesh
        heightmapBase64={resultData.heightmap_png_b64}
        textureBase64={resultData.texture_png_b64}
        heightMin={resultData.height_min}
        heightMax={resultData.height_max}
        verticalExaggeration={verticalExaggeration}
      />

      <Grid
        position={[0, -0.3, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        sectionThickness={1}
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
};

export default TerrainViewer;
