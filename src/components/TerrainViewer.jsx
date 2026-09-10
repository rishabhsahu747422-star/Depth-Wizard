import React, { useCallback, useEffect, useRef, useState } from "react";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

import { getHeightData } from "../utils/getHeightData";

// ============================================================
// TERRAIN MESH
// ============================================================

const TerrainMesh = ({
  heightmapBase64,
  textureBase64,
  heightMin,
  heightMax,
  verticalExaggeration,
}) => {
  const meshRef = useRef();

  const [geometry, setGeometry] = useState(null);
  const [texture, setTexture] = useState(null);

  // ----------------------------------------------------------
  // Create terrain geometry
  // ----------------------------------------------------------

  useEffect(() => {
    if (!heightmapBase64) return;

    let createdGeometry = null;

    try {
      const heightData = getHeightData(heightmapBase64, heightMin, heightMax);

      if (
        !heightData ||
        !heightData.data ||
        !heightData.width ||
        !heightData.height
      ) {
        console.error("Invalid height data");
        return;
      }

      const width = heightData.width;
      const height = heightData.height;

      createdGeometry = new THREE.PlaneGeometry(12, 12, width - 1, height - 1);

      const position = createdGeometry.attributes.position;

      // IMPORTANT:
      // Terrain geometry itself is created in world space.
      // Camera movement NEVER modifies this mesh.
      for (let i = 0; i < position.count; i++) {
        const z = position.getZ(i);

        const xIndex = i % width;
        const yIndex = Math.floor(i / width);

        const index = yIndex * width + xIndex;

        const terrainHeight = heightData.data[index] || 0;

        position.setZ(i, terrainHeight * verticalExaggeration);
      }

      position.needsUpdate = true;

      createdGeometry.computeVertexNormals();

      setGeometry(createdGeometry);
    } catch (error) {
      console.error("Terrain geometry creation failed:", error);
    }

    return () => {
      createdGeometry?.dispose();
    };
  }, [heightmapBase64, heightMin, heightMax, verticalExaggeration]);

  // ----------------------------------------------------------
  // Texture
  // ----------------------------------------------------------

  useEffect(() => {
    if (!textureBase64) return;

    let loadedTexture = null;

    const loader = new THREE.TextureLoader();

    loadedTexture = loader.load(
      textureBase64,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 4;

        setTexture(loaded);
      },
      undefined,
      (error) => {
        console.error("Terrain texture loading failed:", error);
      },
    );

    return () => {
      loadedTexture?.dispose();
    };
  }, [textureBase64]);

  if (!geometry) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    >
      <meshStandardMaterial
        map={texture || null}
        color={texture ? "white" : "#7c9a67"}
        roughness={0.9}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// ============================================================
// STREET VIEW CAMERA CONTROLLER
// ============================================================

