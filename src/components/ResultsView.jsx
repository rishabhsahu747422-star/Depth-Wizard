import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TerrainViewer from "./TerrainViewer";
import ViewerControls from "./ViewerControls";

const ResultsView = ({ selectedFile }) => {
  const [verticalExaggeration, setVerticalExaggeration] = useState(1);

  const demoResultData = {
    heightmap_png_b64: null,
    confidence_png_b64: null,
    texture_png_b64: null,
    height_min: -0.1946883648633957,
    height_max: 12.041318893432617,
    metadata: {
      crs: null,
      bounds_wgs84: null,
      resolution_m: null,
      srtm_used: false,
      calibration_method: "none_relative_only",
      gsd_info: {
        mode: "assumed_no_metadata",
        source_gsd_m: null,
        target_gsd_m: 0.33,
        crop_side_px: 128,
        original_shape: [128, 128],
      },
    },
    image_id: "fixture-demo-0001",
    input_type: "non_georeferenced",
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
              onClick={() => setVerticalExaggeration(1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Reset View
            </button>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
              Export
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* 3D Viewport */}
          <div className="relative min-h-[600px] flex-1 overflow-hidden rounded-2xl bg-[#111315] shadow-lg">
            <TerrainViewer
              resultData={demoResultData}
              verticalExaggeration={verticalExaggeration}
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
            <div className="absolute bottom-4 left-4 z-10 flex gap-2">
              <button className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/70">
                Flythrough
              </button>

              <button className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/70">
                Orbit
              </button>
            </div>

            <ViewerControls
              verticalExaggeration={verticalExaggeration}
              setVerticalExaggeration={setVerticalExaggeration}
            />

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-sm text-white backdrop-blur hover:bg-black/70">
                +
              </button>

              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-sm text-white backdrop-blur hover:bg-black/70">
                −
              </button>
            </div>
          </div>

          {/* Existing Phase 1 Sidebar */}
          <Sidebar />
        </div>
      </div>
    </section>
  );
};

export default ResultsView;
