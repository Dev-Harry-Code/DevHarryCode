"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

const videos = [
  "https://upqmjmnzcpghlyvj.public.blob.vercel-storage.com/videos/programmingedit.mp4",
  "https://upqmjmnzcpghlyvj.public.blob.vercel-storage.com/videos/cprogrammer.mp4",
];

export default function VideoBackground() {
  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const isPausedByScrollRef = useRef(false);

  const [activeIdx, setActiveIdx] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaUnlocked, setMediaUnlocked] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stateRef = useRef({ activeIdx, isPlaying, mediaUnlocked });
  useEffect(() => {
    stateRef.current = { activeIdx, isPlaying, mediaUnlocked };
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    const unlockMedia = () => {
      setMediaUnlocked(true);
      setIsPlaying(!mediaQuery.matches);
    };

    if (localStorage.getItem("photosensitive-warning")) {
      unlockMedia();
    }

    window.addEventListener("portfolio:media-consent", unlockMedia);
    return () => {
      window.removeEventListener("portfolio:media-consent", unlockMedia);
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  // Fade the fixed video background out on scroll without re-rendering on every frame
  useEffect(() => {
    let rafId: number | null = null;

    const updateFade = () => {
      rafId = null;
      const el = fadeRef.current;
      const scrollY = window.scrollY;
      const opacity = Math.max(0, 1 - scrollY / 500);
      if (el) {
        el.style.opacity = String(opacity);
      }

      // When scrolled past hero, pause video decoding to eliminate GPU fill and video decode overhead
      const { activeIdx: currIdx, isPlaying: currPlaying, mediaUnlocked: currUnlocked } = stateRef.current;
      const currentRef = currIdx === 0 ? videoRef0.current : videoRef1.current;
      if (scrollY > 550) {
        if (currentRef && !currentRef.paused) {
          currentRef.pause();
          isPausedByScrollRef.current = true;
        }
      } else if (isPausedByScrollRef.current) {
        if (currUnlocked && currPlaying && currentRef && currentRef.paused) {
          currentRef.play().catch(() => {});
        }
        isPausedByScrollRef.current = false;
      }
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateFade);
    };

    updateFade();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Play active video and pause inactive video cleanly without tearing down DOM elements
  useEffect(() => {
    const activeRef = activeIdx === 0 ? videoRef0.current : videoRef1.current;
    const inactiveRef = activeIdx === 0 ? videoRef1.current : videoRef0.current;
    let retryPlayback: (() => void) | null = null;

    const playWhenReady = () => {
      if (!activeRef || !mediaUnlocked || !isPlaying) return;

      activeRef.preload = "metadata";
      const playPromise = activeRef.play();

      // On a fresh session, changing preload and calling play can race with
      // the first media load. Retry once the browser has enough data instead
      // of treating that transient rejection as a user pause.
      if (playPromise) {
        playPromise.catch(() => {
          retryPlayback = () => {
            activeRef.removeEventListener("canplay", retryPlayback!);
            activeRef.removeEventListener("loadeddata", retryPlayback!);
            activeRef.play().catch(() => setIsPlaying(false));
          };
          activeRef.addEventListener("canplay", retryPlayback);
          activeRef.addEventListener("loadeddata", retryPlayback);
          activeRef.load();
        });
      }
    };

    if (activeRef) {
      activeRef.currentTime = 0;
      activeRef.playbackRate = 0.8;
      if (mediaUnlocked && isPlaying) {
        playWhenReady();
      }
    }

    if (inactiveRef) {
      inactiveRef.pause();
    }

    return () => {
      if (activeRef && retryPlayback) {
        activeRef.removeEventListener("canplay", retryPlayback);
        activeRef.removeEventListener("loadeddata", retryPlayback);
      }
    };
  }, [activeIdx, isPlaying, mediaUnlocked]);

  const togglePlayback = () => {
    if (!mediaUnlocked) return;
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
        ref={fadeRef}
        className="fixed inset-0 z-0 h-screen w-full overflow-hidden pointer-events-none"
      >
        {/* Video 1 */}
        <video
          ref={videoRef0}
          src={videos[0]}
          muted
          playsInline
          preload={mediaUnlocked ? "metadata" : "none"}
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
          preload={mediaUnlocked ? "metadata" : "none"}
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
        {isPlaying && !reducedMotion ? <Pause size={20} /> : <Play size={20} />}
      </button>
    </>
  );
}