const StreetViewControls = ({ enabled, onReset }) => {
  const { camera, gl } = useThree();

  const yaw = useRef(0);
  const pitch = useRef(0);

  const dragging = useRef(false);
  const pointerId = useRef(null);

  const lastPointer = useRef({
    x: 0,
    y: 0,
  });

  const keys = useRef({});

  const initialized = useRef(false);

  // ----------------------------------------------------------
  // Starting camera position
  // ----------------------------------------------------------

  const START_POSITION = {
    x: 0,
    y: 2.5,
    z: 5,
  };

  // ----------------------------------------------------------
  // Look camera in yaw / pitch direction
  // ----------------------------------------------------------

  const updateCameraRotation = useCallback(() => {
    camera.rotation.order = "YXZ";

    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
  }, [camera]);

  // ----------------------------------------------------------
  // Initialize camera
  // ----------------------------------------------------------

  const initializeCamera = useCallback(() => {
    camera.position.set(START_POSITION.x, START_POSITION.y, START_POSITION.z);

    /*
     * Look toward the terrain center.
     *
     * Camera is the thing that changes.
     * Terrain remains completely untouched.
     */

    const target = new THREE.Vector3(0, 0, 0);

    const direction = new THREE.Vector3()
      .subVectors(target, camera.position)
      .normalize();

    yaw.current = Math.atan2(-direction.x, -direction.z);

    pitch.current = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));

    pitch.current = THREE.MathUtils.clamp(
      pitch.current,
      -Math.PI / 2 + 0.05,
      Math.PI / 2 - 0.05,
    );

    updateCameraRotation();

    camera.updateProjectionMatrix();

    initialized.current = true;
  }, [camera, updateCameraRotation]);

  // ----------------------------------------------------------
  // Enable / disable camera mode
  // ----------------------------------------------------------

  useEffect(() => {
    if (!enabled) {
      initialized.current = false;
      dragging.current = false;
      return;
    }

    initializeCamera();
  }, [enabled, initializeCamera]);

  // ----------------------------------------------------------
  // Mouse look
  // ----------------------------------------------------------

  useEffect(() => {
    const canvas = gl.domElement;

    if (!enabled) return;

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;

      dragging.current = true;
      pointerId.current = event.pointerId;

      lastPointer.current = {
        x: event.clientX,
        y: event.clientY,
      };

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture errors
      }
    };

    const handlePointerMove = (event) => {
      if (!dragging.current || event.pointerId !== pointerId.current) {
        return;
      }

      const deltaX = event.clientX - lastPointer.current.x;

      const deltaY = event.clientY - lastPointer.current.y;

      lastPointer.current = {
        x: event.clientX,
        y: event.clientY,
      };

      const sensitivity = 0.0025;

      yaw.current -= deltaX * sensitivity;

      pitch.current -= deltaY * sensitivity;

      pitch.current = THREE.MathUtils.clamp(
        pitch.current,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05,
      );

      updateCameraRotation();
    };

    const stopDragging = (event) => {
      if (pointerId.current !== null && event.pointerId !== pointerId.current) {
        return;
      }

      dragging.current = false;

      try {
        if (event.pointerId !== undefined) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore pointer capture errors
      }

      pointerId.current = null;
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    canvas.addEventListener("pointermove", handlePointerMove);

    canvas.addEventListener("pointerup", stopDragging);

    canvas.addEventListener("pointercancel", stopDragging);

    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);

      canvas.removeEventListener("pointermove", handlePointerMove);

      canvas.removeEventListener("pointerup", stopDragging);

      canvas.removeEventListener("pointercancel", stopDragging);

      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, gl, updateCameraRotation]);

  // ----------------------------------------------------------
  // Keyboard movement
  // ----------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      const movementKeys = [
        "w",
        "a",
        "s",
        "d",
        "q",
        "e",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "shift",
      ];

      if (movementKeys.includes(key)) {
        event.preventDefault();
        event.stopPropagation();

        keys.current[key] = true;
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();

      if (keys.current[key]) {
        event.preventDefault();
        event.stopPropagation();
      }

      keys.current[key] = false;
    };

    const clearKeys = () => {
      keys.current = {};
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });

    window.addEventListener("keyup", handleKeyUp, { passive: false });

    window.addEventListener("blur", clearKeys);

    document.addEventListener("visibilitychange", clearKeys);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      window.removeEventListener("keyup", handleKeyUp);

      window.removeEventListener("blur", clearKeys);

      document.removeEventListener("visibilitychange", clearKeys);
    };
  }, [enabled]);

  // ----------------------------------------------------------
  // Mouse wheel movement
  // ----------------------------------------------------------

  useEffect(() => {
    const canvas = gl.domElement;

    if (!enabled) return;

    const handleWheel = (event) => {
      event.preventDefault();

      const direction = new THREE.Vector3();

      camera.getWorldDirection(direction);

      /*
       * Wheel moves the CAMERA.
       * Nothing happens to the terrain mesh.
       */

      const speed = 0.015;

      camera.position.addScaledVector(direction, -event.deltaY * speed);

      // Ground / height constraint
      camera.position.y = Math.max(1.2, camera.position.y);

      // Keep camera inside terrain bounds
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.7, 5.7);

      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5.7, 5.7);
    };

    canvas.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [enabled, gl, camera]);

  // ----------------------------------------------------------
  // Camera movement every frame
  // ----------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;

    let animationFrame;

    let lastTime = performance.now();

    const update = () => {
      animationFrame = requestAnimationFrame(update);

      if (!initialized.current) return;

      const now = performance.now();

      const delta = Math.min((now - lastTime) / 1000, 0.05);

      lastTime = now;

      const currentKeys = keys.current;

      let forward = 0;
      let right = 0;
      let vertical = 0;

      // ------------------------------------------------------
      // Forward / Backward
      // ------------------------------------------------------

      if (currentKeys.w || currentKeys.arrowup) {
        forward += 1;
      }

      if (currentKeys.s || currentKeys.arrowdown) {
        forward -= 1;
      }

      // ------------------------------------------------------
      // Left / Right
      // ------------------------------------------------------

      if (currentKeys.d || currentKeys.arrowright) {
        right += 1;
      }

      if (currentKeys.a || currentKeys.arrowleft) {
        right -= 1;
      }

      // ------------------------------------------------------
      // Vertical
      // ------------------------------------------------------

      if (currentKeys.e) {
        vertical += 1;
      }

      if (currentKeys.q) {
        vertical -= 1;
      }

      if (forward === 0 && right === 0 && vertical === 0) {
        return;
      }

      // ------------------------------------------------------
      // Movement speed
      // ------------------------------------------------------

      const baseSpeed = currentKeys.shift ? 8 : 3;

      const moveSpeed = baseSpeed * delta;

      // ------------------------------------------------------
      // Camera forward direction
      // ------------------------------------------------------

      const forwardVector = new THREE.Vector3(0, 0, -1);

      forwardVector.applyQuaternion(camera.quaternion);

      /*
       * IMPORTANT:
       *
       * For walking movement we don't want looking
       * up/down to make the player fly into the ground.
       *
       * Therefore remove Y from horizontal movement.
       */

      forwardVector.y = 0;

      if (forwardVector.lengthSq() > 0) {
        forwardVector.normalize();
      }

      // ------------------------------------------------------
      // Camera right direction
      // ------------------------------------------------------

      const rightVector = new THREE.Vector3(1, 0, 0);

      rightVector.applyQuaternion(camera.quaternion);

      rightVector.y = 0;

      if (rightVector.lengthSq() > 0) {
        rightVector.normalize();
      }

      // ------------------------------------------------------
      // MOVE CAMERA
      // ------------------------------------------------------

      camera.position.addScaledVector(forwardVector, forward * moveSpeed);

      camera.position.addScaledVector(rightVector, right * moveSpeed);

      camera.position.y += vertical * moveSpeed;

      // ------------------------------------------------------
      // Safety bounds
      // ------------------------------------------------------

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.7, 5.7);

      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5.7, 5.7);

      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.2, 30);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [enabled, camera]);

  // ----------------------------------------------------------
  // Reset
  // ----------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;

    if (!onReset) return;

    // Parent can trigger reset through callback.
  }, [enabled, onReset]);

  return null;
};

