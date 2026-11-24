"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type IntroPhase =
  | "waiting-consent"
  | "globe-assembling"
  | "globe-docking"
  | "hero-text"
  | "nav-open"
  | "complete";

interface IntroSequenceContextValue {
  phase: IntroPhase;
  consentGranted: boolean;
  globeReady: boolean;
  reducedMotion: boolean;
  markGlobeReady: () => void;
}

const DEFAULT_CONTEXT: IntroSequenceContextValue = {
  phase: "complete",
  consentGranted: true,
  globeReady: true,
  reducedMotion: false,
  markGlobeReady: () => {},
};

const IntroSequenceContext = createContext<IntroSequenceContextValue>(DEFAULT_CONTEXT);

export function useIntroSequence() {
  return useContext(IntroSequenceContext);
}

const ASSEMBLY_DURATION_MS = 1850;
const DOCK_TO_HERO_TEXT_MS = 620;
const HERO_TEXT_TO_NAV_MS = 580;
const NAV_TO_COMPLETE_MS = 820;
const GLOBE_READY_FALLBACK_MS = 1500;

export function IntroSequenceProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>("waiting-consent");
  const [consentGranted, setConsentGranted] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startedTimersRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const markGlobeReady = useCallback(() => {
    setGlobeReady(true);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    syncMotion();
    motionQuery.addEventListener("change", syncMotion);

    const grantConsent = () => {
      setConsentGranted(true);
      if (motionQuery.matches || window.scrollY > 300) {
        setPhase("complete");
        setGlobeReady(true);
        return;
      }
      setPhase((prev) => (prev === "waiting-consent" ? "globe-assembling" : prev));
    };

    if (localStorage.getItem("photosensitive-warning")) {
      grantConsent();
    }

    window.addEventListener("portfolio:media-consent", grantConsent);
    return () => {
      window.removeEventListener("portfolio:media-consent", grantConsent);
      motionQuery.removeEventListener("change", syncMotion);
    };
  }, []);

  // Fallback so the page never stalls if the 3D canvas fails to initialize
  useEffect(() => {
    if (!consentGranted || globeReady || reducedMotion) return;
    const fallbackId = window.setTimeout(() => {
      setGlobeReady(true);
    }, GLOBE_READY_FALLBACK_MS);
    return () => window.clearTimeout(fallbackId);
  }, [consentGranted, globeReady, reducedMotion]);

  // Run the choreographed timeline once consent is granted and the globe is ready
  useEffect(() => {
    if (!consentGranted || !globeReady || reducedMotion) return;
    if (phase === "complete" || startedTimersRef.current) return;

    startedTimersRef.current = true;

    const schedule = (fn: () => void, delayMs: number) => {
      const id = window.setTimeout(fn, delayMs);
      timersRef.current.push(id);
    };

    const tDock = ASSEMBLY_DURATION_MS;
    const tHeroText = tDock + DOCK_TO_HERO_TEXT_MS;
    const tNavOpen = tHeroText + HERO_TEXT_TO_NAV_MS;
    const tComplete = tNavOpen + NAV_TO_COMPLETE_MS;

    schedule(() => setPhase("globe-docking"), tDock);
    schedule(() => setPhase("hero-text"), tHeroText);
    schedule(() => setPhase("nav-open"), tNavOpen);
    schedule(() => setPhase("complete"), tComplete);
  }, [consentGranted, globeReady, reducedMotion, phase]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return (
    <IntroSequenceContext.Provider
      value={{
        phase,
        consentGranted,
        globeReady,
        reducedMotion,
        markGlobeReady,
      }}
    >
      {children}
    </IntroSequenceContext.Provider>
  );
}
