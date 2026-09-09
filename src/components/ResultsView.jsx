import React, { useRef, useState } from "react";
import TerrainViewer from "./TerrainViewer";
import ViewerControls from "./ViewerControls";
import FixtureResponse from "../data/FixtureResponse.json";
import { downloadJsonFile } from "../utils/downloadUtils";

const ResultsView = ({ selectedFile }) => {
  const [cameraMode, setCameraMode] = useState("orbit");
  const [verticalExaggeration, setVerticalExaggeration] = useState(0.5);

  const [resetSignal, setResetSignal] = useState(0);

  const cameraControllerRef = useRef(null);

  const handleResetView = () => {
    setCameraMode("orbit");
    setVerticalExaggeration(0.5);
    setResetSignal((current) => current + 1);
  };

  const handleExport = () => {
    const exportData = {
      project: "DepthWizard",
      exportedAt: new Date().toISOString(),
      result: FixtureResponse,
    };

    const success = downloadJsonFile(exportData, "depthwizard-result.json");

    if (!success) {
      alert("Export failed. Console check karo.");
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] px-5 py-5">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
                COMPLETE
              </span>

              <span className="text-xs text-gray-400">
                {selectedFile?.name || "Demo terrain"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              Terrain Reconstruction
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetView}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Reset View
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>

        {/* Full-Screen Terrain Workspace */}
        <div className="w-full">
          {/* 3D Viewport */}
          <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden rounded-2xl bg-[#111315] shadow-lg">
            <TerrainViewer
              resultData={FixtureResponse}
              verticalExaggeration={verticalExaggeration}
              cameraMode={cameraMode}
              resetSignal={resetSignal}
              cameraControllerRef={cameraControllerRef}
            />

            {/* View Mode */}
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                View Mode
              </p>

              <p className="mt-1 text-xs font-semibold text-white">
                3D Terrain
              </p>
            </div>

            {/* Viewer Controls */}
            <ViewerControls
              cameraMode={cameraMode}
              setCameraMode={setCameraMode}
              verticalExaggeration={verticalExaggeration}
              setVerticalExaggeration={setVerticalExaggeration}
              onResetView={handleResetView}
            />

            {/* Zoom Controls */}
            <div className="absolute bottom-5 right-5 z-30 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/75 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => cameraControllerRef.current?.zoomIn()}
                className="flex h-11 w-11 items-center justify-center border-b border-white/10 text-2xl font-semibold text-white transition hover:bg-white/15 active:bg-white/25"
                title="Zoom in"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => cameraControllerRef.current?.zoomOut()}
                className="flex h-11 w-11 items-center justify-center text-2xl font-semibold text-white transition hover:bg-white/15 active:bg-white/25"
                title="Zoom out"
              >
                −
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsView;
