"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import styles from "./DeviceGate.module.css";

type DeviceGateProps = {
  children: ReactNode;
};

function isUnsupportedDevice() {
  const narrowViewport = window.innerWidth < 1024;
  const touchOnlyDevice =
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(pointer: fine)").matches;

  return narrowViewport || touchOnlyDevice;
}

export default function DeviceGate({ children }: DeviceGateProps) {
  const [isReady, setIsReady] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);

  useEffect(() => {
    const updateDeviceStatus = () => {
      setIsUnsupported(isUnsupportedDevice());
      setIsReady(true);
    };

    updateDeviceStatus();
    window.addEventListener("resize", updateDeviceStatus);
    window.addEventListener("orientationchange", updateDeviceStatus);

    return () => {
      window.removeEventListener("resize", updateDeviceStatus);
      window.removeEventListener("orientationchange", updateDeviceStatus);
    };
  }, []);

  if (!isReady) {
    return <div className={styles.loading} aria-hidden="true" />;
  }

  if (isUnsupported) {
    return (
      <main className={styles.page} aria-labelledby="device-gate-title">
        <div className={styles.grid} aria-hidden="true" />
        <section className={styles.card}>
          <p className={styles.eyebrow}>404 / DESKTOP EXPERIENCE ONLY</p>
          <h1 id="device-gate-title">Please try DevHarryCode on a PC or laptop.</h1>
          <p className={styles.message}>
            The site is currently not available for mobile preview. Open it on a
            desktop or laptop for the best user experience.
          </p>
          <span className={styles.signature}>DEVHARRYCODE</span>
        </section>
      </main>
    );
  }

  return children;
}