// ============================================================
// CAMERA CONTROLLER
// ============================================================

const CameraController = ({ cameraMode, onReset }) => {
  const { camera } = useThree();

  const orbitRef = useRef();

  // ----------------------------------------------------------
  // Orbit / Top camera
  // ----------------------------------------------------------

  useEffect(() => {
    if (cameraMode === "flythrough") {
      return;
    }

    if (cameraMode === "top") {
      camera.position.set(0, 28, 0);

      camera.rotation.set(0, 0, 0);

      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(18, 14, 18);

      camera.lookAt(0, 0, 0);
    }

    camera.updateProjectionMatrix();

    if (orbitRef.current) {
      orbitRef.current.target.set(0, 0, 0);

      orbitRef.current.update();
    }
  }, [camera, cameraMode]);

  // ----------------------------------------------------------
  // IMPORTANT:
  //
  // Flythrough does NOT render OrbitControls.
  // ----------------------------------------------------------

  return (
    <>
      {cameraMode === "flythrough" ? (
        <StreetViewControls enabled={true} onReset={onReset} />
      ) : (
        <OrbitControls
          ref={orbitRef}
          enabled={cameraMode !== "flythrough"}
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.05}
        />
      )}
    </>
  );
};

// ============================================================
// MAIN TERRAIN VIEWER
// ============================================================

const TerrainViewer = ({
  heightmapBase64,
  textureBase64,
  heightMin,
  heightMax,
}) => {
  const [cameraMode, setCameraMode] = useState("orbit");

  const [verticalExaggeration, setVerticalExaggeration] = useState(1);

  const [resetCounter, setResetCounter] = useState(0);

  // ----------------------------------------------------------
  // Reset
  // ----------------------------------------------------------

  const handleResetView = () => {
    setResetCounter((value) => value + 1);
  };

  // ----------------------------------------------------------
  // Reset when switching to Flythrough
  // ----------------------------------------------------------

  useEffect(() => {
    if (cameraMode === "flythrough") {
      setResetCounter((value) => value + 1);
    }
  }, [cameraMode]);

  return (
    <div
      className="
        relative h-full w-full
        overflow-hidden
        bg-black
        [&:fullscreen]:h-screen
        [&:fullscreen]:w-screen
        [&:fullscreen]:rounded-none
      "
    >
      <Canvas
        camera={{
          position: [18, 14, 18],
          fov: 60,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050505");
        }}
      >
        {/* ==================================================
            LIGHTING
        ================================================== */}

        <ambientLight intensity={1.2} />

        <directionalLight position={[10, 20, 10]} intensity={2} castShadow />

        <hemisphereLight intensity={0.6} />

        {/* ==================================================
            TERRAIN
        ================================================== */}

        <TerrainMesh
          heightmapBase64={heightmapBase64}
          textureBase64={textureBase64}
          heightMin={heightMin}
          heightMax={heightMax}
          verticalExaggeration={verticalExaggeration}
        />

        {/* ==================================================
            GROUND GRID
        ================================================== */}

        <Grid
          args={[12, 12]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.4}
          sectionSize={5}
          sectionThickness={1}
          fadeDistance={40}
          fadeStrength={1}
          infiniteGrid={false}
        />

        {/* ==================================================
            CAMERA
        ================================================== */}

        <CameraController
          key={`${cameraMode}-${resetCounter}`}
          cameraMode={cameraMode}
          onReset={handleResetView}
        />
      </Canvas>

      {/* ====================================================
          INTERNAL STATUS
      ==================================================== */}

      {cameraMode === "flythrough" && (
        <div
          className="
            pointer-events-none
            absolute bottom-4 left-1/2
            -translate-x-1/2
            rounded-full
            bg-black/70
            px-4 py-2
            text-xs text-white
            backdrop-blur-md
          "
        >
          Street View Mode
        </div>
      )}
    </div>
  );
};

export default TerrainViewer;
