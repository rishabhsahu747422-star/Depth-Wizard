import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Canvas, useThree } from "@react-three/fiber";

import { OrbitControls, FlyControls, Grid, Html } from "@react-three/drei";

import * as THREE from "three";

import { getHeightData } from "../utils/terrainUtils";

/* -------------------------------------------------- */
/* Terrain Mesh */
/* -------------------------------------------------- */

const TerrainMesh = ({
  heightmapBase64,
  textureBase64,
  heightMin,
  heightMax,
  verticalExaggeration,
}) => {
  const [terrainData, setTerrainData] = useState(null);
  const [terrainError, setTerrainError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTerrain = async () => {
      try {
        setTerrainError("");
        setTerrainData(null);

        const data = await getHeightData(heightmapBase64, heightMin, heightMax);

        if (isMounted) {
          setTerrainData(data);
        }
      } catch (error) {
        console.error("Terrain loading failed:", error);

        if (isMounted) {
          setTerrainError("Unable to load terrain data.");
        }
      }
    };

    loadTerrain();

    return () => {
      isMounted = false;
    };
  }, [heightmapBase64, heightMin, heightMax]);

  const geometry = useMemo(() => {
    if (!terrainData) {
      return null;
    }

    const { heights, width, height } = terrainData;

    const terrainGeometry = new THREE.PlaneGeometry(
      12,
      12,
      width - 1,
      height - 1,
    );

    const position = terrainGeometry.attributes.position;

    for (let index = 0; index < heights.length; index++) {
      position.setZ(index, heights[index] * verticalExaggeration);
    }

    position.needsUpdate = true;
    terrainGeometry.computeVertexNormals();

    return terrainGeometry;
  }, [terrainData, verticalExaggeration]);

  const texture = useMemo(() => {
    if (!textureBase64) {
      return null;
    }

    const loader = new THREE.TextureLoader();

    const loadedTexture = loader.load(`data:image/png;base64,${textureBase64}`);

    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
    loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

    return loadedTexture;
  }, [textureBase64]);

  if (terrainError) {
    return (
      <Html center>
        <div className="w-64 rounded-xl border border-red-400/20 bg-black/80 p-4 text-center shadow-xl backdrop-blur-md">
          <p className="text-sm font-semibold text-white">
            Terrain unavailable
          </p>

          <p className="mt-1 text-xs text-white/60">{terrainError}</p>
        </div>
      </Html>
    );
  }

  if (!geometry) {
    return (
      <Html center>
        <div className="w-64 rounded-xl border border-white/10 bg-black/80 p-4 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="mt-3 text-sm font-semibold text-white">
            Preparing terrain
          </p>

          <p className="mt-1 text-xs text-white/60">
            Converting heightmap into 3D mesh...
          </p>
        </div>
      </Html>
    );
  }

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      {texture ? (
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.02}
        />
      ) : (
        <meshStandardMaterial
          color="#64748B"
          side={THREE.DoubleSide}
          roughness={0.85}
          metalness={0.05}
        />
      )}
    </mesh>
  );
};

/* -------------------------------------------------- */
/* Camera Controller */
/* -------------------------------------------------- */

const CameraController = forwardRef(function CameraController(
  { cameraMode, resetSignal },
  ref,
) {
  const orbitControlsRef = useRef(null);
  const flyControlsRef = useRef(null);

  const { camera } = useThree();

  const defaultCameraPosition = [18, 14, 18];
  const defaultTarget = new THREE.Vector3(0, 0, 0);

  const resetCamera = () => {
    camera.position.set(...defaultCameraPosition);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.copy(defaultTarget);
      orbitControlsRef.current.update();
    }
  };

  const zoomCamera = (direction) => {
    const zoomStep = 2;

    const target = orbitControlsRef.current?.target
      ? orbitControlsRef.current.target.clone()
      : defaultTarget.clone();

    const currentPosition = camera.position.clone();

    const moveDirection = target.clone().sub(currentPosition).normalize();

    const nextPosition = currentPosition
      .clone()
      .addScaledVector(moveDirection, direction * zoomStep);

    const distanceFromTarget = nextPosition.distanceTo(target);

    // Camera ko terrain ke andar jaane se rokna
    if (distanceFromTarget < 4 || distanceFromTarget > 80) {
      return;
    }

    camera.position.copy(nextPosition);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.update();
    }
  };

  useImperativeHandle(ref, () => ({
    zoomIn() {
      zoomCamera(1);
    },

    zoomOut() {
      zoomCamera(-1);
    },

    reset() {
      resetCamera();
    },
  }));

  useEffect(() => {
    resetCamera();

    if (cameraMode === "top") {
      camera.position.set(0, 28, 0);

      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0);
        orbitControlsRef.current.update();
      }
    }
  }, [cameraMode, resetSignal]);

  return (
    <>
      {(cameraMode === "orbit" || cameraMode === "top") && (
        <OrbitControls
          ref={orbitControlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.05}
        />
      )}

      {cameraMode === "flythrough" && (
        <FlyControls
          ref={flyControlsRef}
          movementSpeed={8}
          rollSpeed={0.5}
          dragToLook
        />
      )}
    </>
  );
});

/* -------------------------------------------------- */
/* Main Terrain Viewer */
/* -------------------------------------------------- */

const TerrainViewer = ({
  resultData,
  verticalExaggeration = 1,
  cameraMode = "orbit",
  resetSignal = 0,
  cameraControllerRef,
}) => {
  if (!resultData?.heightmap_png_b64) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <p className="text-sm font-semibold text-white">
            Terrain data unavailable
          </p>

          <p className="mt-1 text-xs text-white/60">
            No heightmap was returned by the pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
      }}
      camera={{
        position: [18, 14, 18],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
    >
      <color attach="background" args={["#111315"]} />

      <CameraController
        ref={cameraControllerRef}
        cameraMode={cameraMode}
        resetSignal={resetSignal}
      />

      <ambientLight intensity={1.2} />

      <directionalLight position={[5, 10, 5]} intensity={2} />

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
    </Canvas>
  );
};

export default TerrainViewer;
