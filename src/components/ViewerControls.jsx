import React from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

export default function ViewerControls({
  cameraMode,
  setCameraMode,
  verticalExaggeration,
  setVerticalExaggeration,
  onResetView,
}) {
  const decreaseExaggeration = () => {
    setVerticalExaggeration((current) => {
      const nextValue = Number((current - 0.1).toFixed(1));

      return Math.max(0.5, nextValue);
    });
  };

  const increaseExaggeration = () => {
    setVerticalExaggeration((current) => {
      const nextValue = Number((current + 0.1).toFixed(1));

      return Math.min(5, nextValue);
    });
  };

  const handleSliderChange = (event) => {
    setVerticalExaggeration(Number(event.target.value));
  };

  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
      {/* Camera Modes */}
      <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
        <button
          type="button"
          onClick={() => setCameraMode("orbit")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            cameraMode === "orbit"
              ? "bg-white text-black"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Orbit
        </button>

        <button
          type="button"
          onClick={() => setCameraMode("flythrough")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            cameraMode === "flythrough"
              ? "bg-white text-black"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Flythrough
        </button>

        <button
          type="button"
          onClick={() => setCameraMode("top")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            cameraMode === "top"
              ? "bg-white text-black"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Top
        </button>
      </div>

      <div className="h-8 w-px bg-white/15" />

      {/* Height Exaggeration */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs font-medium text-white/70">
          Height
        </span>

        <button
          type="button"
          onClick={decreaseExaggeration}
          disabled={verticalExaggeration <= 0.5}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          title="Decrease height exaggeration"
        >
          <Minus size={14} />
        </button>

        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={verticalExaggeration}
          onChange={handleSliderChange}
          className="w-28 cursor-pointer accent-blue-500"
          title="Vertical exaggeration"
        />

        <button
          type="button"
          onClick={increaseExaggeration}
          disabled={verticalExaggeration >= 5}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          title="Increase height exaggeration"
        >
          <Plus size={14} />
        </button>

        <span className="w-10 text-right text-xs font-semibold text-white">
          {Number(verticalExaggeration).toFixed(1)}x
        </span>
      </div>

      <div className="h-8 w-px bg-white/15" />

      {/* Reset */}
      <button
        type="button"
        onClick={onResetView}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
      >
        <RotateCcw size={14} />
        Reset
      </button>
    </div>
  );
}
