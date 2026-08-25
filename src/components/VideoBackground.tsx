"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";

const videos = ["/programmingedit.mp4", "/cprogrammer.mp4"];

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentVideo, setCurrentVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scrollY = useScrollPosition();

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      await videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoEnd = () => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
  };

  // Calculate opacity/fade out of video based on scroll depth (0 to 600px)
  const videoOpacity = Math.max(0, 1 - scrollY / 500);

  return (
    <>
      {/* Full-screen Fixed Video Background */}
      <div
        className="fixed inset-0 z-0 h-screen w-full overflow-hidden transition-opacity duration-100 ease-out pointer-events-none"
        style={{ opacity: videoOpacity }}
      >
        <video
          suppressHydrationWarning
          key={videos[currentVideo]}
          ref={videoRef}
          src={videos[currentVideo]}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.playbackRate = 0.8;
              if (isPlaying) {
                videoRef.current.play().catch(() => setIsPlaying(false));
              }
            }
          }}
          onEnded={handleVideoEnd}
        />
        {/* Dark vignette gradient overlay for contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black" />
      </div>

      {/* Floating Video Controls */}
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
