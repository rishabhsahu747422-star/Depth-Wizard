import React from "react";

const ViewerControls = ({ verticalExaggeration, setVerticalExaggeration }) => {
  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-white/10 bg-black/60 px-4 py-3 shadow-lg backdrop-blur">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Vertical Exaggeration
        </p>

        <p className="mt-1 text-xs font-semibold text-white">
          {verticalExaggeration.toFixed(1)}×
        </p>
      </div>

      <input
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        value={verticalExaggeration}
        onChange={(event) =>
          setVerticalExaggeration(Number(event.target.value))
        }
        className="w-32 accent-blue-500"
      />
    </div>
  );
};

export default ViewerControls;
