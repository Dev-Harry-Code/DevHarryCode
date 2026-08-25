/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { X, TriangleAlert } from "lucide-react";

export default function PhotosensitiveWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("photosensitive-warning");
    if (!dismissed) {
      setShowWarning(true);
    }
  }, []);

  const dismissWarning = () => {
    localStorage.setItem("photosensitive-warning", "true");
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md sm:px-6">
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-yellow-500/30 bg-zinc-900/90 p-6 shadow-2xl sm:p-8">
        <button
          onClick={dismissWarning}
          className="absolute right-5 top-5 text-white/60 transition hover:text-white"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <TriangleAlert className="text-yellow-400" size={28} />
          <h2 className="text-xl font-bold text-yellow-300 sm:text-2xl">
            Photosensitivity Warning
          </h2>
        </div>

        <p className="mt-5 text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-7">
          This portfolio contains{" "}
          <span className="font-semibold text-white">
            flashing visuals, animated effects, dynamic lighting, and looping
            video assets
          </span>{" "}
          that may trigger seizures or discomfort in individuals with
          photosensitive epilepsy or motion sensitivity.
        </p>

        <p className="mt-4 text-sm leading-6 text-white/80 sm:mt-5 sm:text-base sm:leading-7">
          If you experience discomfort or prefer a static experience, use the{" "}
          <span className="font-semibold text-cyan-300">Play / Pause</span>{" "}
          button located in the{" "}
          <span className="font-semibold text-cyan-300">
            bottom-right corner
          </span>{" "}
          to pause the background video at any time.
        </p>

        <button
          onClick={dismissWarning}
          className="mt-6 w-full rounded-xl bg-yellow-400 py-3 font-semibold text-black transition hover:bg-yellow-300 sm:mt-8"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
