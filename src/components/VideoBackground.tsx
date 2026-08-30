"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";

const videos = [
  "https://upqmjmnzcpghlyvj.public.blob.vercel-storage.com/videos/programmingedit.mp4",
  "https://upqmjmnzcpghlyvj.public.blob.vercel-storage.com/videos/cprogrammer.mp4",
];

export default function VideoBackground() {
  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);

  const [activeIdx, setActiveIdx] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scrollY = useScrollPosition();
  const videoOpacity = Math.max(0, 1 - scrollY / 500);

  // Play active video and pause inactive video cleanly without tearing down DOM elements
  useEffect(() => {
    const activeRef = activeIdx === 0 ? videoRef0.current : videoRef1.current;
    const inactiveRef = activeIdx === 0 ? videoRef1.current : videoRef0.current;

    if (activeRef) {
      activeRef.currentTime = 0;
      activeRef.playbackRate = 0.8;
      if (isPlaying) {
        activeRef.play().catch(() => setIsPlaying(false));
      }
    }

    if (inactiveRef) {
      inactiveRef.pause();
    }
  }, [activeIdx, isPlaying]);

  const togglePlayback = () => {
    const currentRef = activeIdx === 0 ? videoRef0.current : videoRef1.current;
    if (!currentRef) return;

    if (currentRef.paused) {
      currentRef.play().catch(() => {});
      setIsPlaying(true);
    } else {
      currentRef.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoEnded = () => {
    setActiveIdx((prev) => (prev === 0 ? 1 : 0));
  };

  return (
    <>
      <div
        className="fixed inset-0 z-0 h-screen w-full overflow-hidden transition-opacity duration-100 ease-out pointer-events-none"
        style={{ opacity: videoOpacity }}
      >
        {/* Video 1 */}
        <video
          ref={videoRef0}
          src={videos[0]}
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnded}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            activeIdx === 0 ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Video 2 */}
        <video
          ref={videoRef1}
          src={videos[1]}
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnded}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            activeIdx === 1 ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black" />
      </div>

      <button
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause video background" : "Play video background"}
        className="fixed bottom-20 right-6 z-50 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-xl transition hover:bg-white/20 sm:bottom-8 sm:right-8 sm:p-4"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
    </>
  );
}